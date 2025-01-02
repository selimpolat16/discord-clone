import express, { Request, Response, Application } from 'express';
import cors from 'cors';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(cors());

// Basit login endpoint'i
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Kullanıcı adı gerekli' });
  }

  // Başarılı yanıt
  res.json({
    success: true,
    user: {
      username,
      token: 'dummy-token-' + Date.now()
    }
  });
});

// Server'ı başlat
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} adresinde çalışıyor`);
}); 