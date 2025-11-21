const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const auth = require('../middleware/auth');
const Resume = require('../models/Resume');
const Job = require('../models/Job');
const User = require('../models/User');
const { extractSkills, extractCandidateInfo, extractResumeDetails } = require('../utils/resumeParser');
const { parseResumeWithAI } = require('../utils/aiResumeParser');
const { parseResumeEnhanced } = require('../utils/advancedResumeParser');
const { parseResumeWithPyresparser, isPyresparserAvailable } = require('../utils/pyresParserWrapper');
const { parseResumeStructured } = require('../utils/structuredResumeParser');

const fsPromises = fs.promises;

const mergeUniqueStrings = (existing = [], incoming = []) => {
  const normalized = (list) =>
    (list || [])
      .map(item => (typeof item === 'string' ? item.trim() : item))
      .filter(Boolean);
  return Array.from(new Set([...normalized(existing), ...normalized(incoming)]));
};

const EDUCATION_KEYWORDS = [
  'bachelor', 'master', 'phd', 'ph.d', 'doctor', 'associate', 'diploma',
  'degree', 'bsc', 'msc', 'bs', 'ms', 'mba', 'btech', 'mtech', 'be', 'me',
  'university', 'college', 'school', 'academy', 'institute', 'certification'
];

const NON_EDUCATION_PATTERNS = [
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, // email addresses
  /(https?:\/\/|www\.)/i,                   // urls
  /\bgithub\b/i,
  /\blinkedin\b/i,
  /\bportfolio\b/i,
  /\bphone\b/i,
  /\bcontact\b/i
];

const looksLikeContactInfo = (value) => {
  if (!value) return false;
  const text = String(value).toLowerCase();
  return NON_EDUCATION_PATTERNS.some(pattern => pattern.test(text));
};

const containsEducationKeyword = (value) => {
  if (!value) return false;
  const text = String(value).toLowerCase();
  return EDUCATION_KEYWORDS.some(keyword => text.includes(keyword));
};

const mapEducationEntries = (entries = []) => {
  return entries
    .map(entry => {
      if (!entry) return null;
      if (typeof entry === 'string') {
          if (looksLikeContactInfo(entry)) return null;
        return { school: entry };
      }
      if (typeof entry === 'object') {
        const mapped = {
          school: entry.school || entry.name || entry.institution || entry.college || entry.university || '',
          degree: entry.degree || entry.title || '',
          field: entry.field || entry.major || entry.specialization || '',
          startYear: entry.startYear || entry.start_date || entry.startDate,
          endYear: entry.endYear || entry.end_date || entry.endDate || entry.graduationYear || entry.year
        };
        if (looksLikeContactInfo([mapped.school, mapped.degree, mapped.field].filter(Boolean).join(' '))) {
          return null;
        }
        return mapped;
      }
      const fallback = String(entry);
      if (looksLikeContactInfo(fallback)) return null;
      return { school: fallback };
    })
    .filter(edu => !!(edu?.school || edu?.degree || edu?.field));
};

const formatYearValue = (value) => {
  if (!value) return '';
  if (value instanceof Date && !isNaN(value)) {
    return String(value.getFullYear());
  }
  if (typeof value === 'number') {
    return String(Math.round(value));
  }
  const text = String(value).trim();
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : text;
};

const formatYearRange = (start, end) => {
  const startVal = formatYearValue(start);
  const endVal = formatYearValue(end);
  if (!startVal && !endVal) return '';
  if (startVal && endVal) {
    if (startVal === endVal) return startVal;
    return `${startVal} - ${endVal}`;
  }
  return startVal || endVal;
};

const normalizeEducationEntries = (entries = []) => {
  return mapEducationEntries(entries)
    .map(entry => {
      if (!entry) return null;
      const parts = [];
      if (entry.degree && entry.field) {
        parts.push(`${entry.degree} in ${entry.field}`);
      } else if (entry.degree || entry.field) {
        parts.push(entry.degree || entry.field);
      }
      if (entry.school) {
        parts.push(entry.school);
      }
      const duration = formatYearRange(entry.startYear, entry.endYear);
      if (duration) {
        parts.push(duration);
      }
      const formatted = parts.join(' - ').trim();
      const fallback = formatted || entry.school || '';
      if (!fallback) return null;
      if (looksLikeContactInfo(fallback)) return null;
      if (!containsEducationKeyword(fallback) && fallback.length < 5) {
        return null;
      }
      return fallback;
    })
    .filter(Boolean)
    .map(entry => (typeof entry === 'string' ? entry.trim() : entry));
};

const syncUserProfileFromResume = async (userId, resumeDoc) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.profile = user.profile || {};
    const profile = user.profile;

    // Update name if available and not set
    if (resumeDoc.candidate?.name && (!user.name || user.name.trim().length < 3)) {
      user.name = resumeDoc.candidate.name;
    }

    // Update bio from summary
    if (resumeDoc.summary) {
      const trimmedSummary = resumeDoc.summary.slice(0, 2000);
      if (!profile.bio || profile.bio.length < trimmedSummary.length) {
        profile.bio = trimmedSummary;
      }
    }

    // Merge skills
    if (resumeDoc.skills?.length) {
      profile.skills = mergeUniqueStrings(profile.skills || [], resumeDoc.skills);
    }

    // Update education if empty or if resume has more entries
    if (resumeDoc.education?.length) {
      const mappedEducation = mapEducationEntries(resumeDoc.education).slice(0, 5);
      if (!profile.education || profile.education.length === 0 || mappedEducation.length > profile.education.length) {
        profile.education = mappedEducation;
      }
    }

    // Update experience in profile if available
    if (resumeDoc.experience && typeof resumeDoc.experience === 'number' && resumeDoc.experience > 0) {
      // Store experience in profile if not already set or if resume has more
      if (!profile.experience || profile.experience.length === 0) {
        profile.experience = [{
          role: 'Professional Experience',
          description: `${resumeDoc.experience} years of professional experience`,
          startDate: new Date(new Date().getFullYear() - Math.floor(resumeDoc.experience), 0, 1),
          endDate: new Date()
        }];
      }
    }

    await user.save();
    console.log('Profile synced from resume:', {
      userId,
      nameUpdated: !!resumeDoc.candidate?.name,
      skillsCount: profile.skills?.length || 0,
      educationCount: profile.education?.length || 0,
      experience: resumeDoc.experience
    });
  } catch (error) {
    console.error('Failed to sync profile from resume:', error);
  }
};

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fsPromises.mkdir(uploadDir, { recursive: true });
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
    console.log('Resume upload request:', {
      userId: req.user.userId,
      userRole: req.user.role,
      hasFile: !!req.file,
      filename: req.file?.originalname
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const processingStartedAt = Date.now();

    // Read and parse PDF
    const pdfBuffer = await fsPromises.readFile(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    const extractedText = pdfData.text;

    console.log('PDF parsed:', {
      textLength: extractedText.length,
      pages: pdfData.numpages
    });

    // Try parsers in order of accuracy: Structured -> Pyresparser -> AI -> Enhanced -> Basic
    let structuredParsedData = null;
    let pyresparserData = null;
    let aiParsedData = null;
    let enhancedParsedData = null;
    
    // First try structured parser (best for display formatting)
    try {
      const structuredResult = parseResumeStructured(extractedText);
      if (structuredResult.success) {
        structuredParsedData = structuredResult.data;
        console.log('Structured parsing successful');
      }
    } catch (error) {
      console.log('Structured parsing failed, trying pyresparser:', error.message);
    }

    // If structured parsing failed, try pyresparser
    if (!structuredParsedData) {
      try {
        const isPyresAvailable = await isPyresparserAvailable();
        if (isPyresAvailable) {
          pyresparserData = await parseResumeWithPyresparser(filePath);
          if (pyresparserData) {
            console.log('Pyresparser parsing successful');
          }
        } else {
          console.log('Pyresparser not available, trying AI parser');
        }
      } catch (error) {
        console.log('Pyresparser parsing failed, trying AI parser:', error.message);
      }
    }

    // If both failed, try AI parsing
    if (!structuredParsedData && !pyresparserData) {
      try {
        aiParsedData = await parseResumeWithAI(extractedText);
        if (aiParsedData) {
          console.log('AI parsing successful');
        }
      } catch (error) {
        console.log('AI parsing failed, trying enhanced parser:', error.message);
      }
    }

    // If all failed, try enhanced parser
    if (!structuredParsedData && !pyresparserData && !aiParsedData) {
      try {
        enhancedParsedData = parseResumeEnhanced(extractedText);
        console.log('Enhanced parsing successful');
      } catch (error) {
        console.log('Enhanced parsing failed, using basic parser:', error.message);
      }
    }

    let candidateInfo, structuredDetails, skills, languages, educationEntries, 
        certificationEntries, projects, highlights, summaryText, experienceYears, candidateBasics, workExperience, achievements;

    if (structuredParsedData) {
      // Use structured parsed data (best for display)
      candidateBasics = structuredParsedData.candidate;
      skills = structuredParsedData.skills || [];
      languages = structuredParsedData.languages || [];
      summaryText = structuredParsedData.summary || '';
      experienceYears = structuredParsedData.experience || 0;
      educationEntries = structuredParsedData.education || [];
      certificationEntries = structuredParsedData.certifications || [];
      projects = structuredParsedData.projects || [];
      workExperience = structuredParsedData.workExperience || [];
      achievements = structuredParsedData.achievements || [];
      highlights = skills.slice(0, 10); // Use top skills as highlights
      
      console.log('Extracted via Structured Parser:', {
        name: candidateBasics.name,
        email: candidateBasics.email,
        skillsCount: skills.length,
        experienceYears,
        educationCount: educationEntries.length,
        workExperienceCount: workExperience.length,
        projectsCount: projects.length
      });
    } else if (pyresparserData) {
      // Use pyresparser data (most accurate)
      candidateBasics = pyresparserData.candidate;
      skills = pyresparserData.skills || [];
      languages = pyresparserData.languages || [];
      summaryText = pyresparserData.summary || '';
      experienceYears = pyresparserData.experience || 0;
      
      // Format education entries
      educationEntries = [];
      if (pyresparserData.education?.length) {
        educationEntries = pyresparserData.education;
      } else if (pyresparserData.degrees?.length || pyresparserData.college_names?.length) {
        // Combine degrees and colleges
        const degrees = pyresparserData.degrees || [];
        const colleges = pyresparserData.college_names || [];
        for (let i = 0; i < Math.max(degrees.length, colleges.length); i++) {
          const parts = [];
          if (degrees[i]) parts.push(degrees[i]);
          if (colleges[i]) parts.push(`at ${colleges[i]}`);
          if (parts.length > 0) educationEntries.push(parts.join(' '));
        }
      }
      
      certificationEntries = pyresparserData.certifications || [];
      projects = pyresparserData.projects || [];
      highlights = skills.slice(0, 20); // Use top skills as highlights
      
      console.log('Extracted via Pyresparser:', {
        name: candidateBasics.name,
        email: candidateBasics.email,
        skillsCount: skills.length,
        experienceYears,
        educationCount: educationEntries.length,
        designations: pyresparserData.designations?.length || 0,
        companies: pyresparserData.company_names?.length || 0
      });
    } else if (aiParsedData) {
      // Use AI parsed data
      candidateBasics = {
        name: aiParsedData.name || '',
        email: aiParsedData.email || '',
        phone: aiParsedData.phone || '',
        location: aiParsedData.location || ''
      };
      
      skills = aiParsedData.skills || [];
      languages = aiParsedData.languages || [];
      summaryText = aiParsedData.summary || '';
      experienceYears = aiParsedData.experienceYears || 0;
      
      // Convert experience array to entries format
      const experienceEntries = (aiParsedData.experience || []).map(exp => {
        const dateRange = exp.endDate === 'Present' || exp.endDate === 'Current' || !exp.endDate
          ? `${exp.startDate} - Present`
          : `${exp.startDate} - ${exp.endDate}`;
        return `${exp.role} at ${exp.company} (${dateRange})${exp.description ? ': ' + exp.description : ''}`;
      });
      
      educationEntries = (aiParsedData.education || []).map(edu => {
        const parts = [edu.degree, edu.field, edu.school].filter(Boolean);
        if (edu.startYear || edu.endYear) {
          parts.push(`(${edu.startYear || ''}${edu.endYear ? '-' + edu.endYear : ''})`);
        }
        return parts.join(' ');
      });
      
      certificationEntries = aiParsedData.certifications || [];
      projects = aiParsedData.projects || [];
      highlights = [];
      
      console.log('Extracted via AI:', {
        name: candidateBasics.name,
        email: candidateBasics.email,
        skillsCount: skills.length,
        experienceYears,
        educationCount: educationEntries.length
      });
    } else if (enhancedParsedData) {
      // Use enhanced parsed data
      candidateBasics = enhancedParsedData.candidate;
      skills = enhancedParsedData.skills;
      languages = enhancedParsedData.languages;
      summaryText = enhancedParsedData.summary;
      experienceYears = enhancedParsedData.experience;
      educationEntries = enhancedParsedData.education;
      certificationEntries = enhancedParsedData.certifications;
      projects = enhancedParsedData.projects;
      highlights = enhancedParsedData.highlights;
      
      console.log('Extracted via Enhanced Parser:', {
        name: candidateBasics.name,
        email: candidateBasics.email,
        skillsCount: skills.length,
        experienceYears,
        educationCount: educationEntries.length
      });
    } else {
      // Fallback to basic parser
      candidateInfo = extractCandidateInfo(extractedText);
      structuredDetails = extractResumeDetails(extractedText);
      
      const {
        education: candidateEducation,
        languages: candidateLanguages,
        certifications: candidateCertifications,
        experience: candidateExperience,
        ...candidateBasicsTemp
      } = candidateInfo;
      
      candidateBasics = candidateBasicsTemp;
    
    // Extract skills
      skills = extractSkills(extractedText);

      languages = Array.from(
        new Set([...(candidateLanguages || []), ...(structuredDetails.languages || [])])
      );

      educationEntries = structuredDetails.educationEntries.length > 0
        ? structuredDetails.educationEntries
        : (candidateEducation || []);

      certificationEntries = structuredDetails.certificationEntries.length > 0
        ? structuredDetails.certificationEntries
        : (candidateCertifications || []);

      projects = structuredDetails.projectEntries || [];
      highlights = structuredDetails.highlights || [];
      summaryText = structuredDetails.summary || '';
      
      // Use calculated experience from dates if available, otherwise use text-based extraction
      experienceYears = structuredDetails.calculatedExperience > 0
        ? structuredDetails.calculatedExperience
        : (typeof candidateExperience === 'number' && candidateExperience > 0 ? candidateExperience : 0);
      
      console.log('Extracted via Basic Parser (fallback)');
    }

    educationEntries = normalizeEducationEntries(educationEntries || []);

    console.log('Final extracted info:', {
      candidate: candidateBasics,
      skills: skills.length,
      educationEntries: educationEntries.length,
      projects: projects.length,
      languages,
      certificationEntries: certificationEntries.length,
      summaryText: summaryText ? summaryText.substring(0, 100) + '...' : '',
      experienceYears,
      parsingMethod: structuredParsedData ? 'Structured' : pyresparserData ? 'Pyresparser' : aiParsedData ? 'AI' : enhancedParsedData ? 'Enhanced' : 'Basic'
    });

    // Create resume record
    const resume = new Resume({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      extractedText,
      candidate: candidateBasics,
      skills,
      experience: experienceYears,
      education: educationEntries,
      languages,
      certifications: certificationEntries,
      projects,
      summary: summaryText ? summaryText.substring(0, 2000) : '',
      highlights,
      workExperience: workExperience || [],
      achievements: achievements || [],
      uploadedBy: req.user.userId,
      status: 'processed',
      processed: true,
      metadata: {
        uploadDate: new Date(),
        processingTime: Date.now() - processingStartedAt,
        wordCount: extractedText.split(/\s+/).length,
        pageCount: pdfData.numpages
      }
    });

    await resume.save();
    await syncUserProfileFromResume(req.user.userId, resume);

    console.log('Resume saved successfully:', {
      id: resume._id,
      filename: resume.filename,
      originalName: resume.originalName,
      candidate: resume.candidate,
      skills: resume.skills,
      uploadedBy: resume.uploadedBy
    });

    res.status(201).json({
      message: 'Resume uploaded and processed successfully',
      resume: {
        id: resume._id,
        filename: resume.filename,
        originalName: resume.originalName,
        candidate: resume.candidate,
        skills: resume.skills,
        summary: resume.summary,
        education: resume.education,
        languages: resume.languages,
        certifications: resume.certifications,
        highlights: resume.highlights,
        experience: resume.experience,
        status: resume.status,
        metadata: resume.metadata,
        uploadedAt: resume.createdAt
      }
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    
    // Clean up uploaded file if processing failed
    if (req.file) {
      try {
        await fsPromises.unlink(req.file.path);
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
        const processingStartedAt = Date.now();

        // Read and parse PDF
        const pdfBuffer = await fsPromises.readFile(file.path);
        const pdfData = await pdfParse(pdfBuffer);
        const extractedText = pdfData.text;

        // Try parsers in order: Structured -> Pyresparser -> AI -> Enhanced -> Basic
        let structuredParsedData = null;
        let pyresparserData = null;
        let aiParsedData = null;
        let enhancedParsedData = null;
        
        // First try structured parser
        try {
          const structuredResult = parseResumeStructured(extractedText);
          if (structuredResult.success) {
            structuredParsedData = structuredResult.data;
          }
        } catch (error) {
          console.log(`Structured parsing failed for ${file.originalname}, trying pyresparser`);
        }

        // If structured parsing failed, try pyresparser
        if (!structuredParsedData) {
          try {
            const isPyresAvailable = await isPyresparserAvailable();
            if (isPyresAvailable) {
              pyresparserData = await parseResumeWithPyresparser(filePath);
            }
          } catch (error) {
            console.log(`Pyresparser parsing failed for ${file.originalname}, trying AI parser`);
          }
        }

        // If both failed, try AI parsing
        if (!structuredParsedData && !pyresparserData) {
          try {
            aiParsedData = await parseResumeWithAI(extractedText);
          } catch (error) {
            console.log(`AI parsing failed for ${file.originalname}, trying enhanced parser`);
          }
        }

        // If all failed, try enhanced parser
        if (!structuredParsedData && !pyresparserData && !aiParsedData) {
          try {
            enhancedParsedData = parseResumeEnhanced(extractedText);
          } catch (error) {
            console.log(`Enhanced parsing failed for ${file.originalname}, using basic parser`);
          }
        }

        let candidateInfo, structuredDetails, skills, languages, educationEntries, 
            certificationEntries, projects, highlights, summaryText, experienceYears, candidateBasics, workExperience, achievements;

        if (structuredParsedData) {
          // Use structured parsed data (best for display)
          candidateBasics = structuredParsedData.candidate;
          skills = structuredParsedData.skills || [];
          languages = structuredParsedData.languages || [];
          summaryText = structuredParsedData.summary || '';
          experienceYears = structuredParsedData.experience || 0;
          educationEntries = structuredParsedData.education || [];
          certificationEntries = structuredParsedData.certifications || [];
          projects = structuredParsedData.projects || [];
          workExperience = structuredParsedData.workExperience || [];
          achievements = structuredParsedData.achievements || [];
          highlights = skills.slice(0, 10);
        } else if (pyresparserData) {
          // Use pyresparser data (most accurate)
          candidateBasics = pyresparserData.candidate;
          skills = pyresparserData.skills || [];
          languages = pyresparserData.languages || [];
          summaryText = pyresparserData.summary || '';
          experienceYears = pyresparserData.experience || 0;
          
          // Format education entries
          educationEntries = [];
          if (pyresparserData.education?.length) {
            educationEntries = pyresparserData.education;
          } else if (pyresparserData.degrees?.length || pyresparserData.college_names?.length) {
            const degrees = pyresparserData.degrees || [];
            const colleges = pyresparserData.college_names || [];
            for (let i = 0; i < Math.max(degrees.length, colleges.length); i++) {
              const parts = [];
              if (degrees[i]) parts.push(degrees[i]);
              if (colleges[i]) parts.push(`at ${colleges[i]}`);
              if (parts.length > 0) educationEntries.push(parts.join(' '));
            }
          }
          
          certificationEntries = pyresparserData.certifications || [];
          projects = pyresparserData.projects || [];
          highlights = skills.slice(0, 20);
        } else if (aiParsedData) {
          // Use AI parsed data
          candidateBasics = {
            name: aiParsedData.name || '',
            email: aiParsedData.email || '',
            phone: aiParsedData.phone || '',
            location: aiParsedData.location || ''
          };
          
          skills = aiParsedData.skills || [];
          languages = aiParsedData.languages || [];
          summaryText = aiParsedData.summary || '';
          experienceYears = aiParsedData.experienceYears || 0;
          
          const experienceEntries = (aiParsedData.experience || []).map(exp => {
            const dateRange = exp.endDate === 'Present' || exp.endDate === 'Current' || !exp.endDate
              ? `${exp.startDate} - Present`
              : `${exp.startDate} - ${exp.endDate}`;
            return `${exp.role} at ${exp.company} (${dateRange})${exp.description ? ': ' + exp.description : ''}`;
          });
          
          educationEntries = (aiParsedData.education || []).map(edu => {
            const parts = [edu.degree, edu.field, edu.school].filter(Boolean);
            if (edu.startYear || edu.endYear) {
              parts.push(`(${edu.startYear || ''}${edu.endYear ? '-' + edu.endYear : ''})`);
            }
            return parts.join(' ');
          });
          
          certificationEntries = aiParsedData.certifications || [];
          projects = aiParsedData.projects || [];
          highlights = [];
        } else if (enhancedParsedData) {
          // Use enhanced parsed data
          candidateBasics = enhancedParsedData.candidate;
          skills = enhancedParsedData.skills;
          languages = enhancedParsedData.languages;
          summaryText = enhancedParsedData.summary;
          experienceYears = enhancedParsedData.experience;
          educationEntries = enhancedParsedData.education;
          certificationEntries = enhancedParsedData.certifications;
          projects = enhancedParsedData.projects;
          highlights = enhancedParsedData.highlights;
        } else {
          // Fallback to basic parser
          candidateInfo = extractCandidateInfo(extractedText);
          structuredDetails = extractResumeDetails(extractedText);

          const {
            education: candidateEducation,
            languages: candidateLanguages,
            certifications: candidateCertifications,
            experience: candidateExperience,
            ...candidateBasicsTemp
          } = candidateInfo;
          
          candidateBasics = candidateBasicsTemp;

          skills = extractSkills(extractedText);

          languages = Array.from(
            new Set([...(candidateLanguages || []), ...(structuredDetails.languages || [])])
          );

          educationEntries = structuredDetails.educationEntries.length > 0
            ? structuredDetails.educationEntries
            : (candidateEducation || []);

          certificationEntries = structuredDetails.certificationEntries.length > 0
            ? structuredDetails.certificationEntries
            : (candidateCertifications || []);

          projects = structuredDetails.projectEntries || [];
          highlights = structuredDetails.highlights || [];
          summaryText = structuredDetails.summary || '';
          
          experienceYears = structuredDetails.calculatedExperience > 0
            ? structuredDetails.calculatedExperience
            : (typeof candidateExperience === 'number' && candidateExperience > 0 ? candidateExperience : 0);
        }

        educationEntries = normalizeEducationEntries(educationEntries || []);

        // Create resume record
        const resume = new Resume({
          filename: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          extractedText,
          candidate: candidateBasics,
          skills,
          experience: experienceYears,
          education: educationEntries,
          languages,
          certifications: certificationEntries,
          projects,
          summary: summaryText ? summaryText.substring(0, 2000) : '',
          highlights,
          workExperience: workExperience || [],
          achievements: achievements || [],
          uploadedBy: req.user.userId,
          status: 'processed',
          processed: true,
          metadata: {
            uploadDate: new Date(),
            processingTime: Date.now() - processingStartedAt,
            wordCount: extractedText.split(/\s+/).length,
            pageCount: pdfData.numpages
          }
        });

        await resume.save();
        await syncUserProfileFromResume(req.user.userId, resume);

        results.push({
          id: resume._id,
          filename: resume.filename,
          originalName: resume.originalName,
          candidate: resume.candidate,
          skills: resume.skills,
          summary: resume.summary,
          education: resume.education,
          languages: resume.languages,
          certifications: resume.certifications,
          highlights: resume.highlights,
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
          await fsPromises.unlink(file.path);
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

    // RBAC logic
    if (req.user.role === 'company') {
      // Find all jobs posted by this company
      const jobs = await Job.find({ createdBy: req.user.userId });
      // Collect all resume IDs from applications to these jobs
      const resumeIds = jobs.flatMap(job => (job.applications || []).map(app => app.resume)).filter(Boolean);
      // Only show resumes that have applied to this company's jobs
      query._id = { $in: resumeIds };
    } else if (req.user.role === 'developer') {
      // Only show resumes uploaded by this developer
      query.uploadedBy = req.user.userId;
    }
    // else: admin, show all resumes

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

// Stream resume PDF for authorized viewers
router.get('/:id/file', auth, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    let canView = false;

    if (req.user.role === 'admin') {
      canView = true;
    } else if (req.user.role === 'developer') {
      canView = resume.uploadedBy.toString() === req.user.userId;
    } else if (req.user.role === 'company') {
      const jobWithResume = await Job.findOne({
        createdBy: req.user.userId,
        'applications.resume': resume._id
      }).select('_id');
      canView = !!jobWithResume;
    }

    if (!canView) {
      return res.status(403).json({ error: 'Not authorized to view this resume file' });
    }

    const resolvedPath = path.isAbsolute(resume.filePath)
      ? resume.filePath
      : path.join(__dirname, '..', resume.filePath);

    try {
      await fsPromises.access(resolvedPath);
    } catch (accessError) {
      if (accessError.code === 'ENOENT') {
        return res.status(404).json({ error: 'Resume file not found on server' });
      }
      throw accessError;
    }

    return res.sendFile(
      resolvedPath,
      {
        headers: {
          'Content-Type': resume.mimeType || 'application/pdf',
          'Content-Disposition': `inline; filename="${encodeURIComponent(resume.originalName)}"`
        }
      },
      (err) => {
        if (err) {
          console.error('Stream resume error:', err);
          if (!res.headersSent) {
            res.status(err.statusCode || 500).json({ error: 'Error streaming resume file' });
          }
        }
      }
    );
  } catch (error) {
    console.error('View resume file error:', error);
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

    const isLinkedToJobs = await Job.exists({ 'applications.resume': resume._id });
    if (isLinkedToJobs) {
      return res.status(400).json({
        error: 'This resume is attached to job applications and cannot be deleted. Withdraw or update those applications first.'
      });
    }

    // Delete file from filesystem
    try {
      await fsPromises.unlink(resume.filePath);
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