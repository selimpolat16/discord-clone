import React from 'react';
import { FaHashtag } from 'react-icons/fa';
import { Channel } from '../../types';

interface ChatAreaProps {
  channel: Channel;
}

const ChatArea: React.FC<ChatAreaProps> = ({ channel }) => {
  return (
    <div className="flex-1 flex flex-col bg-gray-700">
      <div className="h-12 border-b border-gray-900 flex items-center px-4 shadow-sm">
        <FaHashtag className="text-gray-400 mr-2" />
        <h3 className="text-white font-semibold">{channel.name}</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Mesajlar buraya gelecek */}
      </div>
      
      <div className="p-4">
        <div className="bg-gray-600 rounded-lg p-2">
          <input
            type="text"
            placeholder={`${channel.name} kanalına mesaj gönder`}
            className="w-full bg-transparent text-white outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatArea; 