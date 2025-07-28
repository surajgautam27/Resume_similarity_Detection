const axios = require('axios');

// Test script to verify Company Dashboard functionality
async function testCompanyDashboard() {
  console.log('=== Company Dashboard Test ===');
  console.log('\nTo test the new Company Dashboard:');
  console.log('\n1. Open your browser and go to http://localhost:3000');
  console.log('2. Login as a company user');
  console.log('3. You should see a new navigation link "Job Applications"');
  console.log('4. Click on "Job Applications" to go to the Company Dashboard');
  console.log('5. The dashboard should show:');
  console.log('   - All your job postings');
  console.log('   - Application count for each job');
  console.log('   - Expandable job details');
  console.log('   - Resume previews for each application');
  console.log('   - Similarity scores when calculated');
  console.log('\n6. Test the functionality:');
  console.log('   - Click on a job to expand and see applications');
  console.log('   - Click "Sort by Similarity" to calculate scores');
  console.log('   - Verify that developer resumes are visible');
  console.log('\n7. Expected features:');
  console.log('   - Collapsible job sections');
  console.log('   - Resume previews with candidate info');
  console.log('   - Skills and experience display');
  console.log('   - Upload date and uploader info');
  console.log('   - Similarity score calculation');
  console.log('\nIf you encounter any issues, check:');
  console.log('- Browser console for JavaScript errors');
  console.log('- Terminal for server logs');
  console.log('- Network tab for API call failures');
}

testCompanyDashboard(); 