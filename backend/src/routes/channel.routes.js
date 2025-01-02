const express = require('express');
const router = express.Router();
const Channel = require('../models/channel.model');

// Tüm kanalları getir
router.get('/', async (req, res) => {
  try {
    const channels = await Channel.find().sort({ type: 1, name: 1 });
    console.log('Kanallar başarıyla getirildi:', channels); // Debug log
    res.json(channels);
  } catch (error) {
    console.error('Kanal listesi alınırken hata:', error);
    res.status(500).json({ message: 'Kanallar alınırken hata oluştu' });
  }
});

// Yeni kanal oluştur
router.post('/', async (req, res) => {
  try {
    console.log('Gelen kanal oluşturma isteği:', req.body);

    const { name, type } = req.body;

    // Validasyon kontrolleri
    if (!name || !type) {
      console.log('Validasyon hatası: Eksik bilgi');
      return res.status(400).json({ 
        message: 'Kanal adı ve türü gerekli',
        received: { name, type }
      });
    }

    if (!['text', 'voice'].includes(type)) {
      console.log('Validasyon hatası: Geçersiz kanal türü');
      return res.status(400).json({ 
        message: 'Geçersiz kanal türü. "text" veya "voice" olmalı',
        received: type
      });
    }

    // Aynı isimde kanal var mı kontrol et
    const normalizedName = name.trim().toLowerCase();
    const existingChannel = await Channel.findOne({ name: normalizedName });
    
    if (existingChannel) {
      console.log('Validasyon hatası: Kanal zaten var');
      return res.status(400).json({ 
        message: 'Bu isimde bir kanal zaten var',
        existing: existingChannel
      });
    }

    // Yeni kanalı oluştur
    const channel = new Channel({
      name: normalizedName,
      type
    });

    await channel.save();
    console.log('Yeni kanal oluşturuldu:', channel);

    // Socket.IO ile diğer kullanıcılara bildir
    // Event'i sadece bir kez gönder
    const io = req.app.get('io');
    if (io) {
      io.emit('channel_created', channel);
    }

    // Başarılı yanıt
    res.status(201).json(channel);
  } catch (error) {
    console.error('Kanal oluşturma hatası:', error);
    res.status(500).json({ 
      message: 'Kanal oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

// Kanal sil
router.delete('/:id', async (req, res) => {
  try {
    const channel = await Channel.findByIdAndDelete(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Kanal bulunamadı' });
    }

    // Socket.IO ile diğer kullanıcılara bildir
    req.app.get('io').emit('channel_deleted', req.params.id);

    res.json({ message: 'Kanal başarıyla silindi' });
  } catch (error) {
    console.error('Kanal silme hatası:', error);
    res.status(500).json({ message: 'Kanal silinirken hata oluştu' });
  }
});

module.exports = router; 