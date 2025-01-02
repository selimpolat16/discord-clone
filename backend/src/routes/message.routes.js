const express = require('express');
const router = express.Router();
const Message = require('../models/message.model');

// Kanal mesajlarını getir
router.get('/channel/:channelId', async (req, res) => {
  try {
    const messages = await Message.find({ 
      channelId: req.params.channelId 
    }).sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    console.error('Mesajlar alınırken hata:', error);
    res.status(500).json({ message: 'Mesajlar alınırken hata oluştu' });
  }
});

// Yeni mesaj gönder
router.post('/', async (req, res) => {
  try {
    const { content, channelId, userId, username } = req.body;

    const message = new Message({
      content,
      channelId,
      userId,
      username
    });

    await message.save();

    // Socket.IO ile diğer kullanıcılara bildir
    req.app.get('io').to(`channel_${channelId}`).emit('new_message', message);

    res.status(201).json(message);
  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    res.status(500).json({ message: 'Mesaj gönderilemedi' });
  }
});

module.exports = router; 