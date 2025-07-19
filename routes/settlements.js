const express = require('express');
const Expense = require('../models/Expense');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'devdynamics_secret';
const router = express.Router();

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

// GET /settlements - Get current settlement summary for user
router.get('/', auth, async (req, res) => {
  try {
    const balances = await calculateBalances(req.userId);
    console.log('Calculated balances:', balances);
    const settlements = getSettlements(balances);
    res.json({ success: true, data: settlements });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /settlements/settle - Settle up between two users
router.post('/settle', auth, async (req, res) => {
  try {
    const { user, counterparty, direction } = req.body;
    if (!user || !counterparty || !['pay', 'receive'].includes(direction)) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }
    // Find all expenses for this user
    const balances = await calculateBalances(req.userId);
    const userKey = user.trim().toLowerCase();
    const counterpartyKey = counterparty.trim().toLowerCase();
    let amount = 0;
    if (direction === 'pay') {
      // You pay counterparty: you owe them
      amount = Math.abs(balances[userKey] || 0) < 0.01 ? 0 : -(balances[userKey] || 0);
      // Find how much you owe this counterparty
      // But we want to settle only the amount owed to this counterparty
      // So, recalculate settlements and find the right amount
      const settlements = getSettlements(balances);
      const s = settlements.find(s => s.from === user && s.to === counterparty);
      if (!s) return res.status(400).json({ success: false, message: 'No outstanding settlement found' });
      amount = s.amount;
      // Create a settlement expense
      const Expense = require('../models/Expense');
      await Expense.create({
        amount,
        description: `Settlement between ${user} and ${counterparty}`,
        paid_by: user,
        split_type: 'exact',
        split_details: { [counterparty]: amount },
        split_with: [counterparty],
        user: req.userId
      });
    } else if (direction === 'receive') {
      // Counterparty pays you: they owe you
      amount = Math.abs(balances[counterpartyKey] || 0) < 0.01 ? 0 : -(balances[counterpartyKey] || 0);
      const settlements = getSettlements(balances);
      const s = settlements.find(s => s.from === counterparty && s.to === user);
      if (!s) return res.status(400).json({ success: false, message: 'No outstanding settlement found' });
      amount = s.amount;
      const Expense = require('../models/Expense');
      await Expense.create({
        amount,
        description: `Settlement between ${counterparty} and ${user}`,
        paid_by: counterparty,
        split_type: 'exact',
        split_details: { [user]: amount },
        split_with: [user],
        user: req.userId
      });
    }
    res.json({ success: true, message: 'Settlement recorded' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
