const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * Parse resume using Python pyresparser
 * @param {string} filePath - Path to the resume file
 * @returns {Promise<Object>} - Parsed resume data
 */
async function parseResumeWithPyresparser(filePath) {
  return new Promise((resolve, reject) => {
    // Check if file exists
    fs.access(filePath)
      .then(() => {
        const pythonScriptPath = path.join(__dirname, 'pyresumeParser.py');
        const absoluteFilePath = path.resolve(filePath);
        
        console.log(`Parsing resume with pyresparser: ${absoluteFilePath}`);
        
        // Spawn Python process
        const pythonProcess = spawn('python3', [pythonScriptPath, absoluteFilePath], {
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: __dirname
        });
        
        let stdout = '';
        let stderr = '';
        
        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.error(`Python parser exited with code ${code}`);
            console.error('STDERR:', stderr);
            reject(new Error(`Python parser failed with exit code ${code}: ${stderr}`));
            return;
          }
          
          try {
            const result = JSON.parse(stdout);
            if (result.success) {
              console.log('Pyresparser parsing successful:', {
                name: result.data?.candidate?.name || 'N/A',
                email: result.data?.candidate?.email || 'N/A',
                skillsCount: result.data?.skills?.length || 0,
                experience: result.data?.experience || 0,
                educationCount: result.data?.education?.length || 0
              });
              resolve(result.data);
            } else {
              console.error('Pyresparser parsing failed:', result.error);
              reject(new Error(result.error || 'Unknown parsing error'));
            }
          } catch (parseError) {
            console.error('Failed to parse Python output:', parseError);
            console.error('Raw output:', stdout);
            console.error('Raw stderr:', stderr);
            reject(new Error(`Failed to parse Python output: ${parseError.message}`));
          }
        });
        
        pythonProcess.on('error', (error) => {
          console.error('Failed to start Python process:', error);
          reject(new Error(`Failed to start Python process: ${error.message}`));
        });
        
        // Set timeout for long-running processes
        const timeout = setTimeout(() => {
          pythonProcess.kill('SIGTERM');
          reject(new Error('Python parser timeout after 30 seconds'));
        }, 30000);
        
        pythonProcess.on('close', () => {
          clearTimeout(timeout);
        });
      })
      .catch((error) => {
        reject(new Error(`File not accessible: ${error.message}`));
      });
  });
}

/**
 * Check if pyresparser is available
 * @returns {Promise<boolean>} - True if pyresparser is available
 */
async function isPyresparserAvailable() {
  return new Promise((resolve) => {
    const pythonProcess = spawn('python3', ['-c', 'import pyresparser; print("OK")'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      resolve(code === 0 && stdout.trim() === 'OK');
    });
    
    pythonProcess.on('error', () => {
      resolve(false);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      pythonProcess.kill('SIGTERM');
      resolve(false);
    }, 5000);
  });
}

module.exports = {
  parseResumeWithPyresparser,
  isPyresparserAvailable
};

