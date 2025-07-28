import React, { useState } from 'react';
import axios from 'axios';

export default function JobPostForm() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    type: 'full-time',
    department: '',
    company: '',
    skills: '',
    priority: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...form,
        requirements: form.requirements
          ? form.requirements.split(',').map(r => r.trim()).filter(Boolean)
          : [],
        skills: form.skills
          ? form.skills.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      };
      await axios.post('/api/jobs', payload);
      setSuccess('Job posted successfully!');
      setForm({
        title: '',
        description: '',
        requirements: '',
        location: '',
        type: 'full-time',
        department: '',
        company: '',
        skills: '',
        priority: 'medium',
      });
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map(e => e.msg).join(' '));
      } else {
        setError(err.response?.data?.error || 'Failed to post job.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <h2>Post a Job</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Title</label>
          <input type="text" name="title" value={form.title} onChange={handleChange} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Requirements (comma separated)</label>
          <input type="text" name="requirements" value={form.requirements} onChange={handleChange} style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Skills (comma separated)</label>
          <input type="text" name="skills" value={form.skills} onChange={handleChange} style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Location</label>
          <input type="text" name="location" value={form.location} onChange={handleChange} style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Type</label>
          <select name="type" value={form.type} onChange={handleChange} style={{ width: '100%', padding: 8, marginTop: 4 }}>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Department</label>
          <input type="text" name="department" value={form.department} onChange={handleChange} style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Company</label>
          <input type="text" name="company" value={form.company} onChange={handleChange} style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Priority</label>
          <select name="priority" value={form.priority} onChange={handleChange} style={{ width: '100%', padding: 8, marginTop: 4 }}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginBottom: 12 }}>{success}</div>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}>
          {loading ? 'Posting...' : 'Post Job'}
        </button>
      </form>
    </div>
  );
} 