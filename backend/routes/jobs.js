const express = require('express');
const { body, validationResult } = require('express-validator');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const auth = require('../middleware/auth');
const natural = require('natural');

const router = express.Router();

// Get all jobs
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$text = { $search: search };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let jobs = await Job.find(query)
      .populate('createdBy', 'name email')
      .populate('applications.user', 'name email')
      .populate('applications.resume')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Job.countDocuments(query);

    // RBAC: Developers should not see other developers' resumes
    if (req.user.role === 'developer') {
      jobs = jobs.map(job => {
        const filteredApplications = (job.applications || []).map(app => {
          // Only include resume if uploadedBy is the current user
          if (app.resume && app.resume.uploadedBy && app.resume.uploadedBy.toString() === req.user.userId) {
            return app;
          } else {
            // Remove resume field
            return { ...app.toObject(), resume: undefined };
          }
        });
        return { ...job.toObject(), applications: filteredApplications };
      });
    } else if (req.user.role === 'company') {
      // Companies can see all resumes applied to their jobs
      jobs = jobs.map(job => {
        // Only show applications for jobs created by this company
        if (job.createdBy && job.createdBy._id.toString() === req.user.userId) {
          return job; // Show all applications for jobs created by this company
        } else {
          // Remove applications for jobs not created by this company
          return { ...job.toObject(), applications: [] };
        }
      });
    }

    res.json({
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single job
router.get('/:id', auth, async (req, res) => {
  try {
    let job = await Job.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('applications.user', 'name email')
      .populate('applications.resume');
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // RBAC: Developers should not see other developers' resumes
    if (req.user.role === 'developer') {
      const filteredApplications = (job.applications || []).map(app => {
        if (app.resume && app.resume.uploadedBy && app.resume.uploadedBy.toString() === req.user.userId) {
          return app;
        } else {
          return { ...app.toObject(), resume: undefined };
        }
      });
      job = { ...job.toObject(), applications: filteredApplications };
    } else if (req.user.role === 'company') {
      // Companies can see all resumes applied to their jobs
      if (job.createdBy && job.createdBy._id.toString() !== req.user.userId) {
        // If this job was not created by this company, remove all applications
        job = { ...job.toObject(), applications: [] };
      }
    }

    res.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new job
router.post('/', auth, [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('requirements').optional().isArray().withMessage('Requirements must be an array'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('experience').optional().isIn(['entry', 'junior', 'mid', 'senior', 'lead']).withMessage('Invalid experience level'),
  body('location').optional().trim(),
  body('type').optional().isIn(['full-time', 'part-time', 'contract', 'internship']).withMessage('Invalid job type'),
  body('department').optional().trim(),
  body('company').optional().trim(),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const jobData = {
      ...req.body,
      createdBy: req.user.userId
    };

    const job = new Job(jobData);
    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Job created successfully',
      job: populatedJob
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update job
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('requirements').optional().isArray().withMessage('Requirements must be an array'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('experience').optional().isIn(['entry', 'junior', 'mid', 'senior', 'lead']).withMessage('Invalid experience level'),
  body('location').optional().trim(),
  body('type').optional().isIn(['full-time', 'part-time', 'contract', 'internship']).withMessage('Invalid job type'),
  body('department').optional().trim(),
  body('company').optional().trim(),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level'),
  body('status').optional().isIn(['active', 'inactive', 'closed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user has permission to update this job
    if (job.createdBy._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }

    Object.assign(job, req.body);
    await job.save();

    const updatedJob = await Job.findById(job._id)
      .populate('createdBy', 'name email');

    res.json({
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete job
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Only job creator or admin can delete
    if (job.createdBy._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like a job
router.post('/:id/like', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const userId = req.user.userId;
    const alreadyLiked = (job.likes || []).some(id => id.toString() === userId);
    if (alreadyLiked) {
      // Unlike
      job.likes = job.likes.filter(id => id.toString() !== userId);
    } else {
      job.likes = job.likes || [];
      job.likes.push(userId);
    }

    await job.save();
    const populated = await Job.findById(job._id).populate('createdBy', 'name email');
    res.json({
      message: alreadyLiked ? 'Unliked' : 'Liked',
      likesCount: populated.likes?.length || 0,
      job: populated
    });
  } catch (error) {
    console.error('Like job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a comment to a job
router.post('/:id/comments', auth, [
  body('text').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be 1-500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    job.comments = job.comments || [];
    job.comments.push({ user: req.user.userId, text: req.body.text });
    await job.save();

    const populated = await Job.findById(job._id)
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    res.status(201).json({ message: 'Comment added', comments: populated.comments });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search jobs
router.get('/search', auth, async (req, res) => {
  try {
    const { q, skills, experience, location, type, status } = req.query;
    
    const query = {};
    
    if (q) {
      query.$text = { $search: q };
    }
    
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillsArray };
    }
    
    if (experience) query.experience = experience;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (type) query.type = type;
    if (status) query.status = status;

    const jobs = await Job.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ jobs });
  } catch (error) {
    console.error('Search jobs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Apply to job
router.post('/:id/apply', auth, async (req, res) => {
  try {
    const { resumeId } = req.body;
    console.log('Job application request:', {
      jobId: req.params.id,
      resumeId,
      userId: req.user.userId,
      userRole: req.user.role
    });

    const job = await Job.findById(req.params.id);
    const resume = await Resume.findById(resumeId);

    console.log('Found job:', job ? job._id : 'NOT FOUND');
    console.log('Found resume:', resume ? resume._id : 'NOT FOUND');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Check if user already applied
    const alreadyApplied = job.applications.some(app => app.user.toString() === req.user.userId);
    console.log('Already applied:', alreadyApplied);
    
    if (alreadyApplied) {
      return res.status(400).json({ error: 'You have already applied for this job.' });
    }

    // Add application
    const newApplication = {
      user: req.user.userId,
      resume: resume._id
    };
    
    console.log('Adding application:', newApplication);
    job.applications.push(newApplication);
    await job.save();

    console.log('Job application saved:', {
      jobId: job._id,
      userId: req.user.userId,
      resumeId: resume._id,
      applicationsCount: job.applications.length
    });

    res.status(200).json({ message: 'Applied successfully', job });
  } catch (error) {
    console.error('Job application error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get resumes for a job, sorted by similarity to job description
router.get('/:id/match-resumes', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate({
        path: 'applications.resume',
        populate: {
          path: 'uploadedBy',
          select: 'name email'
        }
      })
      .populate('applications.user', 'name email')
      .populate('createdBy', 'name email');
      
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Only allow company who posted the job or admin
    if (job.createdBy._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    console.log('Job applications:', job.applications);
    console.log('Job applications length:', job.applications.length);

    // Check if job has any applications
    if (!job.applications || job.applications.length === 0) {
      console.log('No applications found for this job');
      return res.json({ matches: [] });
    }

    // Debug each application
    job.applications.forEach((app, index) => {
      console.log(`Application ${index + 1}:`, {
        userId: app.user?._id || app.user,
        userName: app.user?.name || 'Unknown',
        resumeId: app.resume?._id || app.resume,
        resumeName: app.resume?.candidate?.name || 'Unknown',
        resumeFilename: app.resume?.originalName || 'Unknown',
        resumeUploadedBy: app.resume?.uploadedBy?.name || 'Unknown'
      });
    });

    const jobText = job.description + ' ' + (job.requirements || []).join(' ');
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();

    // Add job description as the first document
    tfidf.addDocument(jobText);

    // Add each resume as a document
    const resumes = job.applications
      .map(app => app.resume)
      .filter(Boolean);

    console.log('Filtered resumes:', resumes.length);
    console.log('Resumes:', resumes.map(r => ({ 
      id: r._id, 
      name: r.candidate?.name, 
      filename: r.originalName,
      hasExtractedText: !!r.extractedText,
      extractedTextLength: r.extractedText?.length || 0,
      hasCandidate: !!r.candidate,
      hasSkills: !!r.skills && r.skills.length > 0
    })));

    // If no resumes found, return empty matches
    if (resumes.length === 0) {
      console.log('No resumes found in applications');
      return res.json({ matches: [] });
    }

    // Validate that resumes have extracted text
    const validResumes = resumes.filter(resume => {
      if (!resume.extractedText || resume.extractedText.trim().length === 0) {
        console.log(`Resume ${resume._id} has no extracted text`);
        return false;
      }
      return true;
    });

    console.log('Valid resumes with extracted text:', validResumes.length);

    // If no resumes have extracted text, create a simple fallback
    if (validResumes.length === 0 && resumes.length > 0) {
      console.log('No resumes with extracted text found, using fallback...');
      const fallbackResumes = resumes.map(resume => ({
        ...resume,
        extractedText: `${resume.candidate?.name || 'Unknown'} ${resume.skills?.join(' ') || ''} ${resume.originalName || ''}`
      }));
      validResumes.push(...fallbackResumes);
      console.log('Added fallback resumes:', fallbackResumes.length);
    }

    validResumes.forEach(resume => {
      tfidf.addDocument(resume.extractedText || '');
    });

    // Compute cosine similarity for each resume
    const similarities = validResumes.map((resume, idx) => {
      // Use cosine similarity between job and resume
      const jobVector = tfidf.listTerms(0).reduce((acc, term) => {
        acc[term.term] = term.tfidf;
        return acc;
      }, {});
      const resumeVector = tfidf.listTerms(idx + 1).reduce((acc, term) => {
        acc[term.term] = term.tfidf;
        return acc;
      }, {});
      // Compute cosine similarity
      const allTerms = new Set([...Object.keys(jobVector), ...Object.keys(resumeVector)]);
      const jobArr = Array.from(allTerms).map(term => jobVector[term] || 0);
      const resumeArr = Array.from(allTerms).map(term => resumeVector[term] || 0);
      const dot = jobArr.reduce((sum, v, i) => sum + v * resumeArr[i], 0);
      const magA = Math.sqrt(jobArr.reduce((sum, v) => sum + v * v, 0));
      const magB = Math.sqrt(resumeArr.reduce((sum, v) => sum + v * v, 0));
      const score = magA && magB ? dot / (magA * magB) : 0;
      return { resume, score };
    });

    // Sort by score descending
    similarities.sort((a, b) => b.score - a.score);

    console.log('Final similarities:', similarities.length);
    console.log('Similarities:', similarities.map(s => ({ id: s.resume._id, score: s.score })));

    res.json({ matches: similarities });
  } catch (error) {
    console.error('Match resumes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;