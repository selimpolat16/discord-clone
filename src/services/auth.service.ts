import api from '../api/axios';

interface LoginResponse {
  message: string;
  user: {
    username: string;
    token: string;
  };
}

export const loginUser = async (username: string): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/api/auth/login', { username });
    return response.data;
  } catch (error) {
    throw error;
  }
}; 