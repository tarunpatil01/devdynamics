const express = require('express');
const Expense = require('../models/Expense');
const { expenseValidation } = require('./validator');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'devdynamics_secret';
const router = express.Router();
const Group = require('../models/Group');
const crypto = require('crypto');
const mongoose = require('mongoose');

// GET /expenses - List all expenses with pagination or by group/user involvement
router.get('/', auth, async (req, res) => {
  try {
    const groupId = req.query.group;
    const userId = req.userId;
    const User = require('../models/User');
    const user = await User.findById(userId);
    const username = user ? user.username : null;
    const userIdObj = mongoose.Types.ObjectId(userId);
    if (groupId && username) {
      // Only return expenses for this group where the user is involved (by userId or username)
      const query = {
        group: groupId,
        $or: [
          { 'paid_by.username': username },
          { 'paid_by.userId': userIdObj },
          { 'split_with.username': username },
          { 'split_with.userId': userIdObj }
        ]
      };
      console.log('EXPENSES QUERY:', { username, userId: userIdObj, query });
      const expenses = await Expense.find(query);
      return res.json({ success: true, data: expenses });
    }
    // Default: all expenses with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const expenses = await Expense.find().skip(skip).limit(limit);
    const total = await Expense.countDocuments();
    res.json({ success: true, data: expenses, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /expenses/analytics - Category-wise totals, monthly summaries, most expensive categories/transactions
router.get('/analytics', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.userId });
    // Category-wise totals
    const categoryTotals = {};
    expenses.forEach(exp => {
      const cat = exp.category || 'Other';
      if (!categoryTotals[cat]) categoryTotals[cat] = 0;
      categoryTotals[cat] += exp.amount;
    });
    // Monthly summaries
    const monthly = {};
    expenses.forEach(exp => {
      const month = exp.created_at.toISOString().slice(0, 7); // YYYY-MM
      if (!monthly[month]) monthly[month] = 0;
      monthly[month] += exp.amount;
    });
    // Most expensive categories
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    // Most expensive transactions
    const topTransactions = expenses.sort((a, b) => b.amount - a.amount).slice(0, 5);
    res.json({
      success: true,
      data: {
        categoryTotals,
        monthly,
        mostExpensiveCategories: sortedCategories.slice(0, 3),
        topTransactions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// JWT-based auth middleware (same as other routes)
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

// Validate split_details
function validateSplitDetails(split_type, split_details) {
  if (split_type === 'equal') {
    if (!split_details || typeof split_details !== 'object' || Object.keys(split_details).length === 0) {
      return false;
    }
    return true;
  } else if (split_type === 'percentage') {
    let total = 0;
    for (const k in split_details) {
      const v = split_details[k];
      if (typeof v !== 'number' || v < 0) return false;
      total += v;
    }
    if (Math.abs(total - 100) > 0.01) return false;
    return true;
  } else if (split_type === 'exact') {
    let total = 0;
    for (const k in split_details) {
      const v = split_details[k];
      if (typeof v !== 'number' || v < 0) return false;
      total += v;
    }
    return true;
  } else if (split_type === 'shares') {
    let totalShares = 0;
    for (const k in split_details) {
      const v = split_details[k];
      if (typeof v !== 'number' || v <= 0) return false;
      totalShares += v;
    }
    if (totalShares <= 0) return false;
    return true;
  }
  return false;
}

// POST /expenses - Add new expense
router.post('/', auth, expenseValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    let { amount, description, paid_by, split_type, split_details, group, split_with, category, recurring } = req.body;
    const User = require('../models/User');
    // paid_by: can be username or userId, always store as { username, userId }
    let paidByUser = null;
    if (typeof paid_by === 'string') {
      paidByUser = await User.findOne({ username: paid_by });
      if (!paidByUser) paidByUser = await User.findById(paid_by);
    } else if (typeof paid_by === 'object' && paid_by.userId) {
      paidByUser = await User.findById(paid_by.userId);
    }
    if (!paidByUser) return res.status(400).json({ success: false, message: 'Paid by user not found.' });
    const paidByObj = { username: paidByUser.username, userId: paidByUser._id };
    // split_with: array of usernames or userIds, always store as [{ username, userId }]
    const splitWithObjs = [];
    for (const person of split_with) {
      let user = null;
      if (typeof person === 'string') {
        user = await User.findOne({ username: person });
        if (!user) user = await User.findById(person);
      } else if (typeof person === 'object' && person.userId) {
        user = await User.findById(person.userId);
      }
      if (user) splitWithObjs.push({ username: user.username, userId: user._id });
    }
    if (splitWithObjs.length === 0) return res.status(400).json({ success: false, message: 'No valid split_with users found.' });
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }
    if (!category || !['Food', 'Travel', 'Utilities', 'Entertainment', 'Other'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Category is required and must be valid.' });
    }
    if (recurring && typeof recurring === 'object') {
      if (!['none', 'weekly', 'monthly'].includes(recurring.type)) {
        return res.status(400).json({ success: false, message: 'Recurring type must be one of none, weekly, monthly.' });
      }
    }
    const splitPeople = Object.keys(split_details);
    if (splitPeople.some(p => !splitWithObjs.map(u => u.username).includes(p))) {
      return res.status(400).json({ success: false, message: 'split_details must only contain selected people.' });
    }
    if (!validateSplitDetails(split_type, split_details)) {
      return res.status(400).json({ success: false, message: 'Invalid split_details' });
    }
    if (!group) {
      return res.status(400).json({ success: false, message: 'Group is required. Please select or create a group before adding an expense.' });
    }
    // Auto-add people from split_details if missing
    const People = require('../models/People');
    const missingPeople = [];
    for (const personObj of splitWithObjs) {
      const personExists = await People.findOne({ name: personObj.username, group });
      if (!personExists) {
        missingPeople.push(personObj.username);
        await People.create({ name: personObj.username, group });
      }
    }
    const expense = new Expense({ amount, description, paid_by: paidByObj, split_type, split_details, split_with: splitWithObjs, group, user: req.userId, category, recurring });
    await expense.save();
    // Emit socket event for new expense to the group room
    if (req.app.get('io') && group) {
      req.app.get('io').to(String(group)).emit('expenseCreated', expense);
    }
    res.json({ success: true, data: expense, message: `Expense added successfully${missingPeople.length ? ", people auto-added: " + missingPeople.join(", ") : ""}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT /expenses/:id - Update expense for user
router.put('/:id', auth, expenseValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('PUT /expenses/:id - Validation errors:', errors.array());
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    console.log('PUT /expenses/:id - Request body:', JSON.stringify(req.body, null, 2));
    let { amount, description, paid_by, split_type, split_details, group, split_with, category, recurring } = req.body;
    if (!paid_by) paid_by = req.userId;
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }
    if (!paid_by) {
      return res.status(400).json({ success: false, message: 'Paid by is required.' });
    }
    if (!category || !['Food', 'Travel', 'Utilities', 'Entertainment', 'Other'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Category is required and must be valid.' });
    }
    if (recurring && typeof recurring === 'object') {
      if (!['none', 'weekly', 'monthly'].includes(recurring.type)) {
        return res.status(400).json({ success: false, message: 'Recurring type must be one of none, weekly, monthly.' });
      }
    }
    if (!Array.isArray(split_with) || split_with.length === 0) {
      return res.status(400).json({ success: false, message: 'split_with must be a non-empty array of people.' });
    }
    const splitPeople = Object.keys(split_details);
    if (splitPeople.some(p => !split_with.includes(p))) {
      return res.status(400).json({ success: false, message: 'split_details must only contain selected people.' });
    }
    if (!validateSplitDetails(split_type, split_details)) {
      return res.status(400).json({ success: false, message: 'Invalid split_details' });
    }
    if (!group) {
      return res.status(400).json({ success: false, message: 'Group is required. Please select or create a group before adding an expense.' });
    }
    const People = require('../models/People');
    const missingPeople = [];
    for (const personName of split_with) {
      const personExists = await People.findOne({ name: personName, group });
      if (!personExists) {
        missingPeople.push(personName);
        await People.create({ name: personName, group });
      }
    }
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { amount, description, paid_by, split_type, split_details, split_with, group, updated_at: Date.now(), category, recurring },
      { new: true }
    );
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    // Emit socket event for updated expense
    if (req.app.get('io') && group) {
      req.app.get('io').to(String(group)).emit('expenseUpdated', expense);
    }
    res.json({ success: true, data: expense, message: `Expense updated successfully${missingPeople.length ? ", people auto-added: " + missingPeople.join(", ") : ""}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// DELETE /expenses/:id - Delete expense for user
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    // Emit socket event for deleted expense
    if (req.app.get('io') && expense.group) {
      req.app.get('io').to(String(expense.group)).emit('expenseDeleted', { _id: expense._id, group: expense.group });
    }
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
