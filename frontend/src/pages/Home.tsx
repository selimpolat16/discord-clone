import React, { useState, useEffect } from 'react';
import { ChannelList } from '../components/channels/ChannelList';
import { MemberList } from '../components/members/MemberList';
import { RightSidebar } from '../components/sidebar/RightSidebar';
import { Channel, Server } from '../types/server';
import { serverService } from '../services/server.service';

export default function Home() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [serverData, setServerData] = useState<Server | null>(null);

  useEffect(() => {
    const fetchServerData = async () => {
      try {
        const data = await serverService.getServerInfo();
        setServerData(data);
      } catch (error) {
        console.error('Sunucu bilgileri alınamadı:', error);
      }
    };

    fetchServerData();
  }, []);

  return (
    <div className="flex h-screen bg-[#36393f]">
      <ChannelList onChannelSelect={setSelectedChannel} />
      <div className="flex-1 flex flex-col">
        <div className="h-12 border-b border-[#202225] px-4 flex items-center">
          <span className="text-gray-100 font-medium">
            {selectedChannel ? (
              <>
                {selectedChannel.type === 'text' ? '#' : '🔊'} {selectedChannel.name}
              </>
            ) : (
              'Bir kanal seçin'
            )}
          </span>
        </div>
        <div className="flex-1 p-4 text-gray-100">
          {selectedChannel ? (
            <div>Kanal içeriği burada görüntülenecek</div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Bir kanal seçin veya yeni bir kanal oluşturun
            </div>
          )}
        </div>
      </div>
      {serverData && <MemberList members={serverData.members} />}
      <RightSidebar />
    </div>
  );
} 