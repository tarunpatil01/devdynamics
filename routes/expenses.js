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

// GET /expenses/analytics - Category-wise totals, monthly summaries, most expensive categories/transactions
router.get('/analytics', auth, async (req, res) => {
  try {
    const { group } = req.query;
    let query = { user: req.userId };
    
    // If group is specified, filter by group
    if (group) {
      query.group = group;
    }
    
    const expenses = await Expense.find(query);
    
    // Category-wise totals with better categorization
    const categoryTotals = {};
    const categoryCounts = {};
    expenses.forEach(exp => {
      let cat = exp.category;
      
      // Auto-categorize based on description if category is missing or 'Other'
      if (!cat || cat === 'Other') {
        const desc = exp.description.toLowerCase();
        if (desc.includes('food') || desc.includes('dinner') || desc.includes('lunch') || desc.includes('breakfast') || desc.includes('pizza') || desc.includes('restaurant')) {
          cat = 'Food';
        } else if (desc.includes('travel') || desc.includes('petrol') || desc.includes('fuel') || desc.includes('uber') || desc.includes('taxi') || desc.includes('bus') || desc.includes('train')) {
          cat = 'Travel';
        } else if (desc.includes('movie') || desc.includes('entertainment') || desc.includes('game') || desc.includes('concert') || desc.includes('show')) {
          cat = 'Entertainment';
        } else if (desc.includes('electricity') || desc.includes('water') || desc.includes('gas') || desc.includes('internet') || desc.includes('wifi') || desc.includes('utility')) {
          cat = 'Utilities';
        } else {
          cat = 'Other';
        }
      }
      
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = 0;
        categoryCounts[cat] = 0;
      }
      categoryTotals[cat] += exp.amount;
      categoryCounts[cat]++;
    });
    
    // Monthly summaries
    const monthly = {};
    const monthlyCounts = {};
    expenses.forEach(exp => {
      const month = exp.created_at.toISOString().slice(0, 7); // YYYY-MM
      if (!monthly[month]) {
        monthly[month] = 0;
        monthlyCounts[month] = 0;
      }
      monthly[month] += exp.amount;
      monthlyCounts[month]++;
    });
    
    // Most expensive categories
    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([category, total]) => ({
        category,
        total: parseFloat(total.toFixed(2)),
        count: categoryCounts[category],
        percentage: parseFloat(((total / Object.values(categoryTotals).reduce((a, b) => a + b, 0)) * 100).toFixed(1))
      }));
    
    // Most expensive transactions
    const topTransactions = expenses
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(exp => ({
        description: exp.description,
        amount: exp.amount,
        category: exp.category || 'Other',
        paid_by: exp.paid_by,
        created_at: exp.created_at,
        group: exp.group
      }));
    
    // Group-based analytics - with error handling
    const groupAnalytics = {};
    try {
      const groupExpenses = await Expense.find({ user: req.userId }).populate('group', 'name');
      
      groupExpenses.forEach(exp => {
        const groupName = exp.group ? exp.group.name : 'No Group';
        if (!groupAnalytics[groupName]) {
          groupAnalytics[groupName] = {
            total: 0,
            count: 0,
            categories: {}
          };
        }
        groupAnalytics[groupName].total += exp.amount;
        groupAnalytics[groupName].count++;
        
        const cat = exp.category || 'Other';
        if (!groupAnalytics[groupName].categories[cat]) {
          groupAnalytics[groupName].categories[cat] = 0;
        }
        groupAnalytics[groupName].categories[cat] += exp.amount;
      });
    } catch (groupError) {
      console.error('Error in group analytics:', groupError);
      // Continue without group analytics if there's an error
    }
    
    // Convert group analytics to array format
    const groupAnalyticsArray = Object.entries(groupAnalytics)
      .map(([groupName, data]) => ({
        group: groupName,
        total: parseFloat(data.total.toFixed(2)),
        count: data.count,
        categories: Object.entries(data.categories).map(([cat, amount]) => ({
          category: cat,
          amount: parseFloat(amount.toFixed(2))
        }))
      }))
      .sort((a, b) => b.total - a.total);
    
    // Individual vs Group spending
    const individualExpenses = expenses.filter(exp => !exp.group || exp.split_with.length <= 1);
    const groupExpensesOnly = expenses.filter(exp => exp.group && exp.split_with.length > 1);
    
    const individualTotal = individualExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const groupTotal = groupExpensesOnly.reduce((sum, exp) => sum + exp.amount, 0);
    
    res.json({
      success: true,
      data: {
        categoryTotals,
        categoryBreakdown: sortedCategories,
        monthly,
        monthlyCounts,
        mostExpensiveCategories: sortedCategories.slice(0, 5),
        topTransactions,
        groupAnalytics: groupAnalyticsArray,
        spendingPatterns: {
          individual: {
            total: parseFloat(individualTotal.toFixed(2)),
            count: individualExpenses.length,
            percentage: parseFloat(((individualTotal / (individualTotal + groupTotal)) * 100).toFixed(1))
          },
          group: {
            total: parseFloat(groupTotal.toFixed(2)),
            count: groupExpensesOnly.length,
            percentage: parseFloat(((groupTotal / (individualTotal + groupTotal)) * 100).toFixed(1))
          }
        },
        summary: {
          totalExpenses: expenses.length,
          totalAmount: parseFloat(expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)),
          averageAmount: parseFloat((expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length || 0).toFixed(2))
        }
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
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
    const expense = new Expense({ amount, description, paid_by, split_type, split_details, group, user: req.userId, category, recurring });
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
router.put('/:id', auth, async (req, res) => {
  try {
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
      { amount, description, paid_by, split_type, split_details, group, updated_at: Date.now(), category, recurring },
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
