import api from './api';
import { Channel, Server } from '../types/server';

export const serverService = {
  getServerInfo: async (): Promise<Server> => {
    const response = await api.get('/server');
    return response.data;
  },

  getChannels: async (): Promise<Channel[]> => {
    const response = await api.get('/server/channels');
    return response.data;
  },

  createChannel: async (data: { name: string; type: 'text' | 'voice' }): Promise<Channel> => {
    const response = await api.post('/server/channels', data);
    return response.data;
  },

  deleteChannel: async (channelId: string): Promise<void> => {
    await api.delete(`/server/channels/${channelId}`);
  }
}; 