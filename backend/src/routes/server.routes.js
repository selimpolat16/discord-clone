const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const Channel = require('../models/channel.model');
const Server = require('../models/server.model');

// Tüm server route'larına auth middleware'ini ekle
router.use(authMiddleware);

// Tüm sunucuları getir
router.get('/', async (req, res) => {
  try {
    const servers = await Server.find()
      .populate('channels');
    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni sunucu oluştur
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Sunucu adı boş olamaz' });
    }

    // Varsayılan metin kanalını oluştur
    const generalChannel = new Channel({
      name: 'genel',
      type: 'text'
    });
    await generalChannel.save();

    // Yeni sunucuyu oluştur
    const server = new Server({
      name: name.trim(),
      ownerId: req.user.username, // Token'dan gelen kullanıcı
      channels: [generalChannel._id],
      members: [{
        username: req.user.username,
        status: 'online'
      }]
    });

    await server.save();

    // Sunucuyu kanallarıyla birlikte getir
    const populatedServer = await Server.findById(server._id)
      .populate('channels');

    res.status(201).json(populatedServer);
  } catch (error) {
    console.error('Sunucu oluşturma hatası:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Bu isimde bir sunucu zaten mevcut' });
    }
    res.status(500).json({ error: 'Sunucu oluşturulurken bir hata oluştu' });
  }
});

// Kanal oluştur
router.post('/:serverId/channels', async (req, res) => {
  try {
    const { name, type } = req.body;
    const serverId = req.params.serverId;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Kanal adı boş olamaz' });
    }

    // Yeni kanalı oluştur
    const channel = new Channel({
      name: name.trim(),
      type: type || 'text'
    });
    await channel.save();

    // Sunucuya kanalı ekle
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' });
    }

    server.channels.push(channel._id);
    await server.save();

    res.status(201).json(channel);
  } catch (error) {
    console.error('Kanal oluşturma hatası:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Bu isimde bir kanal zaten mevcut' });
    }
    res.status(500).json({ error: 'Kanal oluşturulurken bir hata oluştu' });
  }
});

// Tüm kanalları getir
router.get('/channels', async (req, res) => {
  try {
    const channels = await Channel.find()
      .sort({ createdAt: -1 });
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Kanallar getirilirken bir hata oluştu' });
  }
});

// Belirli bir kanalı getir
router.get('/channels/:id', async (req, res) => {
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

// Kanalı güncelle
router.patch('/channels/:id', async (req, res) => {
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
router.delete('/channels/:id', async (req, res) => {
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