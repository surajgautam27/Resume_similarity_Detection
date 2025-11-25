/**
 * Work Experience Parser
 * Extracts structured work experience information from resume text
 */

const MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'];
const MONTH_ABBR = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const DATE_RANGE_PATTERNS = [
  // "Jan 2020 - Feb 2023" or "January 2020 - February 2023"
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*(\d{4})\s*[-–—to]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*(\d{4})|Present|Current)/gi,
  // "2020-2023" or "2020 - 2023"
  /(\d{4})\s*[-–—to]\s*(\d{4}|Present|Current|Now)/gi,
  // "01/2020 - 02/2023" or "1/2020 - 2/2023"
  /(\d{1,2})\/(\d{4})\s*[-–—to]\s*(\d{1,2})\/(\d{4}|Present|Current)/gi,
  // "Since Jan 2020" or "Since 2020"
  /since\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*)?(\d{4})/gi,
  // "From 2020 to 2023"
  /from\s+(\d{4})\s+to\s+(\d{4}|Present|Current)/gi,
  // "2020 | Present"
  /(\d{4})\s*\|\s*(Present|Current|\d{4})/gi
];

const YEAR_PATTERN = /\b(19|20)\d{2}\b/g;

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const cleaned = String(dateStr).trim().toLowerCase();
  
  // Handle present/current
  if (cleaned.match(/present|current|now|ongoing/i)) {
    return new Date();
  }
  
  // Month Year format: "January 2020", "Jan 2020"
  const monthYearMatch = cleaned.match(/(\w+)\s+(\d{4})/);
  if (monthYearMatch) {
    const monthStr = monthYearMatch[1].toLowerCase();
    const year = parseInt(monthYearMatch[2]);
    
    const monthIndex = MONTH_NAMES.indexOf(monthStr) !== -1 
      ? MONTH_NAMES.indexOf(monthStr)
      : MONTH_ABBR.indexOf(monthStr);
    
    if (monthIndex !== -1 && year >= 1900 && year <= new Date().getFullYear() + 1) {
      return new Date(year, monthIndex, 1);
    }
  }
  
  // MM/YYYY format: "01/2020"
  const slashMatch = cleaned.match(/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1]) - 1;
    const year = parseInt(slashMatch[2]);
    if (month >= 0 && month < 12 && year >= 1900 && year <= new Date().getFullYear() + 1) {
      return new Date(year, month, 1);
    }
  }
  
  // Year only: "2020"
  const yearMatch = cleaned.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year >= 1900 && year <= new Date().getFullYear() + 1) {
      return new Date(year, 0, 1);
    }
  }
  
  return null;
}

function extractDateRange(text) {
  if (!text) return { startDate: null, endDate: null };
  
  let startDate = null;
  let endDate = null;
  
  // Try different date range patterns
  for (const pattern of DATE_RANGE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const fullMatch = match[0];
      
      // Extract start date
      if (pattern === DATE_RANGE_PATTERNS[0]) {
        // Month Year format
        const startMatch = fullMatch.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*(\d{4})/i);
        if (startMatch) {
          startDate = parseDate(startMatch[0]);
        }
        
        const endPart = fullMatch.split(/[-–—to]/i)[1]?.trim();
        if (endPart && !endPart.match(/present|current/i)) {
          endDate = parseDate(endPart);
        } else if (endPart && endPart.match(/present|current/i)) {
          endDate = new Date();
        }
      } else if (pattern === DATE_RANGE_PATTERNS[1]) {
        // Year format: "2020-2023"
        const parts = fullMatch.split(/[-–—to]/i);
        if (parts[0]) startDate = parseDate(parts[0].trim());
        if (parts[1] && !parts[1].match(/present|current/i)) {
          endDate = parseDate(parts[1].trim());
        } else if (parts[1] && parts[1].match(/present|current/i)) {
          endDate = new Date();
        }
      } else if (pattern === DATE_RANGE_PATTERNS[2]) {
        // MM/YYYY format
        const parts = fullMatch.split(/[-–—to]/i);
        if (parts[0]) startDate = parseDate(parts[0].trim());
        if (parts[1] && !parts[1].match(/present|current/i)) {
          endDate = parseDate(parts[1].trim());
        } else if (parts[1] && parts[1].match(/present|current/i)) {
          endDate = new Date();
        }
      } else if (pattern === DATE_RANGE_PATTERNS[3]) {
        // "Since" format
        const yearMatch = fullMatch.match(/(\d{4})/);
        if (yearMatch) {
          startDate = parseDate(yearMatch[1]);
          endDate = new Date();
        }
      } else if (pattern === DATE_RANGE_PATTERNS[4] || pattern === DATE_RANGE_PATTERNS[5]) {
        // "From...to" or "|" format
        const parts = fullMatch.split(/[-–—to|]/i);
        if (parts[0]) startDate = parseDate(parts[0].replace(/from|since/gi, '').trim());
        if (parts[1] && !parts[1].match(/present|current/i)) {
          endDate = parseDate(parts[1].trim());
        } else if (parts[1] && parts[1].match(/present|current/i)) {
          endDate = new Date();
        }
      }
      
      if (startDate || endDate) break;
    }
  }
  
  // If no range found, try to find single years
  if (!startDate && !endDate) {
    const years = [...text.matchAll(YEAR_PATTERN)].map(m => parseInt(m[0]));
    if (years.length > 0) {
      startDate = parseDate(String(years[0]));
      if (years.length > 1) {
        endDate = parseDate(String(years[years.length - 1]));
      }
    }
  }
  
  return { startDate, endDate };
}

function extractWorkExperienceEntry(text, context = []) {
  if (!text || text.trim().length < 5) return null;
  
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return null;
  
  const combinedText = lines.join(' ');
  const lower = combinedText.toLowerCase();
  
  // Skip if it's clearly not work experience
  if (/email|phone|github|linkedin|contact|address|@/i.test(lower) && lower.length < 50) {
    return null;
  }
  
  // Extract date range
  const { startDate, endDate } = extractDateRange(combinedText);
  
  // Extract job title/role (usually before company or date)
  let role = '';
  const rolePatterns = [
    /^([A-Z][A-Za-z\s&,\-()]+?)\s+(?:at|@|,)\s+[A-Z]/,
    /^([A-Z][A-Za-z\s&,\-()]+?)\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})/i,
    /^([A-Z][A-Za-z\s&,\-()]{3,30})\s+/,
  ];
  
  for (const pattern of rolePatterns) {
    const match = combinedText.match(pattern);
    if (match && match[1]) {
      role = match[1].trim();
      // Clean up role
      role = role.replace(/^[•\-\*]\s*/, '').trim();
      if (role.length > 3 && role.length < 100) {
        break;
      }
    }
  }
  
  // Extract company name (usually after "at" or "@", or after role)
  let company = '';
  const companyPatterns = [
    /(?:at|@)\s+([A-Z][A-Za-z\s&.,\-()]+?)(?:\s*[,\-]|\s*$|\(|\d{4})/i,
    /(?:at|@)\s+([A-Z][A-Za-z\s&.,\-()]+)/i,
    /^[A-Z][A-Za-z\s&,\-()]+?\s+(?:at|@)\s+([A-Z][A-Za-z\s&.,\-()]+)/i,
  ];
  
  for (const pattern of companyPatterns) {
    const match = combinedText.match(pattern);
    if (match && match[1]) {
      company = match[1].trim();
      // Remove trailing punctuation
      company = company.replace(/[,.\-]+\s*$/, '').trim();
      // Remove date ranges from company name
      company = company.replace(/\s*\d{4}\s*[-–—]\s*\d{4}.*$/, '').trim();
      if (company.length > 2 && company.length < 100) {
        break;
      }
    }
  }
  
  // If no company found but we have a second line, it might be the company
  if (!company && lines.length > 1) {
    const secondLine = lines[1];
    // Check if second line doesn't look like a date or description
    if (!DATE_RANGE_PATTERNS.some(p => p.test(secondLine)) && 
        !YEAR_PATTERN.test(secondLine) &&
        secondLine.length > 3 && secondLine.length < 100) {
      company = secondLine.trim();
    }
  }
  
  // Extract description (everything after role, company, and dates)
  let description = '';
  const descriptionStart = Math.max(
    role ? combinedText.indexOf(role) + role.length : 0,
    company ? combinedText.indexOf(company) + company.length : 0,
    startDate ? combinedText.indexOf(String(startDate.getFullYear())) + 4 : 0
  );
  
  if (descriptionStart > 0 && descriptionStart < combinedText.length) {
    description = combinedText.substring(descriptionStart).trim();
    // Remove date ranges from description
    description = description.replace(/\d{4}\s*[-–—]\s*(\d{4}|Present|Current)/gi, '').trim();
    // Clean up
    description = description.replace(/^[,\-•]\s*/, '').trim();
    if (description.length < 10) description = '';
  }
  
  // Calculate duration if we have dates
  let duration = '';
  if (startDate && endDate) {
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                   (endDate.getMonth() - startDate.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years > 0 && remainingMonths > 0) {
      duration = `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    } else if (years > 0) {
      duration = `${years} year${years > 1 ? 's' : ''}`;
    } else if (remainingMonths > 0) {
      duration = `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    }
  }
  
  // Validate entry - must have at least role or company
  if (!role && !company) {
    return null;
  }
  
  // Convert dates to ISO strings for storage (MongoDB doesn't handle Date objects in Mixed types well)
  const startDateISO = startDate ? startDate.toISOString() : null;
  const endDateISO = endDate ? endDate.toISOString() : null;
  
  return {
    role: role || '',
    company: company || '',
    startDate: startDateISO,
    endDate: endDateISO,
    startYear: startDate ? startDate.getFullYear() : null,
    endYear: endDate ? endDate.getFullYear() : null,
    duration: duration,
    description: description || '',
    isCurrent: endDate && endDate >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  };
}

function parseWorkExperienceSection(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const workExperience = [];
  let inExperienceSection = false;
  let currentEntry = null;
  let entryLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    // Detect work experience section header
    if (/^(work\s+experience|experience|employment|professional\s+experience|career|work\s+history)/i.test(lower) && line.length < 40) {
      inExperienceSection = true;
      currentEntry = null;
      entryLines = [];
      continue;
    }
    
    // Detect end of experience section
    if (inExperienceSection) {
      const nextSectionHeaders = ['education', 'skills', 'projects', 'certifications', 'languages', 'contact', 'references', 'training', 'summary'];
      if (nextSectionHeaders.some(header => lower.startsWith(header) && line.length < 40)) {
        // Save current entry if exists
        if (entryLines.length > 0) {
          const combinedText = entryLines.join(' ');
          const entry = extractWorkExperienceEntry(combinedText);
          if (entry) workExperience.push(entry);
        }
        inExperienceSection = false;
        currentEntry = null;
        entryLines = [];
        continue;
      }
    }
    
    // Check if this line starts a new work experience entry
    const hasDatePattern = DATE_RANGE_PATTERNS.some(p => p.test(line)) || YEAR_PATTERN.test(line);
    const hasRolePattern = /^(Senior|Junior|Lead|Manager|Developer|Engineer|Analyst|Designer|Consultant|Director|VP|President|CEO|CTO|CFO)/i.test(line);
    const looksLikeNewEntry = hasDatePattern || hasRolePattern;
    
    if (inExperienceSection) {
      if (looksLikeNewEntry && entryLines.length > 0) {
        // Save previous entry
        const combinedText = entryLines.join(' ');
        const entry = extractWorkExperienceEntry(combinedText);
        if (entry && (entry.role || entry.company)) {
          workExperience.push(entry);
        }
        // Start new entry
        entryLines = [line];
      } else if (looksLikeNewEntry) {
        // New entry starting
        entryLines = [line];
      } else if (entryLines.length > 0) {
        // Continue building current entry
        entryLines.push(line);
        
        // Try to extract when we have enough components (role/company + dates)
        if (entryLines.length >= 2) {
          const combinedText = entryLines.join(' ');
          const entry = extractWorkExperienceEntry(combinedText);
          
          // Check if we have a complete entry
          const hasCompleteEntry = entry && (
            (entry.role && entry.company) ||
            ((entry.role || entry.company) && (entry.startDate || entry.endDate)) ||
            entryLines.length >= 3
          );
          
          if (hasCompleteEntry) {
            workExperience.push(entry);
            entryLines = []; // Reset for next entry
          } else if (entryLines.length >= 5) {
            // If we have 5+ lines, force extraction even if incomplete
            if (entry && (entry.role || entry.company)) {
              workExperience.push(entry);
              entryLines = [];
            }
          }
        }
      }
    } else {
      // Not in experience section, but check if line has work experience indicators
      if (hasDatePattern && (hasRolePattern || /at\s+[A-Z]|@\s+[A-Z]/i.test(line))) {
        const entry = extractWorkExperienceEntry(line);
        if (entry) {
          workExperience.push(entry);
        }
      }
    }
  }
  
  // Save last entry if exists
  if (inExperienceSection && entryLines.length > 0) {
    const combinedText = entryLines.join(' ');
    const entry = extractWorkExperienceEntry(combinedText);
    if (entry) workExperience.push(entry);
  }
  
  // If we didn't find experience section, search entire text
  if (workExperience.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const hasDate = DATE_RANGE_PATTERNS.some(p => p.test(line)) || YEAR_PATTERN.test(line);
      const hasRole = /^(Senior|Junior|Lead|Manager|Developer|Engineer|Analyst|Designer|Consultant|Director|VP|President|CEO|CTO|CFO|Software|Data|Product|Marketing|Sales)/i.test(line);
      
      if (hasDate && hasRole) {
        // Try to combine with next 2-4 lines
        const combinedLines = [line];
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j];
          const nextLower = nextLine.toLowerCase();
          
          // Stop if we hit another date/role pattern or section header
          if (DATE_RANGE_PATTERNS.some(p => p.test(nextLine)) ||
              /^(education|skills|projects|certifications|training|references)/i.test(nextLower) ||
              /^(Senior|Junior|Lead|Manager|Developer|Engineer)/i.test(nextLine)) {
            break;
          }
          
          // Stop if line looks like contact info
          if (nextLine.length > 100 || /http|github|linkedin|portfolio|email|phone/i.test(nextLine)) {
            break;
          }
          
          combinedLines.push(nextLine);
        }
        
        const combinedText = combinedLines.join(' ');
        const entry = extractWorkExperienceEntry(combinedText);
        if (entry && (entry.role || entry.company)) {
          workExperience.push(entry);
          i += combinedLines.length - 1; // Skip processed lines
          if (workExperience.length >= 10) break;
        }
      }
    }
  }
  
  // Deduplicate
  const unique = [];
  const seen = new Set();
  
  for (const entry of workExperience) {
    const key = `${entry.role?.toLowerCase().substring(0, 20) || ''}|${entry.company?.toLowerCase().substring(0, 30) || ''}|${entry.startYear || ''}`.trim();
    
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(entry);
    }
  }
  
  // Sort by start date (most recent first)
  unique.sort((a, b) => {
    const dateA = a.startDate || new Date(1900, 0, 1);
    const dateB = b.startDate || new Date(1900, 0, 1);
    return dateB - dateA;
  });
  
  return unique.slice(0, 10); // Limit to 10 most recent
}

module.exports = {
  parseWorkExperienceSection,
  extractWorkExperienceEntry,
  extractDateRange,
  parseDate
};

