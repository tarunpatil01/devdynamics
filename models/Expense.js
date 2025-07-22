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
    type: {
      username: { type: String, required: true, trim: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    },
    required: true
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
  split_with: {
    type: [
      {
        username: { type: String, required: true, trim: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
      }
    ],
    required: true,
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'split_with must be a non-empty array of people'
    }
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
  category: {
    type: String,
    enum: ['Food', 'Travel', 'Utilities', 'Entertainment', 'Other'],
    required: true
  },
  recurring: {
    type: {
      type: String,
      enum: ['none', 'weekly', 'monthly'],
      default: 'none',
      required: true
    },
    next_due: { type: Date }
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
