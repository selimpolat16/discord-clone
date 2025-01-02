import { io, Socket } from 'socket.io-client';
import { ServerMember } from '../types/server';

type Callback = (data: any) => void;

interface UserStatus {
  username: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<Callback>>();
  private currentStatus: UserStatus | null = null;

  connect(userData: { username: string }) {
    if (this.socket?.connected) return;

    this.socket = io('http://localhost:3001', {
      withCredentials: true
    });

    this.currentStatus = {
      username: userData.username,
      status: 'online'
    };

    this.socket.on('connect', () => {
      console.log('Socket.IO bağlantısı kuruldu');
      this.socket?.emit('user:connect', this.currentStatus);
    });

    this.socket.on('users:update', (users: UserStatus[]) => {
      this.emit('usersUpdate', users);
    });

    this.socket.on('user:joined', (user: UserStatus) => {
      this.emit('userJoined', user);
    });

    this.socket.on('user:left', (username: string) => {
      this.emit('userLeft', username);
    });

    this.socket.on('disconnect', () => {
      this.currentStatus = null;
    });
  }

  updateStatus(status: 'online' | 'idle' | 'dnd' | 'offline', customStatus?: string) {
    if (this.currentStatus) {
      this.currentStatus.status = status;
      this.currentStatus.customStatus = customStatus;
      this.socket?.emit('user:updateStatus', this.currentStatus);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.currentStatus = null;
    }
  }

  on(event: string, callback: Callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Callback) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
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
}

export const socketService = new SocketService(); 