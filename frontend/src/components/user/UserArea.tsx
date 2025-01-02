import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { socketService } from '../../services/socket.service';
import { FaCog, FaMicrophone, FaHeadphones, FaSignOutAlt, FaCircle } from 'react-icons/fa';

export const UserArea: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState('online');
  const navigate = useNavigate();
  const username = authService.getUsername() || 'Kullanıcı';

  const handleStatusChange = useCallback((newStatus: string) => {
    setStatus(newStatus);
    socketService.updateStatus(newStatus);
    setShowSettings(false);
  }, []);

  const handleLogout = useCallback(() => {
    socketService.disconnect();
    authService.logout();
    navigate('/login');
  }, [navigate]);

  return (
    <div className="relative">
      <div className="h-14 px-2 flex items-center bg-[#292b2f] justify-between">
        <div className="flex items-center flex-1">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#40444b] flex items-center justify-center text-white">
              {username[0].toUpperCase()}
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#292b2f] ${
              status === 'online' ? 'bg-green-500' :
              status === 'idle' ? 'bg-yellow-500' :
              status === 'dnd' ? 'bg-red-500' :
              'bg-gray-500'
            }`} />
          </div>
          <div className="ml-2">
            <div className="text-sm font-medium text-white">{username}</div>
            <div className="text-xs text-gray-400">#{(Math.floor(Math.random() * 9000) + 1000).toString()}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="text-gray-400 hover:text-gray-200">
            <FaMicrophone size={16} />
          </button>
          <button className="text-gray-400 hover:text-gray-200">
            <FaHeadphones size={16} />
          </button>
          <button 
            className="text-gray-400 hover:text-gray-200"
            onClick={() => setShowSettings(!showSettings)}
          >
            <FaCog size={16} />
          </button>
        </div>
      </div>

      {/* Settings Dropdown */}
      {showSettings && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#18191c] rounded-md shadow-lg overflow-hidden">
          <div className="py-1">
            <button
              onClick={() => handleStatusChange('online')}
              className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-[#34373c] flex items-center"
            >
              <FaCircle className="mr-2 text-green-500" />
              Çevrimiçi
            </button>
            <button
              onClick={() => handleStatusChange('idle')}
              className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-[#34373c] flex items-center"
            >
              <FaCircle className="mr-2 text-yellow-500" />
              Boşta
            </button>
            <button
              onClick={() => handleStatusChange('dnd')}
              className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-[#34373c] flex items-center"
            >
              <FaCircle className="mr-2 text-red-500" />
              Rahatsız Etmeyin
            </button>
            <button
              onClick={() => handleStatusChange('offline')}
              className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-[#34373c] flex items-center"
            >
              <FaCircle className="mr-2 text-gray-500" />
              Görünmez
            </button>
            
            <div className="border-t border-[#2f3136] my-1"></div>
            
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-[#34373c] flex items-center"
            >
              <FaSignOutAlt className="mr-2" />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 