import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { serverService } from '../services/server.service';
import { Channel } from '../types/server';
import { socketService } from '../services/socket.service';

interface Props {
  onChannelSelect: (channel: Channel | null) => void;
}

interface StatusOption {
  value: 'online' | 'idle' | 'dnd' | 'invisible';
  label: string;
  color: string;
}

const statusOptions: StatusOption[] = [
  { value: 'online', label: 'Çevrimiçi', color: 'bg-green-500' },
  { value: 'idle', label: 'Boşta', color: 'bg-yellow-500' },
  { value: 'dnd', label: 'Rahatsız Etmeyin', color: 'bg-red-500' },
  { value: 'invisible', label: 'Görünmez', color: 'bg-gray-500' }
];

export const Sidebar: React.FC<Props> = ({ onChannelSelect }) => {
  const { user, logout, updateStatus } = useAuth();
  const [showStatusMenu, setShowStatusMenu] = React.useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [channelType, setChannelType] = useState<'text' | 'voice'>('text');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleStatusChange = async (status: 'online' | 'idle' | 'dnd' | 'invisible') => {
    try {
      await updateStatus(status);
      setShowStatusMenu(false);
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newChannelName.trim()) {
        return;
      }

      // Aynı isimde kanal var mı kontrol et
      const channelExists = channels.some(
        channel => channel.name.toLowerCase() === newChannelName.trim().toLowerCase()
      );

      if (channelExists) {
        alert('Bu isimde bir kanal zaten var');
        return;
      }

      const newChannel = await serverService.createChannel(
        newChannelName.trim(),
        channelType
      );

      // Socket event'ini dinlemeyi bekle
      const timeout = setTimeout(() => {
        setChannels(prev => {
          // Kanal zaten eklenmediyse ekle
          if (!prev.some(channel => channel._id === newChannel._id)) {
            return [...prev, newChannel];
          }
          return prev;
        });
        setShowCreateChannel(false);
        setNewChannelName('');
      }, 100);

      return () => clearTimeout(timeout);
    } catch (error: any) {
      console.error('Kanal oluşturma hatası:', error.response?.data || error);
      alert(error.response?.data?.message || 'Kanal oluşturulurken bir hata oluştu');
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      await serverService.deleteChannel(channelId);
      setChannels(prev => prev.filter(channel => channel._id !== channelId));
      if (selectedChannelId === channelId) {
        setSelectedChannelId(null);
        onChannelSelect(null);
      }
      setShowDeleteConfirm(null);
    } catch (error: any) {
      console.error('Kanal silme hatası:', error.response?.data || error);
      alert(error.response?.data?.message || 'Kanal silinirken bir hata oluştu');
    }
  };

  // Kanalları yükle
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const channelList = await serverService.getChannels();
        setChannels(channelList);
      } catch (error) {
        console.error('Kanallar yüklenirken hata:', error);
      }
    };

    loadChannels();

    // Socket.IO olaylarını dinle
    const socket = socketService.getSocket();
    
    socket.on('channel_created', (newChannel) => {
      setChannels(prev => [...prev, newChannel]);
    });

    socket.on('channel_deleted', (channelId) => {
      setChannels(prev => prev.filter(channel => channel._id !== channelId));
    });

    return () => {
      socket.off('channel_created');
      socket.off('channel_deleted');
    };
  }, []);

  const handleChannelClick = (channel: Channel) => {
    setSelectedChannelId(channel._id);
    onChannelSelect(channel);
  };

  // Socket event dinleyicisi
  useEffect(() => {
    const handleChannelCreated = (channel: Channel) => {
      setChannels(prev => {
        // Kanal zaten varsa ekleme
        if (prev.some(ch => ch._id === channel._id)) {
          return prev;
        }
        return [...prev, channel];
      });
    };

    socketService.getSocket().on('channel_created', handleChannelCreated);

    return () => {
      socketService.getSocket().off('channel_created', handleChannelCreated);
    };
  }, []);

  return (
    <div className="w-60 bg-gray-800 flex flex-col">
      {/* Sunucu Başlığı */}
      <div className="h-12 px-4 border-b border-gray-900 flex items-center justify-between">
        <h1 className="text-white font-semibold">Discord Clone</h1>
      </div>

      {/* Kanal Listesi */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-gray-400 uppercase text-xs font-semibold">
              Metin Kanalları
            </span>
            <button
              onClick={() => setShowCreateChannel(true)}
              className="text-gray-400 hover:text-white text-lg"
            >
              +
            </button>
          </div>
          
          {/* Kanal Oluşturma Modal */}
          {showCreateChannel && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-gray-800 p-4 rounded-lg w-80">
                <h3 className="text-white text-lg mb-4">Yeni Kanal Oluştur</h3>
                <form onSubmit={handleCreateChannel}>
                  <div className="mb-4">
                    <input
                      type="text"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="Kanal adı"
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <select
                      value={channelType}
                      onChange={(e) => setChannelType(e.target.value as 'text' | 'voice')}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                    >
                      <option value="text">Metin Kanalı</option>
                      <option value="voice">Ses Kanalı</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateChannel(false)}
                      className="px-4 py-2 text-gray-400 hover:text-white"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Oluştur
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Kanal Listesi */}
          <div className="space-y-1">
            {channels.map(channel => (
              <div
                key={channel._id}
                className={`group flex items-center justify-between px-2 py-1 text-gray-400 hover:bg-gray-700 rounded cursor-pointer ${
                  selectedChannelId === channel._id ? 'bg-gray-700' : ''
                }`}
              >
                <div
                  className="flex items-center flex-1"
                  onClick={() => handleChannelClick(channel)}
                >
                  <span className="text-xl mr-1">
                    {channel.type === 'text' ? '#' : '🔊'}
                  </span>
                  <span>{channel.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(channel._id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          {/* Silme Onay Modalı */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-gray-800 p-4 rounded-lg w-80">
                <h3 className="text-white text-lg mb-4">Kanalı Sil</h3>
                <p className="text-gray-300 mb-4">
                  Bu kanalı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    İptal
                  </button>
                  <button
                    onClick={() => handleDeleteChannel(showDeleteConfirm)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kullanıcı Bilgisi */}
      <div className="h-14 px-2 bg-gray-900 flex items-center relative">
        <div 
          className="flex items-center flex-1 p-1 rounded hover:bg-gray-700 cursor-pointer"
          onClick={() => setShowStatusMenu(!showStatusMenu)}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gray-500" />
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
              statusOptions.find(opt => opt.value === user?.status)?.color || 'bg-gray-500'
            }`} />
          </div>
          <div className="ml-2">
            <div className="text-white text-sm font-medium">{user?.username}</div>
            <div className="text-gray-400 text-xs">#{user?.id.slice(-4)}</div>
          </div>
        </div>

        {/* Durum Menüsü */}
        {showStatusMenu && (
          <div className="absolute bottom-full left-0 mb-2 w-56 bg-gray-800 rounded-md shadow-lg p-2">
            {statusOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center px-2 py-1 hover:bg-gray-700 rounded cursor-pointer"
                onClick={() => handleStatusChange(option.value)}
              >
                <div className={`w-3 h-3 rounded-full ${option.color} mr-2`} />
                <span className="text-white">{option.label}</span>
              </div>
            ))}
            <div className="border-t border-gray-700 mt-2 pt-2">
              <div
                className="flex items-center px-2 py-1 hover:bg-gray-700 rounded cursor-pointer text-red-400"
                onClick={() => logout()}
              >
                <span>Çıkış Yap</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 