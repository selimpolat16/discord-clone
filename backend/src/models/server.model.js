const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }],
  categories: [{
    name: String,
    channels: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    }]
  }],
  members: [{
    username: String,
    discriminator: String, // #0001 gibi
    avatar: String,
    status: {
      type: String,
      enum: ['online', 'idle', 'dnd', 'offline'],
      default: 'online'
    },
    customStatus: String,
    roles: [String]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Server', serverSchema); 