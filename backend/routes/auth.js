const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role
    if (!['company', 'developer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role selected' });
    }

    const user = new User({ name, email, password, role });
    await user.save();

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('company').optional().trim(),
  body('profile').optional().isObject(),
  body('profile.headline').optional().isString().isLength({ max: 140 }),
  body('profile.bio').optional().isString().isLength({ max: 2000 }),
  body('profile.skills').optional().isArray(),
  body('profile.education').optional().isArray(),
  body('profile.experience').optional().isArray(),
  body('profile.social').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, company, profile } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (company !== undefined) user.company = company;
    if (profile) {
      // Shallow merge profile to avoid overwriting unspecified subfields
      user.profile = user.profile || {};
      if (profile.headline !== undefined) user.profile.headline = String(profile.headline || '').trim();
      if (profile.bio !== undefined) user.profile.bio = String(profile.bio || '').trim();
      if (profile.skills !== undefined) {
        const skills = Array.isArray(profile.skills) ? profile.skills : [];
        user.profile.skills = skills
          .map(s => (typeof s === 'string' ? s.trim() : ''))
          .filter(Boolean);
      }
      if (profile.education !== undefined) {
        const education = Array.isArray(profile.education) ? profile.education : [];
        user.profile.education = education
          .map(e => ({
            school: (e?.school || '').trim(),
            degree: (e?.degree || '').trim(),
            field: (e?.field || '').trim(),
            startYear: e?.startYear === '' || e?.startYear == null ? undefined : Number(e.startYear),
            endYear: e?.endYear === '' || e?.endYear == null ? undefined : Number(e.endYear)
          }))
          .filter(e => e.school || e.degree || e.field);
      }
      if (profile.experience !== undefined) {
        const experience = Array.isArray(profile.experience) ? profile.experience : [];
        user.profile.experience = experience
          .map(ex => ({
            company: (ex?.company || '').trim(),
            role: (ex?.role || '').trim(),
            startDate: ex?.startDate ? (isNaN(Date.parse(ex.startDate)) ? undefined : new Date(ex.startDate)) : undefined,
            endDate: ex?.endDate ? (isNaN(Date.parse(ex.endDate)) ? undefined : new Date(ex.endDate)) : undefined,
            description: (ex?.description || '').trim()
          }))
          .filter(ex => ex.company || ex.role || ex.description);
      }
      if (profile.social !== undefined) {
        user.profile.social = {
          ...(user.profile.social || {}),
          ...profile.social
        };
      }
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;