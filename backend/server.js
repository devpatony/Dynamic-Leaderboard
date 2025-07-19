const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/users');
const historyRoutes = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  // Initialize default users
  initializeDefaultUsers();
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
});

// Initialize default users if database is empty
const initializeDefaultUsers = async () => {
  const User = require('./models/User');
  
  try {
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      const defaultUsers = [
        { name: 'Rahul', totalPoints: 0 },
        { name: 'Kamal', totalPoints: 0 },
        { name: 'Sanak', totalPoints: 0 },
        { name: 'Priya', totalPoints: 0 },
        { name: 'Amit', totalPoints: 0 },
        { name: 'Neha', totalPoints: 0 },
        { name: 'Raj', totalPoints: 0 },
        { name: 'Pooja', totalPoints: 0 },
        { name: 'Vikash', totalPoints: 0 },
        { name: 'Anita', totalPoints: 0 }
      ];
      
      await User.insertMany(defaultUsers);
      console.log('🎯 Default users initialized');
    }
  } catch (error) {
    console.error('Error initializing default users:', error);
  }
};

// Routes
app.use('/api/users', userRoutes);
app.use('/api/history', historyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Leaderboard API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});
