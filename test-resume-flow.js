const axios = require('axios');

// Test script to verify the complete resume flow
async function testResumeFlow() {
  try {
    console.log('Testing complete resume flow...');
    
    // Step 1: Test resume upload
    console.log('\n1. Testing resume upload...');
    // This would require a real PDF file and authentication
    
    // Step 2: Test job application
    console.log('\n2. Testing job application...');
    // This would require real job and resume IDs
    
    // Step 3: Test resume matching
    console.log('\n3. Testing resume matching...');
    // This would require real job ID and authentication
    
    console.log('\nTest completed. Check the server logs for detailed information.');
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testResumeFlow(); 