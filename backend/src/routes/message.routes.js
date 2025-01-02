const express = require('express');
const router = express.Router();
const Message = require('../models/message.model');

module.exports = (io) => {
  // Mesaj gönderme
  router.post('/messages', async (req, res) => {
    try {
      const { channelId, content, userId } = req.body;
      const message = new Message({
        channelId,
        content,
        sender: userId,
        timestamp: new Date()
      });
      
      await message.save();
      
      // Socket.IO ile real-time mesaj gönderimi
      io.to(channelId).emit('new_message', message);
      
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Kanal mesajlarını getirme
  router.get('/channels/:channelId/messages', async (req, res) => {
    try {
      const messages = await Message.find({ 
        channelId: req.params.channelId 
      }).sort({ timestamp: -1 }).limit(50);
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}; 