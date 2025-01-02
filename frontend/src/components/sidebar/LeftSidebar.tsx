import React from 'react';
import { FaDiscord, FaPlus, FaCompass } from 'react-icons/fa';
import { Server } from '../../types';
import UserArea from '../user/UserArea';

interface LeftSidebarProps {
  servers: Server[];
  selectedServer: Server | null;
  onServerSelect: (server: Server) => void;
  onCreateServer: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  servers,
  selectedServer,
  onServerSelect,
  onCreateServer
}) => {
  return (
    <div className="w-[72px] bg-gray-900 h-screen flex flex-col">
   
      
      <div className='mt-10'></div>
      
      {/* Server List */}
      <div className="flex-1 flex flex-col space-y-2 overflow-y-auto px-3 pb-2">
        {Array.isArray(servers) && servers.map((server) => (
          <div
            key={server._id}
            onClick={() => onServerSelect(server)}
            className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 group relative
              ${selectedServer?._id === server._id ? 'bg-indigo-500' : 'bg-gray-800 hover:bg-indigo-500'}`}
          >
            {server.icon ? (
              <img
                src={server.icon}
                alt={server.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold">
                {server.name[0].toUpperCase()}
              </span>
            )}
            <div className="absolute left-0 w-1 bg-white rounded-r transform scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-left" />
          </div>
        ))}

        {/* Add Server Button */}
        <div
          onClick={onCreateServer}
          className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-500 cursor-pointer group transition-all duration-200"
        >
          <FaPlus className="text-green-500 group-hover:text-white text-xl" />
        </div>
      </div>

      {/* User Menu - artık tam genişlikte */}
      <UserArea />
    </div>
  );
};

export default LeftSidebar; 