import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { voiceService } from '../services/voice.service';
import { socketService } from '../services/socket.service';

interface Props {
  channelId: string;
  channelName: string;
}

interface VoiceUser {
  id: string;
  username: string;
  isSpeaking: boolean;
}

interface VoiceSettings {
  isMuted: boolean;
  isDeafened: boolean;
  volume: number;
}

export const VoiceChannel: React.FC<Props> = ({ channelId, channelName }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState<VoiceUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<VoiceSettings>({
    isMuted: false,
    isDeafened: false,
    volume: 100
  });
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);

  useEffect(() => {
    const socket = socketService.getSocket();

    socket.on('voice_users_updated', (users: VoiceUser[]) => {
      setVoiceUsers(users);
    });

    return () => {
      socket.off('voice_users_updated');
      if (isConnected) {
        handleLeaveVoice();
      }
    };
  }, []);

  // Ses ayarlarını uygula
  useEffect(() => {
    if (isConnected && voiceService) {
      try {
        voiceService.updateSettings(settings);
      } catch (error) {
        console.error('Ses ayarları güncellenirken hata:', error);
      }
    }
  }, [settings, isConnected]);

  // Temizleme işlemi ekle
  useEffect(() => {
    return () => {
      if (isConnected) {
        handleLeaveVoice();
      }
    };
  }, [isConnected]);

  const handleJoinVoice = async () => {
    try {
      setError(null);
      await voiceService.joinVoiceChannel(channelId);
      setIsConnected(true);
      // Başlangıç ayarlarını uygula
      voiceService.updateSettings(settings);
    } catch (error: any) {
      console.error('Ses kanalına katılma hatası:', error);
      setError(error.message || 'Ses kanalına katılırken bir hata oluştu');
      setIsConnected(false);
    }
  };

  const handleLeaveVoice = async () => {
    try {
      await voiceService.leaveVoiceChannel();
      setIsConnected(false);
      // Ses ayarlarını sıfırla
      setSettings({
        isMuted: false,
        isDeafened: false,
        volume: 100
      });
    } catch (error) {
      console.error('Ses kanalından ayrılma hatası:', error);
    }
  };

  const toggleMute = () => {
    setSettings(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const toggleDeafen = () => {
    setSettings(prev => ({ 
      ...prev, 
      isDeafened: !prev.isDeafened,
      isMuted: !prev.isDeafened // Sağır modunda mikrofon da kapatılır
    }));
  };

  const handleVolumeChange = (value: number) => {
    setSettings(prev => ({ ...prev, volume: value }));
  };

  // Test sesi çal
  const playTestSound = () => {
    try {
      setIsTestingAudio(true);
      const beep = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
      beep.volume = settings.volume / 100;
      beep.play();
      setTimeout(() => setIsTestingAudio(false), 500);
    } catch (error) {
      console.error('Test sesi çalma hatası:', error);
      setIsTestingAudio(false);
    }
  };

  // Klavye kısayolları
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isConnected) return;

      switch (e.key.toLowerCase()) {
        case 'm':
          toggleMute();
          break;
        case 'd':
          toggleDeafen();
          break;
        case 'arrowup':
          handleVolumeChange(Math.min(settings.volume + 5, 100));
          break;
        case 'arrowdown':
          handleVolumeChange(Math.max(settings.volume - 5, 0));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isConnected, settings.volume]);

  const handleMicTest = async () => {
    try {
      setIsTesting(true);
      await voiceService.startMicTest();
      setIsTesting(false);
      setHasRecording(true);
    } catch (error) {
      console.error('Mikrofon testi hatası:', error);
      setIsTesting(false);
    }
  };

  const handlePlayRecording = () => {
    voiceService.playLastRecording();
    setHasRecording(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-semibold">
            🔊 {channelName}
          </h2>
          {!isConnected ? (
            <button
              onClick={handleJoinVoice}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Katıl
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              {/* Mikrofon Butonu */}
              <button
                onClick={toggleMute}
                className={`p-2 rounded ${
                  settings.isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
                title={settings.isMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}
              >
                {settings.isMuted ? '🔇' : '🎤'}
              </button>

              {/* Kulaklık Butonu */}
              <button
                onClick={toggleDeafen}
                className={`p-2 rounded ${
                  settings.isDeafened ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
                title={settings.isDeafened ? 'Sesi Aç' : 'Sesi Kapat'}
              >
                {settings.isDeafened ? '🔇' : '🎧'}
              </button>

              {/* Ses Seviyesi */}
              <div className="relative">
                <button
                  onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                  className="p-2 rounded bg-gray-600 hover:bg-gray-700"
                  title="Ses Seviyesi"
                >
                  {settings.volume > 66 ? '🔊' : settings.volume > 33 ? '🔉' : settings.volume > 0 ? '🔈' : '🔇'}
                </button>

                {/* Ses Seviyesi Slider */}
                {showVolumeSlider && (
                  <div className="absolute bottom-full mb-2 p-2 bg-gray-800 rounded shadow-lg">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="w-32 accent-indigo-600"
                    />
                    <div className="text-center text-sm text-gray-400 mt-1">
                      {settings.volume}%
                    </div>
                  </div>
                )}
              </div>

              {/* Ayrıl Butonu */}
              <button
                onClick={handleLeaveVoice}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Ayrıl
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 text-red-200 rounded">
            <div className="font-medium mb-1">Hata</div>
            <div>{error}</div>
            {error.includes('mikrofon izni') && (
              <div className="mt-2 text-sm">
                <p>Çözüm için:</p>
                <ol className="list-decimal ml-4 mt-1">
                  <li>Tarayıcı adres çubuğundaki kilit/mikrofon ikonuna tıklayın</li>
                  <li>Mikrofon iznini "İzin Ver" olarak ayarlayın</li>
                  <li>Sayfayı yenileyin ve tekrar deneyin</li>
                </ol>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          {voiceUsers.map(voiceUser => (
            <div
              key={voiceUser.id}
              className={`flex items-center justify-between p-2 rounded ${
                voiceUser.isSpeaking ? 'bg-green-600/20' : 'bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-500" />
                <span className="text-white">{voiceUser.username}</span>
                {voiceUser.isSpeaking && (
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                )}
              </div>
              <div className="flex items-center space-x-1">
                {voiceUser.id === user?.id && settings.isMuted && (
                  <span title="Mikrofon Kapalı">🔇</span>
                )}
                {voiceUser.id === user?.id && settings.isDeafened && (
                  <span title="Ses Kapalı">🔇</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {isConnected && voiceUsers.length === 0 && (
          <div className="text-gray-400 text-center mt-4">
            Henüz kimse katılmadı
          </div>
        )}

        {!isConnected && voiceUsers.length > 0 && (
          <div className="text-gray-400 text-center mt-4">
            {voiceUsers.length} kişi bu kanalda
          </div>
        )}

        {/* Ses Kontrolleri */}
        {isConnected && (
          <div className="mt-4 p-4 bg-gray-800 rounded">
            <h3 className="text-white font-medium mb-2">Ses Ayarları</h3>
            
            {/* Mikrofon Test Butonu */}
            <button
              onClick={handleMicTest}
              disabled={isTesting}
              className="w-full mb-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mikrofon Test Ediliyor...
                </span>
              ) : (
                'Mikrofonu Test Et (3sn)'
              )}
            </button>

            {/* Kayıt Dinleme Butonu */}
            {hasRecording && (
              <button
                onClick={handlePlayRecording}
                className="w-full mb-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                🎵 Son Kaydı Dinle
              </button>
            )}

            {/* Test Butonu */}
            <button
              onClick={playTestSound}
              disabled={isTestingAudio}
              className="w-full mb-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingAudio ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Test Ediliyor...
                </span>
              ) : (
                'Ses Sistemini Test Et'
              )}
            </button>

            {/* Mikrofon Testi */}
            <div className="mt-4">
              <h4 className="text-gray-400 text-sm mb-2">Mikrofon Seviyesi</h4>
              <div className="h-2 bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${settings.volume}%` }}
                />
              </div>
            </div>

            {/* Ses Ayarları */}
            <div className="mt-4">
              <label className="text-gray-400 text-sm">
                Ana Ses ({settings.volume}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full mt-1 accent-indigo-600"
              />
            </div>

            {/* Kısayol Bilgileri */}
            <div className="mt-4 text-sm text-gray-400">
              <p>Kısayollar:</p>
              <ul className="mt-1 space-y-1">
                <li>• Mikrofon Aç/Kapat: M</li>
                <li>• Ses Aç/Kapat: D</li>
                <li>• Ses Seviyesi: ↑/↓</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 