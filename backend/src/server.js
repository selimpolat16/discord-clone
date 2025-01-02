const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// CORS ve JSON middleware
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı - daha detaylı hata ayıklama
mongoose.connect('mongodb://127.0.0.1:27017/discord-clone', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // Bağlantı zaman aşımı süresini artır
})
.then(() => {
  console.log('MongoDB bağlantısı başarılı');
})
.catch(err => {
  console.error('MongoDB bağlantı hatası detayları:', {
    name: err.name,
    message: err.message,
    code: err.code
  });
  // Uygulama MongoDB olmadan çalışamayacağı için sonlandır
  process.exit(1);
});

// MongoDB bağlantı durumunu izle
mongoose.connection.on('connected', () => {
  console.log('Mongoose bağlantısı kuruldu');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose bağlantı hatası:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose bağlantısı kesildi');
});

// Route'lar
const serverRoutes = require('./routes/server.routes');
app.use('/api/server', serverRoutes);

// Test endpoint'i
app.get('/test', (req, res) => {
  res.json({ message: 'Server çalışıyor' });
});

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
  console.error('Sunucu hatası:', err);
  res.status(500).json({ error: 'Sunucu hatası oluştu' });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server http://localhost:${PORT} adresinde çalışıyor`);
  console.log(`Test için: http://localhost:${PORT}/test`);
}); 