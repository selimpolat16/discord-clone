import React from 'react';
import { FaHashtag, FaVolumeUp } from 'react-icons/fa';

const ChannelList = () => {
  return (
    <div className="w-60 bg-gray-800 h-screen flex flex-col">
      {/* Server Header */}
      <div className="h-12 border-b border-gray-900 flex items-center px-4 shadow-sm">
        <h2 className="text-white font-semibold">Discord Clone</h2>
      </div>
      
      {/* Channels */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <div className="text-gray-400 px-2 text-sm">Metin Kanalları</div>
        
        {/* Text Channels */}
        <div className="space-y-1">
          <div className="flex items-center px-2 py-1 text-gray-400 hover:bg-gray-700 rounded cursor-pointer">
            <FaHashtag className="mr-2" />
            <span>genel</span>
          </div>
          <div className="flex items-center px-2 py-1 text-gray-400 hover:bg-gray-700 rounded cursor-pointer">
            <FaHashtag className="mr-2" />
            <span>sohbet</span>
          </div>
        </div>
        
        <div className="text-gray-400 px-2 text-sm mt-4">Ses Kanalları</div>
        
        {/* Voice Channels */}
        <div className="space-y-1">
          <div className="flex items-center px-2 py-1 text-gray-400 hover:bg-gray-700 rounded cursor-pointer">
            <FaVolumeUp className="mr-2" />
            <span>Genel</span>
          </div>
        </div>
      </div>
      
      {/* User Info */}
      <div className="h-14 bg-gray-700 px-2 flex items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-500"></div>
          <div className="text-white text-sm">
            {JSON.parse(localStorage.getItem('user') || '{}').username}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelList; 