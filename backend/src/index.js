require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Express app oluştur
const app = express();
const server = http.createServer(app);

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB bağlantısı başarılı');
})
.catch((err) => {
  console.error('MongoDB bağlantı hatası:', err);
  process.exit(1);
});

// Modelleri yükle
require('./models/User');
require('./models/channel.model');
require('./models/message.model');

// Route'ları yükle
const authRoutes = require('./routes/auth.routes');
const channelRoutes = require('./routes/channel.routes');
const messageRoutes = require('./routes/message.routes');

// CORS ayarları
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Socket.IO ayarları
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket hata yakalama
io.engine.on("connection_error", (err) => {
  console.log('Socket.IO bağlantı hatası:', err);
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);

// Socket.IO instance'ını express app'e ekle
app.set('io', io);

// Online kullanıcıları tutacak Map
const onlineUsers = new Map();

// Ses kanalındaki kullanıcıları tut
const voiceChannels = new Map();

// Socket bağlantılarını yönet
io.on('connection', (socket) => {
  console.log('Yeni socket bağlantısı:', socket.id);

  // Kullanıcı bağlandığında
  socket.on('user:connect', (userData) => {
    onlineUsers.set(socket.id, {
      ...userData,
      socketId: socket.id
    });
    
    // Tüm kullanıcılara yeni kullanıcıyı bildir
    socket.broadcast.emit('user:joined', userData);
    
    // Bağlanan kullanıcıya mevcut kullanıcı listesini gönder
    io.emit('users:update', Array.from(onlineUsers.values()));
  });

  // Kullanıcı durumunu güncellediğinde
  socket.on('user:updateStatus', (userData) => {
    if (onlineUsers.has(socket.id)) {
      onlineUsers.set(socket.id, {
        ...userData,
        socketId: socket.id
      });
      io.emit('users:update', Array.from(onlineUsers.values()));
    }
  });

  // Kullanıcı ayrıldığında
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit('user:left', user.username);
      onlineUsers.delete(socket.id);
      io.emit('users:update', Array.from(onlineUsers.values()));
    }
    console.log('Kullanıcı ayrıldı:', socket.id);
  });
});

// Server'ı başlat
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 