require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/message.model');

// Express app oluştur
const app = express();
const server = http.createServer(app);

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB bağlantısı başarılı');
  } catch (err) {
    console.error('MongoDB bağlantı hatası:', err.message);
    process.exit(1);
  }
};

// İlk bağlantıyı başlat
connectDB();

// Bağlantı durumunu izle
mongoose.connection.on('error', (err) => {
  console.error('Mongoose bağlantı hatası:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose bağlantısı kesildi');
});

// Uygulama kapandığında bağlantıyı düzgün şekilde kapat
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
    process.exit(0);
  } catch (err) {
    console.error('MongoDB bağlantısı kapatılırken hata:', err);
    process.exit(1);
  }
});

// Route'ları yükle
const authRoutes = require('./routes/auth.routes');
const channelRoutes = require('./routes/channel.routes');
const messageRoutes = require('./routes/message.routes');
const serverRoutes = require('./routes/server.routes');

// CORS ayarları
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/channels', channelRoutes);

// Socket.IO ayarları
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Online kullanıcıları ve durumlarını tutacak Map
const onlineUsers = new Map();

// Socket bağlantılarını yönet
io.on('connection', (socket) => {
  console.log('Yeni socket bağlantısı:', socket.id);

  // Kullanıcı bağlandığında
  socket.on('user:connect', (userData) => {
    if (userData) {
      onlineUsers.set(socket.id, {
        ...userData,
        socketId: socket.id,
        status: 'online'
      });
      io.emit('users:update', Array.from(onlineUsers.values()));
    }
  });

  // Kanala katılma
  socket.on('channel:join', (channelId) => {
    socket.join(channelId);
    console.log(`Kullanıcı ${socket.id} kanala katıldı: ${channelId}`);
  });

  // Kanaldan ayrılma
  socket.on('channel:leave', (channelId) => {
    socket.leave(channelId);
    console.log(`Kullanıcı ${socket.id} kanaldan ayrıldı: ${channelId}`);
  });

  // Mesaj gönderme
  socket.on('message:send', async ({ channelId, content }) => {
    try {
      const user = onlineUsers.get(socket.id);
      if (!user) return;

      // Yeni mesaj oluştur
      const message = new Message({
        content,
        channelId,
        author: {
          username: user.username,
          id: user.id
        }
      });

      // Mesajı veritabanına kaydet
      await message.save();

      // Mesajı kanaldaki herkese gönder
      io.to(channelId).emit('message:receive', {
        _id: message._id,
        content: message.content,
        channelId: message.channelId,
        author: message.author,
        createdAt: message.createdAt
      });
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    }
  });

  // Kullanıcı durumu değiştiğinde
  socket.on('user:status', ({ status }) => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      user.status = status;
      onlineUsers.set(socket.id, user);
      // Tüm kullanıcılara güncel durumu bildir
      io.emit('users:update', Array.from(onlineUsers.values()));
    }
  });

  // Bağlantı koptuğunda
  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    // Tüm kullanıcılara güncel listeyi gönder
    io.emit('users:update', Array.from(onlineUsers.values()));
  });
});

// Server'ı başlat
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 