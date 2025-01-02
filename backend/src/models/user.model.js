const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['online', 'idle', 'dnd', 'invisible', 'offline'],
    default: 'online'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Koleksiyonu temizle ve yeniden oluştur
const setupCollection = async () => {
  try {
    // Mevcut koleksiyonu sil
    await mongoose.connection.collections['users']?.drop();
    console.log('Users koleksiyonu silindi');
  } catch (error) {
    console.log('Koleksiyon silme hatası (ilk çalıştırma olabilir):', error.message);
  }
};

// Schema seviyesinde index tanımla
userSchema.index({ username: 1 }, { 
  unique: true,
  background: true,
  name: 'username_unique' 
});

const User = mongoose.model('User', userSchema);

// Koleksiyonu hazırla
setupCollection().catch(console.error);

module.exports = User; 