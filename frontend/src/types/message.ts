export interface Message {
  _id: string;
  content: string;
  channelId: string;
  author: {
    username: string;
    avatar?: string;
  };
  createdAt: string;
} 