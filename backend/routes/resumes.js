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
const { parseResumeWithAI, parseResumeWithAIAdvanced, isAIParserAvailable } = require('../utils/aiResumeParser');
const { parseResumeEnhanced } = require('../utils/advancedResumeParser');
const { parseResumeWithPyresparser, isPyresparserAvailable } = require('../utils/pyresParserWrapper');
const { parseResumeStructured } = require('../utils/structuredResumeParser');
const { parseEducationSection } = require('../utils/educationParser');
const { parseWorkExperienceSection, extractWorkExperienceEntry } = require('../utils/workExperienceParser');

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

const parseYearNumber = (value) => {
  if (!value) return undefined;
  if (typeof value === 'number') {
    const year = Math.round(value);
    return (year >= 1900 && year <= 2100) ? year : undefined;
  }
  if (value instanceof Date && !isNaN(value)) {
    return value.getFullYear();
  }
  const text = String(value).trim();
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0]);
    return (year >= 1900 && year <= 2100) ? year : undefined;
  }
  return undefined;
};

const normalizeEducationEntries = (entries = []) => {
  const isValidEducationString = (str) => {
    if (!str || str.length < 5) return false;
    const lower = str.toLowerCase();
    
    // Check for contact info
    if (looksLikeContactInfo(str)) return false;
    
    // Must have education keyword or be reasonably long
    if (!containsEducationKeyword(str) && str.length < 10) return false;
    
    // Check for common non-education patterns
    if (/^email|^phone|^contact|^address|^github|^linkedin/i.test(str)) return false;
    
    return true;
  };
  
  return mapEducationEntries(entries)
    .map(entry => {
      if (!entry) return null;
      
      // If entry is already structured, validate and format it
      if (typeof entry === 'object' && (entry.school || entry.degree || entry.field)) {
        const normalized = {
          school: entry.school?.trim() || '',
          degree: entry.degree?.trim() || '',
          field: entry.field?.trim() || '',
          startYear: parseYearNumber(entry.startYear),
          endYear: parseYearNumber(entry.endYear)
        };
        
        // Validate years
        if (normalized.startYear && normalized.endYear && normalized.startYear > normalized.endYear) {
          const temp = normalized.startYear;
          normalized.startYear = normalized.endYear;
          normalized.endYear = temp;
        }
        
        // Validate years are reasonable
        if (normalized.startYear && (normalized.startYear < 1900 || normalized.startYear > 2100)) {
          normalized.startYear = undefined;
        }
        if (normalized.endYear && (normalized.endYear < 1900 || normalized.endYear > 2100)) {
          normalized.endYear = undefined;
        }
        
        // Clean up
        normalized.school = normalized.school.replace(/\s+/g, ' ').trim();
        normalized.degree = normalized.degree.replace(/\s+/g, ' ').trim();
        normalized.field = normalized.field.replace(/\s+/g, ' ').trim();
        
        // Validate the entry
        const combined = `${normalized.school} ${normalized.degree} ${normalized.field}`.toLowerCase();
        if (looksLikeContactInfo(combined)) return null;
        if (!normalized.school && !normalized.degree && !normalized.field) return null;
        
        return normalized;
      }
      
      // If entry is a string, convert to structured format
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
      
      if (!fallback || !isValidEducationString(fallback)) return null;
      
      // Return structured format
      return {
        school: entry.school?.trim() || fallback.split(' - ')[fallback.split(' - ').length - 1] || '',
        degree: entry.degree?.trim() || '',
        field: entry.field?.trim() || '',
        startYear: parseYearNumber(entry.startYear),
        endYear: parseYearNumber(entry.endYear)
      };
    })
    .filter(Boolean)
    .filter(entry => {
      // Final validation - ensure entry has meaningful content
      const hasContent = entry.school || entry.degree || entry.field;
      if (!hasContent) return false;
      
      const combined = `${entry.school || ''} ${entry.degree || ''} ${entry.field || ''}`.toLowerCase();
      return !looksLikeContactInfo(combined);
    });
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
    let pdfBuffer;
    let pdfData;
    let extractedText;
    
    try {
      pdfBuffer = await fsPromises.readFile(req.file.path);
      pdfData = await pdfParse(pdfBuffer);
      extractedText = pdfData.text;
    } catch (parseError) {
      // Clean up uploaded file if parsing failed
      try {
        await fsPromises.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
      
      // Check for specific PDF parsing errors
      if (parseError.message && parseError.message.includes('XRef')) {
        return res.status(400).json({ 
          error: 'Invalid or corrupted PDF file. The PDF appears to be damaged or has an invalid structure. Please try uploading a different PDF file.',
          details: 'bad XRef entry - PDF cross-reference table is corrupted'
        });
      }
      
      if (parseError.message && parseError.message.includes('password')) {
        return res.status(400).json({ 
          error: 'PDF is password-protected. Please remove the password and try again.',
          details: parseError.message
        });
      }
      
      return res.status(400).json({ 
        error: 'Failed to parse PDF file. The file may be corrupted, password-protected, or in an unsupported format.',
        details: parseError.message || 'Unknown PDF parsing error'
      });
    }

    console.log('PDF parsed:', {
      textLength: extractedText.length,
      pages: pdfData.numpages
    });

    // Try parsers in order of accuracy
    // Priority: AI (if available) -> Structured -> Pyresparser -> Enhanced -> Basic
    // AI parser provides the most accurate extraction when OpenAI API key is configured
    let structuredParsedData = null;
    let pyresparserData = null;
    let aiParsedData = null;
    let enhancedParsedData = null;
    
    // Try AI parsing first if available (most accurate with NLP/generative AI)
    const aiAvailable = isAIParserAvailable();
    if (aiAvailable) {
      try {
        aiParsedData = await parseResumeWithAI(extractedText);
        if (aiParsedData && Object.keys(aiParsedData).length > 0) {
          console.log('AI parsing successful (using generative AI/NLP)');
        } else {
          aiParsedData = null;
        }
      } catch (error) {
        console.log('AI parsing failed, trying structured parser:', error.message);
        aiParsedData = null;
      }
    }
    
    // If AI parsing not available or failed, try structured parser (best for display formatting)
    if (!aiParsedData) {
      try {
        const structuredResult = parseResumeStructured(extractedText);
        if (structuredResult.success) {
          structuredParsedData = structuredResult.data;
          console.log('Structured parsing successful');
        }
      } catch (error) {
        console.log('Structured parsing failed, trying pyresparser:', error.message);
      }
    }

    // If both failed, try pyresparser
    if (!aiParsedData && !structuredParsedData) {
      try {
        const isPyresAvailable = await isPyresparserAvailable();
        if (isPyresAvailable) {
          pyresparserData = await parseResumeWithPyresparser(req.file.path);
          if (pyresparserData) {
            console.log('Pyresparser parsing successful');
          }
        } else {
          console.log('Pyresparser not available, trying enhanced parser');
        }
      } catch (error) {
        console.log('Pyresparser parsing failed, trying enhanced parser:', error.message);
      }
    }

    // If all failed, try enhanced parser
    if (!aiParsedData && !structuredParsedData && !pyresparserData) {
      try {
        enhancedParsedData = parseResumeEnhanced(extractedText);
        console.log('Enhanced parsing successful');
      } catch (error) {
        console.log('Enhanced parsing failed, using basic parser:', error.message);
      }
    }

    let candidateInfo, structuredDetails, skills, languages, educationEntries, 
        certificationEntries, projects, highlights, summaryText, experienceYears, candidateBasics, workExperience, achievements;

    // Collect skills from all parsers to merge them
    const allSkills = new Set();

    if (structuredParsedData) {
      // Use structured parsed data (best for display)
      candidateBasics = structuredParsedData.candidate;
      (structuredParsedData.skills || []).forEach(s => allSkills.add(s));
      languages = structuredParsedData.languages || [];
      summaryText = structuredParsedData.summary || '';
      experienceYears = structuredParsedData.experience || 0;
      educationEntries = structuredParsedData.education || [];
      certificationEntries = structuredParsedData.certifications || [];
      projects = structuredParsedData.projects || [];
      workExperience = structuredParsedData.workExperience || [];
      achievements = structuredParsedData.achievements || [];
      highlights = Array.from(allSkills).slice(0, 10); // Use top skills as highlights
      
      console.log('Extracted via Structured Parser:', {
        name: candidateBasics.name,
        email: candidateBasics.email,
        skillsCount: allSkills.size,
        experienceYears,
        educationCount: educationEntries.length,
        workExperienceCount: workExperience.length,
        projectsCount: projects.length
      });
    } else if (pyresparserData) {
      // Use pyresparser data (most accurate)
      candidateBasics = pyresparserData.candidate;
      (pyresparserData.skills || []).forEach(s => allSkills.add(s));
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
      highlights = Array.from(allSkills).slice(0, 20); // Use top skills as highlights
      
      console.log('Extracted via Pyresparser:', {
        name: candidateBasics.name,
        email: candidateBasics.email,
        skillsCount: allSkills.size,
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
      
      // Add AI skills to allSkills Set
      (aiParsedData.skills || []).forEach(s => allSkills.add(s));
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
        skillsCount: allSkills.size,
        experienceYears,
        educationCount: educationEntries.length
      });
    } else if (enhancedParsedData) {
      // Use enhanced parsed data
      candidateBasics = enhancedParsedData.candidate;
      if (enhancedParsedData.skills && Array.isArray(enhancedParsedData.skills)) {
        enhancedParsedData.skills.forEach(s => allSkills.add(s));
      }
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
      // Fallback to basic parser - ensure we always get some data
      try {
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
        const basicSkills = extractSkills(extractedText);
        if (basicSkills && Array.isArray(basicSkills)) {
          basicSkills.forEach(s => allSkills.add(s));
        }

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
      } catch (parseError) {
        console.error('Basic parser also failed, using minimal extraction:', parseError.message);
        // Minimal fallback - extract at least filename and basic info
        candidateBasics = {
          name: req.file.originalname.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').trim() || 'Unknown',
          email: '',
          phone: '',
          location: ''
        };
        skills = [];
        languages = [];
        educationEntries = [];
        certificationEntries = [];
        projects = [];
        highlights = [];
        summaryText = extractedText.substring(0, 500) || '';
        experienceYears = 0;
        workExperience = [];
        achievements = [];
      }
    }
    
    // Ensure we always have at least minimal data
    if (!candidateBasics || !candidateBasics.name) {
      candidateBasics = candidateBasics || {};
      candidateBasics.name = candidateBasics.name || req.file.originalname.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').trim() || 'Unknown';
    }
    
    // Merge skills from all successful parsers
    let allSkillsArray = Array.from(allSkills);
    
    // Also extract skills from the entire text as a final pass using improved extractSkills
    const { extractSkills: extractSkillsFromText } = require('../utils/structuredResumeParser');
    try {
      const additionalSkills = extractSkillsFromText(extractedText);
      if (additionalSkills && Array.isArray(additionalSkills)) {
        additionalSkills.forEach(s => {
          if (s && typeof s === 'string' && s.trim().length > 0) {
            allSkillsArray.push(s.trim());
          }
        });
      }
    } catch (skillExtractError) {
      console.error('Error extracting additional skills from text:', skillExtractError.message);
    }
    
    // Normalize and deduplicate skills
    const normalizeSkillName = (skill) => {
      if (!skill || typeof skill !== 'string') return null;
      let cleaned = skill.trim()
        .replace(/\s+/g, ' ')
        .replace(/\.js$/i, '.js')
        .replace(/\.net$/i, '.NET')
        .replace(/c\+\+/gi, 'C++')
        .replace(/c#/gi, 'C#')
        .replace(/javascript/gi, 'JavaScript')
        .replace(/python/gi, 'Python')
        .replace(/java\b/gi, 'Java')
        .replace(/react/gi, 'React')
        .replace(/angular/gi, 'Angular')
        .replace(/vue/gi, 'Vue')
        .replace(/node\.?js/gi, 'Node.js')
        .replace(/typescript/gi, 'TypeScript')
        .replace(/html/gi, 'HTML')
        .replace(/css/gi, 'CSS')
        .replace(/sql/gi, 'SQL')
        .replace(/aws/gi, 'AWS')
        .replace(/azure/gi, 'Azure')
        .replace(/docker/gi, 'Docker')
        .replace(/kubernetes/gi, 'Kubernetes')
        .replace(/helm/gi, 'Helm')
        .replace(/eks/gi, 'EKS')
        .replace(/git/gi, 'Git')
        .replace(/github\s+actions/gi, 'GitHub Actions')
        .replace(/gitlab\s+ci/gi, 'GitLab CI')
        .replace(/circleci/gi, 'CircleCI')
        .replace(/terraform/gi, 'Terraform')
        .replace(/ansible/gi, 'Ansible')
        .replace(/cloudformation/gi, 'CloudFormation')
        .replace(/prometheus/gi, 'Prometheus')
        .replace(/grafana/gi, 'Grafana')
        .replace(/elk\s+stack/gi, 'ELK Stack')
        .replace(/mongodb/gi, 'MongoDB')
        .replace(/mysql/gi, 'MySQL')
        .replace(/postgresql/gi, 'PostgreSQL')
        .replace(/redis/gi, 'Redis')
        .replace(/express/gi, 'Express')
        .replace(/django/gi, 'Django')
        .replace(/flask/gi, 'Flask')
        .replace(/spring/gi, 'Spring')
        .replace(/laravel/gi, 'Laravel')
        .replace(/php/gi, 'PHP')
        .replace(/ruby/gi, 'Ruby')
        .replace(/rails/gi, 'Rails')
        .replace(/go\b/gi, 'Go')
        .replace(/swift/gi, 'Swift')
        .replace(/kotlin/gi, 'Kotlin')
        .replace(/bash/gi, 'Bash')
        .replace(/yaml/gi, 'YAML')
        .replace(/nginx/gi, 'Nginx')
        .replace(/ssl/gi, 'SSL')
        .replace(/tls/gi, 'TLS')
        .replace(/firewall/gi, 'Firewall')
        .replace(/load\s+balancer/gi, 'Load Balancer')
        .replace(/bitbucket/gi, 'Bitbucket')
        .replace(/digitalocean/gi, 'DigitalOcean')
        .replace(/vs\s+code/gi, 'VS Code')
        .replace(/visual\s+studio\s+code/gi, 'VS Code')
        .replace(/vscode/gi, 'VS Code')
        .replace(/ubuntu/gi, 'Ubuntu')
        .replace(/centos/gi, 'CentOS')
        .replace(/linux/gi, 'Linux')
        .replace(/tensorflow/gi, 'TensorFlow')
        .replace(/pytorch/gi, 'PyTorch')
        .replace(/pandas/gi, 'Pandas')
        .replace(/numpy/gi, 'NumPy')
        .replace(/jira/gi, 'Jira')
        .replace(/jenkins/gi, 'Jenkins')
        .replace(/selenium/gi, 'Selenium')
        .replace(/cypress/gi, 'Cypress')
        .replace(/jest/gi, 'Jest')
        .replace(/react\s+native/gi, 'React Native')
        .replace(/flutter/gi, 'Flutter')
        .replace(/machine\s+learning/gi, 'Machine Learning')
        .replace(/deep\s+learning/gi, 'Deep Learning')
        .replace(/data\s+science/gi, 'Data Science')
        .replace(/artificial\s+intelligence/gi, 'Artificial Intelligence')
        .replace(/natural\s+language\s+processing/gi, 'NLP')
        .replace(/computer\s+vision/gi, 'Computer Vision')
        .replace(/big\s+data/gi, 'Big Data')
        .replace(/agile/gi, 'Agile')
        .replace(/scrum/gi, 'Scrum')
        .replace(/kanban/gi, 'Kanban')
        .replace(/rest\s+api/gi, 'REST API')
        .replace(/graphql/gi, 'GraphQL')
        .replace(/webpack/gi, 'Webpack')
        .replace(/bootstrap/gi, 'Bootstrap')
        .replace(/tailwind/gi, 'Tailwind')
        .replace(/material\s+ui/gi, 'Material-UI')
        .replace(/redux/gi, 'Redux')
        .replace(/vuex/gi, 'Vuex')
        .replace(/next\.?js/gi, 'Next.js')
        .replace(/nuxt\.?js/gi, 'Nuxt.js')
        .replace(/express\.?js/gi, 'Express.js')
        .replace(/angular\.?js/gi, 'AngularJS')
        .replace(/vue\.?js/gi, 'Vue.js')
        .replace(/react\.?js/gi, 'React.js');
      
      return cleaned && cleaned.length >= 2 && cleaned.length <= 50 ? cleaned : null;
    };
    
    // Normalize and deduplicate
    const normalizedSkills = new Set();
    allSkillsArray.forEach(skill => {
      if (!skill) return;
      const normalized = normalizeSkillName(String(skill));
      if (normalized) {
        normalizedSkills.add(normalized);
      }
    });
    
    skills = Array.from(normalizedSkills).filter(Boolean);
    
    // Ensure skills is always an array
    if (!skills || !Array.isArray(skills)) {
      skills = [];
    }
    
    highlights = skills.slice(0, 20); // Use top skills as highlights
    
    console.log('Final merged skills:', {
      totalSkills: skills.length,
      sampleSkills: skills.slice(0, 10)
    });
    
    // Always use advanced education parser to ensure best results
    // It handles multi-line entries, structured data, and filters contact info
    console.log('Running advanced education parser on extracted text...');
    try {
      const advancedEducation = parseEducationSection(extractedText);
      if (advancedEducation.length > 0) {
        // Use advanced parser results if they're better (more entries or more structured)
        const currentCount = educationEntries.length;
        const advancedCount = advancedEducation.length;
        const currentHasStructure = educationEntries.some(e => typeof e === 'object' && (e.school || e.degree || e.field));
        const advancedHasStructure = advancedEducation.some(e => typeof e === 'object' && (e.school || e.degree || e.field));
        
        // Prefer advanced parser if:
        // 1. It has more entries, OR
        // 2. Current entries are invalid/empty, OR
        // 3. Advanced has better structure
        if (advancedCount > currentCount || 
            currentCount === 0 || 
            (advancedHasStructure && !currentHasStructure) ||
            educationEntries.some(e => {
              const str = typeof e === 'string' ? e.toLowerCase() : JSON.stringify(e).toLowerCase();
              return str.length < 5 || 
                     /email|phone|github|linkedin|contact|address|@|http/i.test(str) ||
                     (typeof e === 'string' && e.split(' ').length < 2);
            })) {
          educationEntries = advancedEducation;
          console.log('Using advanced education parser results:', advancedEducation.length, 'entries');
        } else {
          // Merge both - advanced parser might have better structured data
          const merged = [...educationEntries];
          advancedEducation.forEach(advEdu => {
            const key = `${advEdu.degree || ''}|${advEdu.school || ''}|${advEdu.field || ''}`.toLowerCase();
            const exists = merged.some(e => {
              const eKey = typeof e === 'object' 
                ? `${e.degree || ''}|${e.school || ''}|${e.field || ''}`.toLowerCase()
                : String(e).toLowerCase();
              return eKey === key || eKey.includes(key) || key.includes(eKey);
            });
            if (!exists) merged.push(advEdu);
          });
          educationEntries = merged;
          console.log('Merged education entries:', merged.length, 'total');
        }
      }
    } catch (eduError) {
      console.error('Advanced education parser failed, using original results:', eduError.message);
    }
    
    // Ensure extractedText is never empty
    if (!extractedText || extractedText.trim().length < 10) {
      extractedText = [
        candidateBasics.name,
        summaryText,
        skills.join(' '),
        educationEntries.map(e => typeof e === 'string' ? e : (e.school || e.degree || '')).join(' ')
      ].filter(Boolean).join(' ') || req.file.originalname;
    }

    educationEntries = normalizeEducationEntries(educationEntries || []);

    // Parse work experience with dates using advanced parser
    let structuredWorkExperience = [];
    try {
      console.log('Parsing work experience from extracted text...');
      structuredWorkExperience = parseWorkExperienceSection(extractedText);
      
      // If we got structured work experience, use it; otherwise keep existing
      if (structuredWorkExperience.length > 0) {
        // Store structured format with dates for accurate period calculation
        console.log('Parsed work experience:', structuredWorkExperience.length, 'entries with dates');
      } else if (!workExperience || workExperience.length === 0) {
        // If no structured work experience found, try to extract from existing workExperience array
        if (workExperience && workExperience.length > 0) {
          // Try to parse dates from existing work experience strings
          structuredWorkExperience = workExperience
            .map(exp => {
              if (typeof exp === 'string') {
                return extractWorkExperienceEntry(exp);
              }
              return exp;
            })
            .filter(Boolean);
        }
      }
      
      // Calculate experience years from structured work experience dates
      if (structuredWorkExperience.length > 0) {
        const now = new Date();
        let totalMonths = 0;
        const dateRanges = [];
        
        structuredWorkExperience.forEach(exp => {
          // Convert ISO strings back to Date objects for calculation
          const startDate = exp.startDate ? (exp.startDate instanceof Date ? exp.startDate : new Date(exp.startDate)) : null;
          const endDate = exp.endDate ? (exp.endDate instanceof Date ? exp.endDate : new Date(exp.endDate)) : null;
          
          if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            dateRanges.push({ start: startDate, end: endDate });
          }
        });
        
        if (dateRanges.length > 0) {
          // Merge overlapping ranges
          dateRanges.sort((a, b) => a.start - b.start);
          const merged = [];
          let current = dateRanges[0];
          
          for (let i = 1; i < dateRanges.length; i++) {
            if (dateRanges[i].start <= current.end) {
              current.end = dateRanges[i].end > current.end ? dateRanges[i].end : current.end;
            } else {
              merged.push(current);
              current = dateRanges[i];
            }
          }
          merged.push(current);
          
          // Calculate total months
          for (const range of merged) {
            const months = (range.end.getFullYear() - range.start.getFullYear()) * 12 +
                           (range.end.getMonth() - range.start.getMonth());
            totalMonths += Math.max(1, months);
          }
          
          const calculatedYears = Math.round((totalMonths / 12) * 10) / 10;
          
          // Use calculated experience if it's more accurate than text-based
          if (calculatedYears > 0 && (experienceYears === 0 || calculatedYears > experienceYears)) {
            experienceYears = calculatedYears;
            console.log('Updated experience years from work experience dates:', calculatedYears);
          }
        }
      }
    } catch (workExpError) {
      console.error('Work experience parsing failed, using original results:', workExpError.message);
    }

    // Store the raw parsed data from whichever parser succeeded
    let parsedDataToStore = null;
    if (structuredParsedData) {
      parsedDataToStore = {
        source: 'structured',
        data: structuredParsedData,
        parsingMethod: 'Structured'
      };
    } else if (pyresparserData) {
      parsedDataToStore = {
        source: 'pyresparser',
        data: pyresparserData,
        parsingMethod: 'Pyresparser'
      };
    } else if (aiParsedData) {
      parsedDataToStore = {
        source: 'ai',
        data: aiParsedData,
        parsingMethod: 'AI'
      };
    } else if (enhancedParsedData) {
      parsedDataToStore = {
        source: 'enhanced',
        data: enhancedParsedData,
        parsingMethod: 'Enhanced'
      };
    }

    console.log('Final extracted info:', {
      candidate: candidateBasics,
      skills: skills.length,
      educationEntries: educationEntries.length,
      projects: projects.length,
      languages,
      certificationEntries: certificationEntries.length,
      summaryText: summaryText ? summaryText.substring(0, 100) + '...' : '',
      experienceYears,
      parsingMethod: structuredParsedData ? 'Structured' : pyresparserData ? 'Pyresparser' : aiParsedData ? 'AI' : enhancedParsedData ? 'Enhanced' : 'Basic',
      hasParsedData: !!parsedDataToStore
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
      workExperience: structuredWorkExperience.length > 0 ? structuredWorkExperience : (workExperience || []),
      achievements: achievements || [],
      parsedData: parsedDataToStore,
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
        let pdfBuffer;
        let pdfData;
        let extractedText;
        
        try {
          pdfBuffer = await fsPromises.readFile(file.path);
          pdfData = await pdfParse(pdfBuffer);
          extractedText = pdfData.text;
        } catch (parseError) {
          // Clean up uploaded file if parsing failed
          try {
            await fsPromises.unlink(file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
          
          // Add error to errors array and continue with next file
          const errorMessage = parseError.message && parseError.message.includes('XRef')
            ? 'Invalid or corrupted PDF file'
            : parseError.message && parseError.message.includes('password')
            ? 'PDF is password-protected'
            : 'Failed to parse PDF file';
          
          errors.push({
            filename: file.originalname,
            error: errorMessage,
            details: parseError.message || 'Unknown PDF parsing error'
          });
          continue; // Skip to next file
        }

        // Try parsers in order: AI (if available) -> Structured -> Pyresparser -> Enhanced -> Basic
        let structuredParsedData = null;
        let pyresparserData = null;
        let aiParsedData = null;
        let enhancedParsedData = null;
        
        // Try AI parsing first if available (most accurate with NLP/generative AI)
        const aiAvailable = isAIParserAvailable();
        if (aiAvailable) {
          try {
            aiParsedData = await parseResumeWithAI(extractedText);
            if (!aiParsedData || Object.keys(aiParsedData).length === 0) {
              aiParsedData = null;
            }
          } catch (error) {
            console.log(`AI parsing failed for ${file.originalname}, trying structured parser:`, error.message);
            aiParsedData = null;
          }
        }
        
        // If AI parsing not available or failed, try structured parser
        if (!aiParsedData) {
          try {
            const structuredResult = parseResumeStructured(extractedText);
            if (structuredResult.success) {
              structuredParsedData = structuredResult.data;
            }
          } catch (error) {
            console.log(`Structured parsing failed for ${file.originalname}, trying pyresparser`);
          }
        }

        // If both failed, try pyresparser
        if (!aiParsedData && !structuredParsedData) {
          try {
            const isPyresAvailable = await isPyresparserAvailable();
            if (isPyresAvailable) {
              pyresparserData = await parseResumeWithPyresparser(file.path);
            }
          } catch (error) {
            console.log(`Pyresparser parsing failed for ${file.originalname}, trying enhanced parser`);
          }
        }

        // If all failed, try enhanced parser
        if (!aiParsedData && !structuredParsedData && !pyresparserData) {
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

        // Always use advanced education parser to ensure best results
        if (extractedText) {
          try {
            const advancedEducation = parseEducationSection(extractedText);
            if (advancedEducation.length > 0) {
              // Use advanced parser results if they're better
              const currentCount = (educationEntries || []).length;
              const advancedCount = advancedEducation.length;
              const currentHasStructure = (educationEntries || []).some(e => typeof e === 'object' && (e.school || e.degree || e.field));
              const advancedHasStructure = advancedEducation.some(e => typeof e === 'object' && (e.school || e.degree || e.field));
              
              if (advancedCount > currentCount || 
                  currentCount === 0 || 
                  (advancedHasStructure && !currentHasStructure) ||
                  (educationEntries || []).some(e => {
                    const str = typeof e === 'string' ? e.toLowerCase() : JSON.stringify(e).toLowerCase();
                    return str.length < 5 || 
                           /email|phone|github|linkedin|contact|address|@|http/i.test(str);
                  })) {
                educationEntries = advancedEducation;
              } else {
                // Merge both
                const merged = [...(educationEntries || [])];
                advancedEducation.forEach(advEdu => {
                  const key = `${advEdu.degree || ''}|${advEdu.school || ''}|${advEdu.field || ''}`.toLowerCase();
                  const exists = merged.some(e => {
                    const eKey = typeof e === 'object' 
                      ? `${e.degree || ''}|${e.school || ''}|${e.field || ''}`.toLowerCase()
                      : String(e).toLowerCase();
                    return eKey === key || eKey.includes(key) || key.includes(eKey);
                  });
                  if (!exists) merged.push(advEdu);
                });
                educationEntries = merged;
              }
            }
          } catch (eduError) {
            console.error('Advanced education parser failed:', eduError.message);
          }
        }
        
        educationEntries = normalizeEducationEntries(educationEntries || []);

        // Parse work experience with dates using advanced parser
        let structuredWorkExperience = [];
        try {
          structuredWorkExperience = parseWorkExperienceSection(extractedText);
          
          if (structuredWorkExperience.length > 0) {
            console.log(`Parsed work experience for ${file.originalname}:`, structuredWorkExperience.length, 'entries');
            
            // Calculate experience years from structured work experience dates
            const now = new Date();
            let totalMonths = 0;
            const dateRanges = [];
            
            structuredWorkExperience.forEach(exp => {
              // Convert ISO strings back to Date objects for calculation
              const startDate = exp.startDate ? (exp.startDate instanceof Date ? exp.startDate : new Date(exp.startDate)) : null;
              const endDate = exp.endDate ? (exp.endDate instanceof Date ? exp.endDate : new Date(exp.endDate)) : null;
              
              if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                dateRanges.push({ start: startDate, end: endDate });
              }
            });
            
            if (dateRanges.length > 0) {
              // Merge overlapping ranges
              dateRanges.sort((a, b) => a.start - b.start);
              const merged = [];
              let current = dateRanges[0];
              
              for (let i = 1; i < dateRanges.length; i++) {
                if (dateRanges[i].start <= current.end) {
                  current.end = dateRanges[i].end > current.end ? dateRanges[i].end : current.end;
                } else {
                  merged.push(current);
                  current = dateRanges[i];
                }
              }
              merged.push(current);
              
              // Calculate total months
              for (const range of merged) {
                const months = (range.end.getFullYear() - range.start.getFullYear()) * 12 +
                               (range.end.getMonth() - range.start.getMonth());
                totalMonths += Math.max(1, months);
              }
              
              const calculatedYears = Math.round((totalMonths / 12) * 10) / 10;
              
              // Use calculated experience if it's more accurate
              if (calculatedYears > 0 && (experienceYears === 0 || calculatedYears > experienceYears)) {
                experienceYears = calculatedYears;
              }
            }
          } else if (!workExperience || workExperience.length === 0) {
            // Try to parse from existing workExperience strings
            if (workExperience && workExperience.length > 0) {
              structuredWorkExperience = workExperience
                .map(exp => {
                  if (typeof exp === 'string') {
                    return extractWorkExperienceEntry(exp);
                  }
                  return exp;
                })
                .filter(Boolean);
            }
          }
        } catch (workExpError) {
          console.error(`Work experience parsing failed for ${file.originalname}:`, workExpError.message);
        }

        // Store the raw parsed data from whichever parser succeeded
        let parsedDataToStore = null;
        if (structuredParsedData) {
          parsedDataToStore = {
            source: 'structured',
            data: structuredParsedData,
            parsingMethod: 'Structured'
          };
        } else if (pyresparserData) {
          parsedDataToStore = {
            source: 'pyresparser',
            data: pyresparserData,
            parsingMethod: 'Pyresparser'
          };
        } else if (aiParsedData) {
          parsedDataToStore = {
            source: 'ai',
            data: aiParsedData,
            parsingMethod: 'AI'
          };
        } else if (enhancedParsedData) {
          parsedDataToStore = {
            source: 'enhanced',
            data: enhancedParsedData,
            parsingMethod: 'Enhanced'
          };
        }

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
          workExperience: structuredWorkExperience.length > 0 ? structuredWorkExperience : (workExperience || []),
          achievements: achievements || [],
          parsedData: parsedDataToStore,
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

// Update/Re-parse resume
router.put('/:id/reparse', auth, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Check if user has permission to update this resume
    if (resume.uploadedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this resume' });
    }

    // Check if file still exists
    const resolvedPath = path.isAbsolute(resume.filePath)
      ? resume.filePath
      : path.join(__dirname, '..', resume.filePath);
    
    try {
      await fsPromises.access(resolvedPath);
    } catch (accessError) {
      return res.status(404).json({ error: 'Resume file not found on server' });
    }

    const processingStartedAt = Date.now();

    // Read and parse PDF
    let pdfBuffer;
    let pdfData;
    let extractedText;
    
    try {
      pdfBuffer = await fsPromises.readFile(resolvedPath);
      pdfData = await pdfParse(pdfBuffer);
      extractedText = pdfData.text;
    } catch (parseError) {
      // Check for specific PDF parsing errors
      if (parseError.message && parseError.message.includes('XRef')) {
        return res.status(400).json({ 
          error: 'Invalid or corrupted PDF file. The PDF appears to be damaged or has an invalid structure.',
          details: 'bad XRef entry - PDF cross-reference table is corrupted'
        });
      }
      
      if (parseError.message && parseError.message.includes('password')) {
        return res.status(400).json({ 
          error: 'PDF is password-protected. Please remove the password and try again.',
          details: parseError.message
        });
      }
      
      return res.status(400).json({ 
        error: 'Failed to parse PDF file. The file may be corrupted, password-protected, or in an unsupported format.',
        details: parseError.message || 'Unknown PDF parsing error'
      });
    }

    // Try parsers in order of accuracy: AI (if available) -> Structured -> Pyresparser -> Enhanced -> Basic
    let structuredParsedData = null;
    let pyresparserData = null;
    let aiParsedData = null;
    let enhancedParsedData = null;
    
    // Try AI parsing first if available (most accurate with NLP/generative AI)
    const aiAvailable = isAIParserAvailable();
    if (aiAvailable) {
      try {
        aiParsedData = await parseResumeWithAI(extractedText);
        if (aiParsedData && Object.keys(aiParsedData).length > 0) {
          console.log('AI parsing successful (using generative AI/NLP)');
        } else {
          aiParsedData = null;
        }
      } catch (error) {
        console.log('AI parsing failed, trying structured parser:', error.message);
        aiParsedData = null;
      }
    }
    
    // If AI parsing not available or failed, try structured parser
    if (!aiParsedData) {
      try {
        const structuredResult = parseResumeStructured(extractedText);
        if (structuredResult.success) {
          structuredParsedData = structuredResult.data;
        }
      } catch (error) {
        console.log('Structured parsing failed, trying pyresparser:', error.message);
      }
    }

    // If both failed, try pyresparser
    if (!aiParsedData && !structuredParsedData) {
      try {
        const isPyresAvailable = await isPyresparserAvailable();
        if (isPyresAvailable) {
          pyresparserData = await parseResumeWithPyresparser(resolvedPath);
        }
      } catch (error) {
        console.log('Pyresparser parsing failed, trying enhanced parser:', error.message);
      }
    }

    // If all failed, try enhanced parser
    if (!aiParsedData && !structuredParsedData && !pyresparserData) {
      try {
        enhancedParsedData = parseResumeEnhanced(extractedText);
      } catch (error) {
        console.log('Enhanced parsing failed, using basic parser:', error.message);
      }
    }

    let candidateInfo, structuredDetails, skills, languages, educationEntries, 
        certificationEntries, projects, highlights, summaryText, experienceYears, candidateBasics, workExperience, achievements;

    if (structuredParsedData) {
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
      candidateBasics = pyresparserData.candidate;
      skills = pyresparserData.skills || [];
      languages = pyresparserData.languages || [];
      summaryText = pyresparserData.summary || '';
      experienceYears = pyresparserData.experience || 0;
      
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
      try {
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
      } catch (parseError) {
        console.error('Basic parser also failed:', parseError.message);
        return res.status(500).json({ error: 'Failed to parse resume' });
      }
    }
    
    // Always use advanced education parser
    try {
      const advancedEducation = parseEducationSection(extractedText);
      if (advancedEducation.length > 0) {
        const currentCount = educationEntries.length;
        const advancedCount = advancedEducation.length;
        const currentHasStructure = educationEntries.some(e => typeof e === 'object' && (e.school || e.degree || e.field));
        const advancedHasStructure = advancedEducation.some(e => typeof e === 'object' && (e.school || e.degree || e.field));
        
        if (advancedCount > currentCount || 
            currentCount === 0 || 
            (advancedHasStructure && !currentHasStructure) ||
            educationEntries.some(e => {
              const str = typeof e === 'string' ? e.toLowerCase() : JSON.stringify(e).toLowerCase();
              return str.length < 5 || 
                     /email|phone|github|linkedin|contact|address|@|http/i.test(str) ||
                     (typeof e === 'string' && e.split(' ').length < 2);
            })) {
          educationEntries = advancedEducation;
        } else {
          const merged = [...educationEntries];
          advancedEducation.forEach(advEdu => {
            const key = `${advEdu.degree || ''}|${advEdu.school || ''}|${advEdu.field || ''}`.toLowerCase();
            const exists = merged.some(e => {
              const eKey = typeof e === 'object' 
                ? `${e.degree || ''}|${e.school || ''}|${e.field || ''}`.toLowerCase()
                : String(e).toLowerCase();
              return eKey === key || eKey.includes(key) || key.includes(eKey);
            });
            if (!exists) merged.push(advEdu);
          });
          educationEntries = merged;
        }
      }
    } catch (eduError) {
      console.error('Advanced education parser failed:', eduError.message);
    }
    
    educationEntries = normalizeEducationEntries(educationEntries || []);

    // Parse work experience with dates using advanced parser
    let structuredWorkExperience = [];
    try {
      console.log('Parsing work experience from extracted text...');
      structuredWorkExperience = parseWorkExperienceSection(extractedText);
      
      if (structuredWorkExperience.length > 0) {
        console.log('Parsed work experience:', structuredWorkExperience.length, 'entries with dates');
        
        // Calculate experience years from structured work experience dates
        const now = new Date();
        let totalMonths = 0;
        const dateRanges = [];
        
        structuredWorkExperience.forEach(exp => {
          // Convert ISO strings back to Date objects for calculation
          const startDate = exp.startDate ? (exp.startDate instanceof Date ? exp.startDate : new Date(exp.startDate)) : null;
          const endDate = exp.endDate ? (exp.endDate instanceof Date ? exp.endDate : new Date(exp.endDate)) : null;
          
          if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            dateRanges.push({ start: startDate, end: endDate });
          }
        });
        
        if (dateRanges.length > 0) {
          // Merge overlapping ranges
          dateRanges.sort((a, b) => a.start - b.start);
          const merged = [];
          let current = dateRanges[0];
          
          for (let i = 1; i < dateRanges.length; i++) {
            if (dateRanges[i].start <= current.end) {
              current.end = dateRanges[i].end > current.end ? dateRanges[i].end : current.end;
            } else {
              merged.push(current);
              current = dateRanges[i];
            }
          }
          merged.push(current);
          
          // Calculate total months
          for (const range of merged) {
            const months = (range.end.getFullYear() - range.start.getFullYear()) * 12 +
                           (range.end.getMonth() - range.start.getMonth());
            totalMonths += Math.max(1, months);
          }
          
          const calculatedYears = Math.round((totalMonths / 12) * 10) / 10;
          
          // Use calculated experience if it's more accurate
          if (calculatedYears > 0 && (experienceYears === 0 || calculatedYears > experienceYears)) {
            experienceYears = calculatedYears;
            console.log('Updated experience years from work experience dates:', calculatedYears);
          }
        }
      } else if (!workExperience || workExperience.length === 0) {
        // Try to parse from existing workExperience strings
        if (workExperience && workExperience.length > 0) {
          structuredWorkExperience = workExperience
            .map(exp => {
              if (typeof exp === 'string') {
                return extractWorkExperienceEntry(exp);
              }
              return exp;
            })
            .filter(Boolean);
        }
      }
    } catch (workExpError) {
      console.error('Work experience parsing failed:', workExpError.message);
    }

    // Store the raw parsed data
    let parsedDataToStore = null;
    if (structuredParsedData) {
      parsedDataToStore = {
        source: 'structured',
        data: structuredParsedData,
        parsingMethod: 'Structured'
      };
    } else if (pyresparserData) {
      parsedDataToStore = {
        source: 'pyresparser',
        data: pyresparserData,
        parsingMethod: 'Pyresparser'
      };
    } else if (aiParsedData) {
      parsedDataToStore = {
        source: 'ai',
        data: aiParsedData,
        parsingMethod: 'AI'
      };
    } else if (enhancedParsedData) {
      parsedDataToStore = {
        source: 'enhanced',
        data: enhancedParsedData,
        parsingMethod: 'Enhanced'
      };
    }

    // Update resume with new parsed data
    resume.extractedText = extractedText;
    resume.candidate = candidateBasics;
    resume.skills = skills;
    resume.experience = experienceYears;
    resume.education = educationEntries;
    resume.languages = languages;
    resume.certifications = certificationEntries;
    resume.projects = projects;
    resume.summary = summaryText ? summaryText.substring(0, 2000) : '';
    resume.highlights = highlights;
    resume.workExperience = structuredWorkExperience.length > 0 ? structuredWorkExperience : (workExperience || []);
    resume.achievements = achievements || [];
    resume.parsedData = parsedDataToStore;
    resume.status = 'processed';
    resume.processed = true;
    resume.metadata.processingTime = Date.now() - processingStartedAt;
    resume.metadata.wordCount = extractedText.split(/\s+/).length;
    resume.metadata.pageCount = pdfData.numpages;

    await resume.save();
    await syncUserProfileFromResume(req.user.userId, resume);

    res.json({
      message: 'Resume re-parsed and updated successfully',
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
        parsedData: resume.parsedData
      }
    });
  } catch (error) {
    console.error('Re-parse resume error:', error);
    res.status(500).json({ error: 'Error re-parsing resume' });
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