const express = require('express');
const Expense = require('../models/Expense');
const router = express.Router();

// GET /expenses - List all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /expenses - Add new expense
router.post('/', async (req, res) => {
  try {
    const { amount, description, paid_by, split_type, split_details } = req.body;
    if (!amount || amount <= 0 || !description || !paid_by) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    const expense = new Expense({ amount, description, paid_by, split_type, split_details });
    await expense.save();
    res.json({ success: true, data: expense, message: 'Expense added successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /expenses/:id - Update expense
router.put('/:id', async (req, res) => {
  try {
    const { amount, description, paid_by, split_type, split_details } = req.body;
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { amount, description, paid_by, split_type, split_details, updated_at: Date.now() },
      { new: true }
    );
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: expense, message: 'Expense updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /expenses/:id - Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
