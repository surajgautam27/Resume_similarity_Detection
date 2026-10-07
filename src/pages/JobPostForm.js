import React, { useMemo, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { API_URL } from '../utils/Api';
import { useAuth } from '../contexts/AuthContext';

const JOB_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const WORKPLACES = [
  { value: 'on-site', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
];

const SUGGESTED_SKILLS = ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'AWS'];
const SUGGESTED_PERKS = ['Health insurance', 'Equity', 'Flexible hours', 'Visa sponsorship', 'Learning budget'];

function ChipField({ label, helperText, values, inputValue, onInputChange, onAdd, onDelete, suggestions = [] }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      onAdd(inputValue);
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        label={label}
        helperText={helperText}
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onAdd(inputValue)}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
        {values.map((item) => (
          <Chip key={item} label={item} onDelete={() => onDelete(item)} color="primary" variant="outlined" />
        ))}
      </Box>
      {suggestions.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
          {suggestions
            .filter((item) => !values.includes(item))
            .map((item) => (
              <Chip
                key={item}
                label={`+ ${item}`}
                size="small"
                onClick={() => onAdd(item)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
        </Box>
      )}
    </Box>
  );
}
const Section = ({ title, subtitle, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2.5, sm: 3 },
      mb: 2.5,
      border: '1px solid #e3e8ef',
      borderRadius: 2,
      background: '#fff',
    }}
  >
    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
      {subtitle}
    </Typography>
    {children}
  </Paper>
);

export default function JobPostForm({ onJobPosted }) {
  const { user } = useAuth();
  const initialForm = useMemo(() => ({
    title: '',
    description: '',
    location: '',
    type: 'full-time',
    department: '',
    company: user?.company || user?.name || '',
    priority: 'medium',
    experience: 'mid',
    workplace: 'hybrid',
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
    requirements: [],
    skills: [],
    tags: [],
    requirementInput: '',
    skillInput: '',
    tagInput: '',
  }), [user]);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addChip = (listKey, inputKey, rawValue) => {
    const item = (rawValue || '').replace(/,/g, '').trim();
    if (!item) return;
    setForm((prev) => {
      if (prev[listKey].includes(item)) {
        return { ...prev, [inputKey]: '' };
      }
      return { ...prev, [listKey]: [...prev[listKey], item], [inputKey]: '' };
    });
  };

  const removeChip = (listKey, item) => {
    setForm((prev) => ({
      ...prev,
      [listKey]: prev[listKey].filter((value) => value !== item),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const addPending = (list, input) => {
        const item = (input || '').replace(/,/g, '').trim();
        if (!item || list.includes(item)) return list;
        return [...list, item];
      };
      const requirements = addPending(form.requirements, form.requirementInput);
      const skills = addPending(form.skills, form.skillInput);
      const tags = Array.from(new Set([
        ...addPending(form.tags, form.tagInput),
        form.workplace,
      ].filter(Boolean)));

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim() || (form.workplace === 'remote' ? 'Remote' : ''),
        type: form.type,
        department: form.department.trim(),
        company: form.company.trim(),
        priority: form.priority,
        experience: form.experience,
        requirements,
        skills,
        tags,
      };

      if (form.salaryMin || form.salaryMax) {
        payload.salary = {
          min: form.salaryMin ? Number(form.salaryMin) : undefined,
          max: form.salaryMax ? Number(form.salaryMax) : undefined,
          currency: form.currency || 'USD',
        };
      }

      await axios.post(`${API_URL}/jobs`, payload);
      setSuccess('Job posted. Candidates can now discover this opening.');
      setForm(initialForm);
      if (onJobPosted) {
        onJobPosted();
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map((item) => item.msg).join(' '));
      } else {
        setError(err.response?.data?.error || 'Failed to post job.');
      }
    } finally {
      setLoading(false);
    }
  };

 

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 920, mx: 'auto' }}>
      <Box
        sx={{
          mb: 3,
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3,
          color: '#fff',
          background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 55%, #42a5f5 100%)',
        }}
      >
        <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.9 }}>
          Hiring desk
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Post a new role
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 560, opacity: 0.95 }}>
          Write a posting that helps the right people apply. Add compensation, seniority, and skills so matching stays accurate.
        </Typography>
      </Box>

      <Section title="Role details" subtitle="What is this opening, and where does it sit in the company?">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              name="title"
              label="Job title"
              placeholder="Senior Frontend Engineer"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="company"
              label="Company"
              value={form.company}
              onChange={(e) => updateField('company', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="department"
              label="Team / department"
              placeholder="Engineering, People, Product"
              value={form.department}
              onChange={(e) => updateField('department', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Employment type</Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={form.type}
              onChange={(_, value) => value && updateField('type', value)}
            >
              {JOB_TYPES.map((item) => (
                <ToggleButton key={item.value} value={item.value} sx={{ textTransform: 'none' }}>
                  {item.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Seniority</Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={form.experience}
              onChange={(_, value) => value && updateField('experience', value)}
            >
              {EXPERIENCE_LEVELS.map((item) => (
                <ToggleButton key={item.value} value={item.value} sx={{ textTransform: 'none' }}>
                  {item.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Section>

      <Section title="Location and compensation" subtitle="Candidates compare these first. Be as specific as you can.">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Workplace</Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={form.workplace}
              onChange={(_, value) => value && updateField('workplace', value)}
            >
              {WORKPLACES.map((item) => (
                <ToggleButton key={item.value} value={item.value} sx={{ textTransform: 'none' }}>
                  {item.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="location"
              label="City or region"
              placeholder={form.workplace === 'remote' ? 'Anywhere / timezone, e.g. GMT+5:45' : 'e.g. Kathmandu, Nepal'}
              value={form.location}
              onChange={(e) => updateField('location', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              name="priority"
              label="Hiring priority"
              value={form.priority}
              onChange={(e) => updateField('priority', e.target.value)}
            >
              {PRIORITIES.map((item) => (
                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              name="salaryMin"
              label="Salary min"
              value={form.salaryMin}
              onChange={(e) => updateField('salaryMin', e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start">{form.currency}</InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              name="salaryMax"
              label="Salary max"
              value={form.salaryMax}
              onChange={(e) => updateField('salaryMax', e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start">{form.currency}</InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              name="currency"
              label="Currency"
              value={form.currency}
              onChange={(e) => updateField('currency', e.target.value)}
            >
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="NPR">NPR</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
              <MenuItem value="INR">INR</MenuItem>
              <MenuItem value="GBP">GBP</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Section>

      <Section title="Role story" subtitle="Describe the work, impact, and who will thrive in this seat.">
        <TextField
          required
          fullWidth
          multiline
          minRows={6}
          name="description"
          label="Job description"
          placeholder={"What the person will own, who they work with, and what success looks like in 6 months.\n\nExample: You will own the candidate matching experience, ship weekly improvements with design, and mentor two engineers."}
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          helperText={`${form.description.length} characters · at least 10 required`}
        />
      </Section>

      <Section title="Skills, must-haves, and perks" subtitle="Press Enter after each item. These improve matching and make the post easier to scan.">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ChipField
              label="Required skills"
              helperText="Press Enter to add a skill"
              values={form.skills}
              inputValue={form.skillInput}
              onInputChange={(value) => updateField('skillInput', value)}
              onAdd={(value) => addChip('skills', 'skillInput', value)}
              onDelete={(item) => removeChip('skills', item)}
              suggestions={SUGGESTED_SKILLS}
            />
          </Grid>
          <Grid item xs={12}>
            <ChipField
              label="Must-have requirements"
              helperText="Education, years of experience, tools, or certifications"
              values={form.requirements}
              inputValue={form.requirementInput}
              onInputChange={(value) => updateField('requirementInput', value)}
              onAdd={(value) => addChip('requirements', 'requirementInput', value)}
              onDelete={(item) => removeChip('requirements', item)}
            />
          </Grid>
          <Grid item xs={12}>
            <ChipField
              label="Perks and tags"
              helperText="Benefits and extras that help this role stand out"
              values={form.tags}
              inputValue={form.tagInput}
              onInputChange={(value) => updateField('tagInput', value)}
              onAdd={(value) => addChip('tags', 'tagInput', value)}
              onDelete={(item) => removeChip('tags', item)}
              suggestions={SUGGESTED_PERKS}
            />
          </Grid>
        </Grid>
      </Section>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pb: 2 }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ px: 4, py: 1.2 }}
        >
          {loading ? 'Publishing...' : 'Publish job'}
        </Button>
      </Box>
    </Box>
  );
}
