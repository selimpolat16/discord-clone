import React, { useState, useEffect, useCallback } from 'react';
import { FaUserFriends } from 'react-icons/fa';
import { authService } from '../../services/auth.service';
import { socketService } from '../../services/socket.service';
import { ServerMember } from '../../types/server';
import { BsCircleFill } from 'react-icons/bs';
import { FaMoon, FaMinusCircle } from 'react-icons/fa';

export const RightSidebar: React.FC = () => {
  const currentUser = authService.getUsername();
  const [activeUsers, setActiveUsers] = useState<ServerMember[]>([]);

  const handleUsersUpdate = useCallback((users: ServerMember[]) => {
    const otherUsers = users.filter(user => user.username !== currentUser);
    setActiveUsers(otherUsers);
  }, [currentUser]);

  useEffect(() => {
    socketService.on('usersUpdate', handleUsersUpdate);
    return () => {
      socketService.off('usersUpdate', handleUsersUpdate);
    };
  }, [handleUsersUpdate]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <BsCircleFill className="text-green-500" size={10} />;
      case 'idle':
        return <FaMoon className="text-yellow-500" size={10} />;
      case 'dnd':
        return <FaMinusCircle className="text-red-500" size={10} />;
      default:
        return <BsCircleFill className="text-gray-500" size={10} />;
    }
  };

  return (
    <div className="w-60 bg-[#2f3136] flex flex-col h-full border-l border-[#202225]">
      {/* Aktif Şimdi */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-white text-sm font-semibold mb-4">
          AKTİF ŞİMDİ — {activeUsers.length}
        </h2>
        
        {activeUsers.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#40444b] rounded-full mx-auto mb-4 flex items-center justify-center">
              <FaUserFriends className="text-gray-500" size={24} />
            </div>
            <h3 className="text-gray-300 font-medium mb-1">Sessiz bir gün</h3>
            <p className="text-gray-400 text-sm">
              Arkadaşlarınız bir aktiviteye başladığında burada gösterilecek.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeUsers.map((user) => (
              <div
                key={user.username}
                className="flex items-center p-2 rounded hover:bg-[#34373c] cursor-pointer group"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-[#40444b] flex items-center justify-center text-white">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    {getStatusIcon(user.status)}
                  </div>
                </div>
                <div className="ml-2">
                  <div className="text-gray-300 text-sm font-medium group-hover:text-gray-100">
                    {user.username}
                  </div>
                  {user.customStatus && (
                    <div className="text-gray-400 text-xs">
                      {user.customStatus}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mevcut Kullanıcı */}
      <div className="p-2 bg-[#292b2f]">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#40444b] flex items-center justify-center text-white">
              {currentUser?.[0]?.toUpperCase()}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#292b2f]" />
          </div>
          <div className="ml-2">
            <div className="text-sm font-medium text-white">{currentUser}</div>
            <div className="text-xs text-gray-400">Çevrimiçi</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 