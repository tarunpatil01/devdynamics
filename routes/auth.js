const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'devdynamics_secret';

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });
  // Password complexity check
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.'
    });
  }
  try {
    const user = new User({ username, password });
    await user.save();
    res.json({ success: true, message: 'User registered' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'User already exists' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { _id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Forgot password - generate reset token
router.post('/forgot-password', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ success: false, message: 'Username required' });
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 minutes
    await user.save();
    // For demo, return the reset link in the response
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}&username=${encodeURIComponent(username)}`;
    res.json({ success: true, message: 'Password reset link generated', resetLink });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { username, token, newPassword } = req.body;
  if (!username || !token || !newPassword) return res.status(400).json({ success: false, message: 'Missing fields' });
  try {
    const user = await User.findOne({ username, resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
