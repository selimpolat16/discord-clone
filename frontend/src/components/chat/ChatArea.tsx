import React, { useState, useEffect, useRef } from 'react';
import { FaHashtag } from 'react-icons/fa';
import { Channel } from '../../types';
import { socketService } from '../../services/socket.service';
import axios from 'axios';

interface Message {
  _id: string;
  content: string;
  author: {
    username: string;
    id: string;
  };
  channelId: string;
  createdAt: string;
}

interface ChatAreaProps {
  channel: Channel;
}

const ChatArea: React.FC<ChatAreaProps> = ({ channel }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Geçmiş mesajları yükle
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`http://localhost:3001/api/messages/${channel._id}`, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.data) {
          setMessages(response.data);
          setTimeout(scrollToBottom, 100); // Mesajlar yüklendikten sonra scroll
        }
      } catch (error) {
        console.error('Mesajlar yüklenirken hata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [channel._id]);

  // Socket.IO bağlantıları
  useEffect(() => {
    if (!socketService.socket) return; // Socket bağlantısı yoksa çık

    socketService.socket.emit('channel:join', channel._id);

    const handleNewMessage = (message: Message) => {
      if (message.channelId === channel._id) {
        setMessages(prev => [...prev, message]);
        setTimeout(scrollToBottom, 100);
      }
    };

    socketService.socket.on('message:receive', handleNewMessage);

    return () => {
      socketService.socket?.emit('channel:leave', channel._id);
      socketService.socket?.off('message:receive', handleNewMessage);
    };
  }, [channel._id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socketService.socket?.emit('message:send', {
      channelId: channel._id,
      content: newMessage.trim()
    });

    setNewMessage('');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-700">
        <div className="text-white">Mesajlar yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-700">
      <div className="h-12 border-b border-gray-900 flex items-center px-4 shadow-sm">
        <FaHashtag className="text-gray-400 mr-2" />
        <h3 className="text-white font-semibold">{channel.name}</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400">
            Henüz mesaj yok. İlk mesajı sen gönder!
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message._id}
              className={`flex items-start space-x-3 ${
                message.author.id === currentUser.id ? 'opacity-90' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-white">
                  {message.author.username[0].toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-white font-medium">
                    {message.author.username}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-300">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-4">
        <div className="bg-gray-600 rounded-lg p-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`${channel.name} kanalına mesaj gönder`}
            className="w-full bg-transparent text-white outline-none"
          />
        </div>
      </form>
    </div>
  );
};

export default ChatArea; 