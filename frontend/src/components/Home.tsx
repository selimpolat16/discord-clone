import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LeftSidebar from './sidebar/LeftSidebar';
import ChannelList from './sidebar/ChannelList';
import ChatArea from './chat/ChatArea';
import RightSidebar from './sidebar/RightSidebar';
import CreateServerModal from './modals/CreateServerModal';
import CreateChannelModal from './modals/CreateChannelModal';
import { Server, Channel } from '../types';
import { serverService } from '../services/server.service';
import { socketService } from '../services/socket.service';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState(false);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.username) {
      navigate('/login');
      return;
    }

    socketService.connect(user);
    loadServers();

    return () => {
      socketService.disconnect();
    };
  }, [navigate]);

  const loadServers = async () => {
    try {
      setIsLoading(true);
      const serverList = await serverService.getServers();
      setServers(serverList);
      if (serverList.length > 0 && !selectedServer) {
        setSelectedServer(serverList[0]);
        if (serverList[0].channels.length > 0) {
          setSelectedChannel(serverList[0].channels[0]);
        }
      }
    } catch (error) {
      setError('Sunucular yüklenirken bir hata oluştu');
      console.error('Sunucular yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServerCreate = () => {
    setIsCreateServerModalOpen(true);
  };

  const handleChannelCreate = () => {
    if (!selectedServer) return;
    setIsCreateChannelModalOpen(true);
  };

  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
    if (server.channels.length > 0) {
      setSelectedChannel(server.channels[0]);
    } else {
      setSelectedChannel(null);
    }
  };

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-white">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <LeftSidebar
        servers={servers}
        selectedServer={selectedServer}
        onServerSelect={handleServerSelect}
        onCreateServer={handleServerCreate}
      />
      
      {selectedServer && (
        <ChannelList
          server={selectedServer}
          selectedChannel={selectedChannel}
          onChannelSelect={handleChannelSelect}
          onCreateChannel={handleChannelCreate}
        />
      )}
      
      {selectedChannel ? (
        <ChatArea channel={selectedChannel} />
      ) : (
        <div className="flex-1 bg-gray-700 flex items-center justify-center">
          <p className="text-gray-400">
            {servers.length === 0 
              ? "Henüz hiç sunucu yok. Yeni bir sunucu oluşturmak için + butonuna tıklayın."
              : "Bir kanal seçin veya oluşturun"}
          </p>
        </div>
      )}
      
      <RightSidebar
        members={selectedServer?.members || []}
      />

      <CreateServerModal
        isOpen={isCreateServerModalOpen}
        onClose={() => setIsCreateServerModalOpen(false)}
        onSuccess={loadServers}
      />

      <CreateChannelModal
        isOpen={isCreateChannelModalOpen}
        onClose={() => setIsCreateChannelModalOpen(false)}
        onSuccess={loadServers}
        serverId={selectedServer?._id || ''}
      />

      {error && (
        <div className="fixed top-4 right-4 bg-red-900 text-white px-4 py-2 rounded shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default Home; 