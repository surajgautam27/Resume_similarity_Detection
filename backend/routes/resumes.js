const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const natural = require('natural');
const auth = require('../middleware/auth');
const Resume = require('../models/Resume');
const { extractSkills, extractCandidateInfo } = require('../utils/resumeParser');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Upload single resume
router.post('/upload', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read and parse PDF
    const pdfBuffer = await fs.readFile(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    const extractedText = pdfData.text;

    // Extract candidate information
    const candidateInfo = extractCandidateInfo(extractedText);
    
    // Extract skills
    const skills = extractSkills(extractedText);

    // Create resume record
    const resume = new Resume({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      extractedText,
      candidate: candidateInfo,
      skills,
      uploadedBy: req.user.userId,
      status: 'processed',
      processed: true,
      metadata: {
        uploadDate: new Date(),
        processingTime: Date.now(),
        wordCount: extractedText.split(/\s+/).length,
        pageCount: pdfData.numpages
      }
    });

    await resume.save();

    res.status(201).json({
      message: 'Resume uploaded and processed successfully',
      resume: {
        id: resume._id,
        filename: resume.filename,
        originalName: resume.originalName,
        candidate: resume.candidate,
        skills: resume.skills,
        status: resume.status,
        uploadedAt: resume.createdAt
      }
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    
    // Clean up uploaded file if processing failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'Error processing resume' });
  }
});

// Upload multiple resumes
router.post('/upload-multiple', auth, upload.array('resumes', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        // Read and parse PDF
        const pdfBuffer = await fs.readFile(file.path);
        const pdfData = await pdfParse(pdfBuffer);
        const extractedText = pdfData.text;

        // Extract candidate information
        const candidateInfo = extractCandidateInfo(extractedText);
        
        // Extract skills
        const skills = extractSkills(extractedText);

        // Create resume record
        const resume = new Resume({
          filename: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          extractedText,
          candidate: candidateInfo,
          skills,
          uploadedBy: req.user.userId,
          status: 'processed',
          processed: true,
          metadata: {
            uploadDate: new Date(),
            processingTime: Date.now(),
            wordCount: extractedText.split(/\s+/).length,
            pageCount: pdfData.numpages
          }
        });

        await resume.save();

        results.push({
          id: resume._id,
          filename: resume.filename,
          originalName: resume.originalName,
          candidate: resume.candidate,
          skills: resume.skills,
          status: resume.status
        });
      } catch (error) {
        console.error(`Error processing ${file.originalname}:`, error);
        errors.push({
          filename: file.originalname,
          error: 'Failed to process file'
        });
        
        // Clean up failed file
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
    }

    res.status(201).json({
      message: `Processed ${results.length} resumes successfully`,
      results,
      errors
    });
  } catch (error) {
    console.error('Upload multiple resumes error:', error);
    res.status(500).json({ error: 'Error processing resumes' });
  }
});

// Get all resumes
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

    const resumes = await Resume.find(query)
      .populate('uploadedBy', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-extractedText') // Don't send full text in list
      .exec();

    const total = await Resume.countDocuments(query);

    res.json({
      resumes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single resume
router.get('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
      .populate('uploadedBy', 'name email');
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json({ resume });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete resume
router.delete('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Check if user has permission to delete this resume
    if (resume.uploadedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this resume' });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(resume.filePath);
    } catch (unlinkError) {
      console.error('Error deleting file:', unlinkError);
    }

    await Resume.findByIdAndDelete(req.params.id);

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search resumes
router.get('/search', auth, async (req, res) => {
  try {
    const { q, skills, experience, location, status } = req.query;
    
    const query = {};
    
    if (q) {
      query.$text = { $search: q };
    }
    
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillsArray };
    }
    
    if (experience) {
      query.experience = { $gte: parseInt(experience) };
    }
    
    if (location) {
      query['candidate.location'] = { $regex: location, $options: 'i' };
    }
    
    if (status) query.status = status;

    const resumes = await Resume.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-extractedText');

    res.json({ resumes });
  } catch (error) {
    console.error('Search resumes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 