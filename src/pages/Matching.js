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
    const fetchJobs = async () => {
      try {
        const jobsRes = await axios.get(`${API_URL}/jobs`);
        const myJobs = (jobsRes.data.jobs || []).filter(
          job => job.createdBy && job.createdBy._id === user._id
        );
        setJobs(myJobs);
      } catch (err) {
        setError('Failed to fetch jobs.');
      }
    };
    fetchJobs();
  }, [user]);

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
        const resumes = (job.applications || [])
          .map(app => app.resume)
          .filter(r => r && r._id);
        setAppliedResumes(resumes);
        setSelectedResumes([]);
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
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 32, background: '#f9f9f9', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: 24, color: '#1976d2', textAlign: 'center' }}>
        Compare Resumes with Your Job
      </h2>

      <form onSubmit={handleCompare} style={{ display: 'grid', gap: 20 }}>
        {/* Job Selector */}
        <div>
          <label style={{ fontWeight: 600 }}>Select Job</label>
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            required
            style={{ width: '100%', padding: 10, marginTop: 6, borderRadius: 6, border: '1px solid #ccc' }}
          >
            <option value="">-- Choose a job --</option>
            {jobs.map(job => (
              <option key={job._id} value={job._id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        {/* Resume Selector */}
        <div>
          <label style={{ fontWeight: 600 }}>Resumes Applied</label>
          <select
            multiple
            value={selectedResumes}
            onChange={e => setSelectedResumes(Array.from(e.target.selectedOptions, o => o.value))}
            required
            style={{ width: '100%', padding: 10, marginTop: 6, borderRadius: 6, border: '1px solid #ccc', height: 120 }}
          >
            {appliedResumes.map(resume => (
              <option key={resume._id} value={resume._id}>
                {resume.candidate?.name || resume.originalName || 'Unnamed Resume'}
              </option>
            ))}
          </select>
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={loading || !selectedJobId || selectedResumes.length === 0}
          style={{
            padding: 12,
            background: loading ? '#999' : '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.3s'
          }}
        >
          {loading ? 'Comparing...' : 'Compare Resumes'}
        </button>
      </form>

      {/* Error */}
      {error && <div style={{ color: 'red', marginTop: 16, fontWeight: 500 }}>{error}</div>}

      {/* Results */}
      {results && Array.isArray(results) && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ marginBottom: 16 }}>📊 Comparison Results</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {results.map(match => (
              <li key={match.resumeId} style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.05)', marginBottom: 12 }}>
                <strong>{match.candidateName || 'Unnamed Candidate'}</strong>
                <div style={{ marginTop: 6 }}>
                  Cosine Similarity:{" "}
                  <b style={{ color: match.cosineSimilarity > 70 ? 'green' : '#d32f2f' }}>
                    {match.cosineSimilarity}%
                  </b>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
