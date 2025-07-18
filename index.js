const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
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

const peopleRouter = require('./routes/people');
const balancesRouter = require('./routes/balances');
const settlementsRouter = require('./routes/settlements');
app.use('/people', peopleRouter);
app.use('/balances', balancesRouter);
app.use('/settlements', settlementsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
