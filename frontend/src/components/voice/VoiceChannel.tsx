import React, { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaHeadphones, FaPhoneSlash, FaVolumeUp, FaVolumeMute, FaCog } from 'react-icons/fa';
import { socketService } from '../../services/socket.service';
import { Channel, User } from '../../types';

interface VoiceChannelProps {
  channel: Channel;
}

interface PeerConnection {
  userId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
  audioLevel?: number;
}

interface UserAudioSettings {
  volume: number;
  filters: {
    noiseSuppression: boolean;
    echoCancellation: boolean;
    autoGainControl: boolean;
  };
}

const VoiceChannel: React.FC<VoiceChannelProps> = ({ channel }) => {
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerConnections] = useState<Map<string, PeerConnection>>(new Map());
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState<number>(100);
  const [showVolumeControls, setShowVolumeControls] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true
  });
  const [userSettings, setUserSettings] = useState<Map<string, UserAudioSettings>>(new Map());
  const [showSettingsForUser, setShowSettingsForUser] = useState<string | null>(null);

  // Kullanıcı ses ayarlarını başlat
  const initUserSettings = (userId: string) => {
    if (!userSettings.has(userId)) {
      setUserSettings(prev => new Map(prev).set(userId, {
        volume: 100,
        filters: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true
        }
      }));
    }
  };

  // Ses seviyesini ayarla
  const handleVolumeChange = (userId: string, volume: number) => {
    const audio = audioElements.current.get(userId);
    if (audio) {
      audio.volume = volume / 100;
      setUserSettings(prev => {
        const newSettings = new Map(prev);
        const settings = newSettings.get(userId) || {
          volume: 100,
          filters: { noiseSuppression: true, echoCancellation: true, autoGainControl: true }
        };
        newSettings.set(userId, { ...settings, volume });
        return newSettings;
      });
    }
  };

  // Ses ayarlarını uygula
  const applyAudioSettings = async (stream: MediaStream, settings: UserAudioSettings) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const destination = audioContext.createMediaStreamDestination();

    // Ses işleme düğümleri
    const gainNode = audioContext.createGain();
    const compressor = audioContext.createDynamicsCompressor();
    
    // Ses seviyesi ayarı
    gainNode.gain.value = settings.volume / 100;

    // Gürültü önleme ve eko ayarları
    if (settings.filters.noiseSuppression || settings.filters.echoCancellation) {
      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;
    }

    // Ses işleme zinciri
    source
      .connect(gainNode)
      .connect(compressor)
      .connect(destination);

    return destination.stream;
  };

  // Ses filtresini değiştir
  const toggleFilter = async (userId: string, filterName: keyof UserAudioSettings['filters']) => {
    const settings = userSettings.get(userId);
    if (!settings) return;

    const newFilters = {
      ...settings.filters,
      [filterName]: !settings.filters[filterName]
    };

    // Ayarları güncelle
    setUserSettings(prev => {
      const newSettings = new Map(prev);
      newSettings.set(userId, {
        ...settings,
        filters: newFilters
      });
      return newSettings;
    });

    // Eğer bu yerel kullanıcı ise, ses akışını güncelle
    if (userId === currentUser.id && localStream) {
      try {
        // Yeni ayarlarla ses akışını al
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            ...newFilters,
            channelCount: 1,
            sampleRate: 48000,
            latency: 0.01
          }
        });

        // Ses ayarlarını uygula
        const processedStream = await applyAudioSettings(newStream, {
          ...settings,
          filters: newFilters
        });

        // Eski stream'i durdur
        localStream.getTracks().forEach(track => track.stop());

        // Yeni stream'i ayarla
        setLocalStream(processedStream);

        // Peer bağlantılarını güncelle
        peerConnections.forEach(({ connection }) => {
          const sender = connection.getSenders().find(s => s.track?.kind === 'audio');
          if (sender) {
            const [audioTrack] = processedStream.getAudioTracks();
            sender.replaceTrack(audioTrack);
          }
        });

        console.log(`${filterName} filtresi ${newFilters[filterName] ? 'açıldı' : 'kapatıldı'}`);
      } catch (error) {
        console.error('Ses filtresi güncellenirken hata:', error);
      }
    }
  };

  // Kullanıcı kartı
  const UserCard = ({ user }: { user: User }) => {
    // Sadece kendi ayarlarını görebilsin
    const canManageSettings = user.id === currentUser.id;
    const settings = userSettings.get(user.id);
    const isSettingsOpen = showSettingsForUser === user.id;

    if (!settings) return null;

    return (
      <div className="relative flex items-center space-x-3 p-2 rounded-md bg-gray-800">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
          speakingUsers.has(user.id) ? 'bg-green-500' : 'bg-gray-600'
        }`}>
          <span className="text-white">{user.username[0].toUpperCase()}</span>
        </div>
        <span className="text-white">{user.username}</span>
        
        <div className="ml-auto flex items-center space-x-2">
          {user.isMuted && <FaMicrophone className="text-red-500" title="Mikrofon Kapalı" />}
          {user.isDeafened && <FaHeadphones className="text-red-500" title="Ses Kapalı" />}
          
          {/* Sadece kendi ayarlar butonunu göster */}
          {canManageSettings && (
            <button
              onClick={() => setShowSettingsForUser(isSettingsOpen ? null : user.id)}
              className="p-1 rounded hover:bg-gray-700"
              title="Ses Ayarları"
            >
              <FaCog className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Sadece kendi ayarlarını göster ve düzenleyebilsin */}
        {isSettingsOpen && canManageSettings && (
          <div className="absolute right-0 top-full mt-2 p-4 bg-gray-800 rounded-md shadow-lg z-10">
            <div className="space-y-4 min-w-[200px]">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Ses Seviyesi</label>
                <div className="flex items-center space-x-2">
                  <FaVolumeMute className="text-gray-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.volume}
                    onChange={(e) => handleVolumeChange(user.id, Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${settings.volume}%, #4B5563 ${settings.volume}%, #4B5563 100%)`
                    }}
                  />
                  <FaVolumeUp className="text-gray-400" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Ses Filtreleri</label>
                <div className="space-y-2">
                  {Object.entries(settings.filters).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => toggleFilter(user.id, key as keyof UserAudioSettings['filters'])}
                      className={`w-full px-2 py-1 rounded text-sm ${
                        value ? 'bg-blue-500' : 'bg-gray-600'
                      } hover:opacity-90 transition-opacity`}
                    >
                      {key === 'noiseSuppression' && 'Gürültü Önleme'}
                      {key === 'echoCancellation' && 'Eko Önleme'}
                      {key === 'autoGainControl' && 'Otomatik Kazanç'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Yeni kullanıcılar bağlandığında ayarlarını başlat
  useEffect(() => {
    connectedUsers.forEach(user => {
      initUserSettings(user.id);
    });
  }, [connectedUsers]);

  // Ses aktivitesini tespit et
  const detectVoiceActivity = (stream: MediaStream, userId: string) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    let speaking = false;
    let speakingTimeout: NodeJS.Timeout;

    const checkAudio = () => {
      if (!analyser) return;

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      
      // Ses seviyesi eşiği (0-255 arası)
      const threshold = 25; // Daha düşük eşik değeri

      if (average > threshold && !speaking) {
        speaking = true;
        setSpeakingUsers(prev => new Set([...prev, userId]));
        
        // Sadece yerel kullanıcı konuşuyorsa bildir
        if (userId === currentUser.id) {
          socketService.socket?.emit('voice:speaking-start', {
            channelId: channel._id,
            userId: currentUser.id
          });
        }
      } else if (average <= threshold && speaking) {
        clearTimeout(speakingTimeout);
        speakingTimeout = setTimeout(() => {
          speaking = false;
          setSpeakingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
          
          // Sadece yerel kullanıcı konuşmayı bitirdiyse bildir
          if (userId === currentUser.id) {
            socketService.socket?.emit('voice:speaking-end', {
              channelId: channel._id,
              userId: currentUser.id
            });
          }
        }, 200);
      }

      requestAnimationFrame(checkAudio);
    };

    checkAudio();

    return () => {
      clearTimeout(speakingTimeout);
      source.disconnect();
      analyser.disconnect();
      audioContext.close();
    };
  };

  // Ses akışını başlat
  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Mikrofon erişimi hatası:', error);
      return null;
    }
  };

  // Yeni peer bağlantısı oluştur
  const createPeerConnection = async (targetUserId: string, stream: MediaStream) => {
    console.log('Peer bağlantısı oluşturuluyor:', targetUserId);
    
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    // Yerel ses akışını ekle
    stream.getTracks().forEach(track => {
      console.log('Ses track\'i ekleniyor:', track.kind, track.enabled);
      peerConnection.addTrack(track, stream);
    });

    // ICE adaylarını dinle ve gönder
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE adayı bulundu:', event.candidate);
        socketService.socket?.emit('voice:ice-candidate', {
          targetUserId,
          candidate: event.candidate,
          channelId: channel._id
        });
      }
    };

    // Bağlantı durumunu izle
    peerConnection.onconnectionstatechange = () => {
      console.log('Bağlantı durumu:', peerConnection.connectionState);
    };

    // Uzak ses akışını al
    peerConnection.ontrack = (event) => {
      console.log('Uzak ses track\'i alındı:', event.streams[0]);
      const [remoteStream] = event.streams;
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.play().catch(console.error);
      
      const settings = userSettings.get(targetUserId);
      if (settings) {
        audio.volume = settings.volume / 100;
      }
      
      audioElements.current.set(targetUserId, audio);
      detectVoiceActivity(remoteStream, targetUserId);
    };

    peerConnections.set(targetUserId, {
      userId: targetUserId,
      connection: peerConnection,
      stream
    });

    return peerConnection;
  };

  // Bağlantı koptuğunda yeniden bağlanma
  const handleReconnect = async (targetUserId: string) => {
    console.log('Bağlantı yeniden kuruluyor:', targetUserId);
    const oldConnection = peerConnections.get(targetUserId);
    if (oldConnection) {
      oldConnection.connection.close();
      peerConnections.delete(targetUserId);
    }

    if (localStream) {
      const peerConnection = await createPeerConnection(targetUserId, localStream);
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
        voiceActivityDetection: true
      });
      
      await peerConnection.setLocalDescription(offer);
      socketService.socket?.emit('voice:offer', {
        targetUserId,
        offer,
        channelId: channel._id
      });
    }
  };

  useEffect(() => {
    const handleVoiceUpdate = (users: User[]) => {
      // Benzersiz kullanıcıları filtrele
      const uniqueUsers = users.reduce((acc, user) => {
        if (user.channelId === channel._id) {
          // Eğer kullanıcı zaten varsa, güncelle
          acc.set(user.id, user);
        }
        return acc;
      }, new Map<string, User>());

      // Map'ten array'e çevir
      const filteredUsers = Array.from(uniqueUsers.values());
      console.log('Filtrelenmiş kullanıcılar:', filteredUsers);
      setConnectedUsers(filteredUsers);
    };

    const handleOffer = async ({ fromUserId, offer }: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
      console.log('Teklif alındı:', fromUserId);
      try {
        if (!localStream) {
          const stream = await startStream();
          if (!stream) return;
          setLocalStream(stream);
        }

        const peerConnection = await createPeerConnection(fromUserId, localStream!);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        console.log('Cevap gönderiliyor:', fromUserId);
        socketService.socket?.emit('voice:answer', {
          targetUserId: fromUserId,
          answer,
          channelId: channel._id
        });
      } catch (error) {
        console.error('Teklif işleme hatası:', error);
      }
    };

    const handleAnswer = async ({ fromUserId, answer }: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
      console.log('Cevap alındı:', fromUserId);
      const peerConnection = peerConnections.get(fromUserId)?.connection;
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = async ({ fromUserId, candidate }: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      console.log('ICE adayı alındı:', fromUserId);
      const peerConnection = peerConnections.get(fromUserId)?.connection;
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    // Konuşma durumu güncellemelerini dinle
    const handleUserSpeaking = ({ userId, speaking }: { userId: string; speaking: boolean }) => {
      console.log(`Kullanıcı ${userId} ${speaking ? 'konuşuyor' : 'sustu'}`);
      setSpeakingUsers(prev => {
        const newSet = new Set(prev);
        if (speaking) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    };

    socketService.socket?.on('voice:update', handleVoiceUpdate);
    socketService.socket?.on('voice:offer', handleOffer);
    socketService.socket?.on('voice:answer', handleAnswer);
    socketService.socket?.on('voice:ice-candidate', handleIceCandidate);
    socketService.socket?.on('voice:user-speaking', handleUserSpeaking);

    return () => {
      audioElements.current.forEach(audio => {
        audio.srcObject = null;
        audio.remove();
      });
      audioElements.current.clear();
      
      socketService.socket?.off('voice:update', handleVoiceUpdate);
      socketService.socket?.off('voice:offer', handleOffer);
      socketService.socket?.off('voice:answer', handleAnswer);
      socketService.socket?.off('voice:ice-candidate', handleIceCandidate);
      socketService.socket?.off('voice:user-speaking', handleUserSpeaking);
      
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, [channel._id, localStream, peerConnections]);

  // Kullanıcı ayrıldığında listeden kaldır
  useEffect(() => {
    const handleUserDisconnect = (userId: string) => {
      setConnectedUsers(prev => prev.filter(user => user.id !== userId));
    };

    socketService.socket?.on('user:disconnect', handleUserDisconnect);

    return () => {
      socketService.socket?.off('user:disconnect', handleUserDisconnect);
    };
  }, []);

  const handleJoinVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const settings = userSettings.get(currentUser.id);
      if (settings) {
        const processedStream = await applyAudioSettings(stream, settings);
        setLocalStream(processedStream);
      } else {
        setLocalStream(stream);
      }

      // Ses track'lerinin aktif olduğunu kontrol et
      stream.getAudioTracks().forEach(track => {
        console.log('Mikrofon durumu:', track.enabled);
        track.enabled = true; // Track'i aktif et
      });

      socketService.socket?.emit('voice:join', {
        channelId: channel._id,
        userId: currentUser.id
      });

      // Mevcut kullanıcılarla bağlantı kur
      for (const user of connectedUsers) {
        if (user.id !== currentUser.id) {
          console.log('Bağlantı kuruluyor:', user.username);
          const peerConnection = await createPeerConnection(user.id, stream);
          
          try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            console.log('Teklif gönderiliyor:', user.username);
            socketService.socket?.emit('voice:offer', {
              targetUserId: user.id,
              offer,
              channelId: channel._id
            });
          } catch (error) {
            console.error('Teklif oluşturma hatası:', error);
          }
        }
      }

      setIsConnected(true);
    } catch (error) {
      console.error('Ses kanalına katılma hatası:', error);
    }
  };

  const stopStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
      setLocalStream(null);
    }

    // Tüm ses elementlerini temizle
    audioElements.current.forEach(audio => {
      if (audio.srcObject) {
        const stream = audio.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        audio.srcObject = null;
      }
      audio.remove();
    });
    audioElements.current.clear();
  };

  const handleLeaveVoice = () => {
    socketService.socket?.emit('voice:leave', {
      channelId: channel._id,
      userId: currentUser.id
    });

    // Tüm peer bağlantılarını kapat
    peerConnections.forEach(({ connection }) => {
      connection.close();
    });
    peerConnections.clear();

    // Ses akışını durdur
    stopStream();

    // Audio context'i kapat
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }

    setIsConnected(false);
    setIsMuted(false);
    setIsDeafened(false);
    setSpeakingUsers(new Set());
  };

  // Mikrofon aç/kapat
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isMuted;
        console.log('Mikrofon durumu değiştirildi:', track.enabled);
      });
      
      setIsMuted(!isMuted);
      
      socketService.socket?.emit('voice:mute', {
        channelId: channel._id,
        userId: currentUser.id,
        isMuted: !isMuted
      });
    }
  };

  const toggleDeafen = () => {
    // Tüm uzak ses elementlerinin sesini aç/kapat
    audioElements.current.forEach(audio => {
      audio.muted = !isDeafened;
    });

    // Sağır modundayken otomatik olarak mikrofonu da kapat
    if (!isDeafened) {
      if (!isMuted) {
        toggleMute(); // Mikrofonu kapat
      }
    }

    // Durum güncellemesi
    setIsDeafened(!isDeafened);

    // Diğer kullanıcılara bildir
    socketService.socket?.emit('voice:deafen', {
      channelId: channel._id,
      userId: currentUser.id,
      isDeafened: !isDeafened
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-700">
      <div className="h-12 border-b border-gray-900 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center">
          <FaVolumeUp className="text-gray-400 mr-2" />
          <h3 className="text-white font-semibold">{channel.name}</h3>
          <span className="ml-2 text-sm text-gray-400">
            {connectedUsers.length} kullanıcı
          </span>
        </div>
        {isConnected && (
          <div className="flex space-x-2">
            <button
              onClick={toggleMute}
              className={`p-2 rounded-md ${
                isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
              }`}
              title={isMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}
            >
              <FaMicrophone className="text-white" />
            </button>
            <button
              onClick={toggleDeafen}
              className={`p-2 rounded-md ${
                isDeafened ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
              }`}
              title={isDeafened ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              <FaHeadphones className="text-white" />
            </button>
            <button
              onClick={handleLeaveVoice}
              className="p-2 rounded-md bg-red-500 hover:bg-red-600"
              title="Kanaldan Ayrıl"
            >
              <FaPhoneSlash className="text-white" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 p-4">
        <div className="space-y-2">
          {connectedUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>

        {!isConnected && (
          <button
            onClick={handleJoinVoice}
            className="mt-4 w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center justify-center space-x-2"
          >
            <FaVolumeUp />
            <span>Ses Kanalına Katıl</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceChannel; 