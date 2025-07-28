import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedJobs, setExpandedJobs] = useState({});
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
      alert('Failed to fetch sorted resumes: ' + (err.response?.data?.error || err.message));
    } finally {
      setSortingJobId(null);
    }
  };

  const toggleJobExpansion = (jobId) => {
    setExpandedJobs(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  const getApplicationCount = (job) => {
    return job.applications ? job.applications.length : 0;
  };

  const getResumePreview = (resume, jobId) => {
    if (!resume) return null;
    
    return (
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #dee2e6', 
        borderRadius: 8, 
        padding: 16, 
        marginBottom: 12 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>
              {resume.candidate?.name || resume.uploadedBy?.name || 'Unknown Candidate'}
            </h4>
            <p style={{ margin: '4px 0', color: '#6c757d', fontSize: '14px' }}>
              <strong>Email:</strong> {resume.candidate?.email || resume.uploadedBy?.email || 'N/A'}
            </p>
            <p style={{ margin: '4px 0', color: '#6c757d', fontSize: '14px' }}>
              <strong>Resume:</strong> {resume.originalName || resume.filename}
            </p>
            {resume.skills && resume.skills.length > 0 && (
              <p style={{ margin: '4px 0', color: '#6c757d', fontSize: '14px' }}>
                <strong>Skills:</strong> {resume.skills.join(', ')}
              </p>
            )}
            {resume.experience && (
              <p style={{ margin: '4px 0', color: '#6c757d', fontSize: '14px' }}>
                <strong>Experience:</strong> {resume.experience} years
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#6c757d' }}>
            <div>Uploaded: {resume.createdAt ? new Date(resume.createdAt).toLocaleDateString() : 'N/A'}</div>
            <div>By: {resume.uploadedBy?.name || 'Unknown'}</div>
          </div>
        </div>
        
        {sortedResumes[jobId] && (
          <div style={{ 
            background: '#e3f2fd', 
            padding: 8, 
            borderRadius: 4, 
            marginTop: 8,
            fontSize: '14px'
          }}>
            <strong>Similarity Score:</strong> {
              sortedResumes[jobId].find(match => match.resume._id === resume._id)?.score 
                ? ((sortedResumes[jobId].find(match => match.resume._id === resume._id).score * 100).toFixed(2) + '%')
                : 'Not calculated'
            }
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading company dashboard...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '40px' }}>{error}</div>;
  if (!user || user.role !== 'company') return <div style={{ textAlign: 'center', padding: '40px' }}>Unauthorized - Company access only</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>Company Dashboard</h1>
        <div style={{ fontSize: '16px', color: '#6c757d' }}>
          Welcome, {user.name || user.email}
        </div>
      </div>

      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6c757d' }}>
          <h3>No Jobs Posted Yet</h3>
          <p>You haven't posted any job vacancies yet. Create your first job posting to start receiving applications from developers.</p>
        </div>
      ) : (
        <div>
          <h2 style={{ marginBottom: 24, color: '#495057' }}>Your Job Postings ({jobs.length})</h2>
          
          {jobs.map(job => (
            <div key={job._id} style={{ 
              border: '1px solid #dee2e6', 
              borderRadius: 12, 
              marginBottom: 24, 
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {/* Job Header */}
              <div style={{ 
                background: '#f8f9fa', 
                padding: '20px 24px', 
                borderBottom: '1px solid #dee2e6',
                cursor: 'pointer'
              }} onClick={() => toggleJobExpansion(job._id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#495057' }}>{job.title}</h3>
                    <p style={{ margin: '4px 0', color: '#6c757d', fontSize: '14px' }}>
                      <strong>Location:</strong> {job.location || 'Remote'} • 
                      <strong> Type:</strong> {job.type || 'Full-time'} • 
                      <strong> Experience:</strong> {job.experience || 'Mid-level'}
                    </p>
                    <p style={{ margin: '4px 0', color: '#6c757d', fontSize: '14px' }}>
                      <strong>Applications:</strong> {getApplicationCount(job)} • 
                      <strong>Posted:</strong> {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      background: job.status === 'active' ? '#d4edda' : '#f8d7da', 
                      color: job.status === 'active' ? '#155724' : '#721c24',
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {job.status || 'Active'}
                    </div>
                    <div style={{ fontSize: '24px', marginTop: 8 }}>
                      {expandedJobs[job._id] ? '−' : '+'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Details and Applications */}
              {expandedJobs[job._id] && (
                <div style={{ padding: '24px' }}>
                  <div style={{ marginBottom: 24 }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#495057' }}>Job Description</h4>
                    <p style={{ color: '#6c757d', lineHeight: '1.6', margin: 0 }}>
                      {job.description}
                    </p>
                    {job.skills && job.skills.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <strong style={{ color: '#495057' }}>Required Skills:</strong>
                        <div style={{ marginTop: 8 }}>
                          {job.skills.map((skill, idx) => (
                            <span key={idx} style={{
                              background: '#e9ecef',
                              color: '#495057',
                              padding: '4px 8px',
                              borderRadius: 4,
                              fontSize: '12px',
                              marginRight: 8,
                              marginBottom: 4,
                              display: 'inline-block'
                            }}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Applications Section */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h4 style={{ margin: 0, color: '#495057' }}>
                        Applications ({getApplicationCount(job)})
                      </h4>
                      <button
                        onClick={() => handleSortBySimilarity(job._id)}
                        disabled={sortingJobId === job._id}
                        style={{ 
                          background: '#007bff', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: 6, 
                          padding: '8px 16px', 
                          fontWeight: 600, 
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {sortingJobId === job._id ? 'Calculating...' : 'Sort by Similarity'}
                      </button>
                    </div>

                    {getApplicationCount(job) === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px', 
                        color: '#6c757d',
                        background: '#f8f9fa',
                        borderRadius: 8
                      }}>
                        <h5 style={{ margin: '0 0 8px 0' }}>No Applications Yet</h5>
                        <p style={{ margin: 0, fontSize: '14px' }}>
                          This job hasn't received any applications yet. Share the job posting to attract developers.
                        </p>
                      </div>
                    ) : (
                      <div>
                        {job.applications && job.applications.length > 0 ? (
                          job.applications.map((application, idx) => (
                            <div key={application._id || idx}>
                              {getResumePreview(application.resume, job._id)}
                            </div>
                          ))
                        ) : (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '20px', 
                            color: '#6c757d',
                            background: '#f8f9fa',
                            borderRadius: 8
                          }}>
                            <p style={{ margin: 0 }}>No resume data available for applications.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 