import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/Api';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess } from '../utils/toast';

export default function JobList() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyState, setApplyState] = useState({}); // { [jobId]: { resumeId: '', applying: false, success: '', error: '', uploading: false, uploadError: '', uploadProgress: 0 } }
  const [showApply, setShowApply] = useState({}); // { [jobId]: true/false }
  const fileInputs = useRef({});

  useEffect(() => {
    const fetchJobsAndResumes = async () => {
      setLoading(true);
      try {
        const [jobsRes, resumesRes] = await Promise.all([
          axios.get(`${API_URL}/jobs`),
          axios.get(`${API_URL}/resumes`)
        ]);
        setJobs(jobsRes.data.jobs || []);
        // Only resumes uploaded by the current user
        const myResumes = (resumesRes.data.resumes || []).filter(
          r => r.uploadedBy && (r.uploadedBy._id === user._id)
        );
        setResumes(myResumes);
      } catch (err) {
        setError('Failed to fetch jobs or resumes.');
      } finally {
        setLoading(false);
      }
    };
    if (user && user._id) fetchJobsAndResumes();
  }, [user]);

  const handleShowApply = (jobId) => {
    setShowApply(prev => ({ ...prev, [jobId]: !prev[jobId] }));
    setApplyState(prev => ({
      ...prev,
      [jobId]: {
        resumeId: resumes.length === 1 ? resumes[0]._id : '',
        applying: false,
        success: '',
        error: '',
        uploading: false,
        uploadError: '',
        uploadProgress: 0
      }
    }));
  };

  const handleResumeChange = (jobId, value) => {
    setApplyState(prev => ({
      ...prev,
      [jobId]: { ...prev[jobId], resumeId: value }
    }));
  };

  const handleApply = async (jobId) => {
    const resumeId = applyState[jobId]?.resumeId;
    if (!resumeId) {
      setApplyState(prev => ({
        ...prev,
        [jobId]: { ...prev[jobId], error: 'Please select a resume.' }
      }));
      return;
    }
    setApplyState(prev => ({
      ...prev,
      [jobId]: { ...prev[jobId], applying: true, error: '', success: '', uploading: false, uploadError: '', uploadProgress: 0 }
    }));
    try {
      await axios.post(`${API_URL}/jobs/${jobId}/apply`, { resumeId });
      setApplyState(prev => ({
        ...prev,
        [jobId]: { ...prev[jobId], applying: false, success: 'Applied successfully!', error: '', uploading: false, uploadError: '', uploadProgress: 0 }
      }));
    } catch (err) {
      setApplyState(prev => ({
        ...prev,
        [jobId]: { ...prev[jobId], applying: false, error: err.response?.data?.error || 'Failed to apply for the job.', success: '', uploading: false, uploadError: '', uploadProgress: 0 }
      }));
    }
  };

  const handleFileChange = async (jobId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setApplyState(prev => ({
      ...prev,
      [jobId]: { ...prev[jobId], uploading: true, uploadError: '', uploadProgress: 0 }
    }));
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const res = await axios.post(`${API_URL}/resumes/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setApplyState(prev => ({
            ...prev,
            [jobId]: { ...prev[jobId], uploadProgress: percent }
          }));
        }
      });
      // Add new resume to resumes and select it
      const newResume = {
        _id: res.data.resume.id,
        filename: res.data.resume.filename,
        originalName: res.data.resume.originalName,
        candidate: res.data.resume.candidate,
        skills: res.data.resume.skills,
        uploadedBy: { _id: user._id },
      };
      setResumes(prev => [newResume, ...prev]);
      setApplyState(prev => ({
        ...prev,
        [jobId]: { ...prev[jobId], resumeId: newResume._id, uploading: false, uploadError: '', uploadProgress: 0 }
      }));
              showSuccess('Resume uploaded successfully!');
    } catch (err) {
      setApplyState(prev => ({
        ...prev,
        [jobId]: { ...prev[jobId], uploading: false, uploadError: err.response?.data?.error || 'Failed to upload resume.', uploadProgress: 0 }
      }));
    }
  };

  const getResumePreview = (resumeId) => {
    const resume = resumes.find(r => r._id === resumeId);
    if (!resume) return null;
    return (
      <div style={{ background: '#f9f9f9', border: '1px solid #eee', borderRadius: 4, padding: 10, marginTop: 8 }}>
        <div><b>Filename:</b> {resume.originalName || resume.filename}</div>
        {resume.candidate && (
          <div><b>Candidate:</b> {resume.candidate.name || ''} {resume.candidate.email ? `(${resume.candidate.email})` : ''}</div>
        )}
        {resume.skills && resume.skills.length > 0 && (
          <div><b>Skills:</b> {resume.skills.join(', ')}</div>
        )}
        <div style={{ color: '#1976d2', marginTop: 8, fontSize: 13 }}>
          This resume will be sent to the company for this job application.
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading jobs...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div
    style={{
      width: '80%',
      maxWidth: '1200px',
      margin: '40px auto',
      padding: 24,
      background: '#fff',
      borderRadius: 8,
      boxShadow: '0 2px 8px #eee',
    }}
  >
      <h2>Available Jobs</h2>
      {jobs.length === 0 ? (
        <div>No jobs available.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {jobs.map(job => (
            <li key={job._id} style={{ border: '1px solid #eee', borderRadius: 6, marginBottom: 16, padding: 16 }}>
              <h3>{job.title}</h3>
              <p><b>Description:</b> {job.description}</p>
              <p><b>Location:</b> {job.location}</p>
              <p><b>Type:</b> {job.type}</p>
              <p><b>Company:</b> {job.company || (job.createdBy && job.createdBy.name)}</p>
              
              {/* Link to company profile */}
              {job.createdBy?._id && (
                <div style={{ marginBottom: '12px' }}>
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
              
              <button onClick={() => handleShowApply(job._id)} style={{ padding: 8, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, marginBottom: 8 }}>
                {showApply[job._id] ? 'Cancel' : 'Apply'}
              </button>
              {showApply[job._id] && (
                <div style={{ marginTop: 8 }}>
                  <select
                    value={applyState[job._id]?.resumeId || ''}
                    onChange={e => handleResumeChange(job._id, e.target.value)}
                    style={{ padding: 6, width: 220, marginRight: 8 }}
                  >
                    <option value="">Select your resume</option>
                    {resumes.map(resume => (
                      <option key={resume._id} value={resume._id}>
                        {resume.originalName || resume.filename}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    style={{ marginLeft: 8, padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    onClick={() => fileInputs.current[job._id]?.click()}
                  >
                    Upload Resume
                  </button>
                  <input
                    type="file"
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    ref={el => (fileInputs.current[job._id] = el)}
                    onChange={e => handleFileChange(job._id, e)}
                  />
                  {applyState[job._id]?.uploading && (
                    <div style={{ color: '#1976d2', marginTop: 6 }}>Uploading... {applyState[job._id].uploadProgress}%</div>
                  )}
                  {applyState[job._id]?.uploadError && (
                    <div style={{ color: 'red', marginTop: 6 }}>{applyState[job._id].uploadError}</div>
                  )}
                  {getResumePreview(applyState[job._id]?.resumeId)}
                  {applyState[job._id]?.error && <div style={{ color: 'red', marginTop: 6 }}>{applyState[job._id].error}</div>}
                  {applyState[job._id]?.success && <div style={{ color: 'green', marginTop: 6 }}>{applyState[job._id].success}</div>}
                  {resumes.length === 0 && <div style={{ color: 'orange', marginTop: 6 }}>You have no resumes uploaded. Please upload a resume first.</div>}
                  {resumes.length > 0 && (
                    <button
                      onClick={() => handleApply(job._id)}
                      disabled={applyState[job._id]?.applying || !applyState[job._id]?.resumeId}
                      style={{ 
                        marginTop: 8, 
                        padding: '8px 16px', 
                        background: applyState[job._id]?.applying || !applyState[job._id]?.resumeId ? '#ccc' : '#4caf50', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: 4, 
                        cursor: applyState[job._id]?.applying || !applyState[job._id]?.resumeId ? 'not-allowed' : 'pointer' 
                      }}
                    >
                      {applyState[job._id]?.applying ? 'Applying...' : 'Submit Application'}
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 