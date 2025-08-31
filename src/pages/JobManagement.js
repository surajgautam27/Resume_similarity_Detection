import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';
import JobPostForm from './JobPostForm';

export default function JobManagement() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

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

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    setDeletingJobId(jobId);
    try {
      await axios.delete(`/api/jobs/${jobId}`);
      setJobs(jobs.filter(job => job._id !== jobId));
      showSuccess('Job deleted successfully!');
    } catch (err) {
      showError('Failed to delete job: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeletingJobId(null);
    }
  };

  const handleJobPosted = () => {
    setShowPostForm(false);
    fetchJobs(); // Refresh the job list
  };

  if (loading) return <div>Loading jobs...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Manage Your Jobs</h2>
        <button
          onClick={() => setShowPostForm(!showPostForm)}
          style={{
            padding: '10px 20px',
            background: showPostForm ? '#dc3545' : '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {showPostForm ? 'Cancel' : 'Post New Job'}
        </button>
      </div>

      {showPostForm && (
        <div style={{ marginBottom: 32, padding: 24, border: '1px solid #dee2e6', borderRadius: 8, background: '#f8f9fa' }}>
          <h3 style={{ marginTop: 0 }}>Post New Job</h3>
          <JobPostForm onJobPosted={handleJobPosted} />
        </div>
      )}

      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6c757d' }}>
          <h3>No Jobs Posted Yet</h3>
          <p>You haven't posted any job vacancies yet. Click "Post New Job" to create your first job posting.</p>
        </div>
      ) : (
        <div>
          <h3 style={{ marginBottom: 16 }}>Your Posted Jobs ({jobs.length})</h3>
          <div style={{ display: 'grid', gap: 16 }}>
            {jobs.map(job => (
              <div key={job._id} style={{
                border: '1px solid #dee2e6',
                borderRadius: 8,
                padding: 20,
                background: '#fff',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>{job.title}</h4>
                    <p style={{ margin: '4px 0', color: '#6c757d', fontSize: '14px' }}>
                      <strong>Location:</strong> {job.location || 'Remote'} • 
                      <strong> Type:</strong> {job.type || 'Full-time'} • 
                      <strong> Status:</strong> {job.status || 'Active'}
                    </p>
                    <p style={{ margin: '4px 0', color: '#6c757d', fontSize: '14px' }}>
                      <strong>Applications:</strong> {job.applications ? job.applications.length : 0} • 
                      <strong>Posted:</strong> {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                    <p style={{ margin: '8px 0 0 0', color: '#495057', fontSize: '14px' }}>
                      {job.description.length > 150 ? job.description.substring(0, 150) + '...' : job.description}
                    </p>
                    
                    {/* Link to company profile */}
                    {job.createdBy?._id && (
                      <div style={{ marginTop: '8px' }}>
                        <a 
                          href={`/profile/${job.createdBy._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            background: '#f8f9fa',
                            color: '#007bff',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            border: '1px solid #dee2e6',
                            fontWeight: '500'
                          }}
                        >
                          🏢 View Company Profile
                        </a>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      disabled={deletingJobId === job._id}
                      style={{
                        padding: '6px 12px',
                        background: deletingJobId === job._id ? '#6c757d' : '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: deletingJobId === job._id ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {deletingJobId === job._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 