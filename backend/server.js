const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const { PythonShell } = require('python-shell');
const mongoose = require('mongoose');

const app = express();
const port = 5000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/Resume_similarity', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Define MongoDB schemas
const jobSchema = new mongoose.Schema({
  description: String,
  createdAt: { type: Date, default: Date.now },
  results: [{
    resumeName: String,
    score: Number,
    filePath: String
  }]
});

const Job = mongoose.model('Job', jobSchema);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// API endpoint to process job matching
app.post('/api/match-resumes', upload.array('resumes'), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const resumeFiles = req.files;

    if (!jobDescription || !resumeFiles || resumeFiles.length === 0) {
      return res.status(400).json({ error: 'Job description and at least one resume are required' });
    }

    // Prepare options for Python script
    let options = {
      mode: 'text',
      pythonOptions: ['-u'],
      scriptPath: '../python-scripts',
      args: [jobDescription, 'uploads']
    };

    // Run Python script
    PythonShell.run('similarity.py', options, async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error processing files' });
      }
      
      try {
        const parsedResults = JSON.parse(results[0]);
        
        // Save job and results to MongoDB
        const newJob = new Job({
          description: jobDescription,
          results: parsedResults.map(result => ({
            resumeName: result.resume,
            score: result.score,
            filePath: `uploads/${result.resume}`
          }))
        });

        await newJob.save();

        res.json({
          jobId: newJob._id,
          results: parsedResults
        });
      } catch (parseError) {
        console.error(parseError);
        res.status(500).json({ error: 'Error parsing results' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// API endpoint to get previous jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching jobs' });
  }
});

// API endpoint to get a specific job's results
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching job' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});