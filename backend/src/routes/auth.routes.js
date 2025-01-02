const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Basit login
router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({
        error: 'Kullanıcı adı en az 3 karakter olmalıdır'
      });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET || 'gizli-anahtar',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: '1', // Sabit ID
        username
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Giriş yapılırken bir hata oluştu' });
  }
});

module.exports = router; 