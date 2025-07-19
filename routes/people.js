const express = require('express');
const Expense = require('../models/Expense');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'devdynamics_secret';
const router = express.Router();
const User = require('../models/User');

function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ success: false, message: 'No token provided' });
  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// Helper to get all people from expenses for user
async function getAllPeople(userId) {
  const expenses = await Expense.find({ user: userId });
  const peopleSet = new Set();
  expenses.forEach(exp => {
    peopleSet.add(exp.paid_by.trim().toLowerCase());
    if (exp.split_details && typeof exp.split_details === 'object') {
      Object.keys(exp.split_details).forEach(name => peopleSet.add(name.trim().toLowerCase()));
    }
  });
  return Array.from(peopleSet);
}

// GET /users - List all registered usernames
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({}, 'username');
    res.json({ success: true, data: users.map(u => u.username) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /people - List all people for user
router.get('/', auth, async (req, res) => {
  try {
    const people = await getAllPeople(req.userId);
    res.json({ success: true, data: people });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
