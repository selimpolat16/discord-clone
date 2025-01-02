import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LeftSidebar from './sidebar/LeftSidebar';
import ChannelList from './sidebar/ChannelList';
import ChatArea from './chat/ChatArea';
import RightSidebar from './sidebar/RightSidebar';
import { Channel } from '../types';
import { socketService } from '../services/socket.service';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.username) {
      navigate('/login');
      return;
    }

    socketService.connect(user);
    setIsLoading(false);

    return () => {
      socketService.disconnect();
    };
  }, [navigate]);

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
      <LeftSidebar />
      <ChannelList
        selectedChannel={selectedChannel}
        onChannelSelect={handleChannelSelect}
      />
      {selectedChannel ? (
        <ChatArea channel={selectedChannel} />
      ) : (
        <div className="flex-1 bg-gray-700 flex items-center justify-center">
          <p className="text-gray-400">Bir kanal seçin</p>
        </div>
      )}
      <RightSidebar />
    </div>
  );
};

export default Home; 