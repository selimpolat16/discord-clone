import React from 'react';
import { FaDiscord, FaPlus, FaCompass } from 'react-icons/fa';

const LeftSidebar = () => {
  return (
    <div className="w-[72px] bg-gray-900 h-screen flex flex-col items-center py-3 space-y-2">
      {/* Discord Logo */}
      <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center hover:bg-indigo-600 cursor-pointer mb-2">
        <FaDiscord className="text-white text-2xl" />
      </div>
      
      <div className="w-8 h-[2px] bg-gray-700 rounded-full mb-2"></div>
      
      {/* Server Listesi */}
      <div className="flex flex-col space-y-2">
        {/* Sunucu Ekle Butonu */}
        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-500 cursor-pointer group transition-all duration-200">
          <FaPlus className="text-green-500 group-hover:text-white text-xl" />
        </div>
        
        {/* Sunucu Keşfet */}
        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-500 cursor-pointer group transition-all duration-200">
          <FaCompass className="text-green-500 group-hover:text-white text-xl" />
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar; 