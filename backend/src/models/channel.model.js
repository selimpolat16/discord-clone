const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ['text', 'voice'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Aynı isimde kanal oluşturulmasını engelle
channelSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Channel', channelSchema); 