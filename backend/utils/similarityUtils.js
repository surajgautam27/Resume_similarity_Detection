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
  
  // Calculate cosine similarity (should be 0-1 for text vectors)
  const cosine = dotProduct / (magnitude1 * magnitude2);
  
  // Safety cap: ensure result is in 0-1 range (should be, but protect against floating point errors)
  return Math.min(1.0, Math.max(0, cosine));
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
  
  // Calculate TF-IDF cosine similarity (should be 0-1 for text vectors)
  const cosine = dotProduct / (magnitude1 * magnitude2);
  
  // Safety cap: ensure result is in 0-1 range (should be, but protect against floating point errors)
  return Math.min(1.0, Math.max(0, cosine));
}

// Calculate Jaccard similarity for skills
function calculateJaccardSimilarity(set1, set2) {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// Build fallback resume text from available data
function buildResumeText(resume) {
  const parts = [];
  
  if (resume.extractedText && resume.extractedText.trim().length > 50) {
    return resume.extractedText;
  }
  
  // Build from structured data
  if (resume.candidate?.name) parts.push(resume.candidate.name);
  if (resume.summary) parts.push(resume.summary);
  if (resume.skills && resume.skills.length > 0) {
    parts.push(resume.skills.join(' '));
  }
  if (resume.workExperience && resume.workExperience.length > 0) {
    parts.push(resume.workExperience.join(' '));
  }
  if (resume.education && resume.education.length > 0) {
    const eduText = resume.education.map(edu => {
      if (typeof edu === 'string') return edu;
      return [edu.school, edu.degree, edu.field].filter(Boolean).join(' ');
    }).join(' ');
    parts.push(eduText);
  }
  if (resume.projects && resume.projects.length > 0) {
    parts.push(resume.projects.join(' '));
  }
  
  return parts.join(' ').trim() || resume.originalName || '';
}

// Skills matching with fuzzy matching (exact results)
function enhanceSkillsMatching(jobSkills, resumeSkills) {
  const jobSet = new Set(jobSkills.map(s => s.toLowerCase().trim()));
  const resumeSet = new Set(resumeSkills.map(s => s.toLowerCase().trim()));
  
  if (jobSet.size === 0) {
    return 0; // Exact: 0 if job has no skills to compare
  }
  
  // Exact matches
  const exactMatches = [...jobSet].filter(skill => resumeSet.has(skill));
  
  // Fuzzy matches (partial word matches)
  let fuzzyMatches = 0;
  for (const jobSkill of jobSet) {
    if (exactMatches.includes(jobSkill)) continue;
    for (const resumeSkill of resumeSet) {
      if (jobSkill.includes(resumeSkill) || resumeSkill.includes(jobSkill)) {
        fuzzyMatches++;
        break;
      }
    }
  }
  
  const totalMatches = exactMatches.length + (fuzzyMatches * 0.5);
  
  // Calculate match ratio: totalMatches / jobSet.size
  // This can never exceed 1.0 because totalMatches <= jobSet.size (each job skill matched at most once)
  const matchRatio = totalMatches / jobSet.size;
  
  // Ensure it's in 0-1 range
  return Math.min(1.0, Math.max(0, matchRatio));
}

// Calculate weighted similarity based on different criteria
function calculateWeightedSimilarity(job, resume) {
  try {
    // Validate inputs
    if (!job || !resume) {
      console.warn('calculateWeightedSimilarity: Missing job or resume');
      return {
        score: 0,
        breakdown: {
          cosineSimilarity: 0,
          tfidfSimilarity: 0,
          skillsSimilarity: 0,
          experienceSimilarity: 0,
          educationSimilarity: 0,
          keywordSimilarity: 0
        }
      };
    }

    // Build comprehensive job text
    const jobText = [
      job.title || '',
      job.description || '',
      (job.requirements || []).join(' '),
      (job.skills || []).join(' '),
      job.department || '',
      (job.tags || []).join(' ')
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Build resume text with fallback
    let resumeText;
    try {
      resumeText = buildResumeText(resume).toLowerCase();
    } catch (error) {
      console.error('Error building resume text:', error.message);
      resumeText = '';
    }
    
    // Ensure we have text to work with
    if (!resumeText || resumeText.trim().length < 10) {
      // Return exact score: 0 if no data (no enhancements)
      return {
        score: 0,
        breakdown: {
          cosineSimilarity: 0,
          tfidfSimilarity: 0,
          skillsSimilarity: 0,
          experienceSimilarity: 0,
          educationSimilarity: 0,
          keywordSimilarity: 0
        }
      };
    }

    // 1. Cosine similarity for overall text (ensure 0-1 range)
    const cosineSimilarity = Math.min(1.0, Math.max(0, calculateCosineSimilarity(jobText, resumeText)));
    
    // 2. TF-IDF similarity for more sophisticated text comparison (ensure 0-1 range)
    const tfidfSimilarity = Math.min(1.0, Math.max(0, calculateTFIDFSimilarity(jobText, resumeText)));
    
    // 3. Skills matching (exact results, no enhancements)
    const jobSkills = (job.skills || []).map(s => s.toLowerCase().trim()).filter(Boolean);
    const resumeSkills = (resume.skills || []).map(s => s.toLowerCase().trim()).filter(Boolean);
    const skillsSimilarityRaw = jobSkills.length > 0 && resumeSkills.length > 0
      ? enhanceSkillsMatching(jobSkills, resumeSkills)
      : 0; // Exact: 0 if no skills to compare
    const skillsSimilarity = Math.min(1.0, Math.max(0, skillsSimilarityRaw));
    
    // 4. Experience matching (exact results, ensure 0-1 range)
    const jobExperience = getExperienceLevel(job.experience);
    const resumeExperience = resume.experience || 0;
    const experienceSimilarityRaw = calculateExperienceSimilarity(jobExperience, resumeExperience);
    const experienceSimilarity = Math.min(1.0, Math.max(0, experienceSimilarityRaw));
    
    // 5. Education matching (exact results, ensure 0-1 range)
    const educationSimilarityRaw = calculateEducationSimilarity(job, resume);
    const educationSimilarity = Math.min(1.0, Math.max(0, educationSimilarityRaw));
    
    // 6. Keyword matching (exact results, ensure 0-1 range)
    const keywordSimilarityRaw = calculateKeywordSimilarity(jobText, resumeText);
    const keywordSimilarity = Math.min(1.0, Math.max(0, keywordSimilarityRaw));
    
    // 7. Title matching bonus (0 or 1, not a similarity score)
    const titleMatchBonus = job.title && resumeText.includes(job.title.toLowerCase()) ? 1 : 0;
    
    // Weighted combination - weights must sum to exactly 1.0 to ensure max score is 100
    // Redistribute weights to account for title bonus
    const weights = {
      cosineSimilarity: 0.20,
      tfidfSimilarity: 0.15,
      skillsSimilarity: 0.30,
      experienceSimilarity: 0.15,
      educationSimilarity: 0.10,
      keywordSimilarity: 0.05,
      titleMatch: 0.05
    };
    
    // Verify weights sum to 1.0
    const weightSum = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(weightSum - 1.0) > 0.001) {
      console.warn('Weights do not sum to 1.0:', weightSum);
    }
    
    // Calculate weighted score: each component is (similarity * weight * 100)
    // Maximum possible: if all similarities = 1.0, score = 1.0 * 1.0 * 100 = 100
    const weightedComponents = [
      cosineSimilarity * weights.cosineSimilarity,
      tfidfSimilarity * weights.tfidfSimilarity,
      skillsSimilarity * weights.skillsSimilarity,
      experienceSimilarity * weights.experienceSimilarity,
      educationSimilarity * weights.educationSimilarity,
      keywordSimilarity * weights.keywordSimilarity,
      titleMatchBonus * weights.titleMatch
    ];
    
    // Sum of weighted components (each is 0-1 range, weights sum to 1.0)
    // So sum is guaranteed to be 0-1 range, but add safety check
    const weightedSum = weightedComponents.reduce((sum, val) => {
      // Ensure each component is in valid range before summing
      const safeVal = Math.min(1.0, Math.max(0, val));
      return sum + safeVal;
    }, 0);
    
    // Ensure weightedSum is in 0-1 range (should be, but double-check due to floating point)
    const safeWeightedSum = Math.min(1.0, Math.max(0, weightedSum));
    
    // Convert to 0-100 scale - this is the ONLY place we multiply by 100
    // Since safeWeightedSum is 0-1, finalScore is guaranteed 0-100
    const finalScore = safeWeightedSum * 100;
    
    // Final safety check - ensure score never exceeds 100 (should be impossible, but defensive)
    const clampedScore = Math.min(100, Math.max(0, finalScore));
  
    return {
      score: Math.round(clampedScore), // Round to integer, guaranteed 0-100
      breakdown: {
        cosineSimilarity: Math.round(Math.min(100, Math.max(0, cosineSimilarity * 100))),
        tfidfSimilarity: Math.round(Math.min(100, Math.max(0, tfidfSimilarity * 100))),
        skillsSimilarity: Math.round(Math.min(100, Math.max(0, skillsSimilarity * 100))),
        experienceSimilarity: Math.round(Math.min(100, Math.max(0, experienceSimilarity * 100))),
        educationSimilarity: Math.round(Math.min(100, Math.max(0, educationSimilarity * 100))),
        keywordSimilarity: Math.round(Math.min(100, Math.max(0, keywordSimilarity * 100)))
      }
    };
  } catch (error) {
    console.error('Error in calculateWeightedSimilarity:', error.message, error.stack);
    // Return safe default values on error
    return {
      score: 0,
      breakdown: {
        cosineSimilarity: 0,
        tfidfSimilarity: 0,
        skillsSimilarity: 0,
        experienceSimilarity: 0,
        educationSimilarity: 0,
        keywordSimilarity: 0
      }
    };
  }
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

// Calculate experience similarity (exact results, no enhancements)
function calculateExperienceSimilarity(required, actual) {
  // Exact calculation: no minimum boosts or fallbacks
  if (required === 0) {
    return 0; // Exact: 0 if no experience required (can't calculate similarity)
  }
  
  if (actual >= required) {
    return 1.0; // Perfect match
  } else if (actual >= required * 0.7) {
    return 0.9; // Good match
  } else if (actual >= required * 0.5) {
    return 0.75; // Moderate match
  } else if (actual >= required * 0.3) {
    return 0.5; // Partial match
  } else {
    return actual / required; // Exact ratio, no minimum boost
  }
}

// Calculate education similarity (exact results, no enhancements)
function calculateEducationSimilarity(job, resume) {
  const jobText = `${job.title || ''} ${job.description || ''}`.toLowerCase();
  const resumeText = buildResumeText(resume).toLowerCase();
  
  // Check if job mentions education requirements
  const educationKeywords = ['bachelor', 'master', 'phd', 'ph.d', 'doctorate', 'degree', 'university', 'college', 'bsc', 'msc', 'mba'];
  const jobHasEducationReq = educationKeywords.some(kw => jobText.includes(kw));
  
  if (!jobHasEducationReq) {
    return 0; // Exact: 0 if job doesn't require specific education
  }
  
  // Check structured education data first
  if (resume.education && resume.education.length > 0) {
    const eduText = resume.education.map(edu => {
      if (typeof edu === 'string') return edu.toLowerCase();
      return [edu.school, edu.degree, edu.field].filter(Boolean).join(' ').toLowerCase();
    }).join(' ');
    
    let matches = 0;
    educationKeywords.forEach(keyword => {
      if (jobText.includes(keyword) && eduText.includes(keyword)) {
        matches++;
      }
    });
    
    if (matches > 0) {
      // Exact calculation: matches / total keywords
      return Math.min(1.0, matches / educationKeywords.length);
    }
  }
  
  // Fallback to text matching
  let matches = 0;
  educationKeywords.forEach(keyword => {
    if (jobText.includes(keyword) && resumeText.includes(keyword)) {
      matches++;
    }
  });
  
  // Exact: return 0 if no matches, otherwise exact ratio
  return matches > 0 ? Math.min(1.0, matches / educationKeywords.length) : 0;
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
  getExperienceLevel,
  buildResumeText
}; 