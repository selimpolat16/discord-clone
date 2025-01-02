import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { socketService } from '../services/socket.service';

interface User {
  id: string;
  username: string;
  status: 'online' | 'idle' | 'dnd' | 'invisible';
}

export const UserList: React.FC = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    const socket = socketService.getSocket();

    // Online kullanıcıları dinle
    socket.on('users_updated', (users: User[]) => {
      // Kendimizi listeden çıkar
      const filteredUsers = users.filter(u => u.id !== user?.id);
      setOnlineUsers(filteredUsers);
    });

    // Kullanıcı durumu değişikliklerini dinle
    socket.on('user_status_changed', ({ userId, status }) => {
      setOnlineUsers(prev => 
        prev.map(u => u.id === userId ? { ...u, status } : u)
      );
    });

    return () => {
      socket.off('users_updated');
      socket.off('user_status_changed');
    };
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      case 'invisible': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'Çevrimiçi';
      case 'idle': return 'Boşta';
      case 'dnd': return 'Rahatsız Etmeyin';
      case 'invisible': return 'Görünmez';
      default: return 'Çevrimdışı';
    }
  };

  return (
    <div className="w-60 bg-gray-800 p-4">
      <h2 className="text-white font-semibold mb-4">Çevrimiçi - {onlineUsers.length}</h2>
      <div className="space-y-2">
        {onlineUsers.map(user => (
          <div
            key={user.id}
            className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gray-600" />
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(
                  user.status
                )}`}
                title={getStatusLabel(user.status)}
              />
            </div>
            <div>
              <div className="text-white text-sm">{user.username}</div>
              <div className="text-gray-400 text-xs">
                {getStatusLabel(user.status)}
              </div>
            </div>
          </div>
        ))}
        {onlineUsers.length === 0 && (
          <div className="text-gray-400 text-sm text-center">
            Henüz kimse çevrimiçi değil
          </div>
        )}
      </div>
    </div>
  );
}; 