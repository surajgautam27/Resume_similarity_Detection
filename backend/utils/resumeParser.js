const natural = require('natural');
const nlp = require('compromise');

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
  'blockchain': ['blockchain'],
  'cryptocurrency': ['cryptocurrency', 'bitcoin', 'ethereum'],
  'quantum computing': ['quantum computing'],
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
  const words = cleanedText.split(/\s+/);
  const foundSkills = new Set();

  // Check each skill in the dictionary
  for (const [skill, variations] of Object.entries(skillsDictionary)) {
    for (const variation of variations) {
      if (cleanedText.includes(variation.toLowerCase())) {
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
    if (cleanedText.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  }

  return Array.from(foundSkills);
}

// Extract candidate information
function extractCandidateInfo(text) {
  const doc = nlp(text);
  
  // Extract name (usually at the top of resume)
  const names = doc.people().out('array');
  const name = names.length > 0 ? names[0] : '';

  // Extract email
  const emails = doc.emails().out('array');
  const email = emails.length > 0 ? emails[0] : '';

  // Extract phone numbers
  const phones = doc.phoneNumbers().out('array');
  const phone = phones.length > 0 ? phones[0] : '';

  // Extract location (look for city, state patterns)
  const locations = doc.places().out('array');
  const location = locations.length > 0 ? locations[0] : '';

  // Extract experience years
  const experienceMatch = text.match(/(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?experience/i);
  const experience = experienceMatch ? parseInt(experienceMatch[1]) : 0;

  // Extract education
  const educationKeywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'college', 'school'];
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
  const languageKeywords = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'arabic', 'hindi'];
  const languages = [];
  
  for (const keyword of languageKeywords) {
    if (text.toLowerCase().includes(keyword)) {
      languages.push(keyword);
    }
  }

  // Extract certifications
  const certKeywords = ['certified', 'certification', 'certificate', 'cpa', 'pmp', 'aws', 'azure', 'google'];
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
    education: education.slice(0, 5), // Limit to 5 education entries
    languages: languages,
    certifications: certifications.slice(0, 10) // Limit to 10 certifications
  };
}

module.exports = {
  extractSkills,
  extractCandidateInfo,
  cleanText
}; 