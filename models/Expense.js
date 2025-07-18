const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  description: {
    type: String,
    required: true
  },
  paid_by: {
    type: String,
    required: true,
    trim: true
  },
  split_type: {
    type: String,
    enum: ['equal', 'percentage', 'exact'],
    default: 'equal'
  },
  split_details: {
    type: Object,
    default: {}
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
