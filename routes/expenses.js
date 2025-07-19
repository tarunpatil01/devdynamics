const express = require('express');
const Expense = require('../models/Expense');
const { expenseValidation } = require('./validator');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'devdynamics_secret';
const router = express.Router();
const Group = require('../models/Group');
const crypto = require('crypto');

// GET /expenses - List all expenses with pagination
router.get('/', async (req, res) => {
  try {
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
    let { amount, description, paid_by, split_type, split_details, group, split_with } = req.body;
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
    // Auto-create group if not provided
    if (!group) {
      // Generate a unique group name based on sorted usernames
      const groupUsers = [...split_with].sort();
      const groupName = 'Group_' + crypto.createHash('md5').update(groupUsers.join('_')).digest('hex');
      let groupDoc = await Group.findOne({ name: groupName });
      if (!groupDoc) {
        groupDoc = new Group({ name: groupName, owner: req.userId, members: groupUsers });
        await groupDoc.save();
      }
      group = groupDoc._id;
    }
    // Auto-add people from split_details if missing
    const People = require('../models/People');
    const missingPeople = [];
    for (const personName of split_with) {
      const personExists = await People.findOne({ name: personName, group });
      if (!personExists) {
        missingPeople.push(personName);
        await People.create({ name: personName, group });
      }
    }
    const expense = new Expense({ amount, description, paid_by, split_type, split_details, group, user: req.userId });
    await expense.save();
    res.json({ success: true, data: expense, message: `Expense added successfully${missingPeople.length ? ", people auto-added: " + missingPeople.join(", ") : ""}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT /expenses/:id - Update expense for user
router.put('/:id', auth, async (req, res) => {
  try {
    let { amount, description, paid_by, split_type, split_details, group, split_with } = req.body;
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
      { amount, description, paid_by, split_type, split_details, group, updated_at: Date.now() },
      { new: true }
    );
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
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
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
