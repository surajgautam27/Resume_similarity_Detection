import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  Work as WorkIcon,
  Description as ResumeIcon,
  Compare as CompareIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery('dashboard', async () => {
    const [jobsRes, resumesRes, matchesRes] = await Promise.all([
      axios.get('/api/jobs'),
      axios.get('/api/resumes'),
      axios.get('/api/matching/analytics')
    ]);

    return {
      jobs: jobsRes.data,
      resumes: resumesRes.data,
      analytics: matchesRes.data.analytics
    };
  });

  const stats = [
    {
      title: 'Total Jobs',
      value: dashboardData?.jobs?.total || 0,
      icon: <WorkIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary.main',
      path: '/jobs'
    },
    {
      title: 'Total Resumes',
      value: dashboardData?.resumes?.total || 0,
      icon: <ResumeIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      color: 'secondary.main',
      path: '/resumes'
    },
    {
      title: 'Total Matches',
      value: dashboardData?.analytics?.totalMatches || 0,
      icon: <CompareIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success.main',
      path: '/matching'
    },
    {
      title: 'Avg Match Score',
      value: `${dashboardData?.analytics?.averageScore || 0}%`,
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: 'warning.main',
      path: '/analytics'
    }
  ];

  // Add company-specific stats
  if (user?.role === 'company') {
    stats.push({
      title: 'Job Applications',
      value: 'View All',
      icon: <BusinessIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info.main',
      path: '/company-dashboard'
    });
  }

  const recentJobs = dashboardData?.jobs?.jobs?.slice(0, 5) || [];
  const recentResumes = dashboardData?.resumes?.resumes?.slice(0, 5) || [];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your resume matching system.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s'
                }
              }}
              onClick={() => navigate(stat.path)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {stat.icon}
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h4" component="div" sx={{ color: stat.color }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Jobs */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Recent Jobs
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => navigate('/jobs')}
                  sx={{ textTransform: 'none' }}
                >
                  View All
                </Button>
              </Box>
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <Box key={job._id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {job.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {job.company || 'No company specified'}
                        </Typography>
                      </Box>
                      <Chip 
                        label={job.status} 
                        size="small"
                        color={job.status === 'active' ? 'success' : 'default'}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {job.description.substring(0, 100)}...
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No jobs found
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Resumes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Recent Resumes
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => navigate('/resumes')}
                  sx={{ textTransform: 'none' }}
                >
                  View All
                </Button>
              </Box>
              {recentResumes.length > 0 ? (
                recentResumes.map((resume) => (
                  <Box key={resume._id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {resume.candidate?.name || 'Unknown Candidate'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {resume.candidate?.email || 'No email'}
                        </Typography>
                      </Box>
                      <Chip 
                        label={resume.status} 
                        size="small"
                        color={resume.status === 'processed' ? 'success' : 'warning'}
                      />
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      {resume.skills?.slice(0, 3).map((skill, index) => (
                        <Chip 
                          key={index} 
                          label={skill} 
                          size="small" 
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                      {resume.skills?.length > 3 && (
                        <Typography variant="caption" color="text.secondary">
                          +{resume.skills.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No resumes found
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button 
              variant="contained" 
              startIcon={<WorkIcon />}
              onClick={() => navigate('/jobs')}
            >
              Create New Job
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              startIcon={<ResumeIcon />}
              onClick={() => navigate('/resumes')}
            >
              Upload Resumes
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              startIcon={<CompareIcon />}
              onClick={() => navigate('/matching')}
            >
              Start Matching
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard; 