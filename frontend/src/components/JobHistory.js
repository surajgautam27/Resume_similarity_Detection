import React, { useState, useEffect } from 'react';
import axios from 'axios';

const JobHistory = ({ setSelectedJob }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/jobs');
        setJobs(response.data);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) {
    return <div>Loading job history...</div>;
  }

  return (
    <div className="job-history">
      <h3>Previous Job Matches</h3>
      {jobs.length === 0 ? (
        <p>No previous jobs found</p>
      ) : (
        <ul>
          {jobs.map(job => (
            <li key={job._id} onClick={() => setSelectedJob(job)}>
              <div className="job-item">
                <span className="job-description">
                  {job.description.substring(0, 50)}...
                </span>
                <span className="job-date">
                  {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default JobHistory;