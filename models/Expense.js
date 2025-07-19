const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false,
  },
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
    default: {},
    validate: {
      validator: function (v) {
        if (this.split_type === 'equal') {
          return v && typeof v === 'object' && Object.keys(v).length > 0;
        } else if (this.split_type === 'percentage') {
          let total = 0;
          for (const k in v) {
            const val = v[k];
            if (typeof val !== 'number' || val < 0) return false;
            total += val;
          }
          return Math.abs(total - 100) < 0.01;
        } else if (this.split_type === 'exact') {
          for (const k in v) {
            const val = v[k];
            if (typeof val !== 'number' || val < 0) return false;
          }
          return true;
        }
        return false;
      },
      message: 'Invalid split_details structure.'
    }
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

ExpenseSchema.index({ paid_by: 1 });
module.exports = mongoose.model('Expense', ExpenseSchema);
