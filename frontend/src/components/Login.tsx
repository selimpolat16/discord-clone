import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

const Login = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authService.login({ username });
      console.log('Giriş başarılı:', response);
      
      // Kullanıcı bilgilerini localStorage'a kaydet
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Ana sayfaya yönlendir
      navigate('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Bağlantı hatası oluştu';
      setError(errorMessage);
      console.error('Giriş hatası:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-10 bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-center text-3xl font-bold text-white">
          Discord Clone
        </h2>
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Kullanıcı Adı
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
              placeholder="Kullanıcı adınızı girin"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 transition-colors duration-200"
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 