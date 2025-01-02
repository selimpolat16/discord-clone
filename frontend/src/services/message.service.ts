import api from './api';
import { Message } from '../types/message';

export const messageService = {
  getMessages: async (channelId: string): Promise<Message[]> => {
    const response = await api.get(`/messages/channel/${channelId}`);
    return response.data;
  },

  sendMessage: async (channelId: string, content: string): Promise<Message> => {
    const response = await api.post(`/messages/channel/${channelId}`, { content });
    return response.data;
  }
}; 