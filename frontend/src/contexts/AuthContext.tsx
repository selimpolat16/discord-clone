import React, { createContext, useContext, useState, useEffect } from 'react';
import { socketService } from '../services/socket.service';
import axios from 'axios';

type UserStatus = 'online' | 'idle' | 'dnd' | 'invisible';

interface User {
  id: string;
  username: string;
  status: UserStatus;
  customStatus?: string;
}

interface AuthContextType {
  user: User | null;
  onlineUsers: User[];
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateStatus: (status: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('discord_clone_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    if (user) {
      // Kullanıcı bilgilerini socket'e gönder
      socketService.connectUser(user);

      // Online kullanıcıları dinle
      socketService.onUsersUpdated((users) => {
        setOnlineUsers(users.filter(u => u.id !== user.id));
      });
    }
  }, [user]);

  const value = {
    user,
    onlineUsers,
    isAuthenticated: !!user,
    login: async (username: string, password: string) => {
      try {
        const response = await axios.post('/api/auth/login', { username, password });
        const userData = response.data;
        
        setUser(userData);
        localStorage.setItem('discord_clone_user', JSON.stringify(userData));

        // Socket.IO bağlantısı kur
        socketService.getSocket().emit('user_connected', {
          id: userData.id,
          username: userData.username
        });

        return userData;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    logout: async () => {
      socketService.disconnect();
      localStorage.removeItem('discord_clone_user');
      setUser(null);
    },
    updateStatus: async (status: string) => {
      if (user) {
        socketService.emitStatusChange({ status });
        const updatedUser = { ...user, status };
        setUser(updatedUser);
        localStorage.setItem('discord_clone_user', JSON.stringify(updatedUser));
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 