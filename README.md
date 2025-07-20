# Resume Matcher - Full Stack Application

A modern web application for matching resumes to job descriptions using **advanced similarity algorithms** including **cosine similarity**, TF-IDF, and hybrid matching techniques.

## Features

- **User Authentication**: Secure login/register system with JWT tokens
- **Job Management**: Create, edit, and manage job descriptions
- **Resume Upload**: Upload and process PDF resumes with automatic text extraction
- **Advanced Matching**: **Cosine similarity**, TF-IDF, and hybrid algorithms for precise resume-to-job matching
- **Detailed Scoring**: Comprehensive breakdown of similarity scores across multiple dimensions
- **Analytics Dashboard**: Comprehensive analytics and insights with similarity metrics
- **Modern UI**: Beautiful, responsive interface built with Material-UI
- **Real-time Processing**: Instant resume parsing and skill extraction

## Advanced Matching Algorithms

### 1. **Cosine Similarity**
- Calculates the cosine of the angle between two text vectors
- Measures semantic similarity between job descriptions and resumes
- Handles high-dimensional text data efficiently
- Provides scores between 0 and 1 (0% to 100%)

### 2. **TF-IDF Similarity**
- Term Frequency-Inverse Document Frequency based similarity
- Weights important terms more heavily
- Reduces impact of common words
- More sophisticated than simple word matching

### 3. **Jaccard Similarity**
- Set-based similarity for skills matching
- Measures overlap between required and candidate skills
- Handles skill variations and synonyms

### 4. **Hybrid Weighted Scoring**
- Combines multiple similarity measures with configurable weights
- Balances different aspects: skills, experience, education, keywords
- Provides detailed breakdown for each matching dimension

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Material-UI** - Beautiful, accessible UI components
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Axios** - HTTP client
- **React Dropzone** - File upload handling
- **React Toastify** - Notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Multer** - File upload handling
- **PDF-Parse** - PDF text extraction
- **Natural** - NLP processing
- **Custom Similarity Algorithms** - Cosine similarity, TF-IDF, Jaccard

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd resume-matcher-ml
```

### 2. Install dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Set up environment variables

Create a `.env` file in the `backend` directory:
```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/resume-matcher

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On Ubuntu/Debian
sudo systemctl start mongod

# On macOS with Homebrew
brew services start mongodb-community

# On Windows
net start MongoDB
```

### 5. Start the application

#### Development mode (both frontend and backend)
```bash
npm run dev
```

#### Or start them separately:

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage

### 1. Register/Login
- Navigate to http://localhost:3000
- Create a new account or login with existing credentials

### 2. Create Jobs
- Go to the Jobs section
- Click "Create New Job"
- Fill in job details including title, description, requirements, and skills

### 3. Upload Resumes
- Go to the Resumes section
- Click "Upload Resume" or drag and drop PDF files
- The system will automatically extract text and identify skills

### 4. Match Resumes to Jobs
- Go to the Matching section
- Select a job and resumes to match
- View detailed similarity scores including:
  - **Cosine Similarity Score**
  - **TF-IDF Similarity Score**
  - **Skills Similarity (Jaccard)**
  - **Experience Match**
  - **Education Match**
  - **Keyword Overlap**

### 5. View Analytics
- Go to the Analytics section
- View comprehensive statistics including average similarity scores
- Analyze matching performance across different algorithms

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get specific job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs/search` - Search jobs

### Resumes
- `GET /api/resumes` - Get all resumes
- `POST /api/resumes/upload` - Upload single resume
- `POST /api/resumes/upload-multiple` - Upload multiple resumes
- `GET /api/resumes/:id` - Get specific resume
- `DELETE /api/resumes/:id` - Delete resume
- `GET /api/resumes/search` - Search resumes

### Matching
- `POST /api/matching/job/:jobId` - Match resumes to job using cosine similarity
- `GET /api/matching/job/:jobId` - Get matches for job
- `PUT /api/matching/:matchId/status` - Update match status
- `GET /api/matching/analytics` - Get analytics with similarity metrics
- `GET /api/matching/:matchId/analysis` - Get detailed similarity analysis

## Database Schema

### Users
- name, email, password, role, company, isActive, lastLogin

### Jobs
- title, description, requirements, skills, experience, location, type, salary, department, status, createdBy, company, tags, priority

### Resumes
- filename, originalName, filePath, fileSize, mimeType, extractedText, candidate, skills, experience, education, languages, certifications, projects, uploadedBy, status, processed

### Matches
- job, resume, score, breakdown (including cosineSimilarity, tfidfSimilarity), status, notes, reviewedBy, reviewedAt, tags, priority, algorithm, processingTime

## Similarity Algorithms Explained

### Cosine Similarity
```javascript
cosine_similarity = dot_product(A, B) / (magnitude(A) * magnitude(B))
```
- Measures the cosine of the angle between two vectors
- Range: 0 to 1 (0% to 100%)
- Perfect match = 1.0, No similarity = 0.0

### TF-IDF Similarity
- **Term Frequency (TF)**: How often a term appears in a document
- **Inverse Document Frequency (IDF)**: How rare a term is across all documents
- **TF-IDF Score**: TF × IDF
- Provides better weighting for important terms

### Jaccard Similarity
```javascript
jaccard_similarity = |A ∩ B| / |A ∪ B|
```
- Measures overlap between two sets
- Perfect for skills matching
- Range: 0 to 1

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.

## Future Enhancements

- **BERT/SBERT Integration** - Advanced semantic similarity using transformer models
- **Word2Vec Embeddings** - Pre-trained word vectors for better semantic understanding
- **Custom Training** - Domain-specific model training on resume/job data
- **Real-time Matching** - Live similarity updates as resumes are uploaded
- **Multi-language Support** - Similarity algorithms for different languages
- **Advanced Analytics** - Detailed similarity trend analysis
- **API Rate Limiting** - Protect similarity computation resources
- **Caching** - Cache similarity results for performance
- **Batch Processing** - Efficient bulk similarity calculations
