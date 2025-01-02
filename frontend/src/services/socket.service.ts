import { io, Socket } from 'socket.io-client';
import { Message, User } from '../types';

class SocketService {
  public socket: Socket | null = null;

  connect(user: User) {
    this.socket = io('http://localhost:3001', {
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO bağlantısı kuruldu');
      this.socket?.emit('user:connect', user);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket.IO bağlantı hatası:', error);
    });
  }

  updateStatus(status: 'online' | 'idle' | 'dnd' | 'offline') {
    this.socket?.emit('user:status', { status });
  }

  joinChannel(channelId: string) {
    this.socket?.emit('channel:join', channelId);
  }

  leaveChannel(channelId: string) {
    this.socket?.emit('channel:leave', channelId);
  }

  sendMessage(channelId: string, content: string) {
    this.socket?.emit('message:send', { channelId, content });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService(); 