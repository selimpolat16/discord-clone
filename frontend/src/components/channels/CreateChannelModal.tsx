import React, { useState } from 'react';
import { serverService } from '../../services/server.service';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'text' | 'voice'>('text');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await serverService.createChannel({ name, type });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Kanal oluşturma hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#2f3136] rounded-lg p-6 w-full max-w-md text-gray-100">
        <h2 className="text-xl font-bold mb-4">Yeni Kanal Oluştur</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Kanal Adı
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#40444b] rounded border border-[#202225] focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Kanal Tipi
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'text' | 'voice')}
                className="w-full px-3 py-2 bg-[#40444b] rounded border border-[#202225] focus:outline-none focus:border-blue-500"
              >
                <option value="text">Metin</option>
                <option value="voice">Ses</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium bg-[#40444b] hover:bg-[#4f545c] rounded-md transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? 'Oluşturuluyor...' : 'Oluştur'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}; 