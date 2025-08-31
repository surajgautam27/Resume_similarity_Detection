import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { showError } from '../utils/toast';

export default function PublicProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPublicProfile = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/auth/public-profile/${userId}`);
        setProfile(res.data.user);
      } catch (err) {
        setError('Failed to load profile or profile not found');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPublicProfile();
    }
  }, [userId]);

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading profile...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '40px' }}>{error}</div>;
  if (!profile) return <div style={{ textAlign: 'center', padding: '40px' }}>Profile not found</div>;

  const isCompany = profile.role === 'company';
  const isDeveloper = profile.role === 'developer';

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '24px', background: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      {/* Public Visibility Notice */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '12px 16px', 
        background: '#e8f5e8', 
        borderRadius: '8px', 
        border: '1px solid #4caf50',
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          justifyContent: 'center',
          color: '#2e7d32',
          fontWeight: '500',
          fontSize: '14px'
        }}>
          <span>🔓</span>
          <span>This profile is publicly visible to everyone in our community</span>
        </div>
      </div>

      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #f0f0f0' }}>
        <div style={{ 
          width: '120px', 
          height: '120px', 
          borderRadius: '50%', 
          background: isCompany ? '#e3f2fd' : '#f3e5f5', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 16px',
          fontSize: '48px',
          color: isCompany ? '#1976d2' : '#7b1fa2'
        }}>
          {isCompany ? '🏢' : '👨‍💻'}
        </div>
        
        <h1 style={{ margin: '0 0 8px 0', color: '#2c3e50', fontSize: '32px' }}>
          {profile.name || 'Unknown'}
        </h1>
        
        {profile.profile?.headline && (
          <p style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#7f8c8d', fontStyle: 'italic' }}>
            {profile.profile.headline}
          </p>
        )}

        <div style={{ 
          display: 'inline-block', 
          padding: '8px 16px', 
          background: isCompany ? '#e3f2fd' : '#f3e5f5', 
          color: isCompany ? '#1976d2' : '#7b1fa2', 
          borderRadius: '20px', 
          fontSize: '14px', 
          fontWeight: '600',
          textTransform: 'uppercase'
        }}>
          {isCompany ? 'Company' : 'Developer'}
        </div>

        {isCompany && profile.company && (
          <p style={{ margin: '16px 0 0 0', fontSize: '16px', color: '#34495e', fontWeight: '500' }}>
            Company: {profile.company}
          </p>
        )}
      </div>

      {/* Bio Section */}
      {profile.profile?.bio && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '20px' }}>About</h3>
          <p style={{ 
            margin: 0, 
            fontSize: '16px', 
            lineHeight: '1.6', 
            color: '#34495e',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            {profile.profile.bio}
          </p>
        </div>
      )}

      {/* Skills Section */}
      {profile.profile?.skills && profile.profile.skills.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '20px' }}>
            {isCompany ? 'Company Focus Areas' : 'Skills & Technologies'}
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {profile.profile.skills.map((skill, idx) => (
              <span key={idx} style={{
                background: isCompany ? '#e3f2fd' : '#f3e5f5',
                color: isCompany ? '#1976d2' : '#7b1fa2',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                border: `1px solid ${isCompany ? '#bbdefb' : '#e1bee7'}`
              }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Education Section (for developers) */}
      {isDeveloper && profile.profile?.education && profile.profile.education.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '20px' }}>Education</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            {profile.profile.education.map((ed, idx) => (
              <div key={idx} style={{
                padding: '16px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ margin: '0', color: '#2c3e50', fontSize: '16px' }}>{ed.school}</h4>
                  <span style={{ fontSize: '14px', color: '#7f8c8d' }}>
                    {ed.startYear} - {ed.endYear || 'Present'}
                  </span>
                </div>
                <p style={{ margin: '4px 0', color: '#34495e', fontWeight: '500' }}>
                  {ed.degree} in {ed.field}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience Section (for developers) */}
      {isDeveloper && profile.profile?.experience && profile.profile.experience.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '20px' }}>Experience</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            {profile.profile.experience.map((exp, idx) => (
              <div key={idx} style={{
                padding: '16px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ margin: '0', color: '#2c3e50', fontSize: '16px' }}>{exp.role}</h4>
                  <span style={{ fontSize: '14px', color: '#7f8c8d' }}>
                    {exp.startDate ? new Date(exp.startDate).getFullYear() : ''} - {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present'}
                  </span>
                </div>
                <p style={{ margin: '4px 0 8px 0', color: '#34495e', fontWeight: '500' }}>
                  {exp.company}
                </p>
                {exp.description && (
                  <p style={{ margin: '0', color: '#7f8c8d', fontSize: '14px', lineHeight: '1.5' }}>
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Links Section */}
      {profile.profile?.social && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '20px' }}>Connect</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {profile.profile.social.website && (
              <a 
                href={profile.profile.social.website} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#3498db',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🌐 Website
              </a>
            )}
            {profile.profile.social.github && (
              <a 
                href={profile.profile.social.github} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#333',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                📚 GitHub
              </a>
            )}
            {profile.profile.social.linkedin && (
              <a 
                href={profile.profile.social.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#0077b5',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                💼 LinkedIn
              </a>
            )}
            {profile.profile.social.twitter && (
              <a 
                href={profile.profile.social.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#1da1f2',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🐦 Twitter
              </a>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        justifyContent: 'center', 
        paddingTop: '24px', 
        borderTop: '2px solid #f0f0f0' 
      }}>
        {isCompany ? (
          <Link 
            to="/jobs" 
            style={{
              padding: '12px 24px',
              background: '#27ae60',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            🚀 View Job Postings
          </Link>
        ) : (
          <Link 
            to="/jobs" 
            style={{
              padding: '12px 24px',
              background: '#e74c3c',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            💼 Browse Jobs
          </Link>
        )}
        
        <Link 
          to="/posts" 
          style={{
            padding: '12px 24px',
            background: '#9b59b6',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          📱 View Social Feed
        </Link>
      </div>
    </div>
  );
}
