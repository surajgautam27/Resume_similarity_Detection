const axios = require('axios');

async function testDirectory() {
  try {
    console.log('Testing directory endpoint...');
    
    // Test the directory endpoint
    const response = await axios.get('http://localhost:5000/api/auth/directory');
    console.log('Directory Response:', JSON.stringify(response.data, null, 2));
    
    // Test the debug endpoint
    const debugResponse = await axios.get('http://localhost:5000/api/auth/debug/users');
    console.log('Debug Response:', JSON.stringify(debugResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error testing directory:', error.response?.data || error.message);
  }
}

testDirectory();
