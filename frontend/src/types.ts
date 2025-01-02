export interface User {
  id: string;
  username: string;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  channelId?: string;
  isMuted?: boolean;
  isDeafened?: boolean;
}

export interface Channel {
  _id: string;
  name: string;
  type: 'text' | 'voice';
  serverId: string;
}

export interface Message {
  _id: string;
  content: string;
  author: {
    username: string;
    id: string;
  };
  channelId: string;
  createdAt: string;
}

export interface Server {
  _id: string;
  name: string;
  icon?: string;
  ownerId: string;
  members: User[];
  channels: Channel[];
}

// ... diğer tipler 