const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const Match = require('../models/Match');
const { calculateWeightedSimilarity, calculateCosineSimilarity, calculateTFIDFSimilarity } = require('../utils/similarityUtils');

const router = express.Router();

// Match resumes to a specific job
router.post('/job/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { resumeIds } = req.body;

    // Get the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get resumes
    const resumes = await Resume.find({ _id: { $in: resumeIds } });
    if (resumes.length === 0) {
      return res.status(404).json({ error: 'No resumes found' });
    }

    const matches = [];

    // Process resumes with error handling and memory protection
    for (const resume of resumes) {
      try {
        // Limit extractedText size to prevent memory issues
        if (resume && resume.extractedText && resume.extractedText.length > 50000) {
          resume.extractedText = resume.extractedText.substring(0, 50000);
        }
        
        if (!resume || !resume._id) {
          console.warn('Invalid resume found, skipping');
          continue;
        }
        
        const matchResult = calculateWeightedSimilarity(job, resume);
        
        // Create or update match record
        let match = await Match.findOne({ job: jobId, resume: resume._id });
        
        if (match) {
          // Update existing match
          match.score = matchResult.score;
          match.breakdown = {
            skills: {
              score: matchResult.breakdown.skillsSimilarity,
              matched: [],
              missing: []
            },
            experience: {
              score: matchResult.breakdown.experienceSimilarity,
              yearsRequired: 0,
              yearsFound: resume.experience || 0
            },
            education: {
              score: matchResult.breakdown.educationSimilarity,
              matched: [],
              missing: []
            },
            keywords: {
              score: matchResult.breakdown.keywordSimilarity,
              matched: [],
              missing: []
            },
            cosineSimilarity: matchResult.breakdown.cosineSimilarity,
            tfidfSimilarity: matchResult.breakdown.tfidfSimilarity
          };
          match.status = 'pending';
          await match.save();
        } else {
          // Create new match
          match = new Match({
            job: jobId,
            resume: resume._id,
            score: matchResult.score,
            breakdown: {
              skills: {
                score: matchResult.breakdown.skillsSimilarity,
                matched: [],
                missing: []
              },
              experience: {
                score: matchResult.breakdown.experienceSimilarity,
                yearsRequired: 0,
                yearsFound: resume.experience || 0
              },
              education: {
                score: matchResult.breakdown.educationSimilarity,
                matched: [],
                missing: []
              },
              keywords: {
                score: matchResult.breakdown.keywordSimilarity,
                matched: [],
                missing: []
              },
              cosineSimilarity: matchResult.breakdown.cosineSimilarity,
              tfidfSimilarity: matchResult.breakdown.tfidfSimilarity
            }
          });
          await match.save();
        }

        const score = matchResult?.score ?? 0;
        matches.push({
          resumeId: resume._id,
          candidateName: resume.candidate?.name || 'Unknown',
          score: Math.min(100, Math.max(0, score)), // Ensure 0-100 range
          breakdown: matchResult?.breakdown || {},
          matchId: match._id
        });
      } catch (error) {
        console.error('Error processing resume in matching:', resume?._id, error.message);
        // Still add the match with score 0 to avoid losing data
        try {
          matches.push({
            resumeId: resume?._id || null,
            candidateName: resume?.candidate?.name || 'Unknown',
            score: 0,
            breakdown: {},
            matchId: null
          });
        } catch (pushError) {
          console.error('Error adding failed match:', pushError.message);
          // Skip this resume if we can't even add it to matches
        }
      }
    }

    // Sort matches by score (highest first) with safety checks
    matches.sort((a, b) => {
      try {
        const scoreA = a?.score ?? 0;
        const scoreB = b?.score ?? 0;
        // Handle NaN cases
        if (isNaN(scoreA)) return 1;
        if (isNaN(scoreB)) return -1;
        return scoreB - scoreA;
      } catch (error) {
        console.error('Error in sort comparison:', error.message);
        return 0;
      }
    });

    res.json({
      message: `Matched ${matches.length} resumes to job using advanced similarity algorithms`,
      job: {
        id: job._id,
        title: job.title,
        company: job.company
      },
      matches
    });
  } catch (error) {
    console.error('Match resumes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get matches for a specific job
router.get('/job/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, sortBy = 'score', sortOrder = 'desc', page = 1, limit = 20 } = req.query;

    const query = { job: jobId };
    if (status) query.status = status;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const matches = await Match.find(query)
      .populate({
        path: 'resume',
        select: 'candidate skills experience education languages certifications originalName'
      })
      .populate('reviewedBy', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Match.countDocuments(query);

    res.json({
      matches,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update match status
router.put('/:matchId/status', auth, [
  body('status').isIn(['pending', 'reviewed', 'shortlisted', 'rejected', 'hired']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { matchId } = req.params;
    const { status, notes } = req.body;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    match.status = status;
    if (notes !== undefined) match.notes = notes;
    match.reviewedBy = req.user.userId;
    match.reviewedAt = new Date();

    await match.save();

    res.json({
      message: 'Match status updated successfully',
      match
    });
  } catch (error) {
    console.error('Update match status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get match analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const { jobId, timeRange = '30d' } = req.query;

    const query = {};
    if (jobId) query.job = jobId;

    // Add time range filter
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    query.createdAt = { $gte: startDate };

    const matches = await Match.find(query)
      .populate('job', 'title company')
      .populate('resume', 'candidate.name');

    // Calculate analytics
    const totalMatches = matches.length;
    const averageScore = totalMatches > 0 ? matches.reduce((sum, m) => sum + m.score, 0) / totalMatches : 0;
    
    const statusCounts = matches.reduce((acc, match) => {
      acc[match.status] = (acc[match.status] || 0) + 1;
      return acc;
    }, {});

    const scoreRanges = {
      '90-100': matches.filter(m => m.score >= 90).length,
      '80-89': matches.filter(m => m.score >= 80 && m.score < 90).length,
      '70-79': matches.filter(m => m.score >= 70 && m.score < 80).length,
      '60-69': matches.filter(m => m.score >= 60 && m.score < 70).length,
      '0-59': matches.filter(m => m.score < 60).length
    };

    // Calculate average similarity scores
    const avgCosineSimilarity = totalMatches > 0 ? 
      matches.reduce((sum, m) => sum + (m.breakdown?.cosineSimilarity || 0), 0) / totalMatches : 0;
    
    const avgTFIDFSimilarity = totalMatches > 0 ? 
      matches.reduce((sum, m) => sum + (m.breakdown?.tfidfSimilarity || 0), 0) / totalMatches : 0;

    res.json({
      analytics: {
        totalMatches,
        averageScore: Math.round(averageScore * 100) / 100,
        averageCosineSimilarity: Math.round(avgCosineSimilarity * 100) / 100,
        averageTFIDFSimilarity: Math.round(avgTFIDFSimilarity * 100) / 100,
        statusCounts,
        scoreRanges,
        timeRange
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get detailed similarity analysis for a specific match
router.get('/:matchId/analysis', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const match = await Match.findById(matchId)
      .populate('job')
      .populate('resume');
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Calculate detailed similarity analysis
    const jobText = `${match.job.title} ${match.job.description} ${match.job.requirements.join(' ')} ${match.job.skills.join(' ')}`;
    const resumeText = match.resume.extractedText;

    const cosineSimilarity = calculateCosineSimilarity(jobText, resumeText);
    const tfidfSimilarity = calculateTFIDFSimilarity(jobText, resumeText);

    res.json({
      matchId: match._id,
      job: {
        id: match.job._id,
        title: match.job.title,
        company: match.job.company
      },
      resume: {
        id: match.resume._id,
        candidateName: match.resume.candidate.name,
        originalName: match.resume.originalName
      },
      similarityAnalysis: {
        overallScore: match.score,
        cosineSimilarity: Math.round(cosineSimilarity * 100),
        tfidfSimilarity: Math.round(tfidfSimilarity * 100),
        breakdown: match.breakdown
      }
    });
  } catch (error) {
    console.error('Get match analysis error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Ad-hoc job description to resumes comparison using cosine similarity
router.post('/adhoc', auth, async (req, res) => {
  try {
    const { job, resumeIds } = req.body;
    if (!job || !job.title || !job.description) {
      return res.status(400).json({ error: 'Job title and description are required.' });
    }
    if (!Array.isArray(resumeIds) || resumeIds.length === 0) {
      return res.status(400).json({ error: 'At least one resume must be selected.' });
    }

    // Fetch resumes
    const resumes = await Resume.find({ _id: { $in: resumeIds } });
    if (resumes.length === 0) {
      return res.status(404).json({ error: 'No resumes found.' });
    }

    const jobText = `${job.title} ${job.description}`;
    const matches = resumes.map(resume => {
      try {
        if (!resume || !resume.extractedText) {
          return {
            resumeId: resume?._id || null,
            candidateName: resume?.candidate?.name || resume?.originalName || 'Unnamed Resume',
            cosineSimilarity: 0,
          };
        }
        const cosine = calculateCosineSimilarity(jobText, resume.extractedText);
        // Ensure cosine similarity is in 0-1 range, then convert to percentage
        const safeCosine = Math.min(1.0, Math.max(0, cosine));
        return {
          resumeId: resume._id,
          candidateName: resume.candidate?.name || resume.originalName || 'Unnamed Resume',
          cosineSimilarity: Math.round(Math.min(100, safeCosine * 100)), // Guaranteed 0-100
        };
      } catch (error) {
        console.error('Error calculating cosine similarity for resume:', resume?._id, error.message);
        return {
          resumeId: resume?._id || null,
          candidateName: resume?.candidate?.name || resume?.originalName || 'Unnamed Resume',
          cosineSimilarity: 0,
        };
      }
    }).filter(match => match !== null);

    // Sort by similarity descending with safety checks
    matches.sort((a, b) => {
      try {
        const simA = a?.cosineSimilarity ?? 0;
        const simB = b?.cosineSimilarity ?? 0;
        // Handle NaN cases
        if (isNaN(simA)) return 1;
        if (isNaN(simB)) return -1;
        return simB - simA;
      } catch (error) {
        console.error('Error in sort comparison:', error.message);
        return 0;
      }
    });

    res.json({
      message: `Compared ${matches.length} resumes to job description using cosine similarity`,
      matches
    });
  } catch (error) {
    console.error('Ad-hoc match error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Handle job application
const handleApply = async () => {
  try {
    await axios.post(`/api/jobs/${jobId}/apply`, { resumeId: selectedResumeId });
    // Success handled by frontend
  } catch (error) {
    // Error handled by frontend
  }
};

module.exports = router;