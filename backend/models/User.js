const mongoose = require('mongoose');

// User Schema for the leaderboard system Stores user information and their total points

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  totalPoints: {
    type: Number,
    default: 0,
    min: [0, 'Total points cannot be negative']
  },
  rank: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient sorting by points
userSchema.index({ totalPoints: -1 });

// Virtual field to format creation date
userSchema.virtual('memberSince').get(function() {
  return this.createdAt ? this.createdAt.toLocaleDateString() : 'Unknown';
});

// Static method to calculate and update all user rankings
userSchema.statics.updateRankings = async function() {
  try {
    // Get all users sorted by total points (descending)
    const users = await this.find({}).sort({ totalPoints: -1, createdAt: 1 });
    
    // Update rankings
    for (let i = 0; i < users.length; i++) {
      await this.findByIdAndUpdate(users[i]._id, { rank: i + 1 });
    }
    
    return users;
  } catch (error) {
    throw new Error('Error updating rankings: ' + error.message);
  }
};

// Instance method to add points to a user
userSchema.methods.addPoints = async function(points) {
  try {
    this.totalPoints += points;
    await this.save();
    
    // Update all rankings after points change
    await this.constructor.updateRankings();
    
    return this;
  } catch (error) {
    throw new Error('Error adding points: ' + error.message);
  }
};

// Pre-save middleware to ensure data integrity
userSchema.pre('save', function(next) {
  // Ensure total points is not negative
  if (this.totalPoints < 0) {
    this.totalPoints = 0;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
