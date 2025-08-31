import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { showError } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';
import ApplicationCard from '../components/ApplicationCard';

export default function Application() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortedResumes, setSortedResumes] = useState({});
  const [sortingJobId, setSortingJobId] = useState(null);
  const [viewMode, setViewMode] = useState('applications'); // 'applications' or 'sorted'

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
      setViewMode('sorted');
    } catch (err) {
      console.error('Error fetching matches:', err);
      showError('Failed to fetch sorted resumes: ' + (err.response?.data?.error || err.message));
    } finally {
      setSortingJobId(null);
    }
  };

  const handleApplicationUpdate = (jobId, applicationIndex, updatedApplication) => {
    setJobs(prevJobs => 
      prevJobs.map(job => {
        if (job._id === jobId) {
          const updatedApplications = [...job.applications];
          updatedApplications[applicationIndex] = updatedApplication;
          return { ...job, applications: updatedApplications };
        }
        return job;
      })
    );
  };

  if (loading) return <div>Loading applications...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!user || user.role !== 'company') return <div>Unauthorized</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <h2>Applications for Your Jobs</h2>
      {jobs.length === 0 ? (
        <div>You have not posted any jobs yet.</div>
      ) : (
        jobs.map(job => (
          <div key={job._id} style={{ marginBottom: 32, borderBottom: '1px solid #eee', paddingBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>{job.title}</h3>
                <p style={{ margin: '0', color: '#666' }}><b>Description:</b> {job.description}</p>
                <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                  <b>Applications:</b> {job.applications?.length || 0}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setViewMode('applications')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: viewMode === 'applications' ? '#1976d2' : '#f5f5f5',
                    color: viewMode === 'applications' ? '#fff' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Applications
                </button>
                <button
                  onClick={() => handleSortBySimilarity(job._id)}
                  disabled={sortingJobId === job._id}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: viewMode === 'sorted' ? '#1976d2' : '#f5f5f5',
                    color: viewMode === 'sorted' ? '#fff' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {sortingJobId === job._id ? 'Sorting...' : 'Sort by Similarity'}
                </button>
              </div>
            </div>

            {/* Applications View */}
            {viewMode === 'applications' && (
              <div>
                {job.applications?.length === 0 ? (
                  <div style={{ color: '#888', fontStyle: 'italic' }}>No applications yet.</div>
                ) : (
                  job.applications.map((application, index) => (
                    <ApplicationCard
                      key={`${job._id}-${index}`}
                      application={application}
                      jobId={job._id}
                      applicationIndex={index}
                      onUpdate={(updatedApplication) => handleApplicationUpdate(job._id, index, updatedApplication)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Sorted View */}
            {viewMode === 'sorted' && sortedResumes[job._id] && (
              <div>
                {sortedResumes[job._id].length === 0 ? (
                  <div style={{ color: '#888', fontStyle: 'italic' }}>No applications yet.</div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {sortedResumes[job._id].map(({ resume, score }, idx) => (
                      <li key={resume._id || idx} style={{ border: '1px solid #eee', borderRadius: 6, marginBottom: 16, padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div><b>Similarity Score:</b> {(score * 100).toFixed(2)}%</div>
                          <div style={{
                            padding: '2px 8px',
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            Rank #{idx + 1}
                          </div>
                        </div>
                        <div><b>Name:</b> {resume.candidate?.name || resume.uploadedBy?.name || 'Unknown'}</div>
                        <div><b>Email:</b> {resume.candidate?.email || resume.uploadedBy?.email || 'N/A'}</div>
                        <div><b>Skills:</b> {resume.skills?.join(', ') || 'N/A'}</div>
                        <div><b>Experience:</b> {resume.experience || 'N/A'} years</div>
                        <div><b>Resume Filename:</b> {resume.originalName || resume.filename}</div>
                        <div><b>Uploaded By:</b> {resume.uploadedBy?.name || 'Unknown'}</div>
                        <div><b>Upload Date:</b> {resume.createdAt ? new Date(resume.createdAt).toLocaleDateString() : 'N/A'}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}