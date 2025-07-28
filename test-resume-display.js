const axios = require('axios');

// Test script to verify resume display functionality
async function testResumeDisplay() {
  try {
    console.log('=== Resume Display Test ===');
    console.log('\nTo test if the resume display issue is fixed:');
    console.log('\n1. Open your browser and go to http://localhost:3000');
    console.log('2. Login as a developer user');
    console.log('3. Upload a resume (PDF file)');
    console.log('4. Apply to a job with that resume');
    console.log('5. Logout and login as a company user');
    console.log('6. Go to the Applications page');
    console.log('7. Click "Sort Applicants by Similarity" for a job you posted');
    console.log('8. Check if the resume appears with all details');
    console.log('\nThe server logs will show detailed debugging information.');
    console.log('Look for these log messages in the terminal:');
    console.log('- "Job applications:" and "Job applications length:"');
    console.log('- "Filtered resumes:" and resume details');
    console.log('- "Final similarities:" with scores');
    console.log('\nIf you see any errors, please share the specific error message.');
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testResumeDisplay(); 