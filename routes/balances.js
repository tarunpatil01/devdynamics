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

// Helper to calculate balances
async function calculateBalances() {
  const expenses = await Expense.find();
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

// GET /balances - Show each person's balance
router.get('/', async (req, res) => {
  try {
    const balances = await calculateBalances();
    res.json({ success: true, data: balances });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
