const axios = require('axios');

// Ollama configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3'; // Options: llama3, llama3.1, mistral, phi3, etc.

/**
 * Enhanced resume parser using Ollama (Llama 3) - Free and Open Source
 * Uses structured JSON schema for accurate extraction
 */
async function parseResumeWithOllama(extractedText) {
  if (!extractedText || extractedText.trim().length < 50) {
    console.log('Text too short for Ollama parsing');
    return null;
  }

  try {
    // Truncate text to fit token limits (Llama 3 can handle ~8000 tokens)
    const maxTextLength = 15000;
    const resumeText = extractedText.substring(0, maxTextLength);

    const systemPrompt = `You are an expert resume parser with deep understanding of professional resumes, CVs, and career documents. Your task is to extract structured information with high accuracy.

Guidelines:
1. Extract ALL information accurately, including partial or incomplete data
2. Normalize dates to YYYY-MM format when possible, or YYYY if only year is available
3. For current positions, use "Present" as endDate
4. Extract skills in their canonical form (e.g., "JavaScript" not "JS", "React.js" not "React")
5. Identify technical skills, soft skills, tools, frameworks, and technologies separately
6. Extract full job descriptions, not just summaries
7. Calculate total years of experience accurately, accounting for overlapping periods
8. Extract education with proper degree types (Bachelor's, Master's, PhD, etc.)
9. Identify certifications, licenses, and professional credentials
10. Extract projects with descriptions when available
11. Parse contact information carefully (email, phone, LinkedIn, GitHub, etc.)
12. Extract location in format: "City, State/Country" or "City, Country"
13. If information is missing, use null or empty string, never make up data

Return ONLY valid JSON matching the exact schema provided.`;

    const userPrompt = `Extract all structured information from this resume text. Be thorough and accurate.

Resume Text:
${resumeText}

Return a JSON object with this exact structure:
{
  "name": "Full legal name or preferred name",
  "email": "Email address if found",
  "phone": "Phone number in standard format",
  "location": "City, State/Country or City, Country",
  "linkedin": "LinkedIn URL if mentioned",
  "github": "GitHub URL if mentioned",
  "portfolio": "Portfolio/website URL if mentioned",
  "summary": "Professional summary, objective, or profile section (full text)",
  "experience": [
    {
      "company": "Company name",
      "role": "Job title/position",
      "location": "Job location if mentioned",
      "startDate": "YYYY-MM or YYYY format",
      "endDate": "YYYY-MM, YYYY, or 'Present'",
      "description": "Full job description with responsibilities and achievements",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "education": [
    {
      "school": "University/College/Institution name",
      "degree": "Degree type (Bachelor's, Master's, PhD, Associate's, Diploma, Certificate, etc.)",
      "field": "Field of study or major",
      "gpa": "GPA if mentioned (as string)",
      "startYear": YYYY or null,
      "endYear": YYYY or null,
      "honors": "Honors, distinctions, or achievements if mentioned"
    }
  ],
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"],
    "languages": ["language1", "language2"],
    "certifications": [
      {
        "name": "Certification name",
        "issuer": "Issuing organization",
        "date": "YYYY-MM or YYYY",
        "expiry": "YYYY-MM or null if not mentioned"
      }
    ]
  },
  "projects": [
    {
      "name": "Project name",
      "description": "Project description",
      "technologies": ["tech1", "tech2"],
      "url": "Project URL if mentioned",
      "date": "YYYY-MM or YYYY if mentioned"
    }
  ],
  "achievements": ["achievement1", "achievement2"],
  "experienceYears": 0
}

Important:
- Calculate experienceYears by summing all work experience periods (account for overlaps)
- Extract ALL skills mentioned, normalize to standard names
- Include incomplete information if it's clearly stated
- For dates, prefer YYYY-MM format, fallback to YYYY, or use descriptive text if needed
- Extract full descriptions, not summaries
- Return ONLY the JSON object, no additional text or markdown formatting`;

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: fullPrompt,
      stream: false,
      options: {
        temperature: 0.1, // Low temperature for consistent, accurate extraction
        num_predict: 4000, // Maximum tokens to generate
        top_p: 0.9,
        top_k: 40
      },
      format: 'json' // Request JSON format (if supported by model)
    }, {
      timeout: 120000 // 2 minutes timeout for large resumes
    });

    let jsonText = '';
    
    // Handle streaming response (Ollama may return stream even with stream: false in some versions)
    if (response.data.response) {
      jsonText = response.data.response;
    } else if (response.data.text) {
      jsonText = response.data.text;
    } else {
      // Try to get from response directly
      jsonText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    }

    // Clean up the response - remove markdown code blocks if present
    jsonText = jsonText.trim();
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    
    // Try to extract JSON if wrapped in other text
    let parsedData;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (parseError) {
      // Try to extract JSON from response if it's wrapped in markdown or text
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
                       jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        console.error('Failed to parse Ollama response as JSON:', parseError.message);
        console.error('Response text:', jsonText.substring(0, 500));
        throw new Error('Invalid JSON response from Ollama');
      }
    }
    
    // Normalize and validate the parsed data
    parsedData = normalizeParsedData(parsedData);
    
    // Calculate total experience years from experience entries
    let totalExperience = parsedData.experienceYears || 0;
    
    if (parsedData.experience && Array.isArray(parsedData.experience) && parsedData.experience.length > 0) {
      const now = new Date();
      const dateRanges = [];
      
      for (const exp of parsedData.experience) {
        if (!exp.startDate) continue;
        
        const startDate = parseDate(exp.startDate);
        const endDate = exp.endDate === 'Present' || exp.endDate === 'Current' || 
                       exp.endDate === null || exp.endDate === undefined || exp.endDate === ''
          ? now 
          : parseDate(exp.endDate);
        
        if (startDate && endDate) {
          dateRanges.push({ start: startDate, end: endDate });
        }
      }
      
      // Merge overlapping ranges and calculate total
      if (dateRanges.length > 0) {
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
        
        let totalMonths = 0;
        for (const range of merged) {
          const months = (range.end.getFullYear() - range.start.getFullYear()) * 12 +
                         (range.end.getMonth() - range.start.getMonth());
          totalMonths += Math.max(0, months); // Ensure non-negative
        }
        
        totalExperience = Math.round((totalMonths / 12) * 10) / 10;
      }
    }
    
    // If experience not calculated from dates, try to extract from text or use AI's calculation
    if (totalExperience === 0 || totalExperience < 0.5) {
      const expMatch = extractedText.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i);
      if (expMatch) {
        totalExperience = parseFloat(expMatch[1]);
      }
    }
    
    parsedData.experienceYears = totalExperience;
    
    // Flatten skills structure for compatibility with existing code
    if (parsedData.skills && typeof parsedData.skills === 'object') {
      const allSkills = [
        ...(parsedData.skills.technical || []),
        ...(parsedData.skills.soft || []),
        ...(parsedData.skills.languages || [])
      ];
      parsedData.skills = allSkills;
      parsedData.languages = parsedData.skills.languages || [];
    }
    
    // Extract certifications from skills object if present
    if (parsedData.skills && typeof parsedData.skills === 'object' && parsedData.skills.certifications) {
      parsedData.certifications = parsedData.skills.certifications.map(cert => 
        typeof cert === 'string' ? cert : cert.name || cert
      );
    }
    
    // Ensure social links are properly formatted
    if (parsedData.linkedin && !parsedData.linkedin.startsWith('http')) {
      parsedData.linkedin = `https://www.linkedin.com/in/${parsedData.linkedin.replace(/^.*\//, '')}`;
    }
    if (parsedData.github && !parsedData.github.startsWith('http')) {
      parsedData.github = `https://github.com/${parsedData.github.replace(/^.*\//, '')}`;
    }
    if (parsedData.portfolio && !parsedData.portfolio.startsWith('http')) {
      parsedData.portfolio = `https://${parsedData.portfolio}`;
    }
    
    return parsedData;
  } catch (error) {
    console.error('Ollama parsing error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Ollama is not running. Please start Ollama service: ollama serve');
    } else if (error.response) {
      console.error('Ollama API error:', error.response.status, error.response.data);
    }
    return null;
  }
}

/**
 * Normalize and validate parsed data structure
 */
function normalizeParsedData(data) {
  if (!data || typeof data !== 'object') {
    return {};
  }

  // Ensure arrays exist
  if (!Array.isArray(data.experience)) data.experience = [];
  if (!Array.isArray(data.education)) data.education = [];
  if (!Array.isArray(data.projects)) data.projects = [];
  if (!Array.isArray(data.achievements)) data.achievements = [];

  // Normalize experience entries
  data.experience = data.experience.map(exp => ({
    company: exp.company || '',
    role: exp.role || exp.title || exp.position || '',
    location: exp.location || '',
    startDate: exp.startDate || null,
    endDate: exp.endDate || null,
    description: exp.description || exp.responsibilities || '',
    technologies: Array.isArray(exp.technologies) ? exp.technologies : []
  }));

  // Normalize education entries
  data.education = data.education.map(edu => ({
    school: edu.school || edu.university || edu.institution || '',
    degree: edu.degree || edu.degreeType || '',
    field: edu.field || edu.major || edu.specialization || '',
    gpa: edu.gpa || null,
    startYear: edu.startYear || null,
    endYear: edu.endYear || edu.graduationYear || null,
    honors: edu.honors || null
  }));

  // Normalize projects
  data.projects = data.projects.map(proj => ({
    name: typeof proj === 'string' ? proj : (proj.name || ''),
    description: typeof proj === 'string' ? '' : (proj.description || ''),
    technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
    url: proj.url || null,
    date: proj.date || null
  }));

  return data;
}

/**
 * Enhanced date parsing with support for various formats
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr === null || dateStr === undefined) return null;
  
  const cleaned = String(dateStr).trim();
  
  if (!cleaned || cleaned === '') return null;
  
  // Handle "Present", "Current", "Now"
  if (cleaned.match(/^(present|current|now|ongoing|till date)$/i)) {
    return new Date();
  }
  
  // Handle YYYY-MM format
  const yearMonthMatch = cleaned.match(/^(\d{4})-(\d{1,2})$/);
  if (yearMonthMatch) {
    const year = parseInt(yearMonthMatch[1]);
    const month = parseInt(yearMonthMatch[2]);
    if (month >= 1 && month <= 12) {
      return new Date(year, month - 1, 1);
    }
  }
  
  // Handle YYYY format
  const yearMatch = cleaned.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year >= 1900 && year <= new Date().getFullYear() + 1) {
      return new Date(year, 0, 1);
    }
  }
  
  // Handle MM/YYYY or MM-YYYY format
  const monthYearMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (monthYearMatch) {
    const month = parseInt(monthYearMatch[1]);
    const year = parseInt(monthYearMatch[2]);
    if (month >= 1 && month <= 12 && year >= 1900) {
      return new Date(year, month - 1, 1);
    }
  }
  
  // Handle month name formats (e.g., "January 2020", "Jan 2020")
  const monthNameMatch = cleaned.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i);
  if (monthNameMatch) {
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = monthNames.indexOf(monthNameMatch[1].toLowerCase().substring(0, 3));
    const year = parseInt(monthNameMatch[2]);
    if (month >= 0 && year >= 1900) {
      return new Date(year, month, 1);
    }
  }
  
  // Try standard Date parsing
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    // Validate the parsed date is reasonable
    const year = parsed.getFullYear();
    if (year >= 1900 && year <= new Date().getFullYear() + 1) {
      return parsed;
    }
  }
  
  return null;
}

/**
 * Advanced Ollama parser with retry logic and fallback
 * Use this for maximum accuracy
 */
async function parseResumeWithOllamaAdvanced(extractedText, options = {}) {
  const maxRetries = options.maxRetries || 2;
  
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await parseResumeWithOllama(extractedText);
      if (result && Object.keys(result).length > 0) {
        return result;
      }
    } catch (error) {
      lastError = error;
      console.log(`Ollama parsing attempt ${attempt + 1} failed:`, error.message);
      if (attempt < maxRetries - 1) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  console.error('All Ollama parsing attempts failed:', lastError?.message);
  return null;
}

/**
 * Check if Ollama parser is available
 */
async function isOllamaParserAvailable() {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000
    });
    // Check if the model is available
    const models = response.data.models || [];
    const modelAvailable = models.some(m => m.name.includes(OLLAMA_MODEL));
    return modelAvailable;
  } catch (error) {
    console.log('Ollama not available:', error.message);
    return false;
  }
}

module.exports = {
  parseResumeWithOllama,
  parseResumeWithOllamaAdvanced,
  isOllamaParserAvailable
};

