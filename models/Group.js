const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    avatar: String, // URL or base64
    initials: String
  }],
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Group', GroupSchema);
