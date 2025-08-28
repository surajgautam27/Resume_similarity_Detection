import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess, showError } from '../utils/toast';

export default function Resumes() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [deletingResumeId, setDeletingResumeId] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/resumes');
      const myResumes = (res.data.resumes || []).filter(
        r => r.uploadedBy && (r.uploadedBy._id === user._id)
      );
      setResumes(myResumes);
    } catch (err) {
      setError('Failed to fetch resumes.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setUploadError('');
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('resume', file);
    
    try {
      const res = await axios.post('/api/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      
      // Add new resume to the list
      const newResume = {
        _id: res.data.resume.id,
        filename: res.data.resume.filename,
        originalName: res.data.resume.originalName,
        candidate: res.data.resume.candidate,
        skills: res.data.resume.skills,
        uploadedBy: { _id: user._id },
        createdAt: new Date().toISOString()
      };
      setResumes(prev => [newResume, ...prev]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      showSuccess('Resume uploaded successfully!');
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to upload resume.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      return;
    }

    setDeletingResumeId(resumeId);
    try {
      await axios.delete(`/api/resumes/${resumeId}`);
      setResumes(resumes.filter(resume => resume._id !== resumeId));
      showSuccess('Resume deleted successfully!');
    } catch (err) {
      showError('Failed to delete resume: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeletingResumeId(null);
    }
  };

  if (loading) return <div>Loading resumes...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>My Resumes</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '10px 20px',
            background: uploading ? '#6c757d' : '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontWeight: 600
          }}
        >
          {uploading ? 'Uploading...' : 'Upload Resume'}
        </button>
        <input
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {uploading && (
        <div style={{ marginBottom: 16, padding: 12, background: '#e3f2fd', borderRadius: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span>Uploading resume...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{ width: '100%', height: 4, background: '#e0e0e0', borderRadius: 2 }}>
            <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#1976d2', borderRadius: 2 }}></div>
          </div>
        </div>
      )}

      {uploadError && (
        <div style={{ marginBottom: 16, padding: 12, background: '#ffebee', color: '#c62828', borderRadius: 4 }}>
          {uploadError}
        </div>
      )}

      {resumes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6c757d' }}>
          <h3>No Resumes Uploaded</h3>
          <p>You haven't uploaded any resumes yet. Click "Upload Resume" to add your first resume.</p>
        </div>
      ) : (
        <div>
          <h3 style={{ marginBottom: 16 }}>Your Resumes ({resumes.length})</h3>
          <div style={{ display: 'grid', gap: 16 }}>
            {resumes.map(resume => (
              <div key={resume._id} style={{
                border: '1px solid #dee2e6',
                borderRadius: 8,
                padding: 20,
                background: '#fff',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>
                      {resume.originalName || resume.filename}
                    </h4>
                    {resume.candidate && (
                      <p style={{ margin: '4px 0', color: '#6c757d', fontSize: '14px' }}>
                        <strong>Candidate:</strong> {resume.candidate.name || 'Unknown'} 
                        {resume.candidate.email && ` (${resume.candidate.email})`}
                      </p>
                    )}
                    {resume.skills && resume.skills.length > 0 && (
                      <p style={{ margin: '4px 0', color: '#6c757d', fontSize: '14px' }}>
                        <strong>Skills:</strong> {resume.skills.join(', ')}
                      </p>
                    )}
                    <p style={{ margin: '4px 0', color: '#6c757d', fontSize: '14px' }}>
                      <strong>Uploaded:</strong> {resume.createdAt ? new Date(resume.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                    <button
                      onClick={() => handleDeleteResume(resume._id)}
                      disabled={deletingResumeId === resume._id}
                      style={{
                        padding: '6px 12px',
                        background: deletingResumeId === resume._id ? '#6c757d' : '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: deletingResumeId === resume._id ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {deletingResumeId === resume._id ? 'Deleting...' : 'Delete'}
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