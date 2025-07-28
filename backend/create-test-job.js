const mongoose = require('mongoose');
const Job = require('./models/Job');
const User = require('./models/User');

async function createTestJob() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/resume-matcher', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find a company user
    const companyUser = await User.findOne({ role: 'company' });
    if (!companyUser) {
      console.log('No company user found. Please create a company account first.');
      return;
    }

    console.log('Found company user:', companyUser.email);

    // Create a test job
    const testJob = new Job({
      title: 'Software Developer',
      description: 'We are looking for a skilled software developer with experience in React, Node.js, and MongoDB. The ideal candidate should have strong problem-solving skills and experience with modern web technologies.',
      skills: ['react', 'node.js', 'mongodb', 'javascript', 'express'],
      experience: 'mid',
      location: 'Remote',
      type: 'full-time',
      status: 'active',
      createdBy: companyUser._id
    });

    await testJob.save();
    console.log('Test job created successfully:', testJob._id);

    // Create another test job
    const testJob2 = new Job({
      title: 'Frontend Developer',
      description: 'Join our team as a Frontend Developer. We need someone with strong skills in React, TypeScript, and modern CSS frameworks. Experience with responsive design and performance optimization is a plus.',
      skills: ['react', 'typescript', 'css', 'html', 'javascript'],
      experience: 'junior',
      location: 'New York',
      type: 'full-time',
      status: 'active',
      createdBy: companyUser._id
    });

    await testJob2.save();
    console.log('Second test job created successfully:', testJob2._id);

    console.log('✅ Test jobs created successfully!');
    console.log('Now developers can apply to these jobs.');

  } catch (error) {
    console.error('Error creating test job:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestJob(); 