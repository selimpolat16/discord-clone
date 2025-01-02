import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

interface Message {
  _id: string;
  content: string;
  sender: string;
  timestamp: Date;
  channelId: string;
}

interface ChatChannelProps {
  channelId: string;
  userId: string;
}

const ChatChannel: React.FC<ChatChannelProps> = ({ channelId, userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const socket = useRef<any>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    // Socket.IO bağlantısı
    socket.current = io('http://localhost:3000');
    
    // Kanala katılma
    socket.current.emit('join_channel', channelId);
    
    // Yeni mesajları dinleme
    socket.current.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    // Mevcut mesajları yükleme
    fetchMessages();

    return () => {
      socket.current.disconnect();
    };
  }, [channelId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/channels/${channelId}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Mesajlar yüklenemedi:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId,
          content: newMessage,
          userId
        }),
      });

      if (response.ok) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
    }
  };

  return (
    <div className="chat-channel">
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message._id} 
            className={`message ${message.sender === userId ? 'own-message' : ''}`}
          >
            <div className="message-content">{message.content}</div>
            <div className="message-timestamp">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Mesajınızı yazın..."
        />
        <button type="submit">Gönder</button>
      </form>
    </div>
  );
};

export default ChatChannel; 