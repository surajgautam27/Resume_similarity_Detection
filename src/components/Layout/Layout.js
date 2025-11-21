import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout({ children }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const getNavLinks = () => {
    if (!user) {
      return [
        { path: '/directory', label: '👥 Directory' },
        { path: '/login', label: 'Login' },
        { path: '/register', label: 'Register' }
      ];
    }

    if (user.role === 'company') {
      return [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/company-dashboard', label: 'Applications' },
        { path: '/jobs', label: 'Manage Jobs' },
        { path: '/matching', label: 'Matching' },
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
        { path: '/posts', label: 'Social Feed' },
        { path: '/directory', label: '👥 Directory' },
        { path: '/profile', label: 'Profile' }
      ];
    }
  };

  const navLinks = getNavLinks();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div>
      <header style={{ 
        background: '#1976d2', 
        color: '#fff',
        padding: '0 20px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 0',
          maxWidth: '100%'
        }}>
          {/* Logo and Hamburger Menu */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px'
          }}>
            {/* Hamburger Menu Button (Mobile Only) */}
            <button
              onClick={toggleMobileMenu}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px'
              }}
              className="mobile-menu-btn"
            >
              ☰
            </button>

            <Link 
              to="/" 
              style={{ 
                fontWeight: 600, 
                fontSize: '22px', 
                color: '#fff', 
                textDecoration: 'none' 
              }}
            >
              careerNexus
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav style={{ 
            display: 'flex', 
            gap: '16px',
            alignItems: 'center'
          }} 
          className="desktop-nav"
          >
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
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                  whiteSpace: 'nowrap'
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User Info & Logout (Desktop) */}
          {user && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px'
            }} 
            className="desktop-user-info"
            >
              <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
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
                  cursor: 'pointer',
                  fontSize: '14px',
                  whiteSpace: 'nowrap'
                }}
              >
                Logout
              </button>
            </div>
          )}
          {!user && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px'
            }} 
            className="desktop-user-info"
            >
              <span style={{ fontSize: '14px', color: '#e3f2fd', whiteSpace: 'nowrap' }}>
                Welcome to careerNexus
              </span>
            </div>
          )}
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div style={{
            position: 'fixed',
            top: '70px',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={() => setIsMobileMenuOpen(false)}
          >
            <div style={{
              background: '#1976d2',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Navigation Links */}
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    color: isActive(link.path) ? '#fff' : '#e3f2fd',
                    textDecoration: 'none',
                    padding: '12px 16px',
                    borderRadius: '4px',
                    fontWeight: isActive(link.path) ? '600' : '400',
                    background: isActive(link.path) ? 'rgba(255,255,255,0.2)' : 'transparent',
                    transition: 'all 0.2s ease',
                    fontSize: '16px',
                    textAlign: 'center'
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile User Info */}
              {user && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '10px',
                  marginTop: '20px',
                  paddingTop: '20px',
                  borderTop: '1px solid rgba(255,255,255,0.3)'
                }}>
                  <span style={{ 
                    fontSize: '14px', 
                    color: '#e3f2fd',
                    textAlign: 'center'
                  }}>
                    {user.name || user.email} ({user.role})
                  </span>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    style={{ 
                      background: '#fff', 
                      color: '#1976d2', 
                      border: 'none', 
                      borderRadius: 4, 
                      padding: '12px 20px', 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <div style={{ 
        width: '100%', 
        margin: 0, 
        padding: '80px 16px 20px 16px',
        minHeight: 'calc(100vh - 100px)'
      }}>
        {children}
      </div>

      {/* Responsive CSS Styles */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .desktop-nav {
            gap: 12px;
          }
          .desktop-nav a {
            font-size: 13px;
            padding: 6px 12px;
          }
        }

        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-user-info {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          header {
            padding: 0 16px;
          }
        }

        @media (max-width: 480px) {
          header {
            padding: 0 12px;
          }
          .mobile-menu-btn {
            font-size: 20px;
          }
          Link[to="/"] {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}