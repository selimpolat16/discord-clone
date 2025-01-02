const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  name: {
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
      enum: ['online', 'idle', 'dnd', 'offline'],
      default: 'online'
    },
    avatar: String,
    customStatus: String
  }]
});

const Server = mongoose.model('Server', serverSchema);
module.exports = Server; 