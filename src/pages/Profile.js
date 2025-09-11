import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import { API_URL } from '../utils/Api';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedProfile, setSavedProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [form, setForm] = useState({
    name: '',
    company: '',
    profile: {
      headline: '',
      bio: '',
      skills: [],
      social: { website: '', github: '', linkedin: '', twitter: '' },
      education: [],
      experience: []
    }
  });
  const [skillsInput, setSkillsInput] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/auth/profile`);
      const u = res.data.user || {};
      setSavedProfile(u);
      setForm({
        name: u.name || '',
        company: u.company || '',
        profile: {
          headline: u.profile?.headline || '',
          bio: u.profile?.bio || '',
          skills: u.profile?.skills || [],
          social: {
            website: u.profile?.social?.website || '',
            github: u.profile?.social?.github || '',
            linkedin: u.profile?.social?.linkedin || '',
            twitter: u.profile?.social?.twitter || ''
          },
          education: (u.profile?.education || []).map(ed => ({
            ...ed,
            startDate: ed?.startYear ? `${ed.startYear}-01-01` : '',
            endDate: ed?.endYear ? `${ed.endYear}-01-01` : ''
          })),
          experience: u.profile?.experience || []
        }
      });
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (path, value) => {
    setForm(prev => {
      const copy = { ...prev };
      const keys = path.split('.');
      let cur = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        cur[k] = cur[k] || {};
        cur = cur[k];
      }
      cur[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const handleSkillsChange = (v) => {
    setSkillsInput(v);
  };

  const commitSkillToken = () => {
    const token = skillsInput.trim().replace(/,$/, '');
    if (!token) return;
    setForm(prev => ({
      ...prev,
      profile: { ...prev.profile, skills: Array.from(new Set([...(prev.profile.skills || []), token])) }
    }));
    setSkillsInput('');
  };

  const removeSkill = (skill) => {
    setForm(prev => ({
      ...prev,
      profile: { ...prev.profile, skills: (prev.profile.skills || []).filter(s => s !== skill) }
    }));
  };

  const handleAddEducation = () => {
    setForm(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        education: [...(prev.profile.education || []), { school: '', degree: '', field: '', startDate: '', endDate: '' }]
      }
    }));
  };

  const updateEducation = (idx, key, value) => {
    setForm(prev => {
      const ed = [...(prev.profile.education || [])];
      ed[idx] = { ...ed[idx], [key]: value };
      return { ...prev, profile: { ...prev.profile, education: ed } };
    });
  };

  const removeEducation = (idx) => {
    setForm(prev => {
      const ed = [...(prev.profile.education || [])];
      ed.splice(idx, 1);
      return { ...prev, profile: { ...prev.profile, education: ed } };
    });
  };

  const handleAddExperience = () => {
    setForm(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        experience: [...(prev.profile.experience || []), { company: '', role: '', startDate: '', endDate: '', description: '' }]
      }
    }));
  };

  const updateExperience = (idx, key, value) => {
    setForm(prev => {
      const ex = [...(prev.profile.experience || [])];
      ex[idx] = { ...ex[idx], [key]: value };
      return { ...prev, profile: { ...prev.profile, experience: ex } };
    });
  };

  const removeExperience = (idx) => {
    setForm(prev => {
      const ex = [...(prev.profile.experience || [])];
      ex.splice(idx, 1);
      return { ...prev, profile: { ...prev.profile, experience: ex } };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Map education date inputs to year numbers for API
      const mappedEducation = (form.profile.education || []).map(ed => ({
        school: ed.school,
        degree: ed.degree,
        field: ed.field,
        startYear: ed.startDate ? new Date(ed.startDate).getFullYear() : undefined,
        endYear: ed.endDate ? new Date(ed.endDate).getFullYear() : undefined
      }));

      const payload = {
        name: form.name,
        company: form.company,
        profile: {
          headline: form.profile.headline,
          bio: form.profile.bio,
          skills: form.profile.skills,
          social: form.profile.social,
          education: mappedEducation,
          experience: form.profile.experience
        }
      };
      await axios.put(`${API_URL}/auth/profile`, payload);
      showSuccess('Profile updated successfully!');
      // Clear form after save, but keep summary showing saved data
      setSavedProfile(prev => ({ ...prev, ...payload, profile: { ...prev?.profile, ...payload.profile } }));
      setForm({
        name: '',
        company: '',
        profile: {
          headline: '',
          bio: '',
          skills: [],
          social: { website: '', github: '', linkedin: '', twitter: '' },
          education: [],
          experience: []
        }
      });
      setSkillsInput('');
    } catch (err) {
      showError('Failed to update profile: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return (
    <div className="profile-container">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="profile-container">
      <div className="error-message">{error}</div>
    </div>
  );

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Your Profile</h2>
        <p>Manage your professional information</p>
      </div>
      
      {/* Public Visibility Notice */}
      <div className="visibility-notice">
        <div className="notice-header">
          <span className="notice-icon">🔓</span>
          <span>Your profile is publicly visible</span>
        </div>
        <p>This means all developers and companies can see your profile information. Keep this in mind when sharing personal details.</p>
      </div>
      
      {/* Summary Card */}
      <div className="summary-card">
        <div className="summary-content">
          <div className="summary-main">
            <div className="summary-name">{savedProfile?.name || 'Your Name'}</div>
            <div className="summary-headline">{savedProfile?.profile?.headline || 'Add a headline'}</div>
            {savedProfile?.company && (
              <div className="summary-company">{savedProfile.company}</div>
            )}
            {savedProfile?.profile?.bio && (
              <div className="summary-bio">{savedProfile.profile.bio}</div>
            )}
            {(savedProfile?.profile?.skills?.length > 0) && (
              <div className="skills-container">
                {savedProfile.profile.skills.map((s, idx) => (
                  <span key={idx} className="skill-tag">{s}</span>
                ))}
              </div>
            )}
          </div>
          <div className="summary-sidebar">
            <div className="sidebar-title">Social Links</div>
            <div className="social-links">
              {savedProfile?.profile?.social?.website && (
                <a href={savedProfile.profile.social.website} target="_blank" rel="noreferrer" className="social-link">
                  <span className="social-icon">🌐</span> Website
                </a>
              )}
              {savedProfile?.profile?.social?.github && (
                <a href={savedProfile.profile.social.github} target="_blank" rel="noreferrer" className="social-link">
                  <span className="social-icon">🐱</span> GitHub
                </a>
              )}
              {savedProfile?.profile?.social?.linkedin && (
                <a href={savedProfile.profile.social.linkedin} target="_blank" rel="noreferrer" className="social-link">
                  <span className="social-icon">👔</span> LinkedIn
                </a>
              )}
              {savedProfile?.profile?.social?.twitter && (
                <a href={savedProfile.profile.social.twitter} target="_blank" rel="noreferrer" className="social-link">
                  <span className="social-icon">🐦</span> Twitter
                </a>
              )}
              {!((savedProfile?.profile?.social?.website) || (savedProfile?.profile?.social?.github) || 
                (savedProfile?.profile?.social?.linkedin) || (savedProfile?.profile?.social?.twitter)) && (
                <div className="no-links">No social links added</div>
              )}
            </div>
          </div>
        </div>
        <div className="summary-footer">
          <div className="stats">
            <div className="stat">
              <span className="stat-number">{savedProfile?.profile?.education?.length || 0}</span>
              <span className="stat-label">Education</span>
            </div>
            <div className="stat">
              <span className="stat-number">{savedProfile?.profile?.experience?.length || 0}</span>
              <span className="stat-label">Experience</span>
            </div>
            <div className="stat">
              <span className="stat-number">{savedProfile?.profile?.skills?.length || 0}</span>
              <span className="stat-label">Skills</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="edit-form-container">
        <div className="form-tabs">
          <button 
            className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          <button 
            className={`tab ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            Social Links
          </button>
          <button 
            className={`tab ${activeTab === 'education' ? 'active' : ''}`}
            onClick={() => setActiveTab('education')}
          >
            Education
          </button>
          <button 
            className={`tab ${activeTab === 'experience' ? 'active' : ''}`}
            onClick={() => setActiveTab('experience')}
          >
            Experience
          </button>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          {(activeTab === 'basic') && (
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Name</label>
                  <input 
                    value={form.name} 
                    onChange={(e) => handleChange('name', e.target.value)} 
                    placeholder="Your full name"
                  />
                </div>
                <div className="input-group">
                  <label>Company</label>
                  <input 
                    value={form.company} 
                    onChange={(e) => handleChange('company', e.target.value)} 
                    placeholder="Where you work"
                  />
                </div>
                <div className="input-group">
                  <label>Professional Headline</label>
                  <input 
                    value={form.profile.headline} 
                    onChange={(e) => handleChange('profile.headline', e.target.value)} 
                    placeholder="e.g., Senior Frontend Developer"
                  />
                </div>
                <div className="input-group full-width">
                  <label>Bio</label>
                  <textarea 
                    rows={4} 
                    value={form.profile.bio} 
                    onChange={(e) => handleChange('profile.bio', e.target.value)} 
                    placeholder="Tell others about yourself and your experience"
                  />
                </div>
                <div className="input-group full-width">
                  <label>Skills (press Enter or Comma to add)</label>
                  <div className="skills-input-container">
                    {(form.profile.skills || []).map((s, idx) => (
                      <span key={idx} className="skill-tag editable">
                        {s}
                        <button 
                          type="button" 
                          onClick={() => removeSkill(s)}
                          className="remove-skill"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      value={skillsInput}
                      onChange={(e) => handleSkillsChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          commitSkillToken();
                        }
                      }}
                      placeholder="Type a skill and press Enter"
                      className="skills-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'social') && (
            <div className="form-section">
              <h3>Social Links</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Website</label>
                  <input 
                    placeholder="https://yourwebsite.com" 
                    value={form.profile.social.website} 
                    onChange={(e) => handleChange('profile.social.website', e.target.value)} 
                  />
                </div>
                <div className="input-group">
                  <label>GitHub</label>
                  <input 
                    placeholder="https://github.com/username" 
                    value={form.profile.social.github} 
                    onChange={(e) => handleChange('profile.social.github', e.target.value)} 
                  />
                </div>
                <div className="input-group">
                  <label>LinkedIn</label>
                  <input 
                    placeholder="https://linkedin.com/in/username" 
                    value={form.profile.social.linkedin} 
                    onChange={(e) => handleChange('profile.social.linkedin', e.target.value)} 
                  />
                </div>
                <div className="input-group">
                  <label>Twitter</label>
                  <input 
                    placeholder="https://twitter.com/username" 
                    value={form.profile.social.twitter} 
                    onChange={(e) => handleChange('profile.social.twitter', e.target.value)} 
                  />
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'education') && (
            <div className="form-section">
              <div className="section-header">
                <h3>Education</h3>
                <button 
                  type="button" 
                  onClick={handleAddEducation}
                  className="add-button"
                >
                  + Add Education
                </button>
              </div>
              <p className="section-description">Add each school with your degree, field, and years attended.</p>
              
              <div className="cards-container">
                {(form.profile.education || []).map((ed, idx) => (
                  <div key={idx} className="card">
                    <div className="card-header">
                      <h4>Education #{idx + 1}</h4>
                      <button 
                        type="button" 
                        onClick={() => removeEducation(idx)}
                        className="remove-button"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="card-content">
                      <div className="form-grid">
                        <div className="input-group">
                          <label>School/University</label>
                          <input 
                            placeholder="e.g., ABC University" 
                            value={ed.school || ''} 
                            onChange={(e) => updateEducation(idx, 'school', e.target.value)} 
                          />
                        </div>
                        <div className="input-group">
                          <label>Degree</label>
                          <input 
                            placeholder="e.g., BSc, MSc" 
                            value={ed.degree || ''} 
                            onChange={(e) => updateEducation(idx, 'degree', e.target.value)} 
                          />
                        </div>
                        <div className="input-group">
                          <label>Field of Study</label>
                          <input 
                            placeholder="e.g., Computer Science" 
                            value={ed.field || ''} 
                            onChange={(e) => updateEducation(idx, 'field', e.target.value)} 
                          />
                        </div>
                        <div className="input-group">
                          <label>Start Date</label>
                          <input 
                            type="date" 
                            value={ed.startDate || ''} 
                            onChange={(e) => updateEducation(idx, 'startDate', e.target.value)} 
                          />
                        </div>
                        <div className="input-group">
                          <label>End Date (or expected)</label>
                          <input 
                            type="date" 
                            value={ed.endDate || ''} 
                            onChange={(e) => updateEducation(idx, 'endDate', e.target.value)} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'experience') && (
            <div className="form-section">
              <div className="section-header">
                <h3>Work Experience</h3>
                <button 
                  type="button" 
                  onClick={handleAddExperience}
                  className="add-button"
                >
                  + Add Experience
                </button>
              </div>
              <p className="section-description">Add each role with company, dates, and a short description.</p>
              
              <div className="cards-container">
                {(form.profile.experience || []).map((ex, idx) => (
                  <div key={idx} className="card">
                    <div className="card-header">
                      <h4>Experience #{idx + 1}</h4>
                      <button 
                        type="button" 
                        onClick={() => removeExperience(idx)}
                        className="remove-button"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="card-content">
                      <div className="form-grid">
                        <div className="input-group">
                          <label>Company</label>
                          <input 
                            placeholder="e.g., Acme Inc." 
                            value={ex.company || ''} 
                            onChange={(e) => updateExperience(idx, 'company', e.target.value)} 
                          />
                        </div>
                        <div className="input-group">
                          <label>Role/Title</label>
                          <input 
                            placeholder="e.g., Software Engineer" 
                            value={ex.role || ''} 
                            onChange={(e) => updateExperience(idx, 'role', e.target.value)} 
                          />
                        </div>
                        <div className="input-group">
                          <label>Start Date</label>
                          <input 
                            type="date" 
                            value={ex.startDate || ''} 
                            onChange={(e) => updateExperience(idx, 'startDate', e.target.value)} 
                          />
                        </div>
                        <div className="input-group">
                          <label>End Date (leave blank if current)</label>
                          <input 
                            type="date" 
                            value={ex.endDate || ''} 
                            onChange={(e) => updateExperience(idx, 'endDate', e.target.value)} 
                          />
                        </div>
                        <div className="input-group full-width">
                          <label>Description</label>
                          <textarea 
                            placeholder="Key responsibilities and achievements" 
                            value={ex.description || ''} 
                            onChange={(e) => updateExperience(idx, 'description', e.target.value)} 
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="save-button">Save Profile</button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .profile-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          color: #333;
        }
        
        .profile-header {
          margin-bottom: 24px;
        }
        
        .profile-header h2 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #2d3748;
        }
        
        .profile-header p {
          color: #718096;
          margin: 0;
        }
        
        .visibility-notice {
          background: #f0fff4;
          border: 1px solid #9ae6b4;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .notice-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #2f855a;
          font-weight: 600;
        }
        
        .notice-icon {
          font-size: 18px;
        }
        
        .visibility-notice p {
          margin: 0;
          font-size: 14px;
          color: #38a169;
        }
        
        .summary-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          padding: 24px;
          margin-bottom: 32px;
          border: 1px solid #e2e8f0;
        }
        
        .summary-content {
          display: flex;
          gap: 32px;
          margin-bottom: 20px;
        }
        
        .summary-main {
          flex: 1;
        }
        
        .summary-name {
          font-size: 24px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 4px;
        }
        
        .summary-headline {
          font-size: 16px;
          color: #4a5568;
          margin-bottom: 8px;
        }
        
        .summary-company {
          font-size: 14px;
          color: #718096;
          margin-bottom: 16px;
        }
        
        .summary-bio {
          font-size: 15px;
          color: #4a5568;
          line-height: 1.5;
          margin-bottom: 16px;
          white-space: pre-wrap;
        }
        
        .skills-container {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .skill-tag {
          background: #ebf8ff;
          color: #3182ce;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 500;
        }
        
        .summary-sidebar {
          min-width: 200px;
        }
        
        .sidebar-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 12px;
          color: #4a5568;
        }
        
        .social-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .social-link {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #4299e1;
          text-decoration: none;
        }
        
        .social-link:hover {
          text-decoration: underline;
        }
        
        .no-links {
          color: #a0aec0;
          font-size: 14px;
        }
        
        .summary-footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
        }
        
        .stats {
          display: flex;
          gap: 24px;
        }
        
        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .stat-number {
          font-size: 18px;
          font-weight: 700;
          color: #4a5568;
        }
        
        .stat-label {
          font-size: 13px;
          color: #718096;
        }
        
        .edit-form-container {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        
        .form-tabs {
          display: flex;
          border-bottom: 1px solid #e2e8f0;
          background: #f7fafc;
        }
        
        .tab {
          padding: 16px 24px;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 500;
          color: #718096;
          cursor: pointer;
          position: relative;
        }
        
        .tab:hover {
          color: #4299e1;
        }
        
        .tab.active {
          color: #4299e1;
          font-weight: 600;
        }
        
        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #4299e1;
        }
        
        .profile-form {
          padding: 24px;
        }
        
        .form-section {
          margin-bottom: 32px;
        }
        
        .form-section h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: #2d3748;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        .full-width {
          grid-column: 1 / -1;
        }
        
        .input-group {
          display: flex;
          flex-direction: column;
        }
        
        .input-group label {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 6px;
          color: #4a5568;
        }
        
        .input-group input,
        .input-group textarea {
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        
        .input-group input:focus,
        .input-group textarea:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
        }
        
        .skills-input-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px;
          min-height: 44px;
        }
        
        .skills-input {
          flex: 1;
          min-width: 120px;
          border: none;
          outline: none;
          padding: 4px;
        }
        
        .editable {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        
        .remove-skill {
          background: transparent;
          border: none;
          color: #e53e3e;
          cursor: pointer;
          padding: 0;
          font-size: 16px;
          line-height: 1;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .add-button {
          padding: 8px 16px;
          background: #4299e1;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .add-button:hover {
          background: #3182ce;
        }
        
        .section-description {
          font-size: 14px;
          color: #718096;
          margin: 0 0 16px 0;
        }
        
        .cards-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f7fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .card-header h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #4a5568;
        }
        
        .remove-button {
          padding: 6px 12px;
          background: #e53e3e;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
        }
        
        .card-content {
          padding: 16px;
        }
        
        .form-actions {
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          text-align: right;
        }
        
        .save-button {
          padding: 12px 24px;
          background: #48bb78;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .save-button:hover {
          background: #38a169;
        }
        
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #4299e1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-message {
          padding: 20px;
          background: #fed7d7;
          color: #c53030;
          border-radius: 8px;
          text-align: center;
        }
        
        @media (max-width: 768px) {
          .profile-container {
            padding: 16px;
          }
          
          .summary-content {
            flex-direction: column;
            gap: 16px;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .form-tabs {
            overflow-x: auto;
            white-space: nowrap;
          }
          
          .stats {
            justify-content: space-around;
          }
        }
      `}</style>
    </div>
  );
}