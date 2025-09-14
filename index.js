const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const Expense = require('./models/Expense');

dotenv.config();

const app = express();
// Build allow list for CORS: include production domains + common local dev URLs.
// You can override / extend by setting CSV in process.env.CLIENT_ORIGINS
const extraEnvOrigins = process.env.CLIENT_ORIGINS ? process.env.CLIENT_ORIGINS.split(',').map(o => o.trim()).filter(Boolean) : [];
const allowedOrigins = Array.from(new Set([
  "https://devdynamics-split-app.vercel.app",
  "https://devynamics-yw9g.onrender.com", // existing deployed backend
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...extraEnvOrigins
]));
const isDev = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (isDev) {
      // In dev, warn but allow so local experimentation isn't blocked
      console.warn(`[CORS][DEV] Allowing unlisted origin: ${origin}`);
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked origin: ${origin}`);
    // Instead of throwing (which yields 500), respond with standard CORS failure
    return callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 204
}));

// NOTE: Removed explicit app.options('*') handler because Express 5 + path-to-regexp v8
// was throwing a "Missing parameter name" error in some environments. The main CORS
// middleware already handles preflight for listed origins.
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('Split App API is running');
});


const expensesRouter = require('./routes/expenses');
app.use('/expenses', expensesRouter);

const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

// Unregister endpoint (delete user account)
app.delete('/auth/unregister', async (req, res) => {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ success: false, message: 'No token provided' });
  const token = header.replace('Bearer ', '');
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'devdynamics_secret';
  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  try {
    const User = require('./models/User');
    const Group = require('./models/Group');
    const Expense = require('./models/Expense');
    // Remove user from all groups
    await Group.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );
    // Optionally: Delete all expenses created by this user
    await Expense.deleteMany({ user: userId });
    // Delete the user
    const result = await User.findByIdAndDelete(userId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User account and related data deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const peopleRouter = require('./routes/people');
const balancesRouter = require('./routes/balances');
const settlementsRouter = require('./routes/settlements');
const groupsRouter = require('./routes/groups');
app.use('/people', peopleRouter);
app.use('/balances', balancesRouter);
app.use('/settlements', settlementsRouter);
app.use('/groups', groupsRouter);

// Cron job: every day at midnight, check for due recurring expenses
cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();
    // Find all recurring expenses that are due
    const recExp = await Expense.find({
      'recurring.type': { $in: ['weekly', 'monthly'] },
      'recurring.next_due': { $lte: now }
    });
    for (const exp of recExp) {
      // Create a new expense with the same details but new date
      const newExp = new Expense({
        amount: exp.amount,
        description: exp.description + ' (recurring)',
        paid_by: exp.paid_by,
        split_type: exp.split_type,
        split_details: exp.split_details,
        group: exp.group,
        user: exp.user,
        category: exp.category,
        recurring: {
          type: exp.recurring.type,
          next_due: getNextDue(exp.recurring.type, exp.recurring.next_due)
        }
      });
      await newExp.save();
      // Update the original expense's next_due
      exp.recurring.next_due = getNextDue(exp.recurring.type, exp.recurring.next_due);
      await exp.save();
    }
    if (recExp.length > 0) {
      console.log(`Recurring expenses processed: ${recExp.length}`);
    }
  } catch (err) {
    console.error('Error processing recurring expenses:', err);
  }
});

function getNextDue(type, lastDue) {
  const date = new Date(lastDue);
  if (type === 'weekly') {
    date.setDate(date.getDate() + 7);
  } else if (type === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.io setup
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  // Join group room
  socket.on('joinGroup', (groupId) => {
    socket.join(groupId);
  });
  // Handle new group message
  socket.on('groupMessage', (msg) => {
    // msg: { groupId, sender, text, created_at }
    io.to(msg.groupId).emit('groupMessage', msg);
  });
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});
