import React from 'react';
import { FaDiscord } from 'react-icons/fa';
import UserArea from '../user/UserArea';

const LeftSidebar: React.FC = () => {
  return (
    <div className="w-[72px] bg-gray-900 h-screen flex flex-col">
      <div className='mt-10'>
        <div className="w-12 h-12 mx-auto bg-indigo-500 rounded-full flex items-center justify-center hover:bg-indigo-600 cursor-pointer">
          <FaDiscord className="text-white text-2xl" />
        </div>
      </div>
      
      <div className="flex-1"></div>

      {/* User Area */}
      <UserArea />
    </div>
  );
};

export default LeftSidebar; 