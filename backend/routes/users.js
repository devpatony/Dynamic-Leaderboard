const express = require('express');
const router = express.Router();
const User = require('../models/User');
const History = require('../models/History');

/**
 * @route   GET /api/users
 * @desc    Get all users with rankings
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Update rankings before fetching
    await User.updateRankings();
    
    // Get all users sorted by rank
    const users = await User.find({}).sort({ rank: 1 });
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get a single user by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Get user statistics from history
    const stats = await History.getUserStats(user._id);
    
    res.json({
      success: true,
      data: {
        ...user.toObject(),
        stats: stats
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User name is required'
      });
    }
    
    // Check if user already exists (case-insensitive)
    const existingUser = await User.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this name already exists'
      });
    }
    
    // Create new user
    const user = new User({
      name: name.trim(),
      totalPoints: 0
    });
    
    await user.save();
    
    // Update rankings after adding new user
    await User.updateRankings();
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/users/:id/claim
 * @desc    Claim random points for a user
 * @access  Public
 */
router.post('/:id/claim', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Generate random points between 1 and 10
    const pointsAwarded = Math.floor(Math.random() * 10) + 1;
    const previousTotal = user.totalPoints;
    
    // Add points to user
    await user.addPoints(pointsAwarded);
    
    // Create history record
    const historyRecord = new History({
      userId: user._id,
      userName: user.name,
      pointsAwarded: pointsAwarded,
      previousTotal: previousTotal,
      newTotal: user.totalPoints
    });
    
    await historyRecord.save();
    
    // Get updated user with new rank
    const updatedUser = await User.findById(user._id);
    
    res.json({
      success: true,
      data: {
        user: updatedUser,
        pointsAwarded: pointsAwarded,
        previousTotal: previousTotal,
        newTotal: updatedUser.totalPoints,
        rankChange: previousTotal === 0 ? 'New user!' : 'Check leaderboard for rank changes'
      },
      message: `${pointsAwarded} points awarded to ${user.name}!`
    });
  } catch (error) {
    console.error('Error claiming points:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim points',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user information
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User name is required'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if another user already has this name
    const existingUser = await User.findOne({
      _id: { $ne: req.params.id },
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Another user with this name already exists'
      });
    }
    
    user.name = name.trim();
    await user.save();
    
    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Delete user and their history
    await User.findByIdAndDelete(req.params.id);
    await History.deleteMany({ userId: req.params.id });
    
    // Update rankings after deletion
    await User.updateRankings();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/users/reset-all
 * @desc    Reset all user points to zero
 * @access  Public
 */
router.post('/reset-all', async (req, res) => {
  try {
    await User.updateMany({}, { totalPoints: 0 });
    await User.updateRankings();
    await History.deleteMany({});
    
    res.json({
      success: true,
      message: 'All user points reset successfully'
    });
  } catch (error) {
    console.error('Error resetting points:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset points',
      message: error.message
    });
  }
});

module.exports = router;
