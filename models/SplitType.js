const mongoose = require('mongoose');

const SplitTypeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['equal', 'percentage', 'exact'],
    required: true
  },
  shares: {
    type: Map,
    of: Number,
    default: {}
  }
});

module.exports = mongoose.model('SplitType', SplitTypeSchema);
