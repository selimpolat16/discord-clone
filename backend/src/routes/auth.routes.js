const express = require('express');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ 
        error: 'Kullanıcı adı gerekli' 
      });
    }

    // Başarılı giriş
    res.json({
      success: true,
      user: {
        username,
        id: Date.now(),
      },
      message: 'Giriş başarılı'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Sunucu hatası',
      details: error.message 
    });
  }
});

module.exports = router; 