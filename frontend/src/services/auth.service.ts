import api from './api';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

export const authService = {
  login: async (username: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { username });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', username);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  },

  isLoggedIn: (): boolean => {
    return !!localStorage.getItem('token');
  },

  getUsername: (): string | null => {
    return localStorage.getItem('username');
  }
}; 