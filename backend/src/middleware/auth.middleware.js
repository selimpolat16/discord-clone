const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Token'ı header'dan al
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Yetkilendirme token'ı bulunamadı" });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Geçersiz token" });
  }
};

module.exports = authMiddleware; 