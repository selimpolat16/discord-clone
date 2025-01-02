const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  icon: {
    type: String,
    default: null
  },
  ownerId: {
    type: String,
    required: true
  },
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }],
  members: [{
    username: String,
    status: {
      type: String,
      enum: ['online', 'offline', 'idle', 'dnd'],
      default: 'online'
    },
    avatar: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Server', serverSchema); 