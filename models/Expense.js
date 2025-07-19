const mongoose = require('mongoose');

// Expense schema with validation
const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 256
  },
  paid_by: {
    type: String,
    required: true,
    trim: true
  },
  split_type: {
    type: String,
    required: true,
    enum: ['equal', 'percentage', 'exact', 'shares']
  },
  split_details: {
    type: Object,
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date
  }
});

module.exports = mongoose.model('Expense', expenseSchema);
