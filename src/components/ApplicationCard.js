import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../utils/Api';

export default function ApplicationCard({ application, jobId, applicationId, onUpdate }) {
  const { user } = useAuth();
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [status, setStatus] = useState(application.status || 'pending');
  const [notes, setNotes] = useState(application.notes || '');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isOpeningResume, setIsOpeningResume] = useState(false);
  const [resumeUnavailable, setResumeUnavailable] = useState(false);

  useEffect(() => {
    setStatus(application.status || 'pending');
    setNotes(application.notes || '');
  }, [application.status, application.notes]);

  const resumeDetails = typeof application.resume === 'object' ? application.resume : null;
  const resumeId =
    resumeDetails?._id || (typeof application.resume === 'string' ? application.resume : null);
  const candidateProfile = resumeDetails?.candidate || {};
  const fallbackUser = application.user || {};
  const experienceYears =
    (typeof resumeDetails?.experience === 'number' ? resumeDetails.experience : null) ?? null;

  const skills = resumeDetails?.skills || [];
  const languages = resumeDetails?.languages || [];
  const highlights = resumeDetails?.highlights || [];
  const educationEntries = resumeDetails?.education || [];
  const certificationEntries = resumeDetails?.certifications || [];
  const projects = resumeDetails?.projects || [];
  const workExperience = resumeDetails?.workExperience || [];
  const achievements = resumeDetails?.achievements || [];
  const summary = resumeDetails?.summary;

  const getStatusColor = (value) => {
    const colors = {
      pending: '#ff9800',
      reviewed: '#2196f3',
      shortlisted: '#4caf50',
      rejected: '#f44336',
      hired: '#8bc34a'
    };
    return colors[value] || '#666';
  };

  useEffect(() => {
    setResumeUnavailable(false);
  }, [resumeId]);

  const formatYearValue = (value) => {
    if (!value) return '';
    if (value instanceof Date && !isNaN(value)) {
      return value.getFullYear().toString();
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    const text = String(value).trim();
    const match = text.match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : text;
  };

  const formatDuration = (start, end) => {
    const startValue = formatYearValue(start);
    const endValue = formatYearValue(end);
    if (!startValue && !endValue) return '';
    if (startValue && endValue) {
      return startValue === endValue ? startValue : `${startValue} - ${endValue}`;
    }
    return startValue || endValue;
  };

  const formatListItem = (item, label) => {
    if (!item) return '';
    if (typeof item === 'string') return item.trim();
    if (typeof item === 'object') {
      if (label === 'Education') {
        const degree = item.degree || item.title;
        const field = item.field || item.major || item.specialization;
        const institution = item.school || item.name || item.institution || item.college || item.university;
        const duration = formatDuration(item.startYear || item.startDate, item.endYear || item.endDate || item.year);
        const grade = item.gpa || item.grade || item.score;
        const parts = [];
        if (degree && field) {
          parts.push(`${degree} in ${field}`);
        } else if (degree || field) {
          parts.push(degree || field);
        }
        if (institution) {
          parts.push(institution);
        }
        if (duration) {
          parts.push(duration);
        }
        if (grade) {
          parts.push(`GPA: ${grade}`);
        }
        const formatted = parts.filter(Boolean).join(' • ');
        if (formatted) return formatted;
        // Fallback: if no formatted string, try to create one from available fields
        const fallbackParts = [degree, field, institution].filter(Boolean);
        if (fallbackParts.length > 0) return fallbackParts.join(' • ');
        // Last resort: return school name or empty string
        return institution || '';
      } else if (label === 'Work Experience') {
        const role = item.role || item.title || item.position;
        const company = item.company || item.organization || item.employer;
        const duration = formatDuration(item.startDate || item.startYear, item.endDate || item.endYear);
        const description = item.description || item.summary;
        const parts = [role && company ? `${role} at ${company}` : role || company, duration, description];
        const formatted = parts.filter(Boolean).join(' • ');
        if (formatted) return formatted;
      }
      const fallback = Object.values(item)
        .filter(val => typeof val === 'string' && val.trim().length > 0)
        .slice(0, 3)
        .join(' • ');
      return fallback || '';
    }
    return String(item);
  };

  const openBlobInNewTab = (blob) => {
    const blobURL = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobURL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobURL), 60 * 1000);
  };

  const handleViewResume = async () => {
    if (!resumeId) {
      showError('No resume available to preview.');
      return;
    }

    if (isOpeningResume || resumeUnavailable) return;

    setIsOpeningResume(true);
    try {
      const response = await axios.get(`${API_URL}/resumes/${resumeId}/file`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/pdf'
      });
      openBlobInNewTab(blob);
    } catch (error) {
      const message = error.response?.data?.error || 'Unable to open resume file.';
      showError(message);
      if (error.response?.status === 404) {
        setResumeUnavailable(true);
      }
    } finally {
      setIsOpeningResume(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (isUpdatingStatus || !applicationId) return;

    setIsUpdatingStatus(true);
    try {
      const response = await axios.patch(
        `${API_URL}/jobs/${jobId}/applications/${applicationId}/status`,
        {
          status,
          notes
        }
      );
      showSuccess(response.data.message);
      setShowStatusForm(false);
      onUpdate?.(response.data.application);
    } catch (error) {
      // Handle validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map(err => err.msg || err.message).join(', ');
        showError(errorMessages || 'Validation failed');
      } else {
        showError(error.response?.data?.error || error.message || 'Failed to update status');
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const renderList = (label, items) => {
    if (!items || items.length === 0) return null;
    const formattedItems = items
      .map(item => formatListItem(item, label))
      .filter(Boolean);
    if (formattedItems.length === 0) return null;
    
    // Special formatting for work experience
    if (label === 'Work Experience') {
      return (
        <div style={{ marginTop: '12px' }}>
          <strong style={{ color: '#333', fontSize: '14px' }}>{label}:</strong>
          <div style={{ marginTop: '6px' }}>
            {formattedItems.slice(0, 4).map((item, idx) => (
              <div key={`${label}-${idx}`} style={{ 
                margin: '4px 0', 
                padding: '6px 8px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px',
                fontSize: '13px',
                color: '#555',
                lineHeight: 1.4
              }}>
                {item.length > 150 ? `${item.substring(0, 150)}...` : item}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Regular list formatting for other sections
    return (
      <div style={{ marginTop: '8px' }}>
        <strong style={{ color: '#333', fontSize: '14px' }}>{label}:</strong>
        <ul style={{ paddingLeft: '16px', margin: '6px 0', color: '#555', fontSize: '13px' }}>
          {formattedItems.slice(0, 5).map((item, idx) => {
            // Ensure item is always a string
            const itemText = typeof item === 'string' ? item : (typeof item === 'object' ? JSON.stringify(item) : String(item || ''));
            return (
              <li key={`${label}-${idx}`} style={{ marginBottom: '2px' }}>
                {itemText.length > 100 ? `${itemText.substring(0, 100)}...` : itemText}
              </li>
            );
          })}
          {formattedItems.length > 5 && (
            <li style={{ color: '#888', fontStyle: 'italic' }}>
              +{formattedItems.length - 5} more...
            </li>
          )}
        </ul>
      </div>
    );
  };

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '16px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px'
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>
            {fallbackUser.name || candidateProfile.name || 'Unknown Applicant'}
          </h4>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            {candidateProfile.email || fallbackUser.email || 'No email provided'}
          </p>
          {(candidateProfile.phone || candidateProfile.location) && (
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '13px' }}>
              {candidateProfile.phone && <>📞 {candidateProfile.phone} </>}
              {candidateProfile.location && (
                <span style={{ marginLeft: '8px' }}>📍 {candidateProfile.location}</span>
              )}
            </p>
          )}
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '12px' }}>
            Applied: {new Date(application.appliedAt).toLocaleDateString()}
          </p>
          {fallbackUser._id && (
            <a
              href={`/profile/${fallbackUser._id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: '8px',
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
              👤 View Full Profile
            </a>
          )}
        </div>

        <div
          style={{
            padding: '4px 12px',
            borderRadius: '16px',
            backgroundColor: getStatusColor(application.status),
            color: 'white',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}
        >
          {application.status || 'pending'}
        </div>
      </div>

      {resumeDetails ? (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px'
          }}
        >
          <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
            Resume: {resumeDetails.originalName || resumeDetails.filename || 'Untitled'}
          </p>
          {summary && (
            <div style={{ margin: '0 0 12px 0', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
              <strong style={{ color: '#333', fontSize: '14px' }}>Professional Summary:</strong>
              <p style={{ margin: '4px 0 0 0', color: '#555', fontSize: '14px', lineHeight: 1.6 }}>
                {summary.length > 300 ? `${summary.substring(0, 300)}...` : summary}
              </p>
            </div>
          )}
          {skills.length > 0 && (
            <div style={{ margin: '8px 0' }}>
              <strong style={{ color: '#333', fontSize: '14px' }}>Skills:</strong>
              <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {skills.slice(0, 15).map((skill, idx) => (
                  <span key={idx} style={{
                    padding: '2px 8px',
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {skill}
                  </span>
                ))}
                {skills.length > 15 && (
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontStyle: 'italic'
                  }}>
                    +{skills.length - 15} more
                  </span>
                )}
              </div>
            </div>
          )}
          {typeof experienceYears === 'number' && (
            <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
              <strong>Experience:</strong> {experienceYears} years
            </p>
          )}
          {languages.length > 0 && (
            <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
              <strong>Languages:</strong> {languages.join(', ')}
            </p>
          )}
          {renderList('Work Experience', workExperience)}
          {renderList('Education', educationEntries)}
          {renderList('Projects', projects)}
          {renderList('Certifications', certificationEntries)}
          {renderList('Achievements', achievements)}
          {renderList('Highlights', highlights)}
          {resumeDetails.metadata?.pageCount && (
            <p style={{ margin: '8px 0 0 0', color: '#777', fontSize: '12px' }}>
              📄 {resumeDetails.metadata.pageCount} pages • {resumeDetails.metadata.wordCount} words
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#fff3cd',
            borderRadius: '4px',
            border: '1px solid #ffeaa7',
            color: '#856404',
            fontSize: '14px'
          }}
        >
          Resume preview unavailable due to privacy settings.
        </div>
      )}

      {application.notes && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#fff8e1',
            borderRadius: '4px',
            border: '1px solid #ffeaa7'
          }}
        >
          <p style={{ margin: 0, fontWeight: '600', color: '#6c4b00' }}>Notes</p>
          <p style={{ margin: '4px 0 0 0', color: '#6c4b00' }}>{application.notes}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {resumeId && (
          <button
            onClick={handleViewResume}
            disabled={isOpeningResume || resumeUnavailable}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#0d6efd',
              color: '#fff',
              cursor: isOpeningResume || resumeUnavailable ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            {resumeUnavailable ? 'Resume Unavailable' : isOpeningResume ? 'Opening…' : '📄 View Resume'}
          </button>
        )}

        {resumeUnavailable && (
          <span style={{ color: '#c62828', fontSize: '13px' }}>
            Resume file is no longer available. Ask the candidate to re-upload.
          </span>
        )}

        {user.role === 'company' && (
          <button
            onClick={() => setShowStatusForm((prev) => !prev)}
            disabled={!applicationId}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#fff',
              color: '#555',
              cursor: !applicationId ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            📝 Update Status
          </button>
        )}
      </div>

      {showStatusForm && user.role === 'company' && (
        <form
          onSubmit={handleUpdateStatus}
          style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}
        >
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
            </select>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this application..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                minHeight: '80px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={isUpdatingStatus}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isUpdatingStatus ? 'Updating...' : 'Update Status'}
            </button>
            <button
              type="button"
              onClick={() => setShowStatusForm(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

