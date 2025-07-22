const express = require('express');
const Expense = require('../models/Expense');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'devdynamics_secret';
const router = express.Router();
const mongoose = require('mongoose');

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

// Helper to calculate balances for user
async function calculateBalances(userId) {
  const expenses = await Expense.find({ user: userId });
  const balances = {};
  expenses.forEach(exp => {
    const paidBy = exp.paid_by.trim().toLowerCase();
    if (!balances[paidBy]) balances[paidBy] = 0;
    let splits = {};
    if (exp.split_type === 'equal') {
      const people = Object.keys(exp.split_details).length > 0 ? Object.keys(exp.split_details) : [paidBy];
      const share = parseFloat((exp.amount / people.length).toFixed(2));
      people.forEach(person => {
        splits[person.trim().toLowerCase()] = share;
      });
    } else if (exp.split_type === 'percentage') {
      Object.entries(exp.split_details).forEach(([person, percent]) => {
        splits[person.trim().toLowerCase()] = parseFloat(((exp.amount * percent) / 100).toFixed(2));
      });
    } else if (exp.split_type === 'exact') {
      Object.entries(exp.split_details).forEach(([person, amt]) => {
        splits[person.trim().toLowerCase()] = parseFloat(amt);
      });
    }
    // Paid by gets full amount credited
    balances[paidBy] += parseFloat(exp.amount);
    // Each person's share is debited
    Object.entries(splits).forEach(([person, share]) => {
      if (!balances[person]) balances[person] = 0;
      balances[person] -= share;
    });
  });
  // Round balances to 2 decimals
  Object.keys(balances).forEach(p => {
    balances[p] = parseFloat(balances[p].toFixed(2));
  });
  return balances;
}

// Helper to get all people from expenses for group
async function getAllPeopleForGroup(groupId) {
  const expenses = await Expense.find({ group: groupId });
  const peopleSet = new Set();
  expenses.forEach(exp => {
    peopleSet.add(exp.paid_by.trim().toLowerCase());
    if (exp.split_details && typeof exp.split_details === 'object') {
      Object.keys(exp.split_details).forEach(name => peopleSet.add(name.trim().toLowerCase()));
    }
  });
  return Array.from(peopleSet);
}

// Helper to calculate balances for group
async function calculateBalancesForGroup(groupId) {
  const expenses = await Expense.find({ group: groupId });
  const balances = {};
  expenses.forEach(exp => {
    const paidBy = exp.paid_by.trim().toLowerCase();
    if (!balances[paidBy]) balances[paidBy] = 0;
    let splits = {};
    if (exp.split_type === 'equal') {
      const people = Object.keys(exp.split_details).length > 0 ? Object.keys(exp.split_details) : [paidBy];
      const share = parseFloat((exp.amount / people.length).toFixed(2));
      people.forEach(person => {
        splits[person.trim().toLowerCase()] = share;
      });
    } else if (exp.split_type === 'percentage') {
      Object.entries(exp.split_details).forEach(([person, percent]) => {
        splits[person.trim().toLowerCase()] = parseFloat(((exp.amount * percent) / 100).toFixed(2));
      });
    } else if (exp.split_type === 'exact') {
      Object.entries(exp.split_details).forEach(([person, amt]) => {
        splits[person.trim().toLowerCase()] = parseFloat(amt);
      });
    }
    balances[paidBy] += parseFloat(exp.amount);
    Object.entries(splits).forEach(([person, share]) => {
      if (!balances[person]) balances[person] = 0;
      balances[person] -= share;
    });
  });
  Object.keys(balances).forEach(p => {
    balances[p] = parseFloat(balances[p].toFixed(2));
  });
  return balances;
}

// Helper to calculate balances for group, only for expenses where user is involved
async function calculateBalancesForGroupForUser(groupId, username, userId) {
  const Expense = require('../models/Expense');
  const userIdObj = mongoose.Types.ObjectId(userId);
  const query = {
    group: groupId,
    $or: [
      { 'paid_by.username': username },
      { 'paid_by.userId': userIdObj },
      { 'split_with.username': username },
      { 'split_with.userId': userIdObj }
    ]
  };
  console.log('BALANCES QUERY:', { username, userId: userIdObj, query });
  const expenses = await Expense.find(query);
  const balances = {};
  expenses.forEach(exp => {
    const paidBy = (exp.paid_by.username || '').trim().toLowerCase();
    if (!balances[paidBy]) balances[paidBy] = 0;
    let splits = {};
    if (exp.split_type === 'equal') {
      const people = Object.keys(exp.split_details).length > 0 ? Object.keys(exp.split_details) : [paidBy];
      const share = parseFloat((exp.amount / people.length).toFixed(2));
      people.forEach(person => {
        splits[person.trim().toLowerCase()] = share;
      });
    } else if (exp.split_type === 'percentage') {
      Object.entries(exp.split_details).forEach(([person, percent]) => {
        splits[person.trim().toLowerCase()] = parseFloat(((exp.amount * percent) / 100).toFixed(2));
      });
    } else if (exp.split_type === 'exact') {
      Object.entries(exp.split_details).forEach(([person, amt]) => {
        splits[person.trim().toLowerCase()] = parseFloat(amt);
      });
    }
    balances[paidBy] += parseFloat(exp.amount);
    Object.entries(splits).forEach(([person, share]) => {
      if (!balances[person]) balances[person] = 0;
      balances[person] -= share;
    });
  });
  Object.keys(balances).forEach(p => {
    balances[p] = parseFloat(balances[p].toFixed(2));
  });
  return balances;
}

// GET /balances - Show each person's balance for group, only for user-involved expenses
router.get('/', auth, async (req, res) => {
  try {
    const groupId = req.query.group;
    if (!groupId) {
      return res.status(400).json({ success: false, message: 'Group ID is required as query parameter ?group=GROUP_ID' });
    }
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    const username = user ? user.username : null;
    const userId = user ? user._id : null;
    const balances = await calculateBalancesForGroupForUser(groupId, username, userId);
    res.json({ success: true, data: balances });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
