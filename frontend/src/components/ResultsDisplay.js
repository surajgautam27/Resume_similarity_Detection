import React, { useEffect,useState } from 'react';

const ResultsDisplay = ({ results, loading, selectedJob }) => {
  const [displayResults, setDisplayResults] = useState([]);

  useEffect(() => {
    if (selectedJob) {
      setDisplayResults(selectedJob.results);
    } else {
      setDisplayResults(results);
    }
  }, [results, selectedJob]);

  if (loading) {
    return (
      <div className="results-container loading">
        <div className="spinner"></div>
        <p>Analyzing resumes...</p>
      </div>
    );
  }

  if (displayResults.length === 0) {
    return null;
  }

  return (
    <div className="results-container">
      <h2>Results {selectedJob && `(Saved ${new Date(selectedJob.createdAt).toLocaleDateString()})`}</h2>
      <div className="results-table">
        <div className="table-header">
          <span>Resume</span>
          <span>Match Score</span>
        </div>
        {displayResults.map((result, index) => (
          <div className="table-row" key={index}>
            <span>{result.resumeName || result.resume}</span>
            <span>
              <div className="score-bar-container">
                <div 
                  className="score-bar" 
                  style={{ width: `${result.score}%` }}
                ></div>
                <span className="score-text">{result.score}%</span>
              </div>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;