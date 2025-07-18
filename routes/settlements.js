const express = require('express');
const Expense = require('../models/Expense');
const router = express.Router();

// Helper to calculate balances (same as in balances.js)
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

// Helper to calculate settlements (minimize transactions)
function getSettlements(balances) {
  const settlements = [];
  const creditors = [];
  const debtors = [];
  Object.entries(balances).forEach(([person, balance]) => {
    if (balance > 0.01) creditors.push({ person, amount: balance });
    else if (balance < -0.01) debtors.push({ person, amount: -balance });
  });
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const min = Math.min(debtors[i].amount, creditors[j].amount);
    settlements.push({ from: debtors[i].person, to: creditors[j].person, amount: parseFloat(min.toFixed(2)) });
    debtors[i].amount -= min;
    creditors[j].amount -= min;
    if (Math.abs(debtors[i].amount) < 0.01) i++;
    if (Math.abs(creditors[j].amount) < 0.01) j++;
  }
  return settlements;
}

// GET /settlements - Get current settlement summary
router.get('/', async (req, res) => {
  try {
    const balances = await calculateBalances();
    const settlements = getSettlements(balances);
    res.json({ success: true, data: settlements });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
