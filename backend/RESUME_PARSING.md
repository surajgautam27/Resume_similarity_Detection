# Resume Parsing System

This project uses a dual-mode resume parsing system for maximum accuracy and flexibility.

## Parsing Modes

### 1. AI-Powered Parsing (Recommended)
When `OPENAI_API_KEY` is set in your `.env` file, the system uses OpenAI's GPT-4o-mini model to extract structured data from resumes.

**Advantages:**
- ✅ Highly accurate extraction of experience, skills, education
- ✅ Understands context and various resume formats
- ✅ Automatically calculates total years of experience from date ranges
- ✅ Extracts structured data (companies, roles, dates) from experience section
- ✅ Better handling of non-standard resume formats

**Setup:**
1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to your `.env` file: `OPENAI_API_KEY=sk-...`
3. The system will automatically use AI parsing for all resume uploads

**Cost:** ~$0.01-0.02 per resume (using GPT-4o-mini)

### 2. Fallback Parser (No API Key Required)
If no OpenAI API key is provided, the system uses an advanced rule-based parser with:
- NLP techniques using `natural` and `compromise` libraries
- Date range extraction and experience calculation
- Skills dictionary with 200+ technical skills
- Section-based parsing (Experience, Education, Skills, etc.)

**Advantages:**
- ✅ Free to use
- ✅ No external API dependencies
- ✅ Works offline
- ✅ Good accuracy for standard resume formats

## What Gets Extracted

Both parsers extract the following information:

- **Personal Information**: Name, Email, Phone, Location
- **Experience**: 
  - Company names, Job titles, Date ranges
  - Total years of experience (calculated from dates)
  - Job descriptions
- **Education**: 
  - School/University names
  - Degrees, Fields of study
  - Graduation years
- **Skills**: Technical and soft skills (200+ recognized skills)
- **Languages**: Spoken languages
- **Certifications**: Professional certifications
- **Projects**: Project descriptions
- **Summary**: Professional summary or objective

## Profile Auto-Update

After a resume is parsed, the user's profile is automatically updated with:
- Skills (merged with existing)
- Education entries
- Bio/Summary
- Experience information
- Name (if not already set)

## Improving Parsing Accuracy

### For AI Mode:
- Ensure your OpenAI API key has sufficient credits
- The model handles most resume formats automatically

### For Fallback Mode:
- Use standard resume formats
- Include clear section headers (Experience, Education, Skills)
- Use date ranges in format: "MMM YYYY - Present" or "YYYY - YYYY"
- List skills in a dedicated Skills section

## Troubleshooting

**Issue: Experience not detected**
- Ensure date ranges are in the Experience section
- Use formats like "Jan 2020 - Present" or "2020-2023"
- AI mode handles more variations automatically

**Issue: Skills not extracted**
- List skills in a dedicated "Skills" or "Technical Skills" section
- Use common skill names (e.g., "JavaScript" not "JS")
- AI mode recognizes more skill variations

**Issue: Education not parsed**
- Include degree type (Bachelor's, Master's, etc.)
- List university/college name clearly
- Include graduation year if available

## API Response Format

```json
{
  "message": "Resume uploaded and processed successfully",
  "resume": {
    "id": "...",
    "candidate": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "location": "New York, NY"
    },
    "skills": ["JavaScript", "React", "Node.js"],
    "experience": 5.5,
    "education": ["Bachelor's in Computer Science"],
    "summary": "Experienced software developer...",
    "languages": ["English", "Spanish"],
    "certifications": ["AWS Certified"],
    "projects": ["E-commerce Platform"],
    "metadata": {
      "pageCount": 2,
      "wordCount": 500
    }
  }
}
```

