const mongoose = require('mongoose');

// History Schema for tracking point claim activities Stores every point claim event for audit and analysis
const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true // Index for efficient queries by user
  },
  userName: {
    type: String,
    required: [true, 'User name is required'],
    trim: true
  },
  pointsAwarded: {
    type: Number,
    required: [true, 'Points awarded is required'],
    min: [1, 'Points awarded must be at least 1'],
    max: [10, 'Points awarded cannot exceed 10']
  },
  previousTotal: {
    type: Number,
    default: 0,
    min: [0, 'Previous total cannot be negative']
  },
  newTotal: {
    type: Number,
    required: [true, 'New total is required'],
    min: [0, 'New total cannot be negative']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true // Index for efficient time-based queries
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for efficient user-specific history queries
historySchema.index({ userId: 1, timestamp: -1 });

// Virtual field to format timestamp
historySchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Virtual field to calculate points difference
historySchema.virtual('pointsDifference').get(function() {
  return this.newTotal - this.previousTotal;
});

// Static method to get user statistics
historySchema.statics.getUserStats = async function(userId) {
  try {
    const stats = await this.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: '$userId',
          totalClaims: { $sum: 1 },
          totalPointsEarned: { $sum: '$pointsAwarded' },
          averagePoints: { $avg: '$pointsAwarded' },
          maxPoints: { $max: '$pointsAwarded' },
          minPoints: { $min: '$pointsAwarded' },
          lastClaim: { $max: '$timestamp' }
        }
      }
    ]);
    
    return stats[0] || null;
  } catch (error) {
    throw new Error('Error getting user stats: ' + error.message);
  }
};

// Static method to get recent activity
historySchema.statics.getRecentActivity = async function(limit = 10) {
  try {
    return await this.find({})
      .populate('userId', 'name')
      .sort({ timestamp: -1 })
      .limit(limit);
  } catch (error) {
    throw new Error('Error getting recent activity: ' + error.message);
  }
};

// Static method to get leaderboard with activity data
historySchema.statics.getLeaderboardStats = async function() {
  try {
    const stats = await this.aggregate([
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          totalClaims: { $sum: 1 },
          totalPointsEarned: { $sum: '$pointsAwarded' },
          averagePoints: { $avg: '$pointsAwarded' },
          lastActivity: { $max: '$timestamp' }
        }
      },
      {
        $sort: { totalPointsEarned: -1 }
      }
    ]);
    
    return stats;
  } catch (error) {
    throw new Error('Error getting leaderboard stats: ' + error.message);
  }
};

module.exports = mongoose.model('History', historySchema);
