import React, { useState } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';

export default function ApplicationCard({ application, jobId, applicationIndex, onUpdate }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [status, setStatus] = useState(application.status || 'pending');
  const [notes, setNotes] = useState(application.notes || '');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleToggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    
    try {
      const response = await axios.post(`/api/jobs/${jobId}/applications/${applicationIndex}/like`);
      showSuccess(response.data.message);
      if (onUpdate) {
        onUpdate(response.data.application);
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to like application');
    } finally {
      setIsLiking(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isCommenting) return;
    
    setIsCommenting(true);
    try {
      const response = await axios.post(`/api/jobs/${jobId}/applications/${applicationIndex}/comments`, {
        text: newComment
      });
      showSuccess('Comment added successfully');
      setNewComment('');
      if (onUpdate) {
        onUpdate(response.data.application);
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (isUpdatingStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      const response = await axios.patch(`/api/jobs/${jobId}/applications/${applicationIndex}/status`, {
        status,
        notes
      });
      showSuccess(response.data.message);
      setShowStatusForm(false);
      if (onUpdate) {
        onUpdate(response.data.application);
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      reviewed: '#2196f3',
      shortlisted: '#4caf50',
      rejected: '#f44336',
      hired: '#8bc34a'
    };
    return colors[status] || '#666';
  };

  const canLike = () => {
    if (user.role === 'developer') {
      return application.user?._id === user._id || application.user === user._id;
    } else if (user.role === 'company') {
      return true; // Companies can like applications for their jobs
    }
    return false;
  };

  const canComment = () => {
    if (user.role === 'developer') {
      return application.user?._id === user._id || application.user === user._id;
    } else if (user.role === 'company') {
      return true; // Companies can comment on applications for their jobs
    }
    return false;
  };

  const isLiked = application.likes?.some(like => 
    (typeof like === 'object' ? like._id : like) === user._id
  );

  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '16px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Application Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>
            {application.user?.name || 'Unknown Applicant'}
          </h4>
          <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
            {application.user?.email || 'No email provided'}
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '12px' }}>
            Applied: {new Date(application.appliedAt).toLocaleDateString()}
          </p>
          {/* Link to developer's public profile */}
          {application.user?._id && (
            <a 
              href={`/profile/${application.user._id}`}
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
        
        {/* Status Badge */}
        <div style={{
          padding: '4px 12px',
          borderRadius: '16px',
          backgroundColor: getStatusColor(application.status),
          color: 'white',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase'
        }}>
          {application.status || 'pending'}
        </div>
      </div>

      {/* Interaction Summary - Show likes and comments prominently */}
      {(application.likes?.length > 0 || application.comments?.length > 0) && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '6px', 
          border: '1px solid #bbdefb' 
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {application.likes?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>👍</span>
                <span style={{ fontWeight: '600', color: '#1976d2' }}>
                  {application.likes.length} like{application.likes.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {application.comments?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>💬</span>
                <span style={{ fontWeight: '600', color: '#1976d2' }}>
                  {application.comments.length} comment{application.comments.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#1976d2', marginTop: '4px' }}>
            Developer has been active on this application
          </div>
        </div>
      )}

      {/* Resume Info */}
      {application.resume && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>Resume: {application.resume.originalName || 'Resume'}</p>
          {application.resume.candidate && (
            <div style={{ fontSize: '14px', color: '#666' }}>
              <p style={{ margin: '2px 0' }}>Skills: {application.resume.candidate.skills?.join(', ') || 'N/A'}</p>
              <p style={{ margin: '2px 0' }}>Experience: {application.resume.candidate.experience || 'N/A'} years</p>
            </div>
          )}
        </div>
      )}

      {/* Notes (for companies) */}
      {application.notes && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
          <p style={{ margin: '0', fontWeight: '600', color: '#856404' }}>Notes:</p>
          <p style={{ margin: '4px 0 0 0', color: '#856404' }}>{application.notes}</p>
        </div>
      )}

      {/* Social Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        {/* Like Button */}
        {canLike() && (
          <button
            onClick={handleToggleLike}
            disabled={isLiking}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: isLiked ? '#e3f2fd' : '#fff',
              color: isLiked ? '#1976d2' : '#666',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <span>👍</span>
            {isLiked ? 'Liked' : 'Like'}
            {application.likes?.length > 0 && ` (${application.likes.length})`}
          </button>
        )}

        {/* Comment Button */}
        {canComment() && (
          <button
            onClick={() => setShowComments(!showComments)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#fff',
              color: '#666',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <span>💬</span>
            Comments
            {application.comments?.length > 0 && ` (${application.comments.length})`}
          </button>
        )}

        {/* Status Update Button (for companies) */}
        {user.role === 'company' && (
          <button
            onClick={() => setShowStatusForm(!showStatusForm)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#fff',
              color: '#666',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📝 Update Status
          </button>
        )}
      </div>

      {/* Status Update Form */}
      {showStatusForm && user.role === 'company' && (
        <form onSubmit={handleUpdateStatus} style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Status:</label>
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
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Notes:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this application..."
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
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

      {/* Comments Section */}
      {showComments && (
        <div style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
          <h5 style={{ margin: '0 0 12px 0' }}>Comments</h5>
          
          {/* Add Comment Form */}
          {canComment() && (
            <form onSubmit={handleSubmitComment} style={{ marginBottom: '16px' }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '60px',
                  marginBottom: '8px'
                }}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isCommenting}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {isCommenting ? 'Adding...' : 'Add Comment'}
              </button>
            </form>
          )}

          {/* Comments List */}
          <div>
            {application.comments?.length > 0 ? (
              application.comments.map((comment, index) => (
                <div key={index} style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>
                      {comment.user?.name || 'Unknown'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: '0', fontSize: '14px' }}>{comment.text}</p>
                </div>
              ))
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No comments yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
