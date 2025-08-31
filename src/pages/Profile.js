import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Saved profile shown in the summary card
  const [savedProfile, setSavedProfile] = useState(null);
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
      const res = await axios.get('/api/auth/profile');
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
      await axios.put('/api/auth/profile', payload);
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

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Profile</h2>
      
      {/* Public Visibility Notice */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '16px', 
        background: '#e8f5e8', 
        borderRadius: '8px', 
        border: '1px solid #4caf50'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          marginBottom: '8px',
          color: '#2e7d32',
          fontWeight: '600'
        }}>
          <span style={{ fontSize: '18px' }}>🔓</span>
          <span>Your profile is publicly visible to everyone in our community</span>
        </div>
        <p style={{ 
          margin: '0', 
          fontSize: '14px', 
          color: '#388e3c',
          opacity: 0.8 
        }}>
          This means all developers and companies can see your profile information. Keep this in mind when sharing personal details.
        </p>
      </div>
      
      {/* Summary Card */}
      <div style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#212529' }}>{savedProfile?.name || 'Your Name'}</div>
            <div style={{ fontSize: 14, color: '#6c757d', marginTop: 4 }}>{savedProfile?.profile?.headline || 'Add a headline'}</div>
            <div style={{ fontSize: 13, color: '#6c757d', marginTop: 2 }}>{savedProfile?.company ? `Company: ${savedProfile.company}` : ''}</div>
            {savedProfile?.profile?.bio && (
              <div style={{ fontSize: 14, color: '#343a40', marginTop: 10, whiteSpace: 'pre-wrap' }}>{savedProfile.profile.bio}</div>
            )}
            {(savedProfile?.profile?.skills?.length > 0) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {savedProfile.profile.skills.map((s, idx) => (
                  <span key={idx} style={{ background: '#e9f2ff', color: '#0d6efd', border: '1px solid #b6d4fe', borderRadius: 12, padding: '4px 8px', fontSize: 12 }}>
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ minWidth: 200 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#212529' }}>Social</div>
            <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
              {savedProfile?.profile?.social?.website && <a href={savedProfile.profile.social.website} target="_blank" rel="noreferrer">Website</a>}
              {savedProfile?.profile?.social?.github && <a href={savedProfile.profile.social.github} target="_blank" rel="noreferrer">GitHub</a>}
              {savedProfile?.profile?.social?.linkedin && <a href={savedProfile.profile.social.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
              {savedProfile?.profile?.social?.twitter && <a href={savedProfile.profile.social.twitter} target="_blank" rel="noreferrer">Twitter</a>}
              {!((savedProfile?.profile?.social?.website) || (savedProfile?.profile?.social?.github) || (savedProfile?.profile?.social?.linkedin) || (savedProfile?.profile?.social?.twitter)) && (
                <div style={{ color: '#6c757d' }}>No links added</div>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13, color: '#6c757d' }}>
          <div>Education: {savedProfile?.profile?.education?.length || 0}</div>
          <div>Experience: {savedProfile?.profile?.experience?.length || 0}</div>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6c757d' }}>Name</label>
            <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #dee2e6', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6c757d' }}>Company</label>
            <input value={form.company} onChange={(e) => handleChange('company', e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #dee2e6', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6c757d' }}>Headline</label>
            <input value={form.profile.headline} onChange={(e) => handleChange('profile.headline', e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #dee2e6', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6c757d' }}>Bio</label>
            <textarea rows={4} value={form.profile.bio} onChange={(e) => handleChange('profile.bio', e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #dee2e6', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6c757d' }}>Skills (press Enter or Comma to add)</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', border: '1px solid #dee2e6', borderRadius: 6, padding: 8 }}>
              {(form.profile.skills || []).map((s, idx) => (
                <span key={idx} style={{ background: '#e9f2ff', color: '#0d6efd', border: '1px solid #b6d4fe', borderRadius: 12, padding: '4px 8px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} style={{ background: 'transparent', border: 'none', color: '#0d6efd', cursor: 'pointer', padding: 0 }}>×</button>
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
                style={{ flex: 1, minWidth: 160, border: 'none', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontWeight: 600 }}>Social</div>
            <input placeholder="Website" value={form.profile.social.website} onChange={(e) => handleChange('profile.social.website', e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #dee2e6', borderRadius: 6 }} />
            <input placeholder="GitHub" value={form.profile.social.github} onChange={(e) => handleChange('profile.social.github', e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #dee2e6', borderRadius: 6 }} />
            <input placeholder="LinkedIn" value={form.profile.social.linkedin} onChange={(e) => handleChange('profile.social.linkedin', e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #dee2e6', borderRadius: 6 }} />
            <input placeholder="Twitter" value={form.profile.social.twitter} onChange={(e) => handleChange('profile.social.twitter', e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #dee2e6', borderRadius: 6 }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>Education</div>
              <button type="button" onClick={handleAddEducation} style={{ padding: '6px 10px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Add</button>
            </div>
            <div style={{ fontSize: 12, color: '#6c757d', marginTop: 6 }}>Add each school with your degree, field, and years attended.</div>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              {(form.profile.education || []).map((ed, idx) => (
                <div key={idx} style={{ border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
                  <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#6c757d' }}>School/University</label>
                      <input placeholder="e.g., ABC University" value={ed.school || ''} onChange={(e) => updateEducation(idx, 'school', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#6c757d' }}>Degree</label>
                      <input placeholder="e.g., BSc, MSc" value={ed.degree || ''} onChange={(e) => updateEducation(idx, 'degree', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#6c757d' }}>Field of Study</label>
                      <input placeholder="e.g., Computer Science" value={ed.field || ''} onChange={(e) => updateEducation(idx, 'field', e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr auto', marginTop: 8, alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#6c757d' }}>Start Date</label>
                      <input type="date" value={ed.startDate || ''} onChange={(e) => updateEducation(idx, 'startDate', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#6c757d' }}>End Date</label>
                      <input type="date" value={ed.endDate || ''} onChange={(e) => updateEducation(idx, 'endDate', e.target.value)} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <button type="button" onClick={() => removeEducation(idx)} style={{ padding: '6px 10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>Experience</div>
              <button type="button" onClick={handleAddExperience} style={{ padding: '6px 10px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Add</button>
            </div>
            <div style={{ fontSize: 12, color: '#6c757d', marginTop: 6 }}>Add each role with company, dates, and a short description.</div>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              {(form.profile.experience || []).map((ex, idx) => (
                <div key={idx} style={{ border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
                  <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#6c757d' }}>Company</label>
                      <input placeholder="e.g., Acme Inc." value={ex.company || ''} onChange={(e) => updateExperience(idx, 'company', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#6c757d' }}>Role/Title</label>
                      <input placeholder="e.g., Software Engineer" value={ex.role || ''} onChange={(e) => updateExperience(idx, 'role', e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr', marginTop: 8 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#6c757d' }}>Start Date</label>
                      <input type="date" value={ex.startDate || ''} onChange={(e) => updateExperience(idx, 'startDate', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#6c757d' }}>End Date</label>
                      <input type="date" value={ex.endDate || ''} onChange={(e) => updateExperience(idx, 'endDate', e.target.value)} />
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#6c757d' }}>Description</label>
                    <textarea placeholder="Key responsibilities and achievements" value={ex.description || ''} onChange={(e) => updateExperience(idx, 'description', e.target.value)} />
                  </div>
                  <div style={{ textAlign: 'right', marginTop: 8 }}>
                    <button type="button" onClick={() => removeExperience(idx)} style={{ padding: '6px 10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <button type="submit" style={{ padding: '10px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Save Profile</button>
          </div>
        </div>
      </form>
    </div>
  );
} 