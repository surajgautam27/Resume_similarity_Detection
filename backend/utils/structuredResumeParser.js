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
  'AWS': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'rds', 'cloudwatch', 'eks', 'iam', 'vpc'],
  'Azure': ['azure', 'microsoft azure'],
  'Google Cloud': ['google cloud', 'gcp'],
  'DigitalOcean': ['digitalocean', 'digital ocean'],
  'Docker': ['docker', 'containers'],
  'Kubernetes': ['kubernetes', 'k8s'],
  'Helm': ['helm'],
  'EKS': ['eks', 'elastic kubernetes service'],
  'Jenkins': ['jenkins', 'ci/cd'],
  'GitHub Actions': ['github actions', 'github ci'],
  'GitLab CI': ['gitlab ci', 'gitlab'],
  'CircleCI': ['circleci', 'circle ci'],
  'Terraform': ['terraform'],
  'Ansible': ['ansible'],
  'CloudFormation': ['cloudformation', 'aws cloudformation'],
  'Prometheus': ['prometheus'],
  'Grafana': ['grafana'],
  'ELK Stack': ['elk stack', 'elasticsearch', 'logstash', 'kibana'],
  'Git': ['git', 'github', 'gitlab', 'bitbucket', 'version control'],
  'Bitbucket': ['bitbucket'],
  'Bash': ['bash', 'shell scripting', 'shell'],
  'YAML': ['yaml', 'yml'],
  'Nginx': ['nginx'],
  'SSL': ['ssl', 'tls'],
  'Firewall': ['firewall'],
  'Load Balancer': ['load balancer', 'load balancing'],
  
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
  'VS Code': ['vs code', 'visual studio code', 'vscode'],
  'Linux': ['linux', 'ubuntu', 'centos', 'debian', 'red hat'],
  'Ubuntu': ['ubuntu'],
  'CentOS': ['centos'],
  
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
 * Extract skills section from text
 */
function extractSkillsSection(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const skillsSectionPatterns = [
    /^(skills?|technical\s+skills?|core\s+skills?|competencies?|technologies?|tools?|programming\s+languages?|tech\s+stack)/i,
    /^[^\w]*skills?[^\w]*$/i, // Matches "🧠 Technical Skills" or similar with emojis
    /technical\s+skills?/i
  ];
  
  let inSkillsSection = false;
  const skillsLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    // Remove emojis and special characters for pattern matching
    const cleanedLine = line.replace(/[^\w\s:]/g, '').trim();
    const cleanedLower = cleanedLine.toLowerCase();
    
    // Check if this is a skills section header (with or without emojis)
    if (skillsSectionPatterns.some(pattern => {
      return pattern.test(lower) || pattern.test(cleanedLower);
    }) && (line.length < 50 || cleanedLine.length < 50)) {
      inSkillsSection = true;
      continue;
    }
    
    // Check if we've hit another section
    if (inSkillsSection) {
      const nextSectionPatterns = [
        /^(experience|work|employment|education|projects|certifications|languages|contact|references|summary|achievements)/i
      ];
      
      // Also check cleaned line for section headers
      if (nextSectionPatterns.some(pattern => {
        return (pattern.test(lower) || pattern.test(cleanedLower)) && (line.length < 50 || cleanedLine.length < 50);
      })) {
        break;
      }
      
      // Collect skills lines
      if (line.length > 0 && line.length < 200) {
        skillsLines.push(line);
      }
    }
  }
  
  return skillsLines.join(' ');
}

/**
 * Parse skills from skills section text (handles category headers, nested parentheses, comma, pipe, bullet, line-separated)
 */
function parseSkillsFromSection(skillsText) {
  if (!skillsText || skillsText.trim().length === 0) return [];
  
  const skills = new Set();
  
  // Split by lines to handle category-based formats
  const lines = skillsText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // Category header patterns (e.g., "Cloud Platforms:", "CI/CD Tools:")
  const categoryPattern = /^[^:]+:\s*(.+)$/i;
  
  // Common category keywords to skip
  const categoryKeywords = [
    'platforms', 'tools', 'containerization', 'infrastructure', 'monitoring', 
    'logging', 'version control', 'scripting', 'languages', 'security', 
    'networking', 'os', 'operating system', 'technologies', 'frameworks',
    'libraries', 'databases', 'cloud', 'devops', 'ci/cd', 'iac'
  ];
  
  for (const line of lines) {
    let skillsToParse = line;
    
    // Check if this line has a category header (e.g., "Cloud Platforms: AWS, Azure")
    const categoryMatch = line.match(categoryPattern);
    if (categoryMatch) {
      const categoryPart = categoryMatch[1].trim();
      const categoryName = line.split(':')[0].toLowerCase();
      
      // Skip if it's clearly a category header (contains category keywords)
      if (categoryKeywords.some(keyword => categoryName.includes(keyword))) {
        skillsToParse = categoryPart; // Only parse the part after the colon
      } else {
        // Might be a skill with colon, include the whole line
        skillsToParse = line;
      }
    }
    
    // Extract skills from parentheses (e.g., "AWS (EC2, S3, Lambda)" -> extract AWS, EC2, S3, Lambda)
    const parenMatches = skillsToParse.match(/\(([^)]+)\)/g);
    if (parenMatches) {
      for (const match of parenMatches) {
        // Extract content inside parentheses
        const innerContent = match.replace(/[()]/g, '');
        // Split by comma and add each item as a skill
        const innerSkills = innerContent.split(',').map(s => s.trim()).filter(s => s.length > 0);
        innerSkills.forEach(skill => {
          const cleaned = normalizeSkillName(skill);
          if (cleaned && cleaned.length >= 2 && cleaned.length <= 50) {
            skills.add(cleaned);
          }
        });
      }
      // Remove parentheses content from the main string for further processing
      skillsToParse = skillsToParse.replace(/\([^)]+\)/g, '').trim();
    }
    
    // Now parse the remaining skills (split by comma, pipe, semicolon, etc.)
    const delimiters = /[,|;•\-\n\r]+/;
    const skillCandidates = skillsToParse
      .split(delimiters)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 100)
      .filter(s => !/^(and|or|the|a|an|with|using|via|through)$/i.test(s)); // Filter out common words
    
    for (const candidate of skillCandidates) {
      // Clean up the skill
      let cleaned = candidate
        .replace(/^[•\-\*]\s*/, '') // Remove bullet points
        .replace(/\s*[•\-\*]\s*$/, '') // Remove trailing bullets
        .trim();
      
      // Skip if too short or looks like a sentence
      if (cleaned.length < 2 || cleaned.length > 50) continue;
      if (cleaned.split(/\s+/).length > 5) continue; // Skip long phrases
      
      // Skip if it's a category header
      if (categoryKeywords.some(keyword => cleaned.toLowerCase().includes(keyword) && cleaned.split(/\s+/).length <= 3)) {
        continue;
      }
      
      // Skip common non-skill words
      const skipWords = ['years', 'experience', 'proficient', 'familiar', 'knowledge', 'working', 'good', 'excellent'];
      if (skipWords.some(word => cleaned.toLowerCase().includes(word) && cleaned.split(/\s+/).length <= 3)) {
        continue;
      }
      
      // Normalize the skill name
      cleaned = normalizeSkillName(cleaned);
      
      if (cleaned && cleaned.length >= 2 && cleaned.length <= 50) {
        skills.add(cleaned);
      }
    }
  }
  
  return Array.from(skills);
}

/**
 * Normalize skill name to standard format
 */
function normalizeSkillName(skill) {
  if (!skill || skill.trim().length === 0) return null;
  
  let cleaned = skill
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
    .replace(/scala/gi, 'Scala')
    .replace(/rust/gi, 'Rust')
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
    .replace(/react\.?js/gi, 'React.js')
    .trim();
  
  return cleaned;
}

/**
 * Extract skills from text using enhanced matching
 */
function extractSkills(text) {
  const foundSkills = new Set();
  const lowerText = text.toLowerCase();
  
  // First, try to extract from skills section directly
  const skillsSectionText = extractSkillsSection(text);
  if (skillsSectionText) {
    const sectionSkills = parseSkillsFromSection(skillsSectionText);
    sectionSkills.forEach(skill => foundSkills.add(skill));
  }
  
  // Also check dictionary for skills mentioned elsewhere in the resume
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
  
  // Also extract common skill patterns from the entire text
  const commonSkillPatterns = [
    /\b(react|angular|vue|node|express|django|flask|spring|laravel|rails|php|ruby|python|java|javascript|typescript|go|swift|kotlin|scala|rust|perl|r|matlab|dart|html|css|sql|nosql|mongodb|mysql|postgresql|redis|aws|azure|docker|kubernetes|helm|eks|git|github\s+actions|gitlab\s+ci|circleci|jenkins|terraform|ansible|cloudformation|prometheus|grafana|elk\s+stack|nginx|bash|yaml|bitbucket|digitalocean|selenium|cypress|jest|jira|slack|agile|scrum|tensorflow|pytorch|pandas|numpy|tableau|power\s*bi|excel|word|powerpoint|photoshop|illustrator|figma|sketch|invision|salesforce|hubspot|marketo|ec2|s3|lambda|rds|cloudwatch|iam|vpc|ssl|tls|firewall|load\s+balancer|vs\s+code|vscode|ubuntu|centos|linux)\b/gi
  ];
  
  for (const pattern of commonSkillPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const normalized = match.trim();
        if (normalized.length > 0) {
          foundSkills.add(normalized);
        }
      });
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
