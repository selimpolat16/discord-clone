import React, { useEffect, useState, useCallback } from 'react';
import { ServerMember } from '../../types/server';
import { socketService } from '../../services/socket.service';
import { FaCircle, FaMoon, FaMinusCircle } from 'react-icons/fa';
import { BsCircleFill } from 'react-icons/bs';

interface MemberListProps {
  members: ServerMember[];
}

export const MemberList: React.FC<MemberListProps> = ({ members: initialMembers }) => {
  const [members, setMembers] = useState<ServerMember[]>(initialMembers);

  const handleUsersUpdate = useCallback((updatedUsers: ServerMember[]) => {
    setMembers(updatedUsers);
  }, []);

  useEffect(() => {
    socketService.on('usersUpdate', handleUsersUpdate);

    return () => {
      socketService.off('usersUpdate', handleUsersUpdate);
    };
  }, [handleUsersUpdate]);

  const roleGroups = {
    online: members.filter(m => m.status === 'online'),
    idle: members.filter(m => m.status === 'idle'),
    dnd: members.filter(m => m.status === 'dnd'),
    offline: members.filter(m => m.status === 'offline')
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <BsCircleFill className="text-green-500" size={10} />;
      case 'idle':
        return <FaMoon className="text-yellow-500" size={10} />;
      case 'dnd':
        return <FaMinusCircle className="text-red-500" size={10} />;
      default:
        return <FaCircle className="text-gray-500" size={10} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Çevrimiçi';
      case 'idle': return 'Boşta';
      case 'dnd': return 'Rahatsız Etmeyin';
      default: return 'Çevrimdışı';
    }
  };

  const renderMemberGroup = (status: string) => {
    const groupMembers = roleGroups[status as keyof typeof roleGroups];
    if (!groupMembers.length) return null;

    return (
      <div className="mb-6">
        <h3 className="text-gray-400 uppercase text-xs font-semibold px-3 mb-2">
          {getStatusText(status)} — {groupMembers.length}
        </h3>
        {groupMembers.map((member) => (
          <div
            key={member.username}
            className="flex items-center px-3 py-1 mx-2 rounded hover:bg-[#34373c] cursor-pointer group"
          >
            <div className="relative flex-shrink-0">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.username}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#40444b] flex items-center justify-center text-white">
                  {member.username[0].toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1">
                {getStatusIcon(member.status)}
              </div>
            </div>
            <div className="ml-2 min-w-0">
              <div className="text-gray-300 text-sm font-medium truncate group-hover:text-gray-100">
                {member.username}
              </div>
              {member.customStatus && (
                <div className="text-gray-400 text-xs truncate">
                  {member.customStatus}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-60 bg-[#2f3136] flex flex-col h-full">
      <div className="p-3 border-b border-[#202225]">
        <input
          type="text"
          placeholder="Üye Ara"
          className="w-full px-2 py-1 bg-[#202225] text-gray-200 text-sm rounded focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {renderMemberGroup('online')}
        {renderMemberGroup('idle')}
        {renderMemberGroup('dnd')}
        {renderMemberGroup('offline')}
      </div>
    </div>
  );
}; 