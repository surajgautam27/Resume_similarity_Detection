const natural = require('natural');

/**
 * Enhanced Resume Parser for Structured Data Extraction
 * Extracts properly formatted sections from resume text
 */

// Enhanced skills database
const SKILLS_DATABASE = {
  // Programming Languages
  'JavaScript': ['javascript', 'js', 'node.js', 'nodejs', 'react', 'vue', 'angular'],
  'Python': ['python', 'django', 'flask', 'pandas', 'numpy', 'tensorflow', 'pytorch'],
  'Java': ['java', 'spring', 'hibernate', 'maven', 'gradle'],
  'C++': ['c++', 'cpp'],
  'C#': ['c#', '.net', 'asp.net'],
  'PHP': ['php', 'laravel', 'symfony'],
  'Ruby': ['ruby', 'rails'],
  'Go': ['go', 'golang'],
  'Swift': ['swift', 'ios'],
  'Kotlin': ['kotlin', 'android'],
  'TypeScript': ['typescript', 'ts'],
  'R': ['r programming'],
  
  // Web Technologies
  'HTML': ['html', 'html5'],
  'CSS': ['css', 'css3', 'sass', 'scss', 'bootstrap', 'tailwind'],
  'React': ['react', 'react.js', 'jsx', 'redux', 'next.js'],
  'Angular': ['angular', 'angularjs'],
  'Vue': ['vue', 'vue.js', 'vuejs'],
  'Express': ['express', 'express.js'],
  
  // Databases
  'SQL': ['sql', 'mysql', 'postgresql', 'sqlite', 'oracle'],
  'MongoDB': ['mongodb', 'mongo', 'nosql'],
  'Redis': ['redis'],
  'Firebase': ['firebase'],
  
  // Cloud & DevOps
  'AWS': ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
  'Azure': ['azure', 'microsoft azure'],
  'Google Cloud': ['google cloud', 'gcp'],
  'Docker': ['docker', 'containers'],
  'Kubernetes': ['kubernetes', 'k8s'],
  'Jenkins': ['jenkins', 'ci/cd'],
  'Git': ['git', 'github', 'gitlab', 'version control'],
  
  // Machine Learning & AI
  'Machine Learning': ['machine learning', 'ml', 'artificial intelligence', 'ai'],
  'Deep Learning': ['deep learning', 'neural networks', 'cnn', 'rnn', 'lstm'],
  'TensorFlow': ['tensorflow', 'tf'],
  'PyTorch': ['pytorch'],
  'Scikit-learn': ['scikit-learn', 'sklearn'],
  'OpenCV': ['opencv', 'computer vision'],
  'NLP': ['nlp', 'natural language processing'],
  
  // Data Science
  'Data Science': ['data science', 'data analysis', 'analytics'],
  'Pandas': ['pandas'],
  'NumPy': ['numpy'],
  'Matplotlib': ['matplotlib', 'seaborn', 'plotly'],
  'Tableau': ['tableau'],
  'Power BI': ['power bi', 'powerbi'],
  'Excel': ['excel', 'microsoft excel'],
  
  // Mobile Development
  'React Native': ['react native'],
  'Flutter': ['flutter', 'dart'],
  'Xamarin': ['xamarin'],
  
  // Testing
  'Testing': ['testing', 'unit testing', 'integration testing'],
  'Jest': ['jest'],
  'Selenium': ['selenium'],
  'Cypress': ['cypress'],
  
  // Project Management
  'Agile': ['agile', 'scrum', 'kanban'],
  'Jira': ['jira'],
  'Trello': ['trello'],
  'Slack': ['slack'],
  
  // Soft Skills
  'Leadership': ['leadership', 'team lead', 'management'],
  'Communication': ['communication', 'presentation'],
  'Problem Solving': ['problem solving', 'analytical'],
  'Teamwork': ['teamwork', 'collaboration'],
  'Project Management': ['project management', 'pm']
};

/**
 * Extract contact information from resume text
 */
function extractContactInfo(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  // Extract name (usually first non-empty line, but skip if it's a section header)
  let name = '';
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    // Skip section headers
    if (!/^(experience|education|skills|projects|summary|contact)/i.test(lower) && 
        line.length > 2 && line.length < 50 && 
        /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+/.test(line)) {
      name = line;
      break;
    }
  }
  
  // Extract email (get first valid email)
  const emailMatches = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
  const email = emailMatches ? emailMatches[0] : '';
  
  // Extract phone (improved pattern for international numbers)
  const phonePatterns = [
    /\+?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,9}/g,
    /\+?[\d\s\-\(\)]{10,}/g
  ];
  let phone = '';
  for (const pattern of phonePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      phone = matches[0].replace(/\s+/g, ' ').trim();
      if (phone.length >= 10) break;
    }
  }
  
  // Extract location (look for city, state patterns - improved)
  // Look for patterns like "City, State" or "Location • Phone • Email"
  const locationPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+)(?:\s*[•·]|\s*$)/, // "City, State •"
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?:\s*[•·]\s*\+?\d)/ // "City • +phone"
  ];
  let location = '';
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const loc = match[1].trim();
      // Validate it's not a name or other text
      if (loc.length > 3 && loc.length < 50 && 
          !loc.toLowerCase().includes('developer') &&
          !loc.toLowerCase().includes('email') &&
          !loc.toLowerCase().includes('phone')) {
        location = loc;
        break;
      }
    }
  }
  
  return { name, email, phone, location };
}

/**
 * Extract skills from text using enhanced matching
 */
function extractSkills(text) {
  const foundSkills = new Set();
  const lowerText = text.toLowerCase();
  
  // Check each skill category
  for (const [skillName, variations] of Object.entries(SKILLS_DATABASE)) {
    for (const variation of variations) {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerText)) {
        foundSkills.add(skillName);
        break; // Found this skill, move to next
      }
    }
  }
  
  return Array.from(foundSkills);
}

/**
 * Extract structured sections from resume text
 */
function extractStructuredSections(text) {
  const sections = {
    summary: '',
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    achievements: []
  };
  
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  let currentSection = null;
  let currentContent = [];
  
  // Section headers to look for
  const sectionHeaders = {
    summary: ['professional summary', 'summary', 'profile', 'about me', 'objective'],
    experience: ['work experience', 'experience', 'employment history', 'professional experience'],
    education: ['education', 'academic background', 'qualifications'],
    projects: ['projects', 'personal projects', 'key projects'],
    certifications: ['certifications', 'certificates', 'licenses'],
    languages: ['languages', 'language skills'],
    achievements: ['achievements', 'accomplishments', 'awards']
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    let foundSection = null;
    
    // Check if this line is a section header (must be at start of line and not too long)
    for (const [sectionName, headers] of Object.entries(sectionHeaders)) {
      if (headers.some(header => {
        // Header should be at the start of the line or after common prefixes
        const headerPattern = new RegExp(`^(?:\\d+\\.?\\s*)?${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s*:)?$`, 'i');
        return headerPattern.test(lowerLine) && line.length < 40;
      })) {
        foundSection = sectionName;
        break;
      }
    }
    
    if (foundSection) {
      // Save previous section content
      if (currentSection && currentContent.length > 0) {
        if (currentSection === 'summary') {
          sections[currentSection] = currentContent.join(' ').substring(0, 500); // Limit summary
        } else {
          // Filter out contact info and very short items
          sections[currentSection] = currentContent.filter(item => {
            if (item.length < 5) return false;
            const lower = item.toLowerCase();
            // Filter out contact information
            if (/^email|^phone|^contact|^address|@|github\.com|linkedin\.com/i.test(lower)) {
              return false;
            }
            return true;
          });
        }
      }
      
      // Start new section
      currentSection = foundSection;
      currentContent = [];
    } else if (currentSection) {
      // Check if we've hit another section (detect section boundaries)
      const nextSectionPattern = /^(experience|work|employment|projects|skills|certifications|languages|contact|education|academic)/i;
      if (nextSectionPattern.test(lowerLine) && line.length < 40 && i > 0) {
        // This might be a new section, end current one
        if (currentSection === 'summary') {
          sections[currentSection] = currentContent.join(' ').substring(0, 500);
        } else {
          sections[currentSection] = currentContent.filter(item => item.length > 5);
        }
        currentSection = null;
        currentContent = [];
      } else if (line.length > 3) {
        // Add content to current section
        // Filter out contact info
        const lower = line.toLowerCase();
        if (!/^email|^phone|^contact|^address|@|github\.com|linkedin\.com/i.test(lower)) {
          currentContent.push(line);
        }
      }
    }
  }
  
  // Save last section
  if (currentSection && currentContent.length > 0) {
    if (currentSection === 'summary') {
      sections[currentSection] = currentContent.join(' ').substring(0, 500);
    } else {
      sections[currentSection] = currentContent.filter(item => item.length > 10);
    }
  }
  
  return sections;
}

/**
 * Extract experience years from text
 */
function extractExperienceYears(text) {
  // Look for patterns like "3+ years", "5 years of experience", etc.
  const patterns = [
    /(\d+)\+?\s*years?\s*of\s*experience/i,
    /(\d+)\+?\s*years?\s*experience/i,
    /experience\s*:?\s*(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*years?\s*in/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  // Try to calculate from date ranges
  const dateRanges = text.match(/(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi);
  if (dateRanges) {
    let totalYears = 0;
    for (const range of dateRanges) {
      const match = range.match(/(\d{4})\s*[-–]\s*(\d{4}|present|current)/i);
      if (match) {
        const startYear = parseInt(match[1]);
        const endYear = match[2].toLowerCase().includes('present') || match[2].toLowerCase().includes('current') 
          ? new Date().getFullYear() 
          : parseInt(match[2]);
        totalYears += Math.max(0, endYear - startYear);
      }
    }
    return totalYears;
  }
  
  return 0;
}

/**
 * Extract education information (improved)
 */
function extractEducation(text) {
  const { parseEducationSection } = require('./educationParser');
  const structuredEducation = parseEducationSection(text);
  
  // Convert to string format for backward compatibility, but prefer structured
  if (structuredEducation.length > 0) {
    return structuredEducation.map(edu => {
      const parts = [];
      if (edu.degree) parts.push(edu.degree);
      if (edu.field) parts.push(edu.field);
      if (edu.school) parts.push(edu.school);
      if (edu.startYear || edu.endYear) {
        const years = [edu.startYear, edu.endYear].filter(Boolean).join(' - ');
        if (years) parts.push(`(${years})`);
      }
      return parts.join(' ') || edu.school || '';
    }).filter(Boolean);
  }
  
  // Fallback to simple extraction
  const education = [];
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  const degreePatterns = [
    /bachelor(?:'?s)?(?:\s+of\s+science)?(?:\s+in)?/i,
    /master(?:'?s)?(?:\s+of\s+science)?(?:\s+in)?/i,
    /phd|ph\.d|doctorate/i,
    /diploma/i,
    /certificate/i,
    /b\.?s\.?c?/i,
    /m\.?s\.?c?/i,
    /b\.?tech/i,
    /m\.?tech/i
  ];
  
  const nonEducationKeywords = ['email', 'phone', 'github', 'linkedin', 'contact', 'address'];
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    // Skip if contains non-education keywords
    if (nonEducationKeywords.some(kw => lower.includes(kw))) {
      continue;
    }
    
    if (degreePatterns.some(pattern => pattern.test(line)) && line.length > 10) {
      education.push(line);
    }
  }
  
  return education;
}

/**
 * Extract languages
 */
function extractLanguages(text) {
  const languages = [];
  const commonLanguages = [
    'english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean',
    'arabic', 'hindi', 'portuguese', 'russian', 'italian', 'dutch', 'swedish',
    'norwegian', 'danish', 'finnish', 'polish', 'czech', 'hungarian', 'nepali'
  ];
  
  const lowerText = text.toLowerCase();
  
  for (const lang of commonLanguages) {
    const regex = new RegExp(`\\b${lang}\\b`, 'i');
    if (regex.test(lowerText)) {
      languages.push(lang.charAt(0).toUpperCase() + lang.slice(1));
    }
  }
  
  return [...new Set(languages)]; // Remove duplicates
}

/**
 * Main parsing function
 */
function parseResumeStructured(text) {
  try {
    const candidate = extractContactInfo(text);
    const skills = extractSkills(text);
    const sections = extractStructuredSections(text);
    const experienceYears = extractExperienceYears(text);
    const education = extractEducation(text);
    const languages = extractLanguages(text);
    
    return {
      success: true,
      data: {
        candidate,
        skills,
        experience: experienceYears,
        summary: sections.summary || '',
        workExperience: sections.experience || [],
        education: education.length > 0 ? education : sections.education || [],
        projects: sections.projects || [],
        certifications: sections.certifications || [],
        languages: languages.length > 0 ? languages : sections.languages || [],
        achievements: sections.achievements || [],
        parsingMethod: 'Structured'
      }
    };
  } catch (error) {
    console.error('Structured parsing error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

module.exports = {
  parseResumeStructured,
  extractContactInfo,
  extractSkills,
  extractStructuredSections,
  extractExperienceYears,
  extractEducation,
  extractLanguages
};
