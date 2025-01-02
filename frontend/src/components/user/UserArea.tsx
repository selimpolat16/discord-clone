import React, { useState, useRef, useEffect } from 'react';
import { FaCircle, FaMoon, FaCircleNotch, FaSignOutAlt } from 'react-icons/fa';
import { socketService } from '../../services/socket.service';
import { authService } from '../../services/auth.service';

const UserArea = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('online');
  const menuRef = useRef<HTMLDivElement>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const statusOptions = [
    { id: 'online', label: 'Çevrimiçi', icon: FaCircle, color: 'text-green-500' },
    { id: 'idle', label: 'Boşta', icon: FaMoon, color: 'text-yellow-500' },
    { id: 'dnd', label: 'Rahatsız Etmeyin', icon: FaCircle, color: 'text-red-500' },
    { id: 'offline', label: 'Görünmez', icon: FaCircleNotch, color: 'text-gray-500' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = (status: 'online' | 'idle' | 'dnd' | 'offline') => {
    setCurrentStatus(status);
    socketService.updateStatus(status);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
  };

  const getCurrentStatusIcon = () => {
    const status = statusOptions.find(s => s.id === currentStatus);
    const StatusIcon = status?.icon;
    return StatusIcon ? (
      <div className={`absolute -bottom-0.5 -right-0.5 ${status.color} bg-[#232428] rounded-full p-[2px]`}>
        <StatusIcon className="w-3 h-3" />
      </div>
    ) : null;
  };

  return (
    <div ref={menuRef} className="relative bg-[#1F2937] px-2 py-2">
      <div 
        className="flex items-center space-x-2 cursor-pointer"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.username?.[0]?.toUpperCase()}
            </span>
          </div>
          {getCurrentStatusIcon()}
        </div>
        <div className="flex-1">
          <div className="text-white text-sm font-medium">
            {user.username}
          </div>
          <div className="text-gray-400 text-xs">
            #{user.id?.toString().slice(-4)}
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="absolute bottom-full left-0 w-[220px] mb-2 bg-[#18191c] rounded-md shadow-lg overflow-hidden">
          <div className="p-4 bg-[#232428]">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                  <span className="text-white text-lg font-medium">
                    {user.username?.[0]?.toUpperCase()}
                  </span>
                </div>
                {getCurrentStatusIcon()}
              </div>
              <div>
                <div className="text-white text-base font-semibold">
                  {user.username}
                </div>
                <div className="text-gray-400 text-sm">
                  #{user.id?.toString().slice(-4)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-2">
            <div className="text-xs font-semibold text-gray-400 px-2 mb-1">
              DURUM AYARLA
            </div>
            {statusOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleStatusChange(option.id as any)}
                className={`w-full px-2 py-1 text-left flex items-center space-x-2 rounded hover:bg-[#2f3136] ${
                  currentStatus === option.id ? 'bg-[#2f3136]' : ''
                }`}
              >
                <option.icon className={`${option.color} w-3 h-3`} />
                <span className="text-gray-300">{option.label}</span>
                {currentStatus === option.id && (
                  <span className="ml-auto text-green-500">✓</span>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-[#2f3136]">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-[#2f3136] text-red-400 hover:text-red-300"
            >
              <FaSignOutAlt />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserArea; 