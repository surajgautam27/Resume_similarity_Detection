const axios = require('axios');

// Test script to identify frontend errors
async function testFrontendErrors() {
  console.log('=== Frontend Error Debug ===');
  console.log('\nTo identify the terminal error:');
  console.log('\n1. Check the browser console (F12 → Console tab)');
  console.log('2. Look for any JavaScript errors');
  console.log('3. Check the Network tab for failed API calls');
  console.log('4. Look at the terminal where the server is running');
  console.log('\nCommon frontend errors:');
  console.log('- Syntax errors in React components');
  console.log('- Undefined variables');
  console.log('- Missing imports');
  console.log('- API call failures');
  console.log('\nTo test the Company Dashboard:');
  console.log('1. Open http://localhost:3000');
  console.log('2. Login as a company user');
  console.log('3. Navigate to "Job Applications"');
  console.log('4. Check for any error messages');
  console.log('\nIf you see specific error messages, please share them.');
  console.log('\nAlso check:');
  console.log('- Is the React development server running? (npm start in src/)');
  console.log('- Is the backend server running? (npm start in backend/)');
  console.log('- Are there any compilation errors?');
}

testFrontendErrors(); 