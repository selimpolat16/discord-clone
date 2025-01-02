import React, { useState } from 'react';
import { FaHashtag, FaVolumeUp } from 'react-icons/fa';
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
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await serverService.createChannel({ name, type });
      onSuccess();
      onClose();
      setName('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kanal oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#2f3136] rounded-lg p-4 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-100 mb-4">Kanal Oluştur</h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                KANAL TÜRÜ
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setType('text')}
                  className={`flex items-center px-4 py-2 rounded ${
                    type === 'text' ? 'bg-[#404449] text-white' : 'bg-[#2f3136] text-gray-400'
                  }`}
                >
                  <FaHashtag className="mr-2" />
                  Metin
                </button>
                <button
                  type="button"
                  onClick={() => setType('voice')}
                  className={`flex items-center px-4 py-2 rounded ${
                    type === 'voice' ? 'bg-[#404449] text-white' : 'bg-[#2f3136] text-gray-400'
                  }`}
                >
                  <FaVolumeUp className="mr-2" />
                  Ses
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                KANAL ADI
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="w-full px-3 py-2 bg-[#202225] text-gray-100 rounded border border-[#40444b] focus:outline-none focus:border-blue-500"
                placeholder={type === 'text' ? 'yeni-metin-kanalı' : 'yeni-ses-kanalı'}
                required
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="px-4 py-2 text-sm font-medium bg-[#5865f2] text-white rounded hover:bg-[#4752c4] transition-colors disabled:opacity-50"
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