import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { showError } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';

export default function Application() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortedResumes, setSortedResumes] = useState({});
  const [sortingJobId, setSortingJobId] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/jobs');
        const myJobs = (res.data.jobs || []).filter(
          job => job.createdBy && (job.createdBy._id === user._id)
        );
        setJobs(myJobs);
      } catch (err) {
        setError('Failed to fetch jobs.');
      } finally {
        setLoading(false);
      }
    };
    if (user && user.role === 'company') fetchJobs();
  }, [user]);

  const handleSortBySimilarity = async (jobId) => {
    setSortingJobId(jobId);
    try {
      console.log('Fetching matches for job:', jobId);
      const res = await axios.get(`/api/jobs/${jobId}/match-resumes`);
      console.log('Match response:', res.data);
      setSortedResumes(prev => ({ ...prev, [jobId]: res.data.matches }));
    } catch (err) {
      console.error('Error fetching matches:', err);
      showError('Failed to fetch sorted resumes: ' + (err.response?.data?.error || err.message));
    } finally {
      setSortingJobId(null);
    }
  };

  if (loading) return <div>Loading applications...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!user || user.role !== 'company') return <div>Unauthorized</div>;

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <h2>Applications for Your Jobs</h2>
      {jobs.length === 0 ? (
        <div>You have not posted any jobs yet.</div>
      ) : (
        jobs.map(job => (
          <div key={job._id} style={{ marginBottom: 32, borderBottom: '1px solid #eee', paddingBottom: 24 }}>
            <h3>{job.title}</h3>
            <p><b>Description:</b> {job.description}</p>
            <button
              onClick={() => handleSortBySimilarity(job._id)}
              disabled={sortingJobId === job._id}
              style={{ marginBottom: 12, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}
            >
              {sortingJobId === job._id ? 'Sorting...' : 'Sort Applicants by Similarity'}
            </button>
            {sortedResumes[job._id] ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {sortedResumes[job._id].length === 0 ? (
                  <li style={{ color: '#888' }}>No applications yet.</li>
                ) : (
                  sortedResumes[job._id].map(({ resume, score }, idx) => (
                    <li key={resume._id || idx} style={{ border: '1px solid #eee', borderRadius: 6, marginBottom: 16, padding: 16 }}>
                      <div><b>Similarity Score:</b> {(score * 100).toFixed(2)}%</div>
                      <div><b>Name:</b> {resume.candidate?.name || resume.uploadedBy?.name || 'Unknown'}</div>
                      <div><b>Email:</b> {resume.candidate?.email || resume.uploadedBy?.email || 'N/A'}</div>
                      <div><b>Skills:</b> {resume.skills?.join(', ') || 'N/A'}</div>
                      <div><b>Experience:</b> {resume.experience || 'N/A'} years</div>
                      <div><b>Resume Filename:</b> {resume.originalName || resume.filename}</div>
                      <div><b>Uploaded By:</b> {resume.uploadedBy?.name || 'Unknown'}</div>
                      <div><b>Upload Date:</b> {resume.createdAt ? new Date(resume.createdAt).toLocaleDateString() : 'N/A'}</div>
                    </li>
                  ))
                )}
              </ul>
            ) : (
              <div style={{ color: '#888' }}>Click 'Sort Applicants by Similarity' to see best matches.</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}