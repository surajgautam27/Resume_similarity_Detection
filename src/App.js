import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Resumes from './pages/Resumes';
import Matching from './pages/Matching';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import CompanyDashboard from './pages/CompanyDashboard';
import Posts from './pages/Posts';
import MyApplications from './pages/MyApplications';
import Directory from './pages/Directory';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <Layout>
                        <Login />
                      </Layout>
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <PublicRoute>
                      <Layout>
                        <Register />
                      </Layout>
                    </PublicRoute>
                  } 
                />
                
                {/* Public Profile Route (no authentication required) */}
                <Route path="/profile/:userId" element={<PublicProfile />} />
                
                {/* Community Directory Route (no authentication required) */}
                <Route path="/directory" element={
                  <Layout>
                    <Directory />
                  </Layout>
                } />
                
                {/* Protected Routes */}
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <Navigate to="/dashboard" />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/jobs" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Jobs />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/resumes" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Resumes />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/matching" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Matching />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Analytics />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/posts" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Posts />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/company-dashboard" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <CompanyDashboard />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/my-applications" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <MyApplications />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
              </Routes>
              
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 