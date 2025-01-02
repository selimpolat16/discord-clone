const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Koleksiyonu temizle ve yeniden oluştur
const setupCollection = async () => {
  try {
    await mongoose.connection.collections['channels']?.drop();
    console.log('Channels koleksiyonu silindi');
  } catch (error) {
    console.log('Koleksiyon silme hatası (ilk çalıştırma olabilir):', error.message);
  }
};

// Schema seviyesinde index tanımla
channelSchema.index({ name: 1 }, { 
  unique: true,
  background: true,
  name: 'channel_name_unique' 
});

const Channel = mongoose.model('Channel', channelSchema);

// Koleksiyonu hazırla
setupCollection().catch(console.error);

module.exports = Channel; 