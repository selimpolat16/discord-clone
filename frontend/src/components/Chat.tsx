import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { messageService, Message } from '../services/message.service';
import { socketService } from '../services/socket.service';

interface Props {
  channelId: string;
  channelName: string;
}

export const Chat: React.FC<Props> = ({ channelId, channelName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const channelMessages = await messageService.getChannelMessages(channelId);
        setMessages(channelMessages);
        scrollToBottom();
      } catch (error) {
        console.error('Mesajlar yüklenirken hata:', error);
      }
    };

    loadMessages();

    // Socket.IO ile mesajları dinle
    const socket = socketService.getSocket();
    socket.emit('join_channel', channelId);

    socket.on('new_message', (message: Message) => {
      if (message.channelId === channelId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    });

    return () => {
      socket.emit('leave_channel', channelId);
      socket.off('new_message');
    };
  }, [channelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await messageService.sendMessage(
        newMessage.trim(),
        channelId,
        user.id,
        user.username
      );
      setNewMessage('');
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mesaj Listesi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex items-start space-x-3 ${
              message.userId === user?.id ? 'justify-end' : ''
            }`}
          >
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-500" />
            </div>
            <div className={`max-w-[70%] ${message.userId === user?.id ? 'bg-indigo-600' : 'bg-gray-700'} rounded-lg p-3`}>
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">{message.username}</span>
                <span className="text-gray-400 text-xs">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-white mt-1">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Mesaj Gönderme Formu */}
      <form onSubmit={handleSubmit} className="p-4 bg-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`#${channelName} kanalına mesaj gönder`}
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Gönder
          </button>
        </div>
      </form>
    </div>
  );
}; 