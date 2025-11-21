import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/Api';
import { showError } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';
import ApplicationCard from '../components/ApplicationCard';

export default function MyApplications() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyApplications = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/jobs`);
        // Filter jobs where the current user has applied
        const jobsWithMyApplications = res.data.jobs.filter(job => 
          job.applications?.some(app => 
            (app.user?._id === user._id || app.user === user._id)
          )
        );
        setJobs(jobsWithMyApplications);
      } catch (err) {
        setError('Failed to fetch applications.');
      } finally {
        setLoading(false);
      }
    };
    if (user && user.role === 'developer') fetchMyApplications();
  }, [user]);

  const handleApplicationUpdate = (jobId, matcher, updatedApplication) => {
    setJobs(prevJobs => 
      prevJobs.map(job => {
        if (job._id === jobId) {
          const updatedApplications = (job.applications || []).map((app, idx) => {
            const currentId = app._id?.toString() || '';
            const targetId = matcher?.applicationId?.toString() || '';
            const matchesId = currentId && targetId && currentId === targetId;
            const matchesIndex =
              typeof matcher?.applicationIndex === 'number' &&
              idx === matcher.applicationIndex;
            return matchesId || matchesIndex ? updatedApplication : app;
          });
          return { ...job, applications: updatedApplications };
        }
        return job;
      })
    );
  };

  if (loading) return <div>Loading your applications...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!user || user.role !== 'developer') return <div>Unauthorized</div>;

  // Get only the applications submitted by the current user
  const myApplications = jobs.map(job => {
    const myAppIndex = job.applications?.findIndex(app => 
      (app.user?._id === user._id || app.user === user._id)
    );
    return {
      ...job,
      myApplication: myAppIndex !== -1 ? job.applications[myAppIndex] : null,
      myApplicationId: myAppIndex !== -1 ? job.applications[myAppIndex]._id : null,
      myApplicationIndex: myAppIndex
    };
  }).filter(job => job.myApplication);

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <h2>My Job Applications</h2>
      {myApplications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>You haven't applied to any jobs yet.</p>
          <p>Browse available jobs and submit your applications!</p>
        </div>
      ) : (
        myApplications.map(job => (
          <div key={job._id} style={{ marginBottom: 32, borderBottom: '1px solid #eee', paddingBottom: 24 }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>{job.title}</h3>
              <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                <b>Company:</b> {job.company || job.createdBy?.name || 'Unknown Company'}
              </p>
              <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                <b>Location:</b> {job.location || 'Not specified'}
              </p>
              <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                <b>Type:</b> {job.type || 'Not specified'}
              </p>
              <p style={{ margin: '0', color: '#666' }}>
                <b>Applied:</b> {new Date(job.myApplication.appliedAt).toLocaleDateString()}
              </p>
            </div>

            <ApplicationCard
              application={job.myApplication}
              jobId={job._id}
              applicationId={job.myApplicationId}
              onUpdate={(updatedApplication) =>
                handleApplicationUpdate(
                  job._id,
                  { applicationId: job.myApplicationId, applicationIndex: job.myApplicationIndex },
                  updatedApplication
                )
              }
            />
          </div>
        ))
      )}
    </div>
  );
}
