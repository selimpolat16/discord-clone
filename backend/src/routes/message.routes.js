const express = require('express');
const router = express.Router();
const Message = require('../models/message.model');

// Kanal mesajlarını getir
router.get('/:channelId', async (req, res) => {
  try {
    const messages = await Message.find({ channelId: req.params.channelId })
      .sort({ createdAt: 1 }) // Eskiden yeniye sırala
      .limit(50); // Son 50 mesajı getir
    res.json(messages);
  } catch (error) {
    console.error('Mesajlar getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 