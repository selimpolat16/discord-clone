import React, { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaHeadphones, FaPhoneSlash, FaVolumeUp } from 'react-icons/fa';
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

  // Ses aktivitesini tespit et
  const detectVoiceActivity = (stream: MediaStream, userId: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let speaking = false;
    let speakingTimeout: NodeJS.Timeout;

    const checkAudio = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;

      if (average > 30) { // Ses eşiği
        if (!speaking) {
          speaking = true;
          setSpeakingUsers(prev => new Set([...prev, userId]));
        }
        clearTimeout(speakingTimeout);
        speakingTimeout = setTimeout(() => {
          speaking = false;
          setSpeakingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }, 300);
      }

      requestAnimationFrame(checkAudio);
    };

    checkAudio();
    return analyser;
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
      detectVoiceActivity(stream, currentUser.id);
      return stream;
    } catch (error) {
      console.error('Mikrofon erişimi hatası:', error);
      return null;
    }
  };

  // Uzak ses akışını al
  const handleRemoteStream = (stream: MediaStream, userId: string) => {
    const audio = new Audio();
    audio.srcObject = stream;
    audio.autoplay = true;
    audioElements.current.set(userId, audio);
    detectVoiceActivity(stream, userId);
  };

  // Yeni peer bağlantısı oluştur
  const createPeerConnection = async (targetUserId: string, stream: MediaStream) => {
    console.log('Peer bağlantısı oluşturuluyor:', targetUserId);
    
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { 
          urls: 'turn:numb.viagenie.ca',
          username: 'webrtc@live.com',
          credential: 'muazkh'
        }
      ]
    });

    // Yerel ses akışını ekle
    stream.getTracks().forEach(track => {
      console.log('Ses track\'i ekleniyor:', track.kind);
      peerConnection.addTrack(track, stream);
    });

    // Bağlantı durumu değişikliklerini izle
    peerConnection.onconnectionstatechange = () => {
      console.log('Bağlantı durumu:', peerConnection.connectionState);
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE bağlantı durumu:', peerConnection.iceConnectionState);
    };

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

    // Uzak ses akışını al
    peerConnection.ontrack = (event) => {
      console.log('Uzak ses track\'i alındı:', event.streams[0]);
      const [remoteStream] = event.streams;
      handleRemoteStream(remoteStream, targetUserId);
    };

    peerConnections.set(targetUserId, {
      userId: targetUserId,
      connection: peerConnection,
      stream
    });

    return peerConnection;
  };

  useEffect(() => {
    const handleVoiceUpdate = (users: User[]) => {
      const channelUsers = users.filter(user => user.channelId === channel._id);
      console.log('Kanal kullanıcıları güncellendi:', channelUsers);
      setConnectedUsers(channelUsers);
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

    socketService.socket?.on('voice:update', handleVoiceUpdate);
    socketService.socket?.on('voice:offer', handleOffer);
    socketService.socket?.on('voice:answer', handleAnswer);
    socketService.socket?.on('voice:ice-candidate', handleIceCandidate);

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
      
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, [channel._id, localStream, peerConnections]);

  const handleJoinVoice = async () => {
    try {
      const stream = await startStream();
      if (!stream) return;

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
            const offer = await peerConnection.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: false
            });
            
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

  const toggleMute = () => {
    if (localStream) {
      // Tüm ses trackleri için mikrofonu aç/kapat
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // Şu anki durumun tersini ayarla
      });

      // Durum güncellemesi
      setIsMuted(!isMuted);

      // Diğer kullanıcılara bildir
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
            <div
              key={user.id}
              className="flex items-center space-x-3 p-2 rounded-md bg-gray-800"
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  speakingUsers.has(user.id) ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span className="text-white">
                  {user.username[0].toUpperCase()}
                </span>
              </div>
              <span className="text-white">{user.username}</span>
              <div className="ml-auto flex space-x-2">
                {user.isMuted && (
                  <FaMicrophone className="text-red-500" title="Mikrofon Kapalı" />
                )}
                {user.isDeafened && (
                  <FaHeadphones className="text-red-500" title="Ses Kapalı" />
                )}
              </div>
            </div>
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