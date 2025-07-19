const mongoose = require('mongoose');

const PeopleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true }
});

module.exports = mongoose.model('People', PeopleSchema); 