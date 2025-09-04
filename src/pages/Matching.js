import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/Api';
import { useAuth } from '../contexts/AuthContext';

export default function Matching() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [appliedResumes, setAppliedResumes] = useState([]);
  const [selectedResumes, setSelectedResumes] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'company') return;
    // Fetch jobs
    const fetchJobs = async () => {
      try {
        const jobsRes = await axios.get(`${API_URL}/jobs`);
        // Only jobs created by the current company user
        const myJobs = (jobsRes.data.jobs || []).filter(
          job => job.createdBy && (job.createdBy._id === user._id)
        );
        setJobs(myJobs);
      } catch (err) {
        setError('Failed to fetch jobs.');
      }
    };
    fetchJobs();
  }, [user]);

  // Fetch resumes applied to the selected job
  useEffect(() => {
    if (!selectedJobId) {
      setAppliedResumes([]);
      setSelectedResumes([]);
      return;
    }
    const fetchAppliedResumes = async () => {
      try {
        const jobRes = await axios.get(`${API_URL}/jobs/${selectedJobId}`);
        const job = jobRes.data.job;
        // Get resumes from applications
        const resumes = (job.applications || [])
          .map(app => app.resume)
          .filter(r => r && r._id); // Only valid resumes
        setAppliedResumes(resumes);
        setSelectedResumes([]); // Reset selection when job changes
      } catch (err) {
        setError('Failed to fetch applied resumes.');
      }
    };
    fetchAppliedResumes();
  }, [selectedJobId]);

  const handleCompare = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const selectedJob = jobs.find(j => j._id === selectedJobId);
      if (!selectedJob) throw new Error('No job selected');
      const res = await axios.post(`${API_URL}/matching/adhoc`, {
        job: {
          title: selectedJob.title,
          description: selectedJob.description
        },
        resumeIds: selectedResumes
      });
      setResults(res.data.matches || res.data);
    } catch (err) {
      setError('Failed to compare resumes.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'company') return <div>Unauthorized</div>;

  return (
    <div style={{ padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <h2>Compare Resumes to Your Job</h2>
      <form onSubmit={handleCompare}>
        <div style={{ marginBottom: 16 }}>
          <label>Job:</label>
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          >
            <option value="">Select a job</option>
            {jobs.map(job => (
              <option key={job._id} value={job._id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Resumes (applied to this job):</label>
          <select
            multiple
            value={selectedResumes}
            onChange={e => setSelectedResumes(Array.from(e.target.selectedOptions, o => o.value))}
            required
            style={{ width: '100%', padding: 8, marginTop: 4, height: 100 }}
          >
            {appliedResumes.map(resume => (
              <option key={resume._id} value={resume._id}>
                {resume.candidate?.name || resume.originalName || 'Unnamed Resume'}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading || !selectedJobId || selectedResumes.length === 0}
          style={{ width: '100%', padding: 10, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}
        >
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
      {results && Array.isArray(results) && (
        <div style={{ marginTop: 24 }}>
          <h3>Comparison Results</h3>
          <ul>
            {results.map(match => (
              <li key={match.resumeId} style={{ marginBottom: 12 }}>
                <strong>{match.candidateName || 'Unnamed Candidate'}</strong>: Cosine Similarity: <b>{match.cosineSimilarity}%</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 