import axios from 'axios';

const API_URL = 'http://localhost:3001/api/messages';

export interface Message {
  _id: string;
  content: string;
  channelId: string;
  userId: string;
  username: string;
  createdAt: Date;
}

export const messageService = {
  async getChannelMessages(channelId: string): Promise<Message[]> {
    const response = await axios.get(`${API_URL}/channel/${channelId}`);
    return response.data;
  },

  async sendMessage(content: string, channelId: string, userId: string, username: string): Promise<Message> {
    const response = await axios.post(API_URL, {
      content,
      channelId,
      userId,
      username
    });
    return response.data;
  }
}; 