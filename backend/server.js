// Task Owner: Team FULLSTOK - Initial Setup & General Config
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'HR Dashboard API is running' });
});

// API routes
app.use('/api', require('./routes/api'));

// Error handler middleware
const errorHandler = require('./utils/errorHandler');
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
