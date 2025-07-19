const mongoose = require('mongoose');

// Group schema with validation and unique index
const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 64
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.Mixed, // can be ObjectId or string for demo
    required: true
  }]
});

module.exports = mongoose.model('Group', groupSchema);
