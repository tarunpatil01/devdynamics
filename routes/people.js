const express = require('express');
const Expense = require('../models/Expense');
const router = express.Router();

// Helper to get all people from expenses
async function getAllPeople() {
  const expenses = await Expense.find();
  const peopleSet = new Set();
  expenses.forEach(exp => {
    peopleSet.add(exp.paid_by.trim().toLowerCase());
    if (exp.split_details && typeof exp.split_details === 'object') {
      Object.keys(exp.split_details).forEach(name => peopleSet.add(name.trim().toLowerCase()));
    }
  });
  return Array.from(peopleSet);
}

// GET /people - List all people
router.get('/', async (req, res) => {
  try {
    const people = await getAllPeople();
    res.json({ success: true, data: people });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
