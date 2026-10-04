# Resume Parsing System

This project uses a multi-mode resume parsing system for maximum accuracy and flexibility.

## Parsing Modes

### 1. Ollama AI-Powered Parsing (Recommended - Free & Open Source)
The system uses Ollama with Llama 3 model to extract structured data from resumes. This is completely free and runs locally on your machine.

**Advantages:**
- ✅ **100% Free** - No API costs, runs locally
- ✅ Highly accurate extraction of experience, skills, education
- ✅ Understands context and various resume formats
- ✅ Automatically calculates total years of experience from date ranges
- ✅ Extracts structured data (companies, roles, dates) from experience section
- ✅ Better handling of non-standard resume formats
- ✅ Privacy-focused - all processing happens locally
- ✅ No internet required after initial setup

**Setup:**
1. Install Ollama from [ollama.ai](https://ollama.ai)
   ```bash
   # Linux/Mac
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Or download from https://ollama.ai/download
   ```

2. Pull the Llama 3 model:
   ```bash
   ollama pull llama3
   ```

3. Start Ollama service (if not running automatically):
   ```bash
   ollama serve
   ```

4. Configure in `.env` (optional):
   ```env
   OLLAMA_BASE_URL=http://localhost:11434  # Default
   OLLAMA_MODEL=llama3  # Default, can use llama3.1, mistral, phi3, etc.
   ```

5. The system will automatically use Ollama parsing for all resume uploads

**Cost:** $0.00 - Completely free!

**Alternative Models:**
- `llama3` (default) - Best balance of speed and accuracy
- `llama3.1` - Latest version with improved accuracy
- `mistral` - Fast and efficient
- `phi3` - Smaller, faster model

### 2. Fallback Parsers (No Ollama Required)
If Ollama is not available, the system automatically falls back to rule-based parsers:

**Structured Parser:**
- NLP techniques using `natural` and `compromise` libraries
- Date range extraction and experience calculation
- Skills dictionary with 200+ technical skills
- Section-based parsing (Experience, Education, Skills, etc.)

**Pyresparser:**
- Python-based resume parser (if available)
- Good accuracy for standard formats

**Enhanced Parser:**
- Advanced pattern matching
- Multiple date format support
- Enhanced contact extraction

**Advantages:**
- ✅ Free to use
- ✅ No external dependencies
- ✅ Works offline
- ✅ Good accuracy for standard resume formats

## What Gets Extracted

All parsers extract the following information:

- **Personal Information**: Name, Email, Phone, Location
- **Experience**: 
  - Company names, Job titles, Date ranges
  - Total years of experience (calculated from dates)
  - Job descriptions with technologies used
- **Education**: 
  - School/University names
  - Degrees, Fields of study
  - Graduation years, GPA, Honors
- **Skills**: Technical and soft skills (200+ recognized skills)
- **Languages**: Spoken languages with proficiency
- **Certifications**: Professional certifications with issuer and dates
- **Projects**: Project descriptions with technologies
- **Summary**: Professional summary or objective
- **Achievements**: Awards, publications, honors

## Profile Auto-Update

After a resume is parsed, the user's profile is automatically updated with:
- Skills (merged with existing)
- Education entries
- Bio/Summary
- Experience information
- Name (if not already set)
- Social links (LinkedIn, GitHub, Portfolio)

## Improving Parsing Accuracy

### For Ollama Mode:
- Ensure Ollama is running: `ollama serve`
- Use Llama 3.1 for better accuracy: `ollama pull llama3.1` and set `OLLAMA_MODEL=llama3.1`
- The model handles most resume formats automatically
- For better results, ensure your resume has clear sections

### For Fallback Mode:
- Use standard resume formats
- Include clear section headers (Experience, Education, Skills)
- Use date ranges in format: "MMM YYYY - Present" or "YYYY - YYYY"
- List skills in a dedicated Skills section

## Troubleshooting

**Issue: Ollama connection refused**
- Make sure Ollama is running: `ollama serve`
- Check if Ollama is accessible: `curl http://localhost:11434/api/tags`
- Verify the model is installed: `ollama list`

**Issue: Experience not detected**
- Ensure date ranges are in the Experience section
- Use formats like "Jan 2020 - Present" or "2020-2023"
- Ollama mode handles more variations automatically

**Issue: Skills not extracted**
- List skills in a dedicated "Skills" or "Technical Skills" section
- Use common skill names (e.g., "JavaScript" not "JS")
- Ollama mode recognizes more skill variations

**Issue: Education not parsed**
- Include degree type (Bachelor's, Master's, etc.)
- List university/college name clearly
- Include graduation year if available

**Issue: Slow parsing**
- Ollama runs locally, so first-time parsing may be slower
- Consider using a smaller model like `phi3` for faster parsing
- Ensure you have sufficient RAM (8GB+ recommended for Llama 3)

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
      "location": "New York, NY",
      "linkedin": "https://linkedin.com/in/johndoe",
      "github": "https://github.com/johndoe"
    },
    "skills": ["JavaScript", "React", "Node.js"],
    "experience": 5.5,
    "education": [
      {
        "school": "University of Technology",
        "degree": "Bachelor's",
        "field": "Computer Science",
        "endYear": 2018
      }
    ],
    "summary": "Experienced software developer...",
    "languages": ["English", "Spanish"],
    "certifications": ["AWS Certified Solutions Architect"],
    "projects": [
      {
        "name": "E-commerce Platform",
        "description": "Built a full-stack e-commerce solution...",
        "technologies": ["React", "Node.js", "MongoDB"]
      }
    ],
    "metadata": {
      "pageCount": 2,
      "wordCount": 500,
      "parsingMethod": "Ollama (Llama 3)"
    }
  }
}
```

## Performance Notes

- **Ollama**: First parse may take 10-30 seconds depending on resume length and hardware
- **Fallback parsers**: Typically 1-5 seconds
- Ollama requires ~4GB RAM for Llama 3, ~2GB for smaller models
- All parsing happens server-side for security
