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

// Ses kanallarındaki kullanıcıları tutacak Map
const voiceChannels = new Map();

// Ses kanalı yardımcı fonksiyonları - io.on('connection') dışında tanımlayın
const getChannelUserCount = (channelId) => {
  const channelUsers = voiceChannels.get(channelId);
  return channelUsers ? channelUsers.size : 0;
};

const getChannelUsers = (channelId) => {
  const channelUsers = voiceChannels.get(channelId);
  return channelUsers ? Array.from(channelUsers.values()) : [];
};

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

  // Ses kanalına katılma
  socket.on('voice:join', ({ channelId, userId, isMuted }) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;

    if (!voiceChannels.has(channelId)) {
      voiceChannels.set(channelId, new Map());
    }
    
    const channelUsers = voiceChannels.get(channelId);
    channelUsers.set(userId, {
      ...user,
      channelId,
      isMuted: isMuted || false,
      isDeafened: false,
      hasVideo: false
    });

    socket.join(`voice:${channelId}`);
    
    // Kullanıcı sayısını ve listesini güncelle
    io.to(`voice:${channelId}`).emit('voice:user-count', {
      channelId,
      count: getChannelUserCount(channelId)
    });
    
    io.to(`voice:${channelId}`).emit('voice:update', getChannelUsers(channelId));
  });

  // Ses kanalından ayrılma
  socket.on('voice:leave', ({ channelId, userId }) => {
    const channelUsers = voiceChannels.get(channelId);
    if (channelUsers) {
      channelUsers.delete(userId);
      socket.leave(`voice:${channelId}`);

      if (channelUsers.size === 0) {
        voiceChannels.delete(channelId);
      }

      // Güncellenmiş kullanıcı listesini ve sayısını gönder
      io.to(`voice:${channelId}`).emit('voice:update', getChannelUsers(channelId));
      io.to(`voice:${channelId}`).emit('voice:user-count', {
        channelId,
        count: getChannelUserCount(channelId)
      });
    }
  });

  // Kanal kullanıcılarını al
  socket.on('voice:get-users', ({ channelId }) => {
    socket.emit('voice:update', getChannelUsers(channelId));
    socket.emit('voice:user-count', {
      channelId,
      count: getChannelUserCount(channelId)
    });
  });

  // Mikrofon durumu değişikliği
  socket.on('voice:mute', ({ channelId, userId, isMuted }) => {
    const channelUsers = voiceChannels.get(channelId);
    if (channelUsers) {
      const user = channelUsers.get(userId);
      if (user) {
        // Kullanıcının mikrofon durumunu güncelle
        user.isMuted = isMuted;
        channelUsers.set(userId, user);
        
        // Tüm kanal kullanıcılarına güncel listeyi gönder
        io.to(`voice:${channelId}`).emit('voice:update', getChannelUsers(channelId));
        
        console.log(`Kullanıcı ${userId} mikrofon durumu: ${isMuted ? 'Kapalı' : 'Açık'}`);
      }
    }
  });

  // Sağır modu değişikliği
  socket.on('voice:deafen', ({ channelId, userId, isDeafened }) => {
    const channelUsers = voiceChannels.get(channelId);
    if (channelUsers) {
      const user = channelUsers.get(userId);
      if (user) {
        user.isDeafened = isDeafened;
        channelUsers.set(userId, user);
        io.to(`voice:${channelId}`).emit('voice:update', 
          Array.from(channelUsers.values())
        );
      }
    }
  });

  // Ses sinyali iletimi
  socket.on('voice:signal', ({ targetUserId, signal, channelId }) => {
    const fromUser = onlineUsers.get(socket.id);
    if (!fromUser) return;

    // Hedef kullanıcıyı bul
    let targetSocket = null;
    onlineUsers.forEach((user, socketId) => {
      if (user.id === targetUserId) {
        targetSocket = socketId;
      }
    });

    if (targetSocket) {
      io.to(targetSocket).emit('voice:signal', {
        fromUserId: fromUser.id,
        signal
      });
    }
  });

  // WebRTC sinyalleşme
  socket.on('voice:offer', ({ targetUserId, offer, channelId }) => {
    const fromUser = onlineUsers.get(socket.id);
    if (!fromUser) return;

    // Hedef kullanıcıyı bul
    let targetSocket = null;
    onlineUsers.forEach((user, socketId) => {
      if (user.id === targetUserId) {
        targetSocket = socketId;
      }
    });

    if (targetSocket) {
      console.log(`Teklif iletiliyor: ${fromUser.id} -> ${targetUserId}`);
      io.to(targetSocket).emit('voice:offer', {
        fromUserId: fromUser.id,
        offer
      });
    }
  });

  socket.on('voice:answer', ({ targetUserId, answer }) => {
    const fromUser = onlineUsers.get(socket.id);
    if (!fromUser) return;

    let targetSocket = null;
    onlineUsers.forEach((user, socketId) => {
      if (user.id === targetUserId) {
        targetSocket = socketId;
      }
    });

    if (targetSocket) {
      console.log(`Cevap iletiliyor: ${fromUser.id} -> ${targetUserId}`);
      io.to(targetSocket).emit('voice:answer', {
        fromUserId: fromUser.id,
        answer
      });
    }
  });

  socket.on('voice:ice-candidate', ({ targetUserId, candidate, channelId }) => {
    const fromUser = onlineUsers.get(socket.id);
    if (!fromUser) return;

    let targetSocket = null;
    onlineUsers.forEach((user, socketId) => {
      if (user.id === targetUserId) {
        targetSocket = socketId;
      }
    });

    if (targetSocket) {
      io.to(targetSocket).emit('voice:ice-candidate', {
        fromUserId: fromUser.id,
        candidate
      });
    }
  });

  // Kullanıcı konuşmaya başladığında
  socket.on('voice:speaking-start', ({ channelId, userId }) => {
    io.to(channelId).emit('voice:user-speaking', { userId, speaking: true });
  });

  // Kullanıcı konuşmayı bitirdiğinde
  socket.on('voice:speaking-end', ({ channelId, userId }) => {
    io.to(channelId).emit('voice:user-speaking', { userId, speaking: false });
  });

  // Video durumu değişikliği
  socket.on('voice:video', ({ channelId, userId, hasVideo }) => {
    const channelUsers = voiceChannels.get(channelId);
    if (channelUsers) {
      const user = channelUsers.get(userId);
      if (user) {
        user.hasVideo = hasVideo;
        channelUsers.set(userId, user);
        io.to(`voice:${channelId}`).emit('voice:update', Array.from(channelUsers.values()));
      }
    }
  });

  // Bağlantı koptuğunda
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      // Kullanıcıyı tüm ses kanallarından çıkar
      voiceChannels.forEach((users, channelId) => {
        if (users.has(user.id)) {
          users.delete(user.id);
          io.to(`voice:${channelId}`).emit('voice:update', 
            Array.from(users.values())
          );
          // Diğer kullanıcılara bildir
          io.to(`voice:${channelId}`).emit('user:disconnect', user.id);
        }
      });
    }
    onlineUsers.delete(socket.id);
    io.emit('users:update', Array.from(onlineUsers.values()));
  });
});

// Server'ı başlat
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 