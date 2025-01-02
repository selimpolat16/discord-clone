import api from './api';

interface LoginCredentials {
  username: string;
}

interface RegisterCredentials {
  username: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials) => {
    const response = await api.post('/auth/register', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

export default authService; 