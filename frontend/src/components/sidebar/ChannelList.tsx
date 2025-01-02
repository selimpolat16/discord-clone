import React from 'react';
import { FaHashtag, FaVolumeUp } from 'react-icons/fa';
import { Channel } from '../../types';

interface ChannelListProps {
  selectedChannel: Channel | null;
  onChannelSelect: (channel: Channel) => void;
}

const ChannelList: React.FC<ChannelListProps> = ({ selectedChannel, onChannelSelect }) => {
  const defaultChannels: Channel[] = [
    { _id: '1', name: 'genel', type: 'text', serverId: '1' },
    { _id: '2', name: 'sohbet', type: 'text', serverId: '1' },
    { _id: '3', name: 'Genel', type: 'voice', serverId: '1' },
  ];

  return (
    <div className="w-60 bg-gray-800 h-screen flex flex-col">
      <div className="h-12 border-b border-gray-900 flex items-center px-4 shadow-sm">
        <h2 className="text-white font-semibold">Discord Clone</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <div className="text-gray-400 px-2 text-sm">Metin Kanalları</div>
        
        <div className="space-y-1">
          {defaultChannels.filter(channel => channel.type === 'text').map(channel => (
            <div
              key={channel._id}
              onClick={() => onChannelSelect(channel)}
              className={`flex items-center px-2 py-1 text-gray-400 hover:bg-gray-700 rounded cursor-pointer ${
                selectedChannel?._id === channel._id ? 'bg-gray-700 text-white' : ''
              }`}
            >
              <FaHashtag className="mr-2" />
              <span>{channel.name}</span>
            </div>
          ))}
        </div>
        
        <div className="text-gray-400 px-2 text-sm mt-4">Ses Kanalları</div>
        
        <div className="space-y-1">
          {defaultChannels.filter(channel => channel.type === 'voice').map(channel => (
            <div
              key={channel._id}
              onClick={() => onChannelSelect(channel)}
              className={`flex items-center px-2 py-1 text-gray-400 hover:bg-gray-700 rounded cursor-pointer ${
                selectedChannel?._id === channel._id ? 'bg-gray-700 text-white' : ''
              }`}
            >
              <FaVolumeUp className="mr-2" />
              <span>{channel.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChannelList; 