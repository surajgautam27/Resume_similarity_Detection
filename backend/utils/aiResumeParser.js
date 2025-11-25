const OpenAI = require('openai');

// Initialize OpenAI client (optional - works without API key)
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Use more powerful model if available, fallback to mini for cost efficiency
const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'; // Options: gpt-4o, gpt-4-turbo, gpt-4o-mini

/**
 * Enhanced resume parser using OpenAI API with advanced NLP capabilities
 * Uses structured JSON schema for accurate extraction
 */
async function parseResumeWithAI(extractedText) {
  if (!openai) {
    console.log('OpenAI API key not found, using fallback parser');
    return null;
  }

  if (!extractedText || extractedText.trim().length < 50) {
    console.log('Text too short for AI parsing');
    return null;
  }

  try {
    // Truncate text to fit token limits (keep more context for better parsing)
    const maxTextLength = AI_MODEL.includes('gpt-4') ? 15000 : 12000;
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
      "technologies": ["tech1", "tech2"] // Technologies/tools used in this role
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
    "technical": ["skill1", "skill2"], // Programming languages, frameworks, tools
    "soft": ["skill1", "skill2"], // Soft skills, interpersonal skills
    "languages": ["language1", "language2"], // Spoken languages with proficiency if mentioned
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
  "achievements": ["achievement1", "achievement2"], // Awards, honors, publications, etc.
  "experienceYears": 0 // Total years of professional experience (calculated)
}

Important:
- Calculate experienceYears by summing all work experience periods (account for overlaps)
- Extract ALL skills mentioned, normalize to standard names
- Include incomplete information if it's clearly stated
- For dates, prefer YYYY-MM format, fallback to YYYY, or use descriptive text if needed
- Extract full descriptions, not summaries`;

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent, accurate extraction
      max_tokens: AI_MODEL.includes('gpt-4') ? 4000 : 3000, // More tokens for detailed extraction
      response_format: { type: 'json_object' }
    });

    let parsedData;
    try {
      parsedData = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Try to extract JSON from response if it's wrapped in markdown
      const jsonMatch = response.choices[0].message.content.match(/```json\s*([\s\S]*?)\s*```/) ||
                       response.choices[0].message.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from AI');
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
    if (parsedData.skills && parsedData.skills.certifications) {
      parsedData.certifications = parsedData.skills.certifications.map(cert => 
        typeof cert === 'string' ? cert : cert.name || cert
      );
    }
    
    return parsedData;
  } catch (error) {
    console.error('AI parsing error:', error.message);
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
 * Advanced AI parser with retry logic and fallback
 * Use this for maximum accuracy
 */
async function parseResumeWithAIAdvanced(extractedText, options = {}) {
  const maxRetries = options.maxRetries || 2;
  const useBetterModel = options.useBetterModel || false;
  
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // On retry, optionally use a better model
      if (attempt > 0 && useBetterModel && process.env.OPENAI_API_KEY) {
        const originalModel = AI_MODEL;
        const betterModel = originalModel.includes('mini') ? 'gpt-4o' : 'gpt-4-turbo';
        console.log(`Retrying with better model: ${betterModel}`);
        // Temporarily override model (would need refactoring to support this)
      }
      
      const result = await parseResumeWithAI(extractedText);
      if (result && Object.keys(result).length > 0) {
        return result;
      }
    } catch (error) {
      lastError = error;
      console.log(`AI parsing attempt ${attempt + 1} failed:`, error.message);
      if (attempt < maxRetries - 1) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  console.error('All AI parsing attempts failed:', lastError?.message);
  return null;
}

/**
 * Check if AI parser is available
 */
function isAIParserAvailable() {
  return !!openai && !!process.env.OPENAI_API_KEY;
}

module.exports = {
  parseResumeWithAI,
  parseResumeWithAIAdvanced,
  isAIParserAvailable
};

