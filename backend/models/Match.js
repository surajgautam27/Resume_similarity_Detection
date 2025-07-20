const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  breakdown: {
    skills: {
      score: Number,
      matched: [String],
      missing: [String]
    },
    experience: {
      score: Number,
      yearsRequired: Number,
      yearsFound: Number
    },
    education: {
      score: Number,
      matched: [String],
      missing: [String]
    },
    keywords: {
      score: Number,
      matched: [String],
      missing: [String]
    },
    // Advanced similarity measures
    cosineSimilarity: {
      type: Number,
      min: 0,
      max: 100
    },
    tfidfSimilarity: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
    default: 'pending'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  tags: {
    type: [String],
    default: []
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Additional metadata for analysis
  algorithm: {
    type: String,
    default: 'cosine-similarity',
    enum: ['cosine-similarity', 'tfidf-similarity', 'hybrid']
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for job and resume
matchSchema.index({ job: 1, resume: 1 }, { unique: true });

// Index for score-based queries
matchSchema.index({ score: -1 });

// Index for status-based queries
matchSchema.index({ status: 1 });

// Index for similarity-based queries
matchSchema.index({ 'breakdown.cosineSimilarity': -1 });
matchSchema.index({ 'breakdown.tfidfSimilarity': -1 });

module.exports = mongoose.model('Match', matchSchema); 