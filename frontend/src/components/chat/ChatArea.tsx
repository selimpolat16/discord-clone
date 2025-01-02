import React from 'react';
import { FaHashtag } from 'react-icons/fa';

const ChatArea = () => {
  return (
    <div className="flex-1 flex flex-col bg-gray-700">
      {/* Chat Header */}
      <div className="h-12 border-b border-gray-900 flex items-center px-4 shadow-sm">
        <FaHashtag className="text-gray-400 mr-2" />
        <h3 className="text-white font-semibold">genel</h3>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Mesajlar buraya gelecek */}
      </div>
      
      {/* Message Input */}
      <div className="p-4">
        <div className="bg-gray-600 rounded-lg p-2">
          <input
            type="text"
            placeholder="genel kanalına mesaj gönder"
            className="w-full bg-transparent text-white outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatArea; 