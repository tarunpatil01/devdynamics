const express = require('express');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'devdynamics_secret';
const router = express.Router();
const User = require('../models/User');
const Group = require('../models/Group');

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

// GET /people/group/:groupId - List all members of a group
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    // Members can be ObjectIds or usernames, so normalize to usernames
    const usernames = [];
    for (const member of group.members) {
      if (typeof member === 'string' && member.length > 0) {
        // Check if it's a valid ObjectId string
        if (mongoose.Types.ObjectId.isValid(member)) {
          const user = await User.findById(member);
          if (user) usernames.push(user.username);
        } else {
          // It's a username string
          usernames.push(member);
        }
      } else if (member && member.toString) {
        // It's an ObjectId object
        const user = await User.findById(member);
        if (user) usernames.push(user.username);
      }
    }
    
    // Filter out any empty or invalid usernames
    const validUsernames = usernames.filter(username => username && typeof username === 'string' && username.trim().length > 0);
    
    res.json({ success: true, data: validUsernames });
  } catch (err) {
    console.error('Error fetching group members:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
