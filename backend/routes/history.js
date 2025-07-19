const express = require('express');
const router = express.Router();
const History = require('../models/History');
const User = require('../models/User');

/**
 * @route   GET /api/history
 * @desc    Get all point claim history with pagination
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await History.countDocuments();
    
    // Get paginated history
    const history = await History.find({})
      .populate('userId', 'name totalPoints rank')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    res.json({
      success: true,
      data: history,
      pagination: {
        current: page,
        total: totalPages,
        hasNext,
        hasPrev,
        count: history.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/history/recent
 * @desc    Get recent activity (last 10 claims)
 * @access  Public
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const recentActivity = await History.getRecentActivity(limit);
    
    res.json({
      success: true,
      data: recentActivity,
      count: recentActivity.length
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activity',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/history/user/:userId
 * @desc    Get point claim history for a specific user
 * @access  Public
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Get total count for this user
    const total = await History.countDocuments({ userId });
    
    // Get user's history
    const userHistory = await History.find({ userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get user statistics
    const stats = await History.getUserStats(userId);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          totalPoints: user.totalPoints,
          rank: user.rank
        },
        history: userHistory,
        stats: stats
      },
      pagination: {
        current: page,
        total: totalPages,
        hasNext,
        hasPrev,
        count: userHistory.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user history',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/history/stats
 * @desc    Get overall statistics for the leaderboard
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    // Get leaderboard stats
    const leaderboardStats = await History.getLeaderboardStats();
    
    // Get overall statistics
    const overallStats = await History.aggregate([
      {
        $group: {
          _id: null,
          totalClaims: { $sum: 1 },
          totalPointsAwarded: { $sum: '$pointsAwarded' },
          averagePointsPerClaim: { $avg: '$pointsAwarded' },
          maxPointsInSingleClaim: { $max: '$pointsAwarded' },
          minPointsInSingleClaim: { $min: '$pointsAwarded' },
          firstClaim: { $min: '$timestamp' },
          lastClaim: { $max: '$timestamp' }
        }
      }
    ]);
    
    // Get daily statistics for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyStats = await History.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          claimsCount: { $sum: 1 },
          totalPoints: { $sum: '$pointsAwarded' },
          averagePoints: { $avg: '$pointsAwarded' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        overall: overallStats[0] || {
          totalClaims: 0,
          totalPointsAwarded: 0,
          averagePointsPerClaim: 0,
          maxPointsInSingleClaim: 0,
          minPointsInSingleClaim: 0,
          firstClaim: null,
          lastClaim: null
        },
        leaderboard: leaderboardStats,
        dailyStats: dailyStats
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/history/search
 * @desc    Search history by user name or date range
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { userName, startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build search query
    let query = {};
    
    if (userName) {
      query.userName = { $regex: userName, $options: 'i' };
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }
    
    // Get total count for pagination
    const total = await History.countDocuments(query);
    
    // Get search results
    const results = await History.find(query)
      .populate('userId', 'name totalPoints rank')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    res.json({
      success: true,
      data: results,
      searchParams: { userName, startDate, endDate },
      pagination: {
        current: parseInt(page),
        total: totalPages,
        hasNext,
        hasPrev,
        count: results.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Error searching history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search history',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/history/:id
 * @desc    Delete a specific history record (admin feature)
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const historyRecord = await History.findById(req.params.id);
    
    if (!historyRecord) {
      return res.status(404).json({
        success: false,
        error: 'History record not found'
      });
    }
    
    await History.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'History record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting history record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete history record',
      message: error.message
    });
  }
});

module.exports = router;
