import api from './api';
import { Message } from '../types';

export const messageService = {
  getMessages: async (channelId: string): Promise<Message[]> => {
    const response = await api.get(`/messages/${channelId}`);
    return response.data;
  },

  sendMessage: async (channelId: string, content: string): Promise<Message> => {
    const response = await api.post(`/messages/${channelId}`, { content });
    return response.data;
  }
}; 