# careerNexus - Full Stack Application

A comprehensive full-stack application that connects developers with companies through intelligent resume matching, job posting, and social networking features.

## Features

- **Resume Management**: Upload, parse, and manage resumes with AI-powered text extraction
- **Job Matching**: Intelligent matching between resumes and job postings using multiple algorithms
- **Social Networking**: Like, comment, and interact with posts and job applications
- **User Management**: Separate dashboards for developers and companies
- **Real-time Updates**: Live notifications and updates
- **Responsive Design**: Mobile-friendly interface

## Tech Stack

### Frontend
- React.js
- Material-UI (MUI)
- React Router
- Axios for API calls

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads

### AI/ML Components
- Natural Language Processing (NLP)
- TF-IDF Algorithm
- BERT-based similarity
- SBERT embeddings

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Python 3.7+ (for ML components)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd careerNexus
```

2. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install Python dependencies
cd ..
pip install -r requirements.txt
```

3. **Environment Setup**
```bash
# Copy environment file
cp .env.example .env

# Update environment variables
MONGODB_URI=mongodb://localhost:27017/careerNexus
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

4. **Start the application**
```bash
# Start backend server
cd backend
npm start

# Start frontend (in new terminal)
npm start
```

## Usage

### For Developers
1. Register/Login with developer account
2. Upload your resume
3. Browse available jobs
4. Apply to jobs that match your skills
5. Interact with the community through posts

### For Companies
1. Register/Login with company account
2. Post job openings
3. Review applications
4. Match candidates using AI algorithms
5. Engage with the developer community

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get specific job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Resumes
- `POST /api/resumes/upload` - Upload resume
- `GET /api/resumes/:id` - Get resume
- `GET /api/resumes/match/:jobId` - Match resume with job

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comments` - Add comment to post

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
