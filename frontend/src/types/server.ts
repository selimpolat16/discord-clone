export interface Channel {
  _id: string;
  name: string;
  type: 'text' | 'voice';
  createdAt: Date;
}

export interface ServerMember {
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
}

export interface Server {
  name: string;
  channels: Channel[];
  members: ServerMember[];
} 