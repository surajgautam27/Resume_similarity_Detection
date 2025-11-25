/**
 * Advanced Education Parser
 * Extracts structured education information from resume text
 */

const DEGREE_PATTERNS = [
  { pattern: /\bbachelor(?:'?s)?\b/i, type: "Bachelor's" },
  { pattern: /master(?:'?s)?(?:\s+(?:in|of)\s+(?:science|arts|engineering|technology|business|administration))?/i, type: "Master's" },
  { pattern: /m\.?b\.?a/i, type: "MBA" },
  { pattern: /ph\.?d|doctorate|doctor\s+of\s+philosophy/i, type: "PhD" },
  { pattern: /doctor\s+of\s+(?:medicine|law|engineering)/i, type: "Doctorate" },
  { pattern: /associate(?:'?s)?(?:\s+degree)?/i, type: "Associate's" },
  { pattern: /intermediate/i, type: "Intermediate" },
  { pattern: /diploma/i, type: "Diploma" },
  { pattern: /certificate/i, type: "Certificate" },
  { pattern: /b\.?s\.?c/i, type: "BSc" },
  { pattern: /m\.?s\.?c/i, type: "MSc" },
  { pattern: /b\.?tech|bachelor\s+of\s+technology/i, type: "BTech" },
  { pattern: /m\.?tech|master\s+of\s+technology/i, type: "MTech" },
  { pattern: /\bb\.?e\.?\b|bachelor\s+of\s+engineering/i, type: "BE" },
  { pattern: /\bm\.?e\.?\b|master\s+of\s+engineering/i, type: "ME" },
  { pattern: /bsc\s+csit|bachelor\s+in\s+computer\s+science\s+and\s+information\s+technology/i, type: "BSc CSIT" }
];

const FIELD_PATTERNS = [
  /(?:in|of)\s+([A-Z][A-Za-z\s&,\-()]+?)(?:\s*[,\-]|\s*$|\(|from|at|Technical|Stream)/i,
  /\(([A-Z][A-Za-z\s&,\-()]+?)\)/, // Field in parentheses like "(Computer Engineering Technical)"
  /([A-Z][A-Za-z\s&,\-()]+?)\s+(?:degree|major|specialization|Technical|Stream)/i,
  /Computer\s+(?:Engineering|Science)\s+(?:Technical|and\s+Information\s+Technology)/i
];

const SCHOOL_PATTERNS = [
  /\b([A-Z][A-Za-z\s&.]+(?:University|College|Institute|School|Academy|Polytechnic|Campus|Center|Centre))\b/,
  /(?:from|at|@)\s+([A-Z][A-Za-z\s&.]+(?:University|College|Institute|School|Academy|Campus|Center|Centre))/i,
  /([A-Z][A-Za-z\s&.]+(?:University|College|Institute|School|Academy|Campus|Center|Centre))/i,
  // Pattern for names like "Kalika Manavgyan Secondary School" or "Bhaktapur Multiple Campus"
  /^([A-Z][A-Za-z\s&.]+(?:Secondary\s+School|Multiple\s+Campus|High\s+School|Public\s+School))/i
];

const YEAR_PATTERN = /\b(19|20)\d{2}\b/g;
const MONTH_YEAR_PATTERN = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*(\d{4})/gi;
const DATE_RANGE_PATTERN = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*(\d{4})\s*[-–]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*(\d{4})|Present|Current)/gi;

const NON_EDUCATION_KEYWORDS = [
  'email', 'phone', 'github', 'linkedin', 'portfolio', 'website', 'contact',
  'address', 'location', 'city', 'state', 'country', 'zip', 'postal'
];

function isEducationSection(line, context = []) {
  const lowerLine = line.toLowerCase();
  
  // Check if line contains non-education keywords
  if (NON_EDUCATION_KEYWORDS.some(kw => lowerLine.includes(kw))) {
    return false;
  }
  
  // Check if it's clearly an education header
  const educationHeaders = ['education', 'academic', 'qualifications', 'academic background', 'educational background'];
  if (educationHeaders.some(header => lowerLine.includes(header) && lowerLine.length < 30)) {
    return true;
  }
  
  // Check if line contains degree patterns
  const hasDegree = DEGREE_PATTERNS.some(({ pattern }) => pattern.test(line));
  if (hasDegree) {
    return true;
  }
  
  // Check context - if previous lines were education, this might be too
  if (context.length > 0) {
    const lastWasEducation = context[context.length - 1]?.isEducation;
    if (lastWasEducation && (lowerLine.includes('university') || lowerLine.includes('college') || lowerLine.includes('institute'))) {
      return true;
    }
  }
  
  return false;
}

function extractEducationEntry(text, context = []) {
  // Handle both single line and multi-line text
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return null;
  
  const trimmed = lines.join(' ').trim();
  if (trimmed.length < 5) return null;
  
  const lower = trimmed.toLowerCase();
  
  // Skip if it's clearly not education
  if (NON_EDUCATION_KEYWORDS.some(kw => lower.includes(kw))) {
    return null;
  }
  
  // Skip if it's too short and doesn't have education indicators
  if (trimmed.length < 10 && !DEGREE_PATTERNS.some(({ pattern }) => pattern.test(trimmed))) {
    return null;
  }
  
  // Extract degree - require it to be at start of line or after certain keywords
  let degree = '';
  let degreeType = '';
  let degreeMatchIndex = -1;
  
  for (const { pattern, type } of DEGREE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const matchIndex = match.index;
      const beforeText = trimmed.substring(0, matchIndex).toLowerCase();
      const afterText = trimmed.substring(matchIndex + match[0].length);
      
      // Skip if it's part of a larger word (like "MERN" containing "ME" or "improving" containing "me")
      const beforeChar = matchIndex > 0 ? trimmed[matchIndex - 1] : ' ';
      const afterChar = matchIndex + match[0].length < trimmed.length ? trimmed[matchIndex + match[0].length] : ' ';
      
      // For short abbreviations like "ME", "BE", require word boundaries
      if (match[0].length <= 3) {
        if (/\w/.test(beforeChar) || /\w/.test(afterChar)) {
          continue; // Skip - it's part of a larger word
        }
      }
      
      // For "me" specifically, make sure it's not from "improving", "some", etc.
      if (match[0].toLowerCase() === 'me' || match[0].toLowerCase() === 'be') {
        // Must be at start of line, after "Bachelor" or "Master", or standalone
        if (!/^(bachelor|master|intermediate|diploma)/i.test(beforeText.trim()) && 
            matchIndex > 0 && beforeText.trim().length > 0) {
          continue; // Skip - likely false positive
        }
      }
      
      // Degree should be near the start of the line (first 50 chars) or after education keywords
      if (matchIndex < 50 || /^(bachelor|master|intermediate|diploma|degree)/i.test(beforeText.trim())) {
        degree = match[0].trim();
        degreeType = type;
        degreeMatchIndex = matchIndex;
        break;
      }
    }
  }
  
  // Extract field of study
  let field = '';
  
  // First, try to extract field from parentheses like "(Computer Engineering Technical)"
  const parenMatch = trimmed.match(/\(([A-Z][A-Za-z\s&,\-()]+?)\)/);
  if (parenMatch && parenMatch[1]) {
    const parenField = parenMatch[1].trim();
    // Check if it looks like a field (not a year, not too short)
    if (parenField.length > 3 && parenField.length < 60 && !/^\d{4}$/.test(parenField)) {
      field = parenField;
    }
  }
  
  // If no field from parentheses, try other patterns
  if (!field) {
    for (const pattern of FIELD_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        field = match[1].trim();
        // Clean up field
        field = field.replace(/^in\s+/i, '').replace(/^of\s+/i, '').trim();
        if (field.length > 2 && field.length < 60) {
          break;
        }
      }
    }
  }
  
  // Also check for "Bachelor in Computer Science" pattern - improved
  if (!field && degree) {
    // Extract everything after the degree
    const afterDegree = trimmed.substring(degreeMatchIndex + degree.length).trim();
    
    // Extract field from combined text - look for "in/of" after degree
    // First, find where degree ends in the combined text
    const degreeEndIndex = degreeMatchIndex >= 0 ? degreeMatchIndex + degree.length : 0;
    const textAfterDegree = trimmed.substring(degreeEndIndex).trim();
    
    // If we have multiple lines, field is on the first line (same as degree)
    // This is the most reliable approach - extract from first line only
    if (lines.length > 1) {
      const firstLine = lines[0].trim();
      const degreeIndex = firstLine.toLowerCase().indexOf(degree.toLowerCase());
      if (degreeIndex >= 0) {
        const afterDegreeInLine = firstLine.substring(degreeIndex + degree.length).trim();
        // Look for "in/of" pattern and capture everything until end of line
        // This ensures we get the complete field name without school contamination
        const inPattern = /^(?:in|of)\s+(.+)$/i;
        const inMatch = afterDegreeInLine.match(inPattern);
        if (inMatch && inMatch[1]) {
          field = inMatch[1].trim();
          // Remove trailing punctuation but keep the FULL field name
          field = field.replace(/[,.]+\s*$/, '').trim();
          // Don't apply any length limits or keyword stopping here - field is on its own line
        }
      }
    } else {
      // Single line - extract from combined text, stop before school keywords
      const inPattern = /^(?:in|of)\s+(.+?)(?:\s+(?:Bhaktapur|Kalika|Multiple\s+Campus|Campus|School|University|College|Institute))/i;
      let inMatch = textAfterDegree.match(inPattern);
      if (!inMatch) {
        // Try capturing everything
        const simplePattern = /^(?:in|of)\s+(.+)$/i;
        inMatch = textAfterDegree.match(simplePattern);
        if (inMatch && inMatch[1]) {
          field = inMatch[1].trim();
          // Stop at school keywords that appear after reasonable field length
          const schoolKeywords = ['multiple campus', 'campus', 'school', 'university', 'college', 'institute'];
          for (const keyword of schoolKeywords) {
            const keywordIndex = field.toLowerCase().indexOf(keyword);
            // Only stop if keyword is not at the very beginning (might be part of field name)
            if (keywordIndex > 10) {
              field = field.substring(0, keywordIndex).trim();
              break;
            }
          }
          field = field.replace(/[,.]+\s*$/, '').trim();
        }
      } else {
        field = inMatch[1].trim();
        field = field.replace(/[,.]+\s*$/, '').trim();
      }
    }
  }
  
  // Extract school/university - improved to handle multi-line entries
  let school = '';
  
  // If we have multiple lines, school is likely on a separate line
  if (lines.length > 1) {
    // Look for school on lines that come after the degree/field line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Skip date lines
      if (DATE_RANGE_PATTERN.test(line) || YEAR_PATTERN.test(line)) {
        continue;
      }
      
      // Skip if line contains field text (field shouldn't be on separate line from degree)
      if (field && line.toLowerCase().includes(field.toLowerCase().substring(0, 10))) {
        continue;
      }
      
      // Check if this line looks like a school name
      for (const pattern of SCHOOL_PATTERNS) {
        const match = line.match(pattern);
        if (match && match[1]) {
          school = match[1].trim();
          school = school.replace(/^from\s+/i, '').replace(/^at\s+/i, '').replace(/^@\s+/i, '').trim();
          school = school.replace(/[,.]+\s*$/, '').trim();
          
          // Make sure school doesn't contain the field
          if (field && school.toLowerCase().includes(field.toLowerCase())) {
            const fieldIndex = school.toLowerCase().indexOf(field.toLowerCase());
            if (fieldIndex > 0) {
              school = school.substring(0, fieldIndex).trim();
            } else {
              school = school.substring(field.length).trim();
            }
          }
          
          if (school.length > 3 && school.length < 100) {
            break;
          }
        }
      }
      
      // If no pattern match, check if line has school keywords
      if (!school) {
        const schoolKeywords = ['campus', 'school', 'university', 'college', 'institute', 'academy'];
        const lower = line.toLowerCase();
        if (schoolKeywords.some(kw => lower.includes(kw)) && 
            line.length > 5 && line.length < 100 &&
            /^[A-Z]/.test(line) &&
            !DATE_RANGE_PATTERN.test(line) &&
            !YEAR_PATTERN.test(line)) {
          school = line.replace(/[,.]+\s*$/, '').trim();
          
          // Make sure school doesn't contain the field
          if (field && school.toLowerCase().includes(field.toLowerCase())) {
            const fieldIndex = school.toLowerCase().indexOf(field.toLowerCase());
            if (fieldIndex > 0) {
              school = school.substring(0, fieldIndex).trim();
            } else {
              school = school.substring(field.length).trim();
            }
          }
          
          break;
        }
      }
      
      if (school) break;
    }
  }
  
  // If school not found in separate lines, try in combined text
  if (!school) {
    const afterDegreeText = degreeMatchIndex >= 0 ? trimmed.substring(degreeMatchIndex + degree.length) : trimmed;
    
    for (const pattern of SCHOOL_PATTERNS) {
      const match = afterDegreeText.match(pattern);
      if (match && match[1]) {
        school = match[1].trim();
        school = school.replace(/^from\s+/i, '').replace(/^at\s+/i, '').replace(/^@\s+/i, '').trim();
        school = school.replace(/[,.]+\s*$/, '').trim();
        
        // Remove field from school if it got mixed in
        if (field && school.toLowerCase().includes(field.toLowerCase())) {
          const fieldIndex = school.toLowerCase().indexOf(field.toLowerCase());
          if (fieldIndex > 0) {
            school = school.substring(0, fieldIndex).trim();
          }
        }
        
        if (school.length > 3 && school.length < 100) {
          break;
        }
      }
    }
  }
  
  // Extract years - try date range first, then individual years
  let startYear = undefined;
  let endYear = undefined;
  
  // Try to match date ranges like "Apr, 2019 - Feb, 2021" or "May, 2022 - Present"
  const dateRangeMatch = trimmed.match(DATE_RANGE_PATTERN);
  if (dateRangeMatch) {
    const range = dateRangeMatch[0];
    const yearMatches = range.match(/\b(19|20)\d{2}\b/g);
    if (yearMatches && yearMatches.length > 0) {
      startYear = parseInt(yearMatches[0]);
      if (yearMatches.length > 1) {
        endYear = parseInt(yearMatches[1]);
      } else if (/present|current/i.test(range)) {
        endYear = undefined; // Will be handled as "Present"
      }
    }
  } else {
    // Fallback to simple year extraction
    const years = [...trimmed.matchAll(YEAR_PATTERN)].map(m => parseInt(m[0]));
    startYear = years.length > 0 ? years[0] : undefined;
    endYear = years.length > 1 ? years[years.length - 1] : (years.length === 1 ? undefined : undefined);
  }
  
  // If we have at least degree or school, it's valid
  if (!degree && !school && !field) {
    // Check if line has education keywords but we couldn't parse structure
    if (lower.includes('university') || lower.includes('college') || lower.includes('institute')) {
      school = trimmed;
    } else {
      return null;
    }
  }
  
  // Build structured entry
  const entry = {
    degree: degree || '',
    field: field || '',
    school: school || '',
    startYear: startYear,
    endYear: endYear
  };
  
  // Validate entry - filter out false positives
  if (!entry.degree && !entry.school && !entry.field) {
    return null;
  }
  
  // Filter out entries that are clearly not education (too short, no meaningful content)
  const combined = `${entry.degree} ${entry.field} ${entry.school}`.toLowerCase();
  if (combined.length < 10 && !entry.school) {
    return null;
  }
  
  // Filter out entries where degree is too short and seems like a false positive
  if (entry.degree && entry.degree.length <= 2 && !entry.school && !entry.field) {
    return null;
  }
  
  return entry;
}

function parseEducationSection(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const education = [];
  let inEducationSection = false;
  let currentEntry = null;
  let entryLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    // Detect education section header (with or without emojis)
    const cleanedLine = line.replace(/[^\w\s:]/g, '').trim().toLowerCase();
    if ((/^(education|academic|qualifications|academic\s+background)/i.test(lower) || 
         /^(education|academic|qualifications|academic\s+background)/i.test(cleanedLine)) && 
        (line.length < 50 || cleanedLine.length < 50)) {
      inEducationSection = true;
      currentEntry = null;
      entryLines = [];
      continue;
    }
    
    // Detect end of education section (next major section)
    if (inEducationSection) {
      const nextSectionHeaders = ['experience', 'work', 'employment', 'projects', 'skills', 'certifications', 'languages', 'contact', 'references', 'training'];
      if (nextSectionHeaders.some(header => lower.startsWith(header) && line.length < 30)) {
        // Save current entry if exists
        if (currentEntry || entryLines.length > 0) {
          const combinedText = entryLines.join(' ');
          const entry = extractEducationEntry(combinedText);
          if (entry) education.push(entry);
        }
        inEducationSection = false;
        currentEntry = null;
        entryLines = [];
        continue;
      }
    }
    
    // Check if this line starts a new education entry (has degree pattern)
    const hasDegreePattern = DEGREE_PATTERNS.some(({ pattern }) => pattern.test(line));
    const hasSchoolPattern = SCHOOL_PATTERNS.some(pattern => pattern.test(line));
    const hasDatePattern = DATE_RANGE_PATTERN.test(line) || YEAR_PATTERN.test(line);
    
    if (inEducationSection) {
      if (hasDegreePattern && entryLines.length > 0) {
        // Save previous entry
        const combinedText = entryLines.join(' ');
        const entry = extractEducationEntry(combinedText);
        if (entry && (entry.degree || entry.school)) {
          education.push(entry);
        }
        // Start new entry
        entryLines = [line];
      } else if (hasDegreePattern) {
        // New entry starting with degree
        entryLines = [line];
      } else if (hasSchoolPattern || hasDatePattern || entryLines.length > 0) {
        // Continue building current entry
        entryLines.push(line);
        
        // Try to extract when we have enough components
        if (entryLines.length >= 2) {
          const combinedText = entryLines.join(' ');
          const entry = extractEducationEntry(combinedText);
          
          // Check if we have a complete entry (degree + school, or degree + date, or all three)
          const hasCompleteEntry = entry && (
            (entry.degree && entry.school) ||
            (entry.degree && (entry.startYear || entry.endYear)) ||
            (entry.degree && entry.field && entryLines.length >= 2) ||
            entryLines.length >= 3
          );
          
          if (hasCompleteEntry) {
            education.push(entry);
            entryLines = []; // Reset for next entry
          } else if (entryLines.length >= 4) {
            // If we have 4+ lines, force extraction even if incomplete
            if (entry && (entry.degree || entry.school)) {
              education.push(entry);
              entryLines = [];
            }
          }
        }
      }
    } else {
      // Not in education section, but check if line has education keywords
      if (hasDegreePattern || (hasSchoolPattern && hasDatePattern)) {
        const entry = extractEducationEntry(line);
        if (entry) {
          education.push(entry);
        }
      }
    }
  }
  
  // Save last entry if exists
  if (inEducationSection && entryLines.length > 0) {
    const combinedText = entryLines.join(' ');
    const entry = extractEducationEntry(combinedText);
    if (entry) education.push(entry);
  }
  
  // If we didn't find education section, search entire text with multi-line approach
  if (education.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const hasDegree = DEGREE_PATTERNS.some(({ pattern }) => pattern.test(line));
      
      if (hasDegree) {
        // Try to combine with next 2-3 lines
        const combinedLines = [line];
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const nextLine = lines[j];
          const nextLower = nextLine.toLowerCase();
          
          // Stop if we hit another degree, section header, or project/experience content
          if (DEGREE_PATTERNS.some(({ pattern }) => pattern.test(nextLine)) ||
              /^(experience|work|projects|skills|certifications|training|references)/i.test(nextLower) ||
              /^(created|building|developed|worked)/i.test(nextLower)) {
            break;
          }
          
          // Stop if line looks like project description or work description
          if (nextLine.length > 100 || /http|github|linkedin|portfolio/i.test(nextLine)) {
            break;
          }
          
          combinedLines.push(nextLine);
        }
        
        const combinedText = combinedLines.join(' ');
        const entry = extractEducationEntry(combinedText);
        if (entry && (entry.degree || entry.school)) {
          education.push(entry);
          i += combinedLines.length - 1; // Skip processed lines
          if (education.length >= 5) break;
        }
      }
    }
  }
  
  // Deduplicate and clean - improved
  const unique = [];
  const seen = new Set();
  
  for (const entry of education) {
    // Skip entries with very short or invalid degrees
    if (entry.degree && entry.degree.length <= 2 && !entry.school && !entry.field) {
      continue;
    }
    
    // Create a more flexible key for deduplication
    const keyParts = [
      entry.degree?.toLowerCase().substring(0, 20) || '',
      entry.school?.toLowerCase().substring(0, 30) || '',
      entry.field?.toLowerCase().substring(0, 30) || ''
    ].filter(Boolean);
    
    if (keyParts.length === 0) continue;
    
    const key = keyParts.join('|');
    
    // Check if this is a duplicate or subset of another entry
    let isDuplicate = false;
    for (const existingKey of seen) {
      if (key === existingKey || existingKey.includes(key) || key.includes(existingKey)) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate && (entry.degree || entry.school || entry.field)) {
      seen.add(key);
      unique.push(entry);
    }
  }
  
  // Sort by completeness (entries with more fields first)
  unique.sort((a, b) => {
    const aScore = (a.degree ? 1 : 0) + (a.field ? 1 : 0) + (a.school ? 1 : 0) + (a.startYear ? 1 : 0);
    const bScore = (b.degree ? 1 : 0) + (b.field ? 1 : 0) + (b.school ? 1 : 0) + (b.startYear ? 1 : 0);
    return bScore - aScore;
  });
  
  return unique.slice(0, 5);
}

module.exports = {
  parseEducationSection,
  extractEducationEntry,
  isEducationSection
};

