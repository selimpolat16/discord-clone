const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Channel = require('../models/channel.model');
const Server = require('../models/server.model');

let mainServer = null;

// Ana sunucuyu oluştur veya getir
router.get('/', auth, async (req, res) => {
  try {
    if (!mainServer) {
      mainServer = await Server.findOne();
      if (!mainServer) {
        const defaultMembers = [
          {
            username: "Kullanıcı 1",
            status: "online",
            avatar: null
          },
          {
            username: "Kullanıcı 2",
            status: "idle",
            avatar: null
          },
          {
            username: "Kullanıcı 3",
            status: "dnd",
            avatar: null
          }
        ];

        mainServer = await new Server({
          name: "Discord Clone Server",
          channels: [],
          members: defaultMembers
        }).save();
      }
    }
    
    const populatedServer = await Server.findById(mainServer._id)
      .populate('channels');
    
    res.json(populatedServer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tüm kanalları getir
router.get('/channels', auth, async (req, res) => {
  try {
    const channels = await Channel.find()
      .sort({ createdAt: -1 });
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Kanallar getirilirken bir hata oluştu' });
  }
});

// Belirli bir kanalı getir
router.get('/channels/:id', auth, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Kanal bulunamadı' });
    }
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: 'Kanal getirilirken bir hata oluştu' });
  }
});

// Yeni kanal oluştur
router.post('/channels', async (req, res) => {
  try {
    const { name, type } = req.body;

    // İsim kontrolü
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Kanal adı boş olamaz' });
    }

    const channel = new Channel({
      name: name.trim(),
      type: type || 'text'
    });

    await channel.save();
    res.status(201).json(channel);
  } catch (error) {
    console.error('Kanal oluşturma hatası:', error);
    if (error.code === 11000) { // MongoDB duplicate key error
      return res.status(400).json({ error: 'Bu isimde bir kanal zaten mevcut' });
    }
    res.status(500).json({ error: 'Kanal oluşturulurken bir hata oluştu' });
  }
});

// Kanalı güncelle
router.patch('/channels/:id', auth, async (req, res) => {
  try {
    const { name, type } = req.body;
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({ error: 'Kanal bulunamadı' });
    }

    if (name) channel.name = name.trim();
    if (type) channel.type = type;

    await channel.save();
    res.json(channel);
  } catch (error) {
    if (error.message.includes('isminde bir kanal zaten mevcut')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Kanal güncellenirken bir hata oluştu' });
  }
});

// Kanalı sil
router.delete('/channels/:id', auth, async (req, res) => {
  try {
    const channel = await Channel.findByIdAndDelete(req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Kanal bulunamadı' });
    }
    res.json({ message: 'Kanal başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Kanal silinirken bir hata oluştu' });
  }
});

module.exports = router; 