const OpenAI = require('openai');

// Initialize OpenAI client (optional - works without API key)
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Parse resume using OpenAI API for highly accurate extraction
 * Falls back to basic parser if API key not available
 */
async function parseResumeWithAI(extractedText) {
  if (!openai) {
    console.log('OpenAI API key not found, using fallback parser');
    return null;
  }

  try {
    const prompt = `Extract structured information from this resume text. Return ONLY valid JSON with the following structure:
{
  "name": "Full name",
  "email": "Email address",
  "phone": "Phone number",
  "location": "City, State/Country",
  "summary": "Professional summary or objective",
  "experience": [
    {
      "company": "Company name",
      "role": "Job title",
      "startDate": "YYYY-MM or YYYY",
      "endDate": "YYYY-MM, YYYY, or 'Present'",
      "description": "Job description"
    }
  ],
  "education": [
    {
      "school": "University/College name",
      "degree": "Degree type (e.g., Bachelor's, Master's)",
      "field": "Field of study",
      "startYear": YYYY,
      "endYear": YYYY
    }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "languages": ["language1", "language2"],
  "certifications": ["cert1", "cert2"],
  "projects": ["project1", "project2"]
}

Calculate total years of experience from all work experience entries. If dates are missing, estimate based on context.

Resume text:
${extractedText.substring(0, 12000)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using cheaper model, can upgrade to gpt-4 for better accuracy
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume parser. Extract structured data from resumes accurately. Always return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const parsedData = JSON.parse(response.choices[0].message.content);
    
    // Calculate total experience years from experience entries
    let totalExperience = 0;
    if (parsedData.experience && Array.isArray(parsedData.experience)) {
      const now = new Date();
      const dateRanges = [];
      
      for (const exp of parsedData.experience) {
        if (!exp.startDate) continue;
        
        const startDate = parseDate(exp.startDate);
        const endDate = exp.endDate === 'Present' || exp.endDate === 'Current' || !exp.endDate 
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
          totalMonths += months;
        }
        
        totalExperience = Math.round((totalMonths / 12) * 10) / 10;
      }
    }
    
    // If experience not calculated, try to extract from text
    if (totalExperience === 0) {
      const expMatch = extractedText.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i);
      if (expMatch) {
        totalExperience = parseFloat(expMatch[1]);
      }
    }
    
    parsedData.experienceYears = totalExperience;
    
    return parsedData;
  } catch (error) {
    console.error('AI parsing error:', error.message);
    return null;
  }
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const cleaned = dateStr.trim();
  
  // Handle "Present", "Current"
  if (cleaned.match(/present|current|now/i)) {
    return new Date();
  }
  
  // Handle YYYY-MM format
  const yearMonthMatch = cleaned.match(/^(\d{4})-(\d{1,2})$/);
  if (yearMonthMatch) {
    return new Date(parseInt(yearMonthMatch[1]), parseInt(yearMonthMatch[2]) - 1, 1);
  }
  
  // Handle YYYY format
  const yearMatch = cleaned.match(/^(\d{4})$/);
  if (yearMatch) {
    return new Date(parseInt(yearMatch[1]), 0, 1);
  }
  
  // Try standard parsing
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  return null;
}

module.exports = {
  parseResumeWithAI
};

