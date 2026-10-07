import React from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';

export default function JobDetailsDialog({ job, open, onClose }) {
  if (!job) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{job.title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {[
            job.company,
            job.department,
            job.location || 'Location not set',
            job.type,
            job.experience,
          ].filter(Boolean).join(' · ')}
        </Typography>

        {(job.salary?.min || job.salary?.max) && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Salary: {job.salary.currency || 'USD'} {job.salary.min || '?'}–{job.salary.max || '?'}
          </Typography>
        )}

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
          {(job.skills || []).map((skill) => (
            <Chip key={skill} size="small" label={skill} />
          ))}
          {(job.tags || []).map((tag) => (
            <Chip key={`tag-${tag}`} size="small" label={tag} variant="outlined" />
          ))}
        </Stack>

        <Typography variant="subtitle2" sx={{ mb: 0.75 }}>Description</Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2.5 }}>
          {job.description}
        </Typography>

        {(job.requirements || []).length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.75 }}>Requirements</Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {job.requirements.map((req) => (
                <Typography component="li" variant="body2" key={req} sx={{ mb: 0.5 }}>
                  {req}
                </Typography>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
