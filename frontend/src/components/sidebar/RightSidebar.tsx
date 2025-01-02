import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import { socketService } from '../../services/socket.service';
import { FaCircle, FaMoon, FaClock } from 'react-icons/fa';

interface RightSidebarProps {
  members: User[];
}

const RightSidebar: React.FC<RightSidebarProps> = ({ members }) => {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    // Socket.IO üzerinden kullanıcı güncellemelerini dinle
    const handleUsersUpdate = (users: User[]) => {
      setOnlineUsers(users);
    };

    socketService.socket?.on('users:update', handleUsersUpdate);

    return () => {
      socketService.socket?.off('users:update', handleUsersUpdate);
    };
  }, []);

  // Kullanıcıları durumlarına göre grupla
  const groupedMembers = members.reduce((groups, member) => {
    const userStatus = onlineUsers.find(u => u.username === member.username)?.status || 'offline';
    if (!groups[userStatus]) {
      groups[userStatus] = [];
    }
    groups[userStatus].push(member);
    return groups;
  }, {} as Record<string, User[]>);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <FaCircle className="text-green-500" />;
      case 'idle':
        return <FaMoon className="text-yellow-500" />;
      case 'dnd':
        return <FaCircle className="text-red-500" />;
      default:
        return <FaCircle className="text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online':
        return 'Çevrimiçi';
      case 'idle':
        return 'Boşta';
      case 'dnd':
        return 'Rahatsız Etmeyin';
      default:
        return 'Çevrimdışı';
    }
  };

  return (
    <div className="w-60 bg-gray-800 h-screen flex flex-col">
      <div className="h-12 border-b border-gray-900 flex items-center px-4 shadow-sm">
        <h2 className="text-white font-semibold">Üyeler</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {Object.entries(groupedMembers).map(([status, users]) => (
          users.length > 0 && (
            <div key={status} className="mb-6">
              <div className="text-gray-400 text-sm flex items-center mb-2">
                <span className="mr-2">{getStatusIcon(status)}</span>
                <span>{getStatusLabel(status)} — {users.length}</span>
              </div>
              
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.username}
                    className="flex items-center space-x-3 px-2 py-1 rounded hover:bg-gray-700 cursor-pointer group"
                  >
                    <div className="relative">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                          <span className="text-white text-sm">
                            {user.username[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1">
                        {getStatusIcon(status)}
                      </div>
                    </div>
                    <span className="text-gray-300 group-hover:text-white">
                      {user.username}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default RightSidebar;