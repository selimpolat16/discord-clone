import api from './api';
import { Server, Channel } from '../types';

export const serverService = {
  getServers: async (): Promise<Server[]> => {
    const response = await api.get('/servers');
    return response.data;
  },

  createServer: async (name: string): Promise<Server> => {
    const response = await api.post('/servers', { name });
    return response.data;
  },

  createChannel: async (serverId: string, name: string, type: 'text' | 'voice'): Promise<Channel> => {
    const response = await api.post(`/servers/${serverId}/channels`, { name, type });
    return response.data;
  }
}; 