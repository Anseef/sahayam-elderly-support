const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectToDb } = require('./config/db');
const authRoute = require('./routes/auth');
const requestRoute = require('./routes/requests');

dotenv.config();

const app = express();

// 1. CORS first
app.use(cors());

// 2. JSON Parser with INCREASED LIMIT (Call this ONLY ONCE)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. Routes
app.use('/api/user', authRoute);
app.use('/api/requests', requestRoute);

// Connect to DB first, then start server
connectToDb((err) => {
  if (!err) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } else {
    console.log('Failed to connect to DB', err);
  }
});