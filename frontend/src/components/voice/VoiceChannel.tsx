import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaMicrophone, FaHeadphones, FaPhoneSlash, FaVolumeUp, FaVolumeMute, FaCog, FaVideo, FaVideoSlash, FaTimes } from 'react-icons/fa';
import { socketService } from '../../services/socket.service';
import { Channel, User } from '../../types';
import { createPortal } from 'react-dom';

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
  userVolume: number;
}

interface User {
  id: string;
  username: string;
  channelId?: string;
  isMuted?: boolean;
  isDeafened?: boolean;
  hasVideo?: boolean;
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
  const audioAnalysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const animationFrameRef = useRef<number>();
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
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const videoElements = useRef<Map<string, HTMLVideoElement>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [channelUserCount, setChannelUserCount] = useState(0);
  const [userVolumes, setUserVolumes] = useState<Map<string, number>>(new Map());

  const handleVoiceUserCount = (data: { channelId: string, count: number }) => {
    if (data.channelId === channel._id) {
      setChannelUserCount(data.count);
    }
  };

  const handleVoiceUpdate = (users: User[]) => {
    const filteredUsers = users.filter(user => user.channelId === channel._id);
    setConnectedUsers(filteredUsers);
    setChannelUserCount(filteredUsers.length);
  };

  const createPeerConnection = async (userId: string, stream: MediaStream): Promise<RTCPeerConnection> => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const connection = new RTCPeerConnection(configuration);

    // Yerel stream'i bağlantıya ekle
    stream.getTracks().forEach(track => {
      connection.addTrack(track, stream);
      console.log('Track eklendi:', track.kind, track.enabled);
    });

    // ICE adaylarını dinle
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.socket?.emit('voice:ice-candidate', {
          targetUserId: userId,
          candidate: event.candidate,
          channelId: channel._id
        });
      }
    };

    // Bağlantı durumunu izle
    connection.onconnectionstatechange = () => {
      console.log('Bağlantı durumu:', connection.connectionState);
    };

    // Uzak stream'i al
    connection.ontrack = (event) => {
      console.log('Uzak track alındı:', event.track.kind);
      const [remoteStream] = event.streams;

      if (event.track.kind === 'audio') {
        let audioElement = audioElements.current.get(userId);
        if (!audioElement) {
          audioElement = new Audio();
          audioElement.autoplay = true;
          audioElement.volume = 1.0;
          audioElements.current.set(userId, audioElement);
        }
        audioElement.srcObject = remoteStream;
        audioElement.play().catch(console.error);

        // Ses analizi ekle
        setupAudioAnalysis(userId, remoteStream);
      }
    };

    peerConnections.set(userId, {
      userId,
      connection,
      stream
    });

    return connection;
  };

  interface CustomRTCPeerConnection extends RTCPeerConnection {
    userId?: string;
  }

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
  const handleVolumeChange = (userId: string, volume: number, isUserVolume: boolean = false) => {
    const audio = audioElements.current.get(userId);
    if (audio) {
      if (isUserVolume) {
        // Kullanıcıya özel ses seviyesi
        audio.volume = volume / 100;
        setUserSettings(prev => {
          const newSettings = new Map(prev);
          const settings = newSettings.get(userId) || {
            volume: 100,
            userVolume: 100,
            filters: { noiseSuppression: true, echoCancellation: true, autoGainControl: true }
          };
          newSettings.set(userId, { ...settings, userVolume: volume });
          return newSettings;
        });
      } else {
        // Genel mikrofon seviyesi
        audio.volume = volume / 100;
        setUserSettings(prev => {
          const newSettings = new Map(prev);
          const settings = newSettings.get(userId) || {
            volume: 100,
            userVolume: 100,
            filters: { noiseSuppression: true, echoCancellation: true, autoGainControl: true }
          };
          newSettings.set(userId, { ...settings, volume });
          return newSettings;
        });
      }
    }
  };

  // Ses filtresini değiştir
  const toggleFilter = async (userId: string, filterName: keyof UserAudioSettings['filters']) => {
    const settings = userSettings.get(userId);
    if (!settings) return;

    try {
      // Önce ayarları güncelle
      const newFilters = {
        ...settings.filters,
        [filterName]: !settings.filters[filterName]
      };

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
          // Yeni ses akışı al
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: newFilters.echoCancellation,
              noiseSuppression: newFilters.noiseSuppression,
              autoGainControl: newFilters.autoGainControl,
              channelCount: 1,
              sampleRate: 48000
            }
          });

          // Yeni ses track'ini al
          const [newAudioTrack] = newStream.getAudioTracks();
          
          // Eski track'i durdur ve kaldır
          localStream.getAudioTracks().forEach(track => {
            track.stop();
            localStream.removeTrack(track);
          });

          // Yeni track'i ekle
          localStream.addTrack(newAudioTrack);

          // Her peer bağlantısı için ses track'ini güncelle
          peerConnections.forEach(({ connection }) => {
            const sender = connection.getSenders().find(s => s.track?.kind === 'audio');
            if (sender) {
              sender.replaceTrack(newAudioTrack).catch(console.error);
            }
          });

          // Mikrofon durumunu koru
          newAudioTrack.enabled = !isMuted;

          console.log(`${filterName} filtresi ${newFilters[filterName] ? 'açıldı' : 'kapatıldı'}`);
        } catch (error) {
          console.error('Ses filtresi güncellenirken hata:', error);
          // Hata durumunda eski ayarlara geri dön
          setUserSettings(prev => {
            const newSettings = new Map(prev);
            newSettings.set(userId, settings);
            return newSettings;
          });
        }
      }
    } catch (error) {
      console.error('Filtre değiştirme hatası:', error);
      // Hata durumunda eski ayarlara geri dön
      setUserSettings(prev => {
        const newSettings = new Map(prev);
        newSettings.set(userId, settings);
        return newSettings;
      });
    }
  };

  // Ses analizi için yeni fonksiyonlar ekleyin
  const setupAudioAnalysis = (userId: string, stream: MediaStream) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioAnalysersRef.current.set(userId, analyser);

      // Ses seviyesi analizi başlat
      analyzeSoundLevel(userId, analyser);
    } catch (error) {
      console.error('Ses analizi kurulumu hatası:', error);
    }
  };

  const analyzeSoundLevel = (userId: string, analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const checkSoundLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Ses seviyesini hesapla
      const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
      
      // Konuşma eşiği (0-255 arası)
      const threshold = 30;

      if (average > threshold) {
        setSpeakingUsers(prev => new Set(prev).add(userId));
      } else {
        setSpeakingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }

      animationFrameRef.current = requestAnimationFrame(checkSoundLevel);
    };

    checkSoundLevel();
  };

  // Kullanıcı kartı
  const UserCard = ({ user }: { user: User }) => {
    const volume = userVolumes.get(user.id) || 0;

    return (
      <div className="relative flex items-center space-x-3 p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors">
        <div 
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
            speakingUsers.has(user.id) ? 'bg-green-500' : 'bg-gray-600'
          }`}
        >
          <span className="text-white">{user.username[0].toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <span className="text-white truncate">{user.username}</span>
            <div className="flex items-center ml-2 space-x-1">
              {user.isMuted && <FaMicrophone className="text-red-500 w-3 h-3" />}
              {user.isDeafened && <FaHeadphones className="text-red-500 w-3 h-3" />}
              {user.hasVideo && <FaVideo className="text-green-500 w-3 h-3" />}
            </div>
          </div>
          <div className="relative h-1 bg-gray-600 rounded-full mt-1">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-100 ${
                speakingUsers.has(user.id) ? 'bg-green-500' : 'bg-gray-500'
              }`}
              style={{ width: `${volume}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Yeni kullanıcılar bağlandığında ayarlarını başlat
  useEffect(() => {
    // Kullanıcı sayısı güncellemesi için handler
    const handleVoiceUserCount = (data: { channelId: string, count: number }) => {
      if (data.channelId === channel._id) {
        setChannelUserCount(data.count);
      }
    };

    // Kullanıcı güncellemeleri için handler
    const handleVoiceUpdate = (users: User[]) => {
      const filteredUsers = users.filter(user => user.channelId === channel._id);
      setConnectedUsers(filteredUsers);
      setChannelUserCount(filteredUsers.length);
    };

    // Socket event'lerini dinle
    socketService.socket?.on('voice:user-count', handleVoiceUserCount);
    socketService.socket?.on('voice:update', handleVoiceUpdate);

    // Kanal bilgisini al
    socketService.socket?.emit('voice:get-users', { channelId: channel._id });

    // Cleanup
    return () => {
      socketService.socket?.off('voice:user-count', handleVoiceUserCount);
      socketService.socket?.off('voice:update', handleVoiceUpdate);
    };
  }, [channel._id]);

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
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000
        }
      });

      // Ses track'lerinin başlangıç durumunu ayarla
      stream.getAudioTracks().forEach(track => {
        track.enabled = true;
        console.log('Yerel ses track\'i başlatıldı:', track.enabled);
      });

      setLocalStream(stream);
      setIsMuted(false);

      // Yerel ses analizi ekle
      setupAudioAnalysis(currentUser.id, stream);

      // Ses ayarlarını başlat
      if (!userSettings.has(currentUser.id)) {
        setUserSettings(prev => new Map(prev).set(currentUser.id, {
          volume: 100,
          filters: {
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true
          }
        }));
      }

      // Kanala katıl
      socketService.socket?.emit('voice:join', {
        channelId: channel._id,
        userId: currentUser.id,
        isMuted: false
      });

      // Mevcut kullanıcılarla bağlantı kur
      connectedUsers.forEach(async (user) => {
        if (user.id !== currentUser.id) {
          try {
            const peerConnection = await createPeerConnection(user.id, stream);
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            socketService.socket?.emit('voice:offer', {
              targetUserId: user.id,
              offer,
              channelId: channel._id
            });
          } catch (error) {
            console.error('Kullanıcı bağlantısı oluşturma hatası:', error);
          }
        }
      });

      setIsConnected(true);

    } catch (error) {
      console.error('Ses erişimi hatası:', error);
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

    setShowSettingsForUser(null);
    setIsConnected(false);
    setIsMuted(false);
    setIsDeafened(false);
    setSpeakingUsers(new Set());
  };

  // Mikrofon aç/kapat
  const toggleMute = () => {
    if (localStream) {
      try {
        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach(track => {
          // Burada mantığı düzelttik - track.enabled'ı isMuted'ın tersine ayarlıyoruz
          track.enabled = !isMuted;
        });
        
        // Önce state'i güncelle
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        
        // Sonra diğer kullanıcılara bildir
        socketService.socket?.emit('voice:mute', {
          channelId: channel._id,
          userId: currentUser.id,
          isMuted: newMutedState
        });

        console.log('Mikrofon durumu değiştirildi:', newMutedState);
      } catch (error) {
        console.error('Mikrofon durumu değiştirilirken hata:', error);
      }
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

  // Video aç/kapat
  const toggleVideo = async () => {
    try {
      if (isVideoEnabled) {
        // Video kapatma
        localStream?.getVideoTracks().forEach(track => {
          track.stop();
        });
        setIsVideoEnabled(false);
        
        // Diğer kullanıcılara bildir
        socketService.socket?.emit('voice:video', {
          channelId: channel._id,
          userId: currentUser.id,
          hasVideo: false
        });
      } else {
        // Video açma
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });

        // Yerel görüntüyü ayarla
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = videoStream;
        }

        // Video track'ini tüm bağlantılara ekle
        peerConnections.forEach(({ connection }) => {
          videoStream.getTracks().forEach(track => {
            connection.addTrack(track, videoStream);
          });

          // Yeni teklif oluştur ve gönder
          connection.createOffer().then(offer => {
            connection.setLocalDescription(offer);
            socketService.socket?.emit('voice:offer', {
              targetUserId: (connection as CustomRTCPeerConnection).userId || userId,
              offer,
              channelId: channel._id
            });
          });
        });

        setIsVideoEnabled(true);
        
        // Diğer kullanıcılara bildir
        socketService.socket?.emit('voice:video', {
          channelId: channel._id,
          userId: currentUser.id,
          hasVideo: true
        });
      }
    } catch (error) {
      console.error('Video toggle hatası:', error);
      setIsVideoEnabled(false);
    }
  };

  // WebRTC olaylarını dinle
  useEffect(() => {
    const handleOffer = async ({ fromUserId, offer }: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
      console.log('Teklif alındı:', fromUserId);
      
      if (!localStream) {
        console.error('Yerel stream bulunamadı');
        return;
      }

      try {
        const peerConnection = await createPeerConnection(fromUserId, localStream);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socketService.socket?.emit('voice:answer', {
          targetUserId: fromUserId,
          answer,
          channelId: channel._id
        });

        console.log('Cevap gönderildi');
      } catch (error) {
        console.error('Teklif işleme hatası:', error);
      }
    };

    const handleAnswer = async ({ fromUserId, answer }: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
      console.log('Cevap alındı:', fromUserId);
      const peerConnection = peerConnections.get(fromUserId)?.connection;
      
      if (peerConnection) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
          console.error('Cevap işleme hatası:', error);
        }
      }
    };

    const handleIceCandidate = async ({ fromUserId, candidate }: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      console.log('ICE adayı alındı:', fromUserId);
      const peerConnection = peerConnections.get(fromUserId)?.connection;
      
      if (peerConnection) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('ICE adayı ekleme hatası:', error);
        }
      }
    };

    socketService.socket?.on('voice:offer', handleOffer);
    socketService.socket?.on('voice:answer', handleAnswer);
    socketService.socket?.on('voice:ice-candidate', handleIceCandidate);

    return () => {
      socketService.socket?.off('voice:offer', handleOffer);
      socketService.socket?.off('voice:answer', handleAnswer);
      socketService.socket?.off('voice:ice-candidate', handleIceCandidate);
    };
  }, [channel._id, localStream, peerConnections]);

  // Yeni bir kullanıcı katıldığında ses ayarlarını başlatmak için useEffect ekleyin
  useEffect(() => {
    connectedUsers.forEach(user => {
      if (!userSettings.has(user.id)) {
        setUserSettings(prev => new Map(prev).set(user.id, {
          volume: 100,
          filters: {
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true
          }
        }));
      }
    });
  }, [connectedUsers]);

  // Temizlik için useEffect ekleyin
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // AudioContext'i kapat
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }

      // Analizörleri temizle
      audioAnalysersRef.current.clear();
    };
  }, []);

  // Cleanup function
  useEffect(() => {
    return () => {
      setShowSettingsForUser(null); // Component unmount olduğunda ayarlar panelini kapat
    };
  }, []);

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
              {isMuted ? <FaMicrophone className="text-white line-through" /> : <FaMicrophone className="text-white" />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-2 rounded-md ${
                !isVideoEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
              }`}
              title={!isVideoEnabled ? 'Kamerayı Aç' : 'Kamerayı Kapat'}
            >
              {isVideoEnabled ? <FaVideo className="text-white" /> : <FaVideoSlash className="text-white" />}
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
              onClick={() => setShowSettingsForUser(currentUser.id)}
              className="p-2 rounded-md bg-gray-600 hover:bg-gray-500"
              title="Ses Ayarları"
            >
              <FaCog className="text-white" />
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

      {/* Ayarlar Paneli - Portal ile render ediliyor */}
      {showSettingsForUser === currentUser.id && createPortal(
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => setShowSettingsForUser(null)}
          />
          
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg w-96 shadow-xl z-50">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">Ses Filtreleri</h3>
              <button
                onClick={() => setShowSettingsForUser(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {userSettings.get(currentUser.id) && (
                <div className="space-y-2">
                  {Object.entries(userSettings.get(currentUser.id)!.filters).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => toggleFilter(currentUser.id, key as keyof UserAudioSettings['filters'])}
                      className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-700"
                    >
                      <span className="text-sm text-gray-300">
                        {key === 'noiseSuppression' && 'Gürültü Önleme'}
                        {key === 'echoCancellation' && 'Eko Önleme'}
                        {key === 'autoGainControl' && 'Otomatik Ses'}
                      </span>
                      <div className={`w-10 h-5 rounded-full relative ${
                        value ? 'bg-blue-500' : 'bg-gray-600'
                      }`}>
                        <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${
                          value ? 'right-0.5' : 'left-0.5'
                        }`} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700">
              <button
                onClick={() => setShowSettingsForUser(null)}
                className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
              >
                Tamam
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      <div className="flex-1 p-4">
        {isConnected && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Yerel video */}
            {isVideoEnabled && (
              <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded">
                  Sen
                </div>
              </div>
            )}
            
            {/* Uzak videolar */}
            {connectedUsers.map(user => {
              if (user.id === currentUser.id || !user.hasVideo) return null;
              
              return (
                <div 
                  key={user.id}
                  data-user-video={user.id}
                  className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden"
                >
                  <video
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black text-white bg-opacity-50 px-2 py-1 rounded">
                    {user.username}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Kullanıcı listesi */}
        <div className="space-y-2">
          {connectedUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>

        {!isConnected && (
          <div className="mt-4 space-y-2">
            <div className="text-gray-400 text-sm">
              <div className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
                <div className="flex items-center space-x-2">
                  <FaVolumeUp className="text-gray-400" />
                  <span>Ses Kanalında</span>
                </div>
                <span className="bg-gray-700 px-2 py-1 rounded">
                  {channelUserCount} kullanıcı
                </span>
              </div>
              {connectedUsers.length > 0 && (
                <div className="mt-2 pl-4 space-y-1">
                  {connectedUsers.map(user => (
                    <div key={user.id} className="flex items-center text-gray-400 py-1">
                      <span className="flex-1">{user.username}</span>
                      <div className="flex items-center space-x-2">
                        {user.isMuted && (
                          <FaMicrophone className="text-red-500" title="Mikrofon Kapalı" />
                        )}
                        {user.isDeafened && (
                          <FaHeadphones className="text-red-500" title="Ses Kapalı" />
                        )}
                        {user.hasVideo && (
                          <FaVideo className="text-green-500" title="Kamera Açık" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleJoinVoice}
              className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center justify-center space-x-2 transition-colors"
            >
              <FaVolumeUp />
              <span>Ses Kanalına Katıl</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceChannel; 