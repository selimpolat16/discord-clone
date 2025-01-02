import React from 'react';
import LeftSidebar from './sidebar/LeftSidebar';
import ChannelList from './sidebar/ChannelList';
import ChatArea from './chat/ChatArea';
import RightSidebar from './sidebar/RightSidebar';

const Home = () => {
  return (
    <div className="flex h-screen">
      <LeftSidebar />
      <ChannelList />
      <ChatArea />
      <RightSidebar />
    </div>
  );
};

export default Home; 