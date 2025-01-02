const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3
  },
  status: {
    type: String,
    enum: ['online', 'idle', 'dnd', 'invisible', 'offline'],
    default: 'online'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Username için unique index
userSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema); 