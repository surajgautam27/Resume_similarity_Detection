import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Matching() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumes, setSelectedResumes] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch resumes
    const fetchResumes = async () => {
      try {
        const resumesRes = await axios.get('/api/resumes');
        setResumes(resumesRes.data.resumes || resumesRes.data);
      } catch (err) {
        setError('Failed to fetch resumes.');
      }
    };
    fetchResumes();
  }, []);

  const handleCompare = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);
    try {
      // Call a new backend endpoint for ad-hoc job description matching
      const res = await axios.post(`/api/matching/adhoc`, {
        job: {
          title: jobTitle,
          description: jobDescription
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

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <h2>Compare Resumes to Job Description</h2>
      <form onSubmit={handleCompare}>
        <div style={{ marginBottom: 16 }}>
          <label>Job Title:</label>
          <input
            type="text"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Job Description:</label>
          <textarea
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            required
            rows={5}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Resumes:</label>
          <select
            multiple
            value={selectedResumes}
            onChange={e => setSelectedResumes(Array.from(e.target.selectedOptions, o => o.value))}
            required
            style={{ width: '100%', padding: 8, marginTop: 4, height: 100 }}
          >
            {resumes.map(resume => (
              <option key={resume.id || resume._id} value={resume.id || resume._id}>
                {resume.candidate?.name || resume.originalName || 'Unnamed Resume'}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading || !jobTitle || !jobDescription || selectedResumes.length === 0}
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