const natural = require('natural');
const nlp = require('compromise');

const SECTION_ALIASES = {
  summary: ['summary', 'professional summary', 'about me', 'profile', 'objective', 'career objective'],
  experience: ['experience', 'work experience', 'professional experience', 'employment history', 'employment', 'work history', 'career history'],
  education: ['education', 'academic background', 'academics', 'qualifications', 'academic qualifications'],
  projects: ['projects', 'personal projects', 'notable projects', 'key projects', 'project experience'],
  certifications: ['certifications', 'certificates', 'licenses', 'licences', 'professional certifications'],
  skillsSection: ['skills', 'technical skills', 'core competencies', 'competencies', 'technical competencies', 'key skills'],
  languagesSection: ['languages', 'language skills', 'spoken languages'],
};

// Skills dictionary for matching
const skillsDictionary = {
  // Programming Languages
  'python': ['python', 'py', 'pandas', 'numpy', 'scipy', 'flask', 'django'],
  'javascript': ['javascript', 'js', 'node.js', 'react.js', 'vue.js', 'angular', 'typescript'],
  'java': ['java', 'jvm', 'spring', 'hibernate', 'maven', 'gradle'],
  'csharp': ['c#', '.net', 'asp.net', 'entity framework'],
  'cpp': ['c++', 'cpp', 'qt', 'boost'],
  'php': ['php', 'laravel', 'symfony'],
  'ruby': ['ruby', 'rails'],
  'go': ['go', 'golang'],
  'swift': ['swift', 'ios'],
  'kotlin': ['kotlin', 'android'],
  'scala': ['scala', 'akka', 'play framework'],
  'rust': ['rust'],
  'perl': ['perl'],

  // Frameworks and Libraries
  'react': ['react', 'react.js', 'react native'],
  'angular': ['angular'],
  'vue': ['vue', 'vue.js'],
  'jquery': ['jquery'],
  'bootstrap': ['bootstrap'],
  'express': ['express'],
  'spring boot': ['spring boot'],
  'tensorflow': ['tensorflow'],
  'keras': ['keras'],
  'pytorch': ['pytorch'],
  'scikit-learn': ['scikit-learn'],

  // Databases
  'sql': ['sql', 'mysql', 'postgresql', 'oracle', 'sql server'],
  'nosql': ['nosql', 'mongodb', 'cassandra', 'redis', 'neo4j', 'couchdb'],
  'mysql': ['mysql'],
  'postgresql': ['postgresql'],
  'mongodb': ['mongodb'],
  'redis': ['redis'],
  'sqlite': ['sqlite'],
  'oracle': ['oracle'],
  'snowflake': ['snowflake'],
  'redshift': ['redshift'],
  'greenplum': ['greenplum'],
  'teradata': ['teradata'],

  // DevOps and Cloud Platforms
  'aws': ['aws', 'ec2', 's3', 'lambda', 'rds'],
  'azure': ['azure', 'azure devops'],
  'google cloud': ['google cloud', 'gcp', 'app engine', 'kubernetes engine'],
  'docker': ['docker', 'docker-compose'],
  'kubernetes': ['kubernetes', 'k8s'],
  'jenkins': ['jenkins'],
  'travis ci': ['travis ci'],
  'gitlab ci': ['gitlab ci'],
  'circleci': ['circleci'],

  // Web Technologies
  'html': ['html'],
  'css': ['css', 'sass', 'less'],
  'rest api': ['rest', 'restful', 'json', 'xml'],
  'graphql': ['graphql'],

  // Software Development Methodologies
  'agile': ['agile', 'scrum', 'kanban'],
  'devops': ['devops', 'site reliability'],

  // Soft Skills
  'leadership': ['leadership', 'management'],
  'communication': ['communication', 'teamwork'],
  'problem-solving': ['problem-solving', 'analytical skills'],
  'adaptability': ['adaptability', 'flexibility'],
  'teamwork': ['teamwork'],
  'project management': ['project management', 'pm'],
  'creativity': ['creativity'],
  'critical thinking': ['critical thinking'],
  'emotional intelligence': ['emotional intelligence', 'eq'],
  'negotiation': ['negotiation'],
  'decision making': ['decision making'],
  
  // Machine Learning
  'machine learning': ['machine learning', 'ml'],
  'deep learning': ['deep learning', 'dl'],
  'reinforcement learning': ['reinforcement learning', 'rl'],
  'supervised learning': ['supervised learning'],
  'unsupervised learning': ['unsupervised learning'],
  'semi-supervised learning': ['semi-supervised learning'],
  'natural language processing': ['natural language processing', 'nlp'],
  'computer vision': ['computer vision'],
  'speech recognition': ['speech recognition'],
  'anomaly detection': ['anomaly detection'],
  'generative adversarial networks': ['gan', 'generative adversarial networks'],
  'transfer learning': ['transfer learning'],
  'feature engineering': ['feature engineering'],
  'model optimization': ['model optimization'],
  'model deployment': ['model deployment'],
  'edge AI': ['edge ai', 'edge computing'],
  'federated learning': ['federated learning'],
  'explainable AI': ['explainable ai', 'xai'],

  // ML Frameworks and Libraries
  'tensorflow': ['tensorflow', 'tf'],
  'keras': ['keras'],
  'pytorch': ['pytorch'],
  'scikit-learn': ['scikit-learn', 'sklearn'],
  'pandas': ['pandas'],
  'numpy': ['numpy'],
  'scipy': ['scipy'],
  'matplotlib': ['matplotlib'],
  'seaborn': ['seaborn'],
  'xgboost': ['xgboost'],
  'lightgbm': ['lightgbm'],
  'opencv': ['opencv'],
  'spacy': ['spacy'],
  'nltk': ['nltk'],
  'gensim': ['gensim'],
  'huggingface': ['huggingface', 'transformers'],
  'fastai': ['fastai'],
  'caffe': ['caffe'],
  'theano': ['theano'],
  'dlib': ['dlib'],
  'mlflow': ['mlflow'],
  'pycaret': ['pycaret'],
  'streamlit': ['streamlit'],
  'dash': ['dash'],
  
  // Time Series Analysis & Forecasting
  'time series': ['time series', 'time series analysis'],
  'arima': ['arima'],
  'prophet': ['prophet'],
  'lstm': ['lstm'],
  
  // Deep Learning Specific Technologies
  'convolutional neural networks': ['cnn', 'convolutional neural networks'],
  'recurrent neural networks': ['rnn', 'recurrent neural networks'],
  'long short-term memory': ['lstm'],
  'transformers': ['transformers'],
  'bert': ['bert'],
  'gpt': ['gpt', 'gpt-2', 'gpt-3'],

  // Visualization and Reporting Tools
  'tableau': ['tableau'],
  'power bi': ['power bi'],
  'qlik': ['qlik', 'qlikview', 'qliksense'],
  'looker': ['looker'],
  
  // Big Data
  'big data': ['big data'],
  'hadoop': ['hadoop'],
  'spark': ['spark'],
  'kafka': ['kafka'],
  'hive': ['hive'],
  'flink': ['flink'],
  'elastic search': ['elastic search', 'elasticsearch'],
  'solr': ['solr'],
  'cassandra': ['cassandra'],
  'hbase': ['hbase'],
  'neo4j': ['neo4j'],

  // Cloud and DevOps
  'aws': ['aws', 'amazon web services'],
  'azure': ['azure'],
  'gcp': ['gcp', 'google cloud platform'],
  'docker': ['docker'],
  'kubernetes': ['kubernetes', 'k8s'],
  'jenkins': ['jenkins'],
  'ci/cd': ['ci/cd', 'continuous integration', 'continuous deployment'],
  'terraform': ['terraform'],
  'ansible': ['ansible'],
  'cloudformation': ['cloudformation'],
  'openstack': ['openstack'],

  // Data Engineering and ETL Tools
  'airflow': ['airflow'],
  'luigi': ['luigi'],
  'talend': ['talend'],
  'pentaho': ['pentaho'],
  'informatica': ['informatica'],

  // Miscellaneous
  'git': ['git', 'version control', 'svn'],
  'project management': ['jira', 'trello', 'asana'],
  'ui/ux': ['ui', 'ux', 'user interface', 'user experience'],
  'cybersecurity': ['cybersecurity', 'penetration testing', 'encryption'],
  'data analysis': ['data analysis', 'excel', 'power bi', 'tableau', 'data analytics'],
  'data visualization': ['data visualization'],
  'data mining': ['data mining'],
  'statistical analysis': ['statistical analysis', 'statistics'],
  'ethics in AI': ['ethics in ai', 'ai ethics'],
  'quantum computing': ['quantum computing'],
  'blockchain': ['blockchain'],
  'augmented reality': ['augmented reality', 'ar'],
  'virtual reality': ['virtual reality', 'vr'],
  'internet of things': ['iot', 'internet of things'],
  'robotics': ['robotics'],
  'drones': ['drones', 'uav'],
  'penetration testing': ['penetration testing'],
  'cryptocurrency': ['cryptocurrency', 'bitcoin', 'ethereum'],
  'bioinformatics': ['bioinformatics']
};

// Clean and normalize text
function cleanText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract skills from text
function extractSkills(text) {
  const cleanedText = cleanText(text);
  const foundSkills = new Set();

  // Check each skill in the dictionary
  for (const [skill, variations] of Object.entries(skillsDictionary)) {
    for (const variation of variations) {
      const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) {
        foundSkills.add(skill);
        break;
      }
    }
  }

  // Also check for individual words that might be skills
  const commonSkills = [
    'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node', 'express',
    'mongodb', 'mysql', 'postgresql', 'aws', 'docker', 'kubernetes', 'git',
    'html', 'css', 'sql', 'api', 'rest', 'graphql', 'typescript', 'php',
    'ruby', 'go', 'swift', 'kotlin', 'scala', 'rust', 'perl', 'c++', 'c#',
    'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'matplotlib',
    'tableau', 'powerbi', 'excel', 'word', 'powerpoint', 'photoshop', 'illustrator',
    'figma', 'sketch', 'invision', 'zeplin', 'jira', 'trello', 'asana', 'slack',
    'teams', 'zoom', 'webex', 'salesforce', 'hubspot', 'marketo', 'pardot'
  ];

  for (const skill of commonSkills) {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      foundSkills.add(skill);
    }
  }

  return Array.from(foundSkills);
}

// Parse date from various formats
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const cleaned = dateStr.trim().toLowerCase();
  
  // Handle "Present", "Current", "Now"
  if (cleaned.match(/present|current|now|till date|till now/i)) {
    return new Date();
  }
  
  // Handle month/year formats: "Jan 2020", "January 2020", "01/2020", "2020-01"
  const monthYearMatch = cleaned.match(/(\w+)\s+(\d{4})|(\d{1,2})\/(\d{4})|(\d{4})-(\d{1,2})/);
  if (monthYearMatch) {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'];
    const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    let month, year;
    if (monthYearMatch[1]) {
      const monthStr = monthYearMatch[1];
      month = monthNames.indexOf(monthStr) !== -1 ? monthNames.indexOf(monthStr) :
              monthAbbr.indexOf(monthStr) !== -1 ? monthAbbr.indexOf(monthStr) : null;
      year = parseInt(monthYearMatch[2]);
    } else if (monthYearMatch[3]) {
      month = parseInt(monthYearMatch[3]) - 1;
      year = parseInt(monthYearMatch[4]);
    } else if (monthYearMatch[5]) {
      year = parseInt(monthYearMatch[5]);
      month = parseInt(monthYearMatch[6]) - 1;
    }
    
    if (month !== null && year) {
      return new Date(year, month, 1);
    }
  }
  
  // Handle year only: "2020"
  const yearMatch = cleaned.match(/^(\d{4})$/);
  if (yearMatch) {
    return new Date(parseInt(yearMatch[1]), 0, 1);
  }
  
  // Try standard date parsing
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  return null;
}

// Calculate experience from date ranges
function calculateExperienceFromDates(experienceEntries) {
  if (!experienceEntries || experienceEntries.length === 0) return 0;
  
  const dateRanges = [];
  const now = new Date();
  
  for (const entry of experienceEntries) {
    if (typeof entry !== 'string') continue;
    
    // Look for date patterns: "Jan 2020 - Present", "2020-2023", etc.
    const datePatterns = [
      /(\w+\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*[-–—]\s*(\w+\s+\d{4}|\d{1,2}\/\d{4}|\d{4}|present|current|now)/i,
      /(\d{4})\s*[-–—]\s*(\d{4}|present|current|now)/i,
      /since\s+(\w+\s+\d{4}|\d{1,2}\/\d{4}|\d{4})/i,
      /from\s+(\w+\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s+to\s+(\w+\s+\d{4}|\d{1,2}\/\d{4}|\d{4}|present|current|now)/i
    ];
    
    for (const pattern of datePatterns) {
      const match = entry.match(pattern);
      if (match) {
        const startDate = parseDate(match[1]);
        const endDate = match[2] && !match[2].match(/present|current|now/i) ? parseDate(match[2]) : now;
        
        if (startDate && endDate && startDate <= endDate) {
          dateRanges.push({ start: startDate, end: endDate });
          break;
        }
      }
    }
  }
  
  if (dateRanges.length === 0) return 0;
  
  // Merge overlapping date ranges
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
    totalMonths += months;
  }
  
  // Convert to years (round to 1 decimal)
  return Math.round((totalMonths / 12) * 10) / 10;
}

// Extract candidate information
function extractCandidateInfo(text) {
  const doc = nlp(text);
  
  // Extract name (usually at the top of resume)
  const names = doc.people().out('array');
  const name = names.length > 0 ? names[0] : '';

  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex) || [];
  const email = emails.length > 0 ? emails[0] : '';

  // Extract phone numbers
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10}/g;
  const phones = text.match(phoneRegex) || [];
  const phone = phones.length > 0 ? phones[0].replace(/[-.\s()]/g, '') : '';

  // Extract location (look for city, state patterns)
  const locations = doc.places().out('array');
  const location = locations.length > 0 ? locations[0] : '';

  // Extract experience years - try multiple patterns
  let experience = 0;
  
  // Pattern 1: "X years of experience"
  const experienceMatch1 = text.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i);
  if (experienceMatch1) {
    experience = parseFloat(experienceMatch1[1]);
  }
  
  // Pattern 2: "X+ years"
  if (experience === 0) {
    const experienceMatch2 = text.match(/(\d+)\+\s*years?/i);
    if (experienceMatch2) {
      experience = parseInt(experienceMatch2[1]);
    }
  }

  // Extract education
  const educationKeywords = ['bachelor', 'master', 'phd', 'ph.d', 'degree', 'university', 'college', 'school', 'bsc', 'msc', 'mba', 'be', 'btech', 'mtech'];
  const education = [];
  
  const lines = text.split('\n');
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const keyword of educationKeywords) {
      if (lowerLine.includes(keyword)) {
        education.push(line.trim());
        break;
      }
    }
  }

  // Extract languages
  const languageKeywords = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'arabic', 'hindi', 'portuguese', 'italian', 'russian'];
  const languages = [];
  
  for (const keyword of languageKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(text)) {
      languages.push(keyword);
    }
  }

  // Extract certifications
  const certKeywords = ['certified', 'certification', 'certificate', 'cpa', 'pmp', 'aws', 'azure', 'google', 'oracle', 'microsoft', 'cisco'];
  const certifications = [];
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const keyword of certKeywords) {
      if (lowerLine.includes(keyword)) {
        certifications.push(line.trim());
        break;
      }
    }
  }

  return {
    name: name || '',
    email: email || '',
    phone: phone || '',
    location: location || '',
    experience: experience,
    education: education.slice(0, 5),
    languages: languages,
    certifications: certifications.slice(0, 10)
  };
}

function normalizeHeading(line) {
  return line.replace(/[^a-z0-9\s]/gi, '').trim().toLowerCase();
}

function buildEntriesFromSection(lines) {
  if (!lines || lines.length === 0) return [];
  const joined = lines.join('\n').trim();
  if (!joined) return [];
  return joined
    .split(/\n{2,}|\r\n{2,}|(?:^|\n)[•\-\*\u2022]+\s*/)
    .map(entry => entry.replace(/^[•\-\*\u2022]+\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 10);
}

function parseSections(text) {
  const lines = text.split(/\r?\n/);
  const sections = { summary: [] };
  let currentSection = 'summary';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    
    const normalized = normalizeHeading(line);

    const matchedSection = Object.entries(SECTION_ALIASES).find(([, aliases]) =>
      aliases.some(alias => normalized === alias || normalized.startsWith(`${alias} `))
    );

    if (matchedSection) {
      const [sectionKey] = matchedSection;
      switch (sectionKey) {
        case 'skillsSection':
          currentSection = 'skills';
          break;
        case 'languagesSection':
          currentSection = 'languages';
          break;
        default:
          currentSection = sectionKey;
          break;
      }
      if (!sections[currentSection]) sections[currentSection] = [];
      continue;
    }

    if (!sections[currentSection]) {
      sections[currentSection] = [];
    }
    sections[currentSection].push(line);
  }

  return sections;
}

function extractResumeDetails(text) {
  const sections = parseSections(text);

  const summaryText = (sections.summary || []).filter(Boolean).join(' ').trim();
  const experienceEntries = buildEntriesFromSection(sections.experience);
  const educationEntries = buildEntriesFromSection(sections.education);
  const projectEntries = buildEntriesFromSection(sections.projects);
  const certificationEntries = buildEntriesFromSection(sections.certifications);
  const skillHighlights = buildEntriesFromSection(sections.skills)?.flatMap(entry =>
    entry.split(/[,•\-;]/).map(item => item.trim())
  ) || [];
  const languagesFromSections = buildEntriesFromSection(sections.languages).flatMap(entry =>
    entry.split(/[,•;]/).map(item => item.trim())
  );

  // Calculate experience from date ranges
  const calculatedExperience = calculateExperienceFromDates(experienceEntries);

  return {
    summary: summaryText || '',
    experienceEntries,
    educationEntries,
    projectEntries,
    certificationEntries,
    languages: languagesFromSections.filter(Boolean),
    highlights: skillHighlights.filter(Boolean).slice(0, 20),
    calculatedExperience
  };
}

module.exports = {
  extractSkills,
  extractCandidateInfo,
  extractResumeDetails,
  cleanText,
  calculateExperienceFromDates
};
