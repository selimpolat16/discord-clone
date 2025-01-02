import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { socketService } from '../services/socket.service';

export default function Login() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(username.toLowerCase());
      socketService.connect({ username: username.toLowerCase() });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Giriş yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#36393f] flex items-center justify-center p-4">
      <div className="bg-[#2f3136] p-8 rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-100 text-center mb-6">
          Discord Clone'a Hoş Geldiniz
        </h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-[#40444b] rounded border border-[#202225] text-gray-100 focus:outline-none focus:border-blue-500"
                required
                minLength={3}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || username.length < 3}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 