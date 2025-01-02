const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Channel = require('../models/channel.model');
const Server = require('../models/server.model');
const User = require('../models/user.model');

let mainServer = null;

// Ana sunucuyu oluştur veya getir
router.get('/', auth, async (req, res) => {
  try {
    if (!mainServer) {
      mainServer = await Server.findOne();
      if (!mainServer) {
        // Örnek kullanıcılar
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
          },
          {
            username: req.body.username || "Yeni Kullanıcı",
            status: "online",
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
    
    // Sunucu bilgilerini kanallarla birlikte getir
    const populatedServer = await Server.findById(mainServer._id)
      .populate('channels')
      .populate('members.user');
    
    res.json(populatedServer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni kanal oluştur
router.post('/channels', auth, async (req, res) => {
  try {
    const channel = new Channel({
      name: req.body.name,
      type: req.body.type
    });
    await channel.save();

    // Kanalı ana sunucuya ekle
    if (mainServer) {
      mainServer.channels.push(channel._id);
      await mainServer.save();
    }

    res.status(201).json(channel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Kanal sil
router.delete('/channels/:id', auth, async (req, res) => {
  try {
    const channel = await Channel.findByIdAndDelete(req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Kanal bulunamadı' });
    }

    // Kanalı ana sunucudan kaldır
    if (mainServer) {
      mainServer.channels = mainServer.channels.filter(
        ch => ch.toString() !== req.params.id
      );
      await mainServer.save();
    }

    res.json({ message: 'Kanal başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 