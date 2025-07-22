const express = require('express');
const Group = require('../models/Group');
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

// Create a group
router.post('/', auth, async (req, res) => {
  const { name, members } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Group name required' });
  try {
    const User = require('../models/User');
    const creator = await User.findById(req.userId);
    if (!creator) return res.status(400).json({ success: false, message: 'Creator not found' });
    // Store all members as usernames, including creator
    const memberUsernames = [creator.username, ...(members || [])];
    const group = new Group({ name, owner: req.userId, members: memberUsernames });
    await group.save();
    // Emit socket event for new group
    if (req.app.get('io')) {
      req.app.get('io').emit('groupCreated', group);
    }
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// List groups for user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or deleted' });
    }
    const username = user.username;
    const groups = await Group.find({
      $or: [
        { owner: userId },
        { members: username }
      ]
    });
    res.json({ success: true, data: Array.isArray(groups) ? groups : [] });
  } catch (err) {
    console.error('Error in GET /groups:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Join a group
router.post('/:id/join', auth, async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: req.userId } },
      { new: true }
    );
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    // Emit socket event for group update
    if (req.app.get('io')) {
      req.app.get('io').emit('groupUpdated', group);
    }
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Leave a group
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { $pull: { members: req.userId } },
      { new: true }
    );
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    // Emit socket event for group update
    if (req.app.get('io')) {
      req.app.get('io').emit('groupUpdated', group);
    }
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add person to group (by name)
router.post('/:id/add-person', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });
    const User = require('../models/User');
    const user = await User.findOne({ username: name });
    if (!user) return res.status(400).json({ success: false, message: 'User not found. Only registered users can be added.' });
    // Only add username to group members
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: user.username } },
      { new: true }
    );
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    // Emit socket event for group update
    if (req.app.get('io')) {
      req.app.get('io').emit('groupUpdated', group);
    }
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Group messages (stub, replace with real DB)
let groupMessages = {};
const GroupMessage = require('../models/GroupMessage');
// Get group messages (persistent)
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const msgs = await GroupMessage.find({ group: req.params.id })
      .populate('sender', 'username') // Populate sender with username
      .sort({ created_at: 1 });
    res.json({ success: true, data: msgs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// POST /groups/:id/messages - Add a new message to the group
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'Message text required' });
    const GroupMessage = require('../models/GroupMessage');
    const msg = new GroupMessage({ group: req.params.id, sender: req.userId, text });
    await msg.save();
    // Populate sender with username for real-time emit
    const populatedMsg = await GroupMessage.findById(msg._id).populate('sender', 'username');
    // Emit socket event for real-time chat
    if (req.app.get('io')) {
      req.app.get('io').to(String(req.params.id)).emit('groupMessage', populatedMsg);
    }
    res.json({ success: true, data: populatedMsg });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
