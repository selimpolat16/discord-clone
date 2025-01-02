import React, { useEffect, useState } from 'react';
import { Channel } from '../../types/server';
import { serverService } from '../../services/server.service';
import { CreateChannelModal } from './CreateChannelModal';
import { FaChevronDown, FaHashtag, FaVolumeUp, FaCog } from 'react-icons/fa';
import { UserArea } from '../user/UserArea';

export const ChannelList: React.FC<{ onChannelSelect?: (channel: Channel) => void }> = ({ 
  onChannelSelect 
}) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const fetchChannels = async () => {
    try {
      const data = await serverService.getChannels();
      setChannels(data);
    } catch (error) {
      console.error('Kanal listesi alınamadı:', error);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel._id);
    onChannelSelect?.(channel);
  };

  return (
    <div className="w-60 bg-[#2f3136] flex flex-col h-full">
      {/* Server Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#202225] shadow-sm cursor-pointer hover:bg-[#34373c]">
        <h2 className="text-white font-medium">Discord Clone</h2>
        <FaChevronDown className="text-gray-400" />
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto">
        {/* Text Channels Category */}
        <div className="pt-4">
          <div className="px-3 mb-1 flex items-center justify-between group">
            <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-300">
              <FaChevronDown className="mr-1 text-xs" />
              Metin Kanalları
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-4 h-4 text-gray-400 hover:text-gray-300 opacity-0 group-hover:opacity-100"
            >
              +
            </button>
          </div>

          <div className="space-y-0.5 mt-1">
            {channels.filter(c => c.type === 'text').map((channel) => (
              <div
                key={channel._id}
                onClick={() => handleChannelSelect(channel)}
                className={`
                  group px-2 mx-2 py-1 rounded flex items-center justify-between cursor-pointer
                  ${selectedChannel === channel._id ? 'bg-[#393c43] text-white' : 'text-gray-400 hover:bg-[#34373c] hover:text-gray-300'}
                `}
              >
                <div className="flex items-center">
                  <FaHashtag className="mr-2 text-sm" />
                  <span className="text-sm">{channel.name}</span>
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100">
                  <FaCog className="w-4 h-4 hover:text-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Channels Category */}
        <div className="pt-4">
          <div className="px-3 mb-1 flex items-center justify-between group">
            <div className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-300">
              <FaChevronDown className="mr-1 text-xs" />
              Ses Kanalları
            </div>
          </div>

          <div className="space-y-0.5 mt-1">
            {channels.filter(c => c.type === 'voice').map((channel) => (
              <div
                key={channel._id}
                onClick={() => handleChannelSelect(channel)}
                className={`
                  group px-2 mx-2 py-1 rounded flex items-center justify-between cursor-pointer
                  ${selectedChannel === channel._id ? 'bg-[#393c43] text-white' : 'text-gray-400 hover:bg-[#34373c] hover:text-gray-300'}
                `}
              >
                <div className="flex items-center">
                  <FaVolumeUp className="mr-2 text-sm" />
                  <span className="text-sm">{channel.name}</span>
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100">
                  <FaCog className="w-4 h-4 hover:text-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Area */}
      <UserArea />

      <CreateChannelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchChannels();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}; 