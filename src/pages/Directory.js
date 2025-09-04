import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../utils/Api';
import { showError } from '../utils/toast';

export default function Directory() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'developer', 'company'
  const [skillFilter, setSkillFilter] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'role', 'recent'

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/auth/directory`);
      setUsers(res.data.users || []);
    } catch (err) {
      setError('Failed to load directory');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search users
  const filteredUsers = users.filter(user => {
    // Simple filtering - just check if user exists
    if (!user || !user.name) return false;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        user.name.toLowerCase().includes(searchLower) ||
        (user.company && user.company.toLowerCase().includes(searchLower)) ||
        (user.profile?.headline && user.profile.headline.toLowerCase().includes(searchLower)) ||
        (user.profile?.skills && user.profile.skills.some(skill => skill.toLowerCase().includes(searchLower)));
      
      if (!matchesSearch) return false;
    }
    
    // Apply role filter
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false;
    }
    
    // Apply skills filter
    if (skillFilter && (!user.profile?.skills || !user.profile.skills.includes(skillFilter))) {
      return false;
    }
    
    return true;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'role':
        return (a.role || '').localeCompare(b.role || '');
      case 'recent':
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      default:
        return 0;
    }
  });

  // Get unique skills for filter dropdown
  const allSkills = [...new Set(
    users.flatMap(user => user.profile?.skills || [])
  )].sort();

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading directory...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '40px' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '36px' }}>
          👥 Community Directory
        </h1>
        <p style={{ margin: '0', fontSize: '18px', color: '#7f8c8d' }}>
          Discover developers and companies in our community
        </p>
        
        {/* Visibility Message */}
        <div style={{ 
          marginTop: '20px', 
          padding: '16px 24px', 
          background: '#e8f5e8', 
          borderRadius: '8px', 
          border: '1px solid #4caf50',
          maxWidth: '600px',
          margin: '20px auto 0'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            justifyContent: 'center',
            color: '#2e7d32',
            fontWeight: '500'
          }}>
            <span style={{ fontSize: '20px' }}>🔓</span>
            <span>Open Community - All developers and companies can see each other</span>
          </div>
          <p style={{ 
            margin: '8px 0 0 0', 
            fontSize: '14px', 
            color: '#388e3c',
            opacity: 0.8 
          }}>
            This directory is completely public and accessible to everyone in our community
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        background: '#fff', 
        padding: '24px', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {/* Search */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
              🔍 Search
            </label>
            <input
              type="text"
              placeholder="Search by name, company, skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>

          {/* Role Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
              👤 Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              <option value="all">All Roles</option>
              <option value="developer">Developers</option>
              <option value="company">Companies</option>
            </select>
          </div>

          {/* Skills Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
              🛠️ Skills
            </label>
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              <option value="">All Skills</option>
              {allSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
              📊 Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              <option value="name">Name</option>
              <option value="role">Role</option>
              <option value="recent">Recently Joined</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          textAlign: 'center',
          color: '#6c757d'
        }}>
          Showing {sortedUsers.length} of {users.length} users
        </div>
      </div>

      {/* Users Grid */}
      {sortedUsers.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          background: '#fff', 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#6c757d' }}>
            {users.length === 0 ? 'No Users Found' : 'No Users Match Your Filters'}
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#6c757d' }}>
            {users.length === 0 
              ? 'The directory appears to be empty. This might mean there are no users in the database yet, or there might be an issue with the backend.'
              : 'Try adjusting your search criteria or filters to see more results.'
            }
          </p>
          {users.length === 0 && (
            <div style={{ 
              background: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #dee2e6',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#495057' }}>Debug Information:</h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6c757d' }}>
                • Raw users from backend: {users.length}
              </p>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6c757d' }}>
                • Check browser console for detailed response
              </p>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6c757d' }}>
                • Verify backend is running and database has users
              </p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gap: '24px', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' 
        }}>
          {sortedUsers.map(user => (
            <div key={user._id} style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #f0f0f0',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }} 
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
            >
              {/* User Header */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: user.role === 'company' ? '#e3f2fd' : '#f3e5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  fontSize: '24px',
                  color: user.role === 'company' ? '#1976d2' : '#7b1fa2'
                }}>
                  {user.role === 'company' ? '🏢' : '👨‍💻'}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', color: '#2c3e50', fontSize: '20px' }}>
                    {user.name || 'Unknown'}
                  </h3>
                  <div style={{ 
                    display: 'inline-block', 
                    padding: '4px 12px', 
                    background: user.role === 'company' ? '#e3f2fd' : '#f3e5f5', 
                    color: user.role === 'company' ? '#1976d2' : '#7b1fa2', 
                    borderRadius: '16px', 
                    fontSize: '12px', 
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {user.role === 'company' ? 'Company' : 'Developer'}
                  </div>
                </div>
              </div>

              {/* Company Name (for companies) */}
              {user.role === 'company' && user.company && (
                <p style={{ 
                  margin: '0 0 12px 0', 
                  color: '#34495e', 
                  fontSize: '16px',
                  fontWeight: '500'
                }}>
                  🏢 {user.company}
                </p>
              )}

              {/* Headline */}
              {user.profile?.headline && (
                <p style={{ 
                  margin: '0 0 16px 0', 
                  color: '#7f8c8d', 
                  fontSize: '14px',
                  fontStyle: 'italic',
                  lineHeight: '1.4'
                }}>
                  {user.profile.headline}
                </p>
              )}

              {/* Skills */}
              {user.profile?.skills && user.profile.skills.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '6px', 
                    flexWrap: 'wrap',
                    marginBottom: '8px'
                  }}>
                    {user.profile.skills.slice(0, 5).map((skill, idx) => (
                      <span key={idx} style={{
                        background: user.role === 'company' ? '#e3f2fd' : '#f3e5f5',
                        color: user.role === 'company' ? '#1976d2' : '#7b1fa2',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        {skill}
                      </span>
                    ))}
                    {user.profile.skills.length > 5 && (
                      <span style={{
                        background: '#f8f9fa',
                        color: '#6c757d',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px'
                      }}>
                        +{user.profile.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Join Date */}
              <div style={{ 
                marginBottom: '16px', 
                fontSize: '12px', 
                color: '#6c757d' 
              }}>
                Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </div>

              {/* View Profile Button */}
              <Link 
                to={`/profile/${user._id}`}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px',
                  background: user.role === 'company' ? '#27ae60' : '#e74c3c',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textAlign: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = user.role === 'company' ? '#229954' : '#c0392b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = user.role === 'company' ? '#27ae60' : '#e74c3c';
                }}
              >
                {user.role === 'company' ? '🏢 View Company Profile' : '👤 View Developer Profile'}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
