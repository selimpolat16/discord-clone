import React, { useState, useCallback } from 'react';
import { BsCircleFill } from 'react-icons/bs';
import { FaMoon, FaMinusCircle, FaSignOutAlt } from 'react-icons/fa';
import { authService } from '../../services/auth.service';
import { socketService } from '../../services/socket.service';
import { useNavigate } from 'react-router-dom';

export const UserArea: React.FC = () => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('online');
  const username = authService.getUsername();
  const navigate = useNavigate();

  const handleStatusChange = useCallback((status: string) => {
    setCurrentStatus(status);
    socketService.updateStatus(status);
    setShowStatusMenu(false);
  }, []);

  const handleLogout = useCallback(() => {
    socketService.disconnect();
    authService.logout();
    navigate('/login');
  }, [navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <BsCircleFill className="text-green-500" size={12} />;
      case 'idle':
        return <FaMoon className="text-yellow-500" size={12} />;
      case 'dnd':
        return <FaMinusCircle className="text-red-500" size={12} />;
      default:
        return <BsCircleFill className="text-gray-500" size={12} />;
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center bg-[#292b2f]">
        <div 
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className="flex-1 p-2 flex items-center cursor-pointer hover:bg-[#34373c]"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#40444b] flex items-center justify-center text-white">
              {username?.[0]?.toUpperCase()}
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#292b2f] ${getStatusColor(currentStatus)}`} />
          </div>
          <div className="ml-2">
            <div className="text-sm font-medium text-white">{username}</div>
            <div className="text-xs text-gray-400 capitalize">{currentStatus}</div>
          </div>
        </div>

        {/* Çıkış Yap Butonu */}
        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#34373c] transition-colors"
          title="Çıkış Yap"
        >
          <FaSignOutAlt size={16} />
        </button>
      </div>

      {/* Durum Menüsü */}
      {showStatusMenu && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#18191c] rounded-md shadow-lg overflow-hidden">
          <div className="py-2">
            <button
              onClick={() => handleStatusChange('online')}
              className="w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-[#34373c] flex items-center"
            >
              {getStatusIcon('online')}
              <span className="ml-2">Çevrimiçi</span>
            </button>
            <button
              onClick={() => handleStatusChange('idle')}
              className="w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-[#34373c] flex items-center"
            >
              {getStatusIcon('idle')}
              <span className="ml-2">Boşta</span>
            </button>
            <button
              onClick={() => handleStatusChange('dnd')}
              className="w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-[#34373c] flex items-center"
            >
              {getStatusIcon('dnd')}
              <span className="ml-2">Rahatsız Etmeyin</span>
            </button>
            <button
              onClick={() => handleStatusChange('offline')}
              className="w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-[#34373c] flex items-center"
            >
              {getStatusIcon('offline')}
              <span className="ml-2">Görünmez</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 