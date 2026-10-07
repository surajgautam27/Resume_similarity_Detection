import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { API_URL } from '../utils/Api';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';
import JobPostForm from './JobPostForm';

const priorityColor = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
};

export default function JobManagement() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState(null);

  const fetchJobs = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/jobs`, { params: { limit: 100 } });
      const myJobs = (res.data.jobs || []).filter(
        job => job.createdBy && (job.createdBy._id === user._id)
      );
      setJobs(myJobs);
    } catch (err) {
      setError('Failed to fetch jobs.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    setDeletingJobId(jobId);
    try {
      await axios.delete(`${API_URL}/jobs/${jobId}`);
      setJobs(jobs.filter(job => job._id !== jobId));
      showSuccess('Job deleted successfully!');
    } catch (err) {
      showError('Failed to delete job: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeletingJobId(null);
    }
  };

  const handleJobPosted = () => {
    setShowPostForm(false);
    fetchJobs();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
          borderRadius: 3,
          color: '#fff',
          background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 55%, #42a5f5 100%)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.9 }}>
              Company jobs
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Manage openings
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.95, mt: 0.5 }}>
              {jobs.length} live posting{jobs.length === 1 ? '' : 's'} on careerNexus
            </Typography>
          </Box>
          <Button
            onClick={() => setShowPostForm(!showPostForm)}
            variant="contained"
            sx={{
              bgcolor: '#fff',
              color: '#1976d2',
              fontWeight: 700,
              '&:hover': { bgcolor: '#e3f2fd' },
            }}
          >
            {showPostForm ? 'Back to jobs' : 'Post new job'}
          </Button>
        </Stack>
      </Paper>

      {showPostForm && <JobPostForm onJobPosted={handleJobPosted} />}

      {!showPostForm && jobs.length === 0 && (
        <Paper sx={{ textAlign: 'center', p: 6, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>No jobs posted yet</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Publish your first opening with salary, seniority, and skills so candidates can match faster.
          </Typography>
          <Button variant="contained" onClick={() => setShowPostForm(true)}>
            Create a job posting
          </Button>
        </Paper>
      )}

      {!showPostForm && jobs.length > 0 && (
        <Stack spacing={2}>
          {jobs.map(job => (
            <Paper
              key={job._id}
              elevation={0}
              sx={{ p: 2.5, border: '1px solid #e3e8ef', borderRadius: 2 }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{job.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {job.company || user?.name} · {job.location || 'Location not set'} · {job.type || 'full-time'}
                    {job.experience ? ` · ${job.experience}` : ''}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                    <Chip size="small" label={job.status || 'active'} color="success" variant="outlined" />
                    {job.priority && (
                      <Chip size="small" label={job.priority} color={priorityColor[job.priority] || 'default'} />
                    )}
                    {(job.skills || []).map(skill => (
                      <Chip key={skill} size="small" label={skill} />
                    ))}
                    {(job.tags || []).map(tag => (
                      <Chip key={`tag-${tag}`} size="small" label={tag} variant="outlined" />
                    ))}
                  </Stack>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {job.description.length > 160 ? `${job.description.substring(0, 160)}...` : job.description}
                  </Typography>
                  {(job.requirements || []).length > 0 && (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.75 }}>Requirements</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {job.requirements.map((req) => (
                          <Chip key={req} size="small" label={req} variant="outlined" />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {job.applications ? job.applications.length : 0} applications · Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
                    {job.salary?.min || job.salary?.max ? ` · ${job.salary.currency || 'USD'} ${job.salary.min || '?'}–${job.salary.max || '?'}` : ''}
                  </Typography>
                </Box>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => handleDeleteJob(job._id)}
                  disabled={deletingJobId === job._id}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {deletingJobId === job._id ? 'Deleting...' : 'Delete'}
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
