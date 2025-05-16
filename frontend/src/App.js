import React, { useState } from 'react';
import ResumeUploader from './components/ResumeUploader';
import ResultsDisplay from './components/ResultsDisplay';
import JobHistory from './components/JobHistory';
import './App.css';

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Resume Similarity Analyzer</h1>
      </header>
      <main>
        <div className="app-container">
          <div className="upload-section">
            <ResumeUploader 
              setResults={setResults} 
              setLoading={setLoading} 
              setSelectedJob={setSelectedJob}
            />
            <ResultsDisplay 
              results={results} 
              loading={loading} 
              selectedJob={selectedJob}
            />
          </div>
          <div className="history-section">
            <JobHistory setSelectedJob={setSelectedJob} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;