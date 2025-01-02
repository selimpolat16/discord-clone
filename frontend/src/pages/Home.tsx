import React, { useState, useEffect } from 'react';
import CreateChannel from '../components/CreateChannel';
import RightSidebar from '../components/sidebar/RightSidebar';
import axios from 'axios';

interface Channel {
  _id: string;
  name: string;
  type: string;
}

const Home: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:3000/api/server/channels');
      setChannels(response.data);
    } catch (error) {
      console.error('Kanallar yüklenirken hata oluştu:', error);
    }
  };

  const handleChannelCreated = (newChannel: Channel) => {
    setChannels(prev => [...prev, newChannel]);
  };

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannel(channelId);
  };

  return (
    <div className="flex h-screen bg-discord-primary">
      <div className="w-60 bg-discord-secondary flex flex-col border-r border-discord-tertiary">
        <div className="p-4 text-white border-b border-discord-tertiary">
          <h2 className="text-base font-semibold">Kanallar</h2>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {channels.map(channel => (
            <div 
              key={channel._id} 
              className={`px-4 py-2 text-discord-muted cursor-pointer flex items-center gap-2 hover:bg-discord-hover transition-colors ${
                selectedChannel === channel._id ? 'bg-discord-hover text-discord-text' : ''
              }`}
              onClick={() => handleChannelSelect(channel._id)}
            >
              <span className="text-discord-muted">#</span>
              <span className="text-base">{channel.name}</span>
            </div>
          ))}
        </div>
        <CreateChannel onChannelCreated={handleChannelCreated} />
      </div>
      
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <div className="flex-1 flex flex-col p-4">
            <div className="flex-1 overflow-y-auto">
              <p>Mesajlar yükleniyor...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-discord-muted">
            <p className="text-lg">Bir kanal seçin</p>
          </div>
        )}
      </div>

      <RightSidebar />
    </div>
  );
};

export default Home; 