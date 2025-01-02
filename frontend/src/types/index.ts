export interface User {
  id: string;
  username: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'idle' | 'dnd';
}

export interface Message {
  _id: string;
  content: string;
  author: User;
  channelId: string;
  createdAt: string;
}

export interface Channel {
  _id: string;
  name: string;
  type: 'text' | 'voice';
  serverId: string;
}

export interface Server {
  _id: string;
  name: string;
  icon?: string;
  ownerId: string;
  channels: Channel[];
  members: User[];
} 