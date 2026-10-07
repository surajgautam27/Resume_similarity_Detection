import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export default function AuthShell({ title, subtitle, children }) {
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 3,
        px: { xs: 2, sm: 4 },
        py: { xs: 3, sm: 4 },
        background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 45%, #42a5f5 100%)',
        boxShadow: '0 16px 40px rgba(13, 71, 161, 0.18)',
      }}
    >
      <Typography
        variant="overline"
        sx={{ color: '#fff', letterSpacing: 3, mb: 1, fontWeight: 600 }}
      >
        careerNexus
      </Typography>
      <Typography
        variant="h4"
        sx={{
          color: '#fff',
          fontWeight: 700,
          mb: 1,
          textAlign: 'center',
          fontSize: { xs: '1.75rem', sm: '2.1rem' },
        }}
      >
        Connect talent with opportunity
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: 'rgba(255,255,255,0.92)',
          mb: 4,
          textAlign: 'center',
          maxWidth: 480,
        }}
      >
        Match resumes, discover jobs, and grow your professional network in one place.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 440,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        }}
      >
        <Typography component="h1" variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
        {children}
      </Paper>
    </Box>
  );
}
