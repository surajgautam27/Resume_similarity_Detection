import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { showError } from '../utils/toast';

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPost, setNewPost] = useState('');
  const [commentInputs, setCommentInputs] = useState({});

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/posts');
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
      const res = await axios.post('/api/posts', { content });
      const created = res.data.post;
      setPosts(prev => [created, ...prev]);
      setNewPost('');
    } catch (err) {
      showError('Failed to create post: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const res = await axios.post(`/api/posts/${postId}/like`);
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
      const res = await axios.post(`/api/posts/${postId}/comments`, { text });
      const comments = res.data.comments || [];
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments } : p));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      showError('Failed to comment: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div>Loading feed...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 700, margin: '30px auto', padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Feed</h2>
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
        {posts.map(post => (
          <div key={post._id} style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 6 }}>
              {post.author?.name || 'User'} • {post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}
            </div>
            <div style={{ fontSize: 15, color: '#343a40', whiteSpace: 'pre-wrap' }}>{post.content}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => handleToggleLike(post._id)} style={{ padding: '6px 10px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                Like ({post.likes ? post.likes.length : 0})
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
        ))}
      </div>
    </div>
  );
}


