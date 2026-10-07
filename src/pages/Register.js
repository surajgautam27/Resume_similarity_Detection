import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  CircularProgress,
  MenuItem,
  Alert,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthShell from '../components/Layout/AuthShell';

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'developer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await registerUser(form);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join careerNexus as a developer or company"
    >
      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="name"
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          value={form.password}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          select
          fullWidth
          id="role"
          name="role"
          label="Role"
          value={form.role}
          onChange={handleChange}
        >
          <MenuItem value="developer">Developer</MenuItem>
          <MenuItem value="company">Company</MenuItem>
        </TextField>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          sx={{ mt: 3, mb: 2, py: 1.2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Account'}
        </Button>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" underline="hover">
              Sign In
            </Link>
          </Typography>
        </Box>
      </Box>
    </AuthShell>
  );
}
