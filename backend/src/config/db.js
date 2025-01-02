const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Geliştirme ortamında koleksiyonları temizle
    if (process.env.NODE_ENV === 'development') {
      try {
        await mongoose.connection.dropDatabase();
        console.log('Veritabanı temizlendi');
      } catch (error) {
        console.error('Veritabanı temizleme hatası:', error);
      }
    }

    console.log('MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

module.exports = connectDB; 