const mongoose = require('mongoose');
const Job = require('./models/Job');

async function checkJobs() {
  try {
    await mongoose.connect('mongodb://localhost:27017/resume-matcher', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const jobs = await Job.find({});
    console.log('Total jobs in database:', jobs.length);
    
    jobs.forEach((job, index) => {
      console.log(`Job ${index + 1}:`);
      console.log(`  Title: ${job.title}`);
      console.log(`  Created by: ${job.createdBy}`);
      console.log(`  Status: ${job.status}`);
      console.log(`  Applications: ${job.applications ? job.applications.length : 0}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error checking jobs:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkJobs(); 