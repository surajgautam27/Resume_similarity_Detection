import React, { useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';

const ResumeUploader = ({ setResults, setLoading }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 10,
    onDrop: acceptedFiles => {
      setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
      setError('');
    }
  });

  // Rest of your component code...
  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!jobDescription || files.length === 0) {
      setError('Please provide both a job description and at least one resume');
      return;
    }

    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('jobDescription', jobDescription);
    files.forEach(file => {
      formData.append('resumes', file);
    });

    try {
      const response = await axios.post('http://localhost:5000/api/match-resumes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResults(response.data);
    } catch (err) {
      console.error(err);
      setError('Error processing your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="uploader-container">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="jobDescription">Job Description:</label>
          <textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows="6"
            placeholder="Paste the job description here..."
            required
          />
        </div>

        <div className="dropzone-container">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <p>Drag & drop resumes (PDF) here, or click to select files</p>
          </div>
          {files.length > 0 && (
            <div className="file-list">
              <h4>Selected files:</h4>
              <ul>
                {files.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="submit-button">
          Analyze Resumes
        </button>
      </form>
    </div>
  );
};

export default ResumeUploader;