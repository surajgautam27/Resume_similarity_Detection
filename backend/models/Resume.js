const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    required: true
  },
  candidate: {
    name: String,
    email: String,
    phone: String,
    location: String
  },
  skills: {
    type: [String],
    default: []
  },
  experience: {
    type: Number, // years of experience
    default: 0
  },
  education: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  languages: {
    type: [String],
    default: []
  },
  certifications: {
    type: [String],
    default: []
  },
  projects: {
    type: [String],
    default: []
  },
  summary: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  highlights: {
    type: [String],
    default: []
  },
  workExperience: {
    type: [String],
    default: []
  },
  achievements: {
    type: [String],
    default: []
  },
  processed: {
    type: Boolean,
    default: false
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'error'],
    default: 'pending'
  },
  processingError: {
    type: String
  },
  metadata: {
    uploadDate: {
      type: Date,
      default: Date.now
    },
    processingTime: Number,
    wordCount: Number,
    pageCount: Number
  },
  parsedData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

// Index for search functionality
resumeSchema.index({ 
  'candidate.name': 'text', 
  'candidate.email': 'text', 
  skills: 'text',
  'extractedText': 'text'
});

module.exports = mongoose.model('Resume', resumeSchema); 