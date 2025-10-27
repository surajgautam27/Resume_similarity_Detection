import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/Api';
import { showError } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';

export default function Posts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPost, setNewPost] = useState('');
  const [commentInputs, setCommentInputs] = useState({});

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/posts`);
      setPosts(res.data.posts || []);
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async () => {
    const content = newPost.trim();
    if (!content) return;
    try {
      const res = await axios.post(`${API_URL}/posts`, { content });
      const created = res.data.post;
      setPosts(prev => [created, ...prev]);
      setNewPost('');
    } catch (err) {
      showError('Failed to create post: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const res = await axios.post(`${API_URL}/posts/${postId}/like`);
      const updated = res.data.post;
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, ...updated } : p));
    } catch (err) {
      showError('Failed to like post: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const handleSubmitComment = async (postId) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;
    try {
      const res = await axios.post(`${API_URL}/posts/${postId}/comments`, { text });
      const comments = res.data.comments || [];
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments } : p));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      showError('Failed to comment: ' + (err.response?.data?.error || err.message));
    }
  };

  // Check if current user has liked a post
  const hasUserLiked = (post) => {
    if (!user || !post.likes) return false;
    return post.likes.some(likeId => likeId.toString() === user._id);
  };

  if (loading) return <div>Loading feed...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '30px auto', padding: 16 }}>

      <h2 style={{ marginBottom: 16 }}>Feed</h2>
      
      {/* Directory Link */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9 }}>
          👥 Discover developers and companies in our community
        </p>
        <a 
          href="/directory" 
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid rgba(255,255,255,0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)';
          }}
        >
          Explore Directory
        </a>
      </div>
      
      <div style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <textarea
          rows={3}
          placeholder="What's on your mind?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          style={{ width: '100%', padding: 10, border: '1px solid #dee2e6', borderRadius: 6 }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={handleCreatePost} style={{ padding: '8px 14px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Post
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {posts.map(post => {
          const isLiked = hasUserLiked(post);
          return (
            <div key={post._id} style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 6 }}>
                {post.author?.name || 'User'} • {post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}
                {/* Link to author's public profile */}
                {post.author?._id && (
                  <a 
                    href={`/profile/${post.author._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      marginLeft: '8px',
                      padding: '2px 6px',
                      background: '#f8f9fa',
                      color: '#007bff',
                      textDecoration: 'none',
                      borderRadius: '3px',
                      fontSize: '11px',
                      border: '1px solid #dee2e6'
                    }}
                  >
                    👤 Profile
                  </a>
                )}
              </div>
              <div style={{ fontSize: 15, color: '#343a40', whiteSpace: 'pre-wrap' }}>{post.content}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button 
                  onClick={() => handleToggleLike(post._id)} 
                  style={{ 
                    padding: '6px 10px', 
                    background: isLiked ? '#dc3545' : '#0d6efd', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 4, 
                    cursor: 'pointer', 
                    fontSize: '12px' 
                  }}
                >
                  {isLiked ? 'Unlike' : 'Like'} ({post.likes ? post.likes.length : 0})
                </button>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentInputs[post._id] || ''}
                    onChange={(e) => handleCommentChange(post._id, e.target.value)}
                    style={{ flex: 1, padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: 4 }}
                  />
                  <button onClick={() => handleSubmitComment(post._id)} style={{ padding: '8px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                    Comment
                  </button>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {(post.comments || []).slice().reverse().map((c, idx) => (
                    <div key={idx} style={{ background: '#f8f9fa', border: '1px solid #eee', borderRadius: 6, padding: 10 }}>
                      <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>
                        {c.user?.name || 'User'} • {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                      </div>
                      <div style={{ fontSize: 14, color: '#343a40' }}>{c.text}</div>
                    </div>
                  ))}
                  {(!post.comments || post.comments.length === 0) && (
                    <div style={{ fontSize: 13, color: '#6c757d' }}>No comments yet.</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


