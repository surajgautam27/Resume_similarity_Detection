const natural = require('natural');
const nlp = require('compromise');
const { extractSocialLinks } = require('./structuredResumeParser');

// Enhanced skills database with more variations and synonyms
const ENHANCED_SKILLS_DB = {
  // Programming Languages with variations
  'JavaScript': ['javascript', 'js', 'ecmascript', 'es6', 'es2015', 'node.js', 'nodejs', 'react.js', 'reactjs', 'vue.js', 'vuejs', 'angular.js', 'angularjs'],
  'Python': ['python', 'py', 'python3', 'python2', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn'],
  'Java': ['java', 'jvm', 'spring', 'spring boot', 'springboot', 'hibernate', 'maven', 'gradle', 'struts'],
  'C++': ['c++', 'cpp', 'c plus plus', 'cplusplus', 'qt', 'boost', 'stl'],
  'C#': ['c#', 'csharp', 'c sharp', '.net', 'dotnet', 'asp.net', 'aspnet', 'entity framework'],
  'PHP': ['php', 'laravel', 'symfony', 'codeigniter', 'zend', 'wordpress', 'drupal'],
  'Ruby': ['ruby', 'rails', 'ruby on rails', 'ror', 'sinatra'],
  'Go': ['go', 'golang', 'go lang'],
  'Rust': ['rust', 'cargo'],
  'Swift': ['swift', 'ios', 'xcode', 'objective-c', 'objc'],
  'Kotlin': ['kotlin', 'android', 'android studio'],
  'TypeScript': ['typescript', 'ts', 'angular', 'nest.js', 'nestjs'],
  'Scala': ['scala', 'akka', 'play framework', 'sbt'],
  'R': ['r programming', 'r language', 'rstudio', 'shiny'],
  'MATLAB': ['matlab', 'simulink'],
  'Perl': ['perl'],
  'Dart': ['dart', 'flutter'],
  
  // Web Technologies
  'HTML': ['html', 'html5', 'markup', 'semantic html'],
  'CSS': ['css', 'css3', 'sass', 'scss', 'less', 'stylus', 'bootstrap', 'tailwind', 'material-ui', 'mui'],
  'React': ['react', 'react.js', 'reactjs', 'jsx', 'react native', 'redux', 'mobx', 'next.js', 'nextjs'],
  'Angular': ['angular', 'angularjs', 'angular2+', 'typescript', 'rxjs', 'ngrx'],
  'Vue': ['vue', 'vue.js', 'vuejs', 'vuex', 'nuxt.js', 'nuxtjs'],
  'jQuery': ['jquery', 'jquery ui'],
  'Express': ['express', 'express.js', 'expressjs'],
  'GraphQL': ['graphql', 'apollo', 'relay'],
  'REST API': ['rest', 'restful', 'api', 'json', 'xml', 'soap'],
  'WebPack': ['webpack', 'bundler', 'parcel', 'rollup', 'vite'],
  
  // Databases
  'SQL': ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'mariadb', 'oracle', 'sql server', 'mssql', 't-sql'],
  'MongoDB': ['mongodb', 'mongo', 'mongoose', 'nosql'],
  'Redis': ['redis', 'cache', 'in-memory'],
  'Elasticsearch': ['elasticsearch', 'elastic search', 'elk stack', 'kibana', 'logstash'],
  'Cassandra': ['cassandra', 'apache cassandra'],
  'Neo4j': ['neo4j', 'graph database', 'cypher'],
  'DynamoDB': ['dynamodb', 'dynamo db'],
  'Firebase': ['firebase', 'firestore', 'realtime database'],
  
  // Cloud & DevOps
  'AWS': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'rds', 'cloudformation', 'iam', 'vpc', 'route53'],
  'Azure': ['azure', 'microsoft azure', 'azure devops', 'azure functions', 'cosmos db'],
  'Google Cloud': ['google cloud', 'gcp', 'google cloud platform', 'app engine', 'kubernetes engine', 'bigquery'],
  'Docker': ['docker', 'containerization', 'docker-compose', 'dockerfile'],
  'Kubernetes': ['kubernetes', 'k8s', 'kubectl', 'helm', 'istio'],
  'Jenkins': ['jenkins', 'ci/cd', 'continuous integration', 'continuous deployment'],
  'GitLab CI': ['gitlab ci', 'gitlab', 'ci/cd'],
  'GitHub Actions': ['github actions', 'github workflows'],
  'Terraform': ['terraform', 'infrastructure as code', 'iac'],
  'Ansible': ['ansible', 'automation', 'playbooks'],
  
  // Machine Learning & AI
  'Machine Learning': ['machine learning', 'ml', 'artificial intelligence', 'ai'],
  'Deep Learning': ['deep learning', 'dl', 'neural networks', 'cnn', 'rnn', 'lstm', 'gru'],
  'TensorFlow': ['tensorflow', 'tf', 'keras', 'tensorboard'],
  'PyTorch': ['pytorch', 'torch', 'torchvision'],
  'Scikit-learn': ['scikit-learn', 'sklearn', 'sci-kit learn'],
  'OpenCV': ['opencv', 'computer vision', 'cv2', 'image processing'],
  'NLP': ['nlp', 'natural language processing', 'spacy', 'nltk', 'transformers', 'bert', 'gpt'],
  'Data Science': ['data science', 'data analysis', 'statistics', 'statistical analysis'],
  'Big Data': ['big data', 'hadoop', 'spark', 'apache spark', 'kafka', 'hive', 'pig'],
  
  // Tools & IDEs
  'Git': ['git', 'version control', 'github', 'gitlab', 'bitbucket', 'svn'],
  'VS Code': ['vs code', 'visual studio code', 'vscode'],
  'IntelliJ': ['intellij', 'intellij idea', 'jetbrains'],
  'Eclipse': ['eclipse', 'eclipse ide'],
  'Vim': ['vim', 'neovim', 'vi'],
  'Postman': ['postman', 'api testing'],
  'Jira': ['jira', 'atlassian', 'project management'],
  'Slack': ['slack', 'communication'],
  
  // Testing
  'Jest': ['jest', 'unit testing', 'javascript testing'],
  'Selenium': ['selenium', 'automation testing', 'webdriver'],
  'Cypress': ['cypress', 'e2e testing', 'end to end'],
  'JUnit': ['junit', 'java testing'],
  'PyTest': ['pytest', 'python testing'],
  
  // Mobile Development
  'React Native': ['react native', 'mobile development', 'cross platform'],
  'Flutter': ['flutter', 'dart', 'mobile development'],
  'iOS Development': ['ios', 'swift', 'objective-c', 'xcode', 'cocoa'],
  'Android Development': ['android', 'kotlin', 'java', 'android studio'],
  
  // Soft Skills
  'Leadership': ['leadership', 'team lead', 'management', 'project management', 'people management'],
  'Communication': ['communication', 'presentation', 'public speaking', 'writing'],
  'Problem Solving': ['problem solving', 'analytical thinking', 'critical thinking', 'debugging'],
  'Teamwork': ['teamwork', 'collaboration', 'team player', 'cross-functional'],
  'Agile': ['agile', 'scrum', 'kanban', 'sprint', 'scrum master', 'product owner'],
};

// Experience keywords for better detection
const EXPERIENCE_KEYWORDS = [
  'worked', 'developed', 'built', 'created', 'designed', 'implemented', 'managed', 'led', 'coordinated',
  'responsible for', 'achievements', 'accomplished', 'delivered', 'maintained', 'optimized', 'improved',
  'collaborated', 'participated', 'contributed', 'established', 'initiated', 'executed', 'supervised'
];

// Education keywords
const EDUCATION_KEYWORDS = [
  'bachelor', 'master', 'phd', 'ph.d', 'doctorate', 'degree', 'diploma', 'certificate',
  'university', 'college', 'institute', 'school', 'academy',
  'bsc', 'msc', 'mba', 'be', 'btech', 'mtech', 'ms', 'bs', 'ba', 'ma',
  'computer science', 'engineering', 'information technology', 'software engineering'
];

// Company indicators
const COMPANY_INDICATORS = [
  'inc', 'ltd', 'llc', 'corp', 'corporation', 'company', 'technologies', 'tech', 'systems',
  'solutions', 'services', 'consulting', 'group', 'international', 'global'
];

/**
 * Enhanced text preprocessing
 */
function preprocessText(text) {
  return text
    .replace(/[^\w\s\-.,()@]/g, ' ') // Keep basic punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract skills using enhanced matching
 */
function extractEnhancedSkills(text) {
  const foundSkills = new Set();
  const lowerText = text.toLowerCase();
  
  // Check each skill category
  for (const [skill, variations] of Object.entries(ENHANCED_SKILLS_DB)) {
    for (const variation of variations) {
      // Create word boundary regex for exact matches
      const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) {
        foundSkills.add(skill);
        break;
      }
    }
  }
  
  return Array.from(foundSkills);
}

/**
 * Enhanced date parsing with multiple formats
 */
function parseEnhancedDate(dateStr) {
  if (!dateStr) return null;
  
  const cleaned = dateStr.trim().toLowerCase();
  
  // Handle current/present
  if (cleaned.match(/present|current|now|ongoing|till date|till now|to date/i)) {
    return new Date();
  }
  
  // Month Year formats: "January 2020", "Jan 2020", "01/2020", "2020-01"
  const patterns = [
    /(\w+)\s+(\d{4})/i, // "January 2020"
    /(\d{1,2})\/(\d{4})/i, // "01/2020"
    /(\d{4})-(\d{1,2})/i, // "2020-01"
    /(\d{4})\.(\d{1,2})/i, // "2020.01"
  ];
  
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'];
  const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      let month, year;
      
      if (pattern === patterns[0]) { // Month name format
        const monthStr = match[1].toLowerCase();
        month = monthNames.indexOf(monthStr) !== -1 ? monthNames.indexOf(monthStr) :
                monthAbbr.indexOf(monthStr) !== -1 ? monthAbbr.indexOf(monthStr) : null;
        year = parseInt(match[2]);
      } else {
        month = parseInt(match[pattern === patterns[1] ? 1 : 2]) - 1;
        year = parseInt(match[pattern === patterns[1] ? 2 : 1]);
      }
      
      if (month !== null && year && year > 1900 && year <= new Date().getFullYear() + 1) {
        return new Date(year, month, 1);
      }
    }
  }
  
  // Year only
  const yearMatch = cleaned.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year > 1900 && year <= new Date().getFullYear() + 1) {
      return new Date(year, 0, 1);
    }
  }
  
  return null;
}

/**
 * Enhanced experience calculation with better date range detection
 */
function calculateEnhancedExperience(text) {
  const lines = text.split(/\r?\n/);
  const dateRanges = [];
  const now = new Date();
  
  // Enhanced date range patterns
  const dateRangePatterns = [
    /(\w+\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*[-–—to]\s*(\w+\s+\d{4}|\d{1,2}\/\d{4}|\d{4}|present|current|now|ongoing)/i,
    /(\d{4})\s*[-–—to]\s*(\d{4}|present|current|now|ongoing)/i,
    /since\s+(\w+\s+\d{4}|\d{1,2}\/\d{4}|\d{4})/i,
    /from\s+(\w+\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s+to\s+(\w+\s+\d{4}|\d{1,2}\/\d{4}|\d{4}|present|current|now|ongoing)/i,
    /(\w+\s+\d{4}|\d{4})\s*\|\s*(\w+\s+\d{4}|\d{4}|present|current)/i, // "Jan 2020 | Present"
  ];
  
  for (const line of lines) {
    // Skip lines that don't look like experience entries
    if (line.length < 10 || !line.match(/\d{4}/)) continue;
    
    for (const pattern of dateRangePatterns) {
      const match = line.match(pattern);
      if (match) {
        const startDate = parseEnhancedDate(match[1]);
        const endDate = match[2] && !match[2].match(/present|current|now|ongoing/i) 
          ? parseEnhancedDate(match[2]) 
          : now;
        
        if (startDate && endDate && startDate <= endDate) {
          dateRanges.push({ start: startDate, end: endDate });
          break;
        }
      }
    }
  }
  
  if (dateRanges.length === 0) {
    // Fallback: look for "X years of experience" in text
    const expMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i);
    return expMatch ? parseFloat(expMatch[1]) : 0;
  }
  
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
  let totalMonths = 0;
  for (const range of merged) {
    const months = (range.end.getFullYear() - range.start.getFullYear()) * 12 +
                   (range.end.getMonth() - range.start.getMonth());
    totalMonths += Math.max(1, months); // Minimum 1 month per job
  }
  
  return Math.round((totalMonths / 12) * 10) / 10;
}

/**
 * Enhanced contact information extraction
 */
function extractEnhancedContact(text) {
  // Email extraction with better regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex) || [];
  
  // Phone extraction with international formats
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})|(?:\+\d{1,3}[-.\s]?)?\d{10,14}/g;
  const phones = text.match(phoneRegex) || [];
  
  // Improved name extraction - look for name patterns in first 5 lines
  const lines = text.split('\n').slice(0, 5);
  let name = '';
  const namePatterns = [
    /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/, // "John Doe" or "John Michael Doe"
    /^[A-Z][a-z]+\s+[A-Z]\.\s+[A-Z][a-z]+$/, // "John M. Doe"
    /^[A-Z][a-z]+\s+[A-Z][a-z]+$/ // "John Doe"
  ];
  
  for (const line of lines) {
    const cleanLine = line.trim();
    const lower = cleanLine.toLowerCase();
    
    // Skip if it's clearly not a name
    if (cleanLine.length < 3 || cleanLine.length > 60) continue;
    if (/@|http|phone|email|linkedin|github|portfolio|twitter|experience|education|skills|projects|summary|contact|resume|cv/i.test(lower)) continue;
    if (/\d{3,}/.test(cleanLine)) continue; // Contains numbers (likely phone or year)
    if (/^[^A-Z]/.test(cleanLine)) continue; // Doesn't start with capital letter
    
    // Check if it matches name patterns
    for (const pattern of namePatterns) {
      if (pattern.test(cleanLine)) {
        // Additional validation: should have 2-4 words, mostly letters
        const words = cleanLine.split(/\s+/);
        if (words.length >= 2 && words.length <= 4) {
          const allWordsValid = words.every(word => /^[A-Z][a-z]+(?:\.|')?$/.test(word) || /^[A-Z]\.$/.test(word));
          if (allWordsValid) {
            name = cleanLine;
            break;
          }
        }
      }
    }
    
    if (name) break;
  }
  
  // Location extraction using NLP
  const doc = nlp(text);
  const places = doc.places().out('array');
  const location = places.length > 0 ? places[0] : '';
  
  // Extract social links
  const socialLinks = extractSocialLinks(text);
  
  return {
    name: name || '',
    email: emails[0] || '',
    phone: phones[0] ? phones[0].replace(/[-.\s()]/g, '') : '',
    location: location || '',
    ...socialLinks
  };
}

/**
 * Enhanced section parsing with better detection
 */
function parseEnhancedSections(text) {
  const lines = text.split(/\r?\n/);
  const sections = {};
  let currentSection = 'summary';
  
  const sectionPatterns = {
    summary: /^(summary|profile|about|objective|career\s*objective|professional\s*summary)/i,
    experience: /^(experience|work\s*experience|employment|professional\s*experience|career|work\s*history)/i,
    education: /^(education|academic|qualifications|academic\s*background)/i,
    skills: /^(skills|technical\s*skills|competencies|core\s*competencies|technologies)/i,
    projects: /^(projects|personal\s*projects|key\s*projects|notable\s*projects)/i,
    certifications: /^(certifications?|certificates?|licenses?|professional\s*certifications?)/i,
    languages: /^(languages?|language\s*skills)/i,
    achievements: /^(achievements?|accomplishments?|awards?)/i,
  };
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check if line is a section header
    let foundSection = null;
    for (const [section, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(trimmed)) {
        foundSection = section;
        break;
      }
    }
    
    if (foundSection) {
      currentSection = foundSection;
      if (!sections[currentSection]) sections[currentSection] = [];
    } else {
      if (!sections[currentSection]) sections[currentSection] = [];
      sections[currentSection].push(trimmed);
    }
  }
  
  return sections;
}

/**
 * Enhanced education extraction (using advanced parser)
 */
function extractEnhancedEducation(text) {
  try {
    const { parseEducationSection } = require('./educationParser');
    const structuredEducation = parseEducationSection(text);
    
    if (structuredEducation.length > 0) {
      // Convert structured entries to strings for compatibility
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
  } catch (error) {
    console.error('Advanced education parser failed, using fallback:', error.message);
  }
  
  // Fallback to simple extraction
  const sections = parseEnhancedSections(text);
  const educationLines = sections.education || [];
  const allLines = text.split('\n');
  
  const education = [];
  const nonEducationKeywords = ['email', 'phone', 'github', 'linkedin', 'contact', 'address', '@'];
  
  // Look in education section first
  for (const line of educationLines) {
    const lower = line.toLowerCase();
    // Skip contact info
    if (nonEducationKeywords.some(kw => lower.includes(kw))) continue;
    
    if (EDUCATION_KEYWORDS.some(keyword => lower.includes(keyword)) && line.length > 10) {
      education.push(line.trim());
    }
  }
  
  // If no education found in section, search entire text
  if (education.length === 0) {
    for (const line of allLines) {
      const lowerLine = line.toLowerCase();
      if (nonEducationKeywords.some(kw => lowerLine.includes(kw))) continue;
      
      if (EDUCATION_KEYWORDS.some(keyword => lowerLine.includes(keyword)) && line.length > 10) {
        education.push(line.trim());
        if (education.length >= 5) break;
      }
    }
  }
  
  return education.slice(0, 5);
}

/**
 * Main enhanced parsing function
 */
function parseResumeEnhanced(text) {
  const preprocessedText = preprocessText(text);
  const sections = parseEnhancedSections(preprocessedText);
  
  // Extract contact information
  const contact = extractEnhancedContact(preprocessedText);
  
  // Extract skills
  const skills = extractEnhancedSkills(preprocessedText);
  
  // Calculate experience
  const experienceYears = calculateEnhancedExperience(preprocessedText);
  
  // Extract education
  const education = extractEnhancedEducation(preprocessedText);
  
  // Extract other sections
  const summary = (sections.summary || []).join(' ').trim();
  const projects = sections.projects || [];
  const certifications = sections.certifications || [];
  const languages = sections.languages ? 
    sections.languages.join(' ').split(/[,;]/).map(l => l.trim()).filter(Boolean) : [];
  
  // Extract experience entries with better formatting
  const experienceEntries = sections.experience || [];
  
  return {
    candidate: contact,
    skills,
    experience: experienceYears,
    education,
    summary,
    projects: projects.slice(0, 10),
    certifications: certifications.slice(0, 10),
    languages: languages.slice(0, 10),
    experienceEntries: experienceEntries.slice(0, 10),
    highlights: skills.slice(0, 20) // Use top skills as highlights
  };
}

module.exports = {
  parseResumeEnhanced,
  extractEnhancedSkills,
  calculateEnhancedExperience,
  extractEnhancedContact
};


