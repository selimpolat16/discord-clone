import api from './api';
import { socketService } from './socket.service';

interface LoginCredentials {
  username: string;
}

interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    username: string;
  };
  token: string;
  message: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: () => {
    // Socket bağlantısını kapat
    socketService.disconnect();
    
    // Local storage'ı temizle
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Login sayfasına yönlendir
    window.location.href = '/login';
  }
};

export default authService; 