import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout({ children }) {
  const { logout, user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const getNavLinks = () => {
    if (!user) {
      // Public navigation for non-authenticated users
      return [
        { path: '/directory', label: '👥 Directory' },
        { path: '/login', label: 'Login' },
        { path: '/register', label: 'Register' }
      ];
    }

    if (user.role === 'company') {
      return [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/company-dashboard', label: 'Job Applications' },
        { path: '/jobs', label: 'Manage Jobs' },
        { path: '/matching', label: 'Matching' },
        { path: '/analytics', label: 'Analytics' },
        { path: '/posts', label: 'Social Feed' },
        { path: '/directory', label: '👥 Directory' },
        { path: '/profile', label: 'Profile' }
      ];
    } else if (user.role === 'developer') {
      return [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/jobs', label: 'Browse Jobs' },
        { path: '/my-applications', label: 'My Applications' },
        { path: '/resumes', label: 'My Resumes' },
        { path: '/posts', label: 'Social Feed' },
        { path: '/directory', label: '👥 Directory' },
        { path: '/profile', label: 'Profile' }
      ];
    } else {
      return [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/jobs', label: 'Jobs' },
        { path: '/resumes', label: 'Resumes' },
        { path: '/matching', label: 'Matching' },
        { path: '/analytics', label: 'Analytics' },
        { path: '/posts', label: 'Social Feed' },
        { path: '/directory', label: '👥 Directory' },
        { path: '/profile', label: 'Profile' }
      ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div>
      <header style={{ 
        background: '#1976d2', 
        color: '#fff',
        padding: '0 32px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 0'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '32px'
          }}>
            <div style={{ fontWeight: 600, fontSize: 22 }}>
              careerNexus
            </div>
            <nav style={{ display: 'flex', gap: '16px' }}>
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    color: isActive(link.path) ? '#fff' : '#e3f2fd',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontWeight: isActive(link.path) ? '600' : '400',
                    background: isActive(link.path) ? 'rgba(255,255,255,0.2)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '14px' }}>
                {user.name || user.email} ({user.role})
              </span>
              <button
                onClick={logout}
                style={{ 
                  background: '#fff', 
                  color: '#1976d2', 
                  border: 'none', 
                  borderRadius: 4, 
                  padding: '8px 20px', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                Logout
              </button>
            </div>
          )}
          {!user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '14px', color: '#e3f2fd' }}>
                Welcome to careerNexus
              </span>
            </div>
          )}
        </div>
      </header>
      <div style={{ width: '100%', margin: 0, padding: '0 16px' }}>
  {children}
</div>
    </div>
  );
} 