const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['company', 'developer'],
    default: 'developer' // Default role
  },
  company: {
    type: String,
    trim: true
  },
  // Extended profile fields
  profile: {
    headline: { type: String, trim: true, maxlength: 140 },
    bio: { type: String, trim: true, maxlength: 2000 },
    education: [{
      school: { type: String, trim: true },
      degree: { type: String, trim: true },
      field: { type: String, trim: true },
      startYear: Number,
      endYear: Number
    }],
    experience: [{
      company: { type: String, trim: true },
      role: { type: String, trim: true },
      startDate: Date,
      endDate: Date,
      description: { type: String, trim: true, maxlength: 1000 }
    }],
    skills: { type: [String], default: [] },
    social: {
      website: { type: String, trim: true },
      github: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      twitter: { type: String, trim: true }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without password
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);