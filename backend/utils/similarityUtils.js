const natural = require('natural');
const { cleanText } = require('./resumeParser');

// Calculate cosine similarity between two text vectors
function calculateCosineSimilarity(text1, text2) {
  // Tokenize and create word frequency vectors
  const words1 = cleanText(text1).split(/\s+/).filter(word => word.length > 2);
  const words2 = cleanText(text2).split(/\s+/).filter(word => word.length > 2);
  
  // Create vocabulary (unique words from both texts)
  const vocabulary = new Set([...words1, ...words2]);
  
  // Create frequency vectors
  const vector1 = {};
  const vector2 = {};
  
  // Initialize vectors
  vocabulary.forEach(word => {
    vector1[word] = 0;
    vector2[word] = 0;
  });
  
  // Count frequencies
  words1.forEach(word => {
    if (vector1.hasOwnProperty(word)) {
      vector1[word]++;
    }
  });
  
  words2.forEach(word => {
    if (vector2.hasOwnProperty(word)) {
      vector2[word]++;
    }
  });
  
  // Calculate cosine similarity
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  vocabulary.forEach(word => {
    const freq1 = vector1[word] || 0;
    const freq2 = vector2[word] || 0;
    
    dotProduct += freq1 * freq2;
    magnitude1 += freq1 * freq1;
    magnitude2 += freq2 * freq2;
  });
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  return dotProduct / (magnitude1 * magnitude2);
}

// Calculate TF-IDF based cosine similarity
function calculateTFIDFSimilarity(text1, text2) {
  // Tokenize texts
  const words1 = cleanText(text1).split(/\s+/).filter(word => word.length > 2);
  const words2 = cleanText(text2).split(/\s+/).filter(word => word.length > 2);
  
  // Create vocabulary
  const vocabulary = new Set([...words1, ...words2]);
  
  // Calculate TF for each document
  const tf1 = {};
  const tf2 = {};
  
  words1.forEach(word => {
    tf1[word] = (tf1[word] || 0) + 1;
  });
  
  words2.forEach(word => {
    tf2[word] = (tf2[word] || 0) + 1;
  });
  
  // Normalize TF by document length
  const docLength1 = words1.length;
  const docLength2 = words2.length;
  
  Object.keys(tf1).forEach(word => {
    tf1[word] = tf1[word] / docLength1;
  });
  
  Object.keys(tf2).forEach(word => {
    tf2[word] = tf2[word] / docLength2;
  });
  
  // Calculate IDF (simplified - in real implementation, you'd have a corpus)
  const idf = {};
  vocabulary.forEach(word => {
    let docCount = 0;
    if (tf1[word]) docCount++;
    if (tf2[word]) docCount++;
    idf[word] = Math.log(2 / docCount);
  });
  
  // Calculate TF-IDF vectors
  const tfidf1 = {};
  const tfidf2 = {};
  
  vocabulary.forEach(word => {
    tfidf1[word] = (tf1[word] || 0) * idf[word];
    tfidf2[word] = (tf2[word] || 0) * idf[word];
  });
  
  // Calculate cosine similarity
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  vocabulary.forEach(word => {
    const val1 = tfidf1[word] || 0;
    const val2 = tfidf2[word] || 0;
    
    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  });
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  return dotProduct / (magnitude1 * magnitude2);
}

// Calculate Jaccard similarity for skills
function calculateJaccardSimilarity(set1, set2) {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// Calculate weighted similarity based on different criteria
function calculateWeightedSimilarity(job, resume) {
  const jobText = `${job.title} ${job.description} ${job.requirements.join(' ')} ${job.skills.join(' ')}`;
  const resumeText = resume.extractedText;
  
  // 1. Cosine similarity for overall text
  const cosineSimilarity = calculateCosineSimilarity(jobText, resumeText);
  
  // 2. TF-IDF similarity for more sophisticated text comparison
  const tfidfSimilarity = calculateTFIDFSimilarity(jobText, resumeText);
  
  // 3. Skills matching using Jaccard similarity
  const jobSkills = new Set(job.skills.map(skill => skill.toLowerCase()));
  const resumeSkills = new Set(resume.skills.map(skill => skill.toLowerCase()));
  const skillsSimilarity = calculateJaccardSimilarity(jobSkills, resumeSkills);
  
  // 4. Experience matching
  const jobExperience = getExperienceLevel(job.experience);
  const resumeExperience = resume.experience || 0;
  const experienceSimilarity = calculateExperienceSimilarity(jobExperience, resumeExperience);
  
  // 5. Education matching
  const educationSimilarity = calculateEducationSimilarity(job, resume);
  
  // 6. Keyword matching
  const keywordSimilarity = calculateKeywordSimilarity(jobText, resumeText);
  
  // Weighted combination
  const weights = {
    cosineSimilarity: 0.25,
    tfidfSimilarity: 0.20,
    skillsSimilarity: 0.25,
    experienceSimilarity: 0.15,
    educationSimilarity: 0.10,
    keywordSimilarity: 0.05
  };
  
  const finalScore = (
    cosineSimilarity * weights.cosineSimilarity * 100 +
    tfidfSimilarity * weights.tfidfSimilarity * 100 +
    skillsSimilarity * weights.skillsSimilarity * 100 +
    experienceSimilarity * weights.experienceSimilarity * 100 +
    educationSimilarity * weights.educationSimilarity * 100 +
    keywordSimilarity * weights.keywordSimilarity * 100
  );
  
  return {
    score: Math.round(finalScore),
    breakdown: {
      cosineSimilarity: Math.round(cosineSimilarity * 100),
      tfidfSimilarity: Math.round(tfidfSimilarity * 100),
      skillsSimilarity: Math.round(skillsSimilarity * 100),
      experienceSimilarity: Math.round(experienceSimilarity * 100),
      educationSimilarity: Math.round(educationSimilarity * 100),
      keywordSimilarity: Math.round(keywordSimilarity * 100)
    }
  };
}

// Helper function to get experience level
function getExperienceLevel(level) {
  const experienceMap = {
    'entry': 0,
    'junior': 2,
    'mid': 5,
    'senior': 8,
    'lead': 10
  };
  return experienceMap[level] || 5;
}

// Calculate experience similarity
function calculateExperienceSimilarity(required, actual) {
  if (actual >= required) {
    return 1.0; // Perfect match
  } else if (actual >= required * 0.7) {
    return 0.8; // Good match
  } else if (actual >= required * 0.5) {
    return 0.6; // Moderate match
  } else {
    return Math.max(0, actual / required); // Proportional match
  }
}

// Calculate education similarity
function calculateEducationSimilarity(job, resume) {
  const educationKeywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'college'];
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  const resumeText = resume.extractedText.toLowerCase();
  
  let matches = 0;
  educationKeywords.forEach(keyword => {
    if (jobText.includes(keyword) && resumeText.includes(keyword)) {
      matches++;
    }
  });
  
  return Math.min(1.0, matches / educationKeywords.length);
}

// Calculate keyword similarity
function calculateKeywordSimilarity(jobText, resumeText) {
  const jobWords = cleanText(jobText).split(/\s+/).filter(word => word.length > 3);
  const resumeWords = cleanText(resumeText).split(/\s+/).filter(word => word.length > 3);
  
  const importantWords = jobWords.filter(word => word.length > 3);
  const matchedWords = importantWords.filter(word => resumeWords.includes(word));
  
  return importantWords.length > 0 ? matchedWords.length / importantWords.length : 0;
}

// Calculate semantic similarity using word embeddings (simplified)
function calculateSemanticSimilarity(text1, text2) {
  // This is a simplified version. In a production system, you'd use:
  // - Word2Vec embeddings
  // - BERT embeddings
  // - Sentence transformers
  
  const words1 = cleanText(text1).split(/\s+/);
  const words2 = cleanText(text2).split(/\s+/);
  
  // Simple word overlap as a proxy for semantic similarity
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

module.exports = {
  calculateCosineSimilarity,
  calculateTFIDFSimilarity,
  calculateJaccardSimilarity,
  calculateWeightedSimilarity,
  calculateSemanticSimilarity,
  getExperienceLevel
}; 