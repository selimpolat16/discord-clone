import React, { useState } from 'react';
import axios from 'axios';

interface CreateChannelProps {
  onChannelCreated?: (channel: any) => void;
}

const CreateChannel: React.FC<CreateChannelProps> = ({ onChannelCreated }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:3000/api/server/channels', {
        name,
        type
      });

      setName('');
      if (onChannelCreated) {
        onChannelCreated(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kanal oluşturulamadı');
      console.error('Kanal oluşturma hatası:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-discord-secondary">
      <h3 className="text-white mb-4">Yeni Kanal Oluştur</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="channel-name" className="block text-discord-text mb-2">
            Kanal Adı
          </label>
          <input
            id="channel-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kanal adı girin"
            required
            className="w-full p-2 rounded bg-discord-tertiary border border-discord-tertiary text-discord-text focus:outline-none focus:border-discord-accent"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="channel-type" className="block text-discord-text mb-2">
            Kanal Türü
          </label>
          <select
            id="channel-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 rounded bg-discord-tertiary border border-discord-tertiary text-discord-text focus:outline-none focus:border-discord-accent"
          >
            <option value="text">Metin</option>
            <option value="voice">Ses</option>
          </select>
        </div>

        {error && (
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-2 px-4 bg-discord-accent text-white rounded font-medium hover:bg-opacity-90 transition-colors disabled:bg-opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Oluşturuluyor...' : 'Kanal Oluştur'}
        </button>
      </form>
    </div>
  );
};

export default CreateChannel; 