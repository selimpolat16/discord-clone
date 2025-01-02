import { socketService } from './socket.service';

interface PeerConnection {
  userId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
  audioElement?: HTMLAudioElement;
}

interface VoiceSettings {
  isMuted: boolean;
  isDeafened: boolean;
  volume: number;
}

class VoiceService {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private currentChannelId: string | null = null;
  private isSpeaking = false;
  private speakingThreshold = -30; // dB cinsinden ses eşiği
  private configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:numb.viagenie.ca',
        username: 'webrtc@live.com',
        credential: 'muazkh'
      }
    ],
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    sdpSemantics: 'unified-plan'
  };

  constructor() {
    const socket = socketService.getSocket();

    socket.on('user_joined_voice', async ({ userId }) => {
      if (this.currentChannelId) {
        try {
          const pc = this.createPeerConnection(userId);
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            voiceActivityDetection: true
          });
          await pc.setLocalDescription(offer);
          socket.emit('voice_offer', { userId, offer });
        } catch (error) {
          console.error('Teklif oluşturma hatası:', error);
        }
      }
    });

    socket.on('voice_offer', async ({ userId, offer }) => {
      try {
        const pc = this.createPeerConnection(userId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('voice_answer', { userId, answer });
      } catch (error) {
        console.error('Teklif yanıtlama hatası:', error);
      }
    });

    socket.on('voice_answer', async ({ userId, answer }) => {
      try {
        const pc = this.peerConnections.get(userId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (error) {
        console.error('Yanıt işleme hatası:', error);
      }
    });

    socket.on('voice_ice_candidate', async ({ userId, candidate }) => {
      try {
        const pc = this.peerConnections.get(userId);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('ICE aday ekleme hatası:', error);
      }
    });
  }

  private createPeerConnection(userId: string): RTCPeerConnection {
    let pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }

    pc = new RTCPeerConnection(this.configuration);
    this.peerConnections.set(userId, pc);

    // Ses akışını ekle
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // ICE adaylarını gönder
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.getSocket().emit('voice_ice_candidate', {
          userId,
          candidate: event.candidate
        });
      }
    };

    // Uzak ses akışını al
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      const audio = new Audio();
      audio.srcObject = stream;
      audio.autoplay = true;
      audio.dataset.peerId = userId; // Ses elementine peer ID'sini ekle
      audio.volume = 1.0;
      document.body.appendChild(audio); // Ses elementini DOM'a ekle
    };

    // Bağlantı durumunu izle
    pc.onconnectionstatechange = () => {
      console.log(`Bağlantı durumu (${userId}):`, pc.connectionState);
      if (pc.connectionState === 'failed') {
        this.handleConnectionFailure(userId);
      }
    };

    return pc;
  }

  private async handleConnectionFailure(userId: string) {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      try {
        const offer = await pc.createOffer({ iceRestart: true });
        await pc.setLocalDescription(offer);
        socketService.getSocket().emit('voice_offer', { userId, offer });
      } catch (error) {
        console.error('Bağlantı yenileme hatası:', error);
      }
    }
  }

  private startVoiceDetection() {
    if (!this.localStream) return;

    try {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      this.analyser = this.audioContext.createAnalyser();
      
      // Ses analiz ayarları
      this.analyser.fftSize = 256;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;
      this.analyser.smoothingTimeConstant = 0.2;

      source.connect(this.analyser);

      const dataArray = new Float32Array(this.analyser.frequencyBinCount);
      let speakingCounter = 0;
      const SPEAKING_INTERVAL = 1;
      const VOLUME_THRESHOLD = -75;

      const checkAudioLevel = () => {
        if (!this.analyser || !this.currentChannelId) return;

        this.analyser.getFloatFrequencyData(dataArray);
        
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const isSpeakingNow = average > VOLUME_THRESHOLD;

        if (isSpeakingNow) {
          speakingCounter++;
          if (speakingCounter >= SPEAKING_INTERVAL && !this.isSpeaking) {
            this.isSpeaking = true;
            socketService.getSocket().emit('voice_speaking', {
              channelId: this.currentChannelId,
              isSpeaking: true
            });
          }
        } else {
          if (this.isSpeaking && speakingCounter < SPEAKING_INTERVAL) {
            this.isSpeaking = false;
            socketService.getSocket().emit('voice_speaking', {
              channelId: this.currentChannelId,
              isSpeaking: false
            });
          }
          speakingCounter = Math.max(0, speakingCounter - 1);
        }

        if (this.currentChannelId) {
          requestAnimationFrame(checkAudioLevel);
        }
      };

      checkAudioLevel();
    } catch (error) {
      console.error('Ses algılama başlatma hatası:', error);
    }
  }

  async joinVoiceChannel(channelId: string) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
          latency: 0,
          volume: 1.0
        }
      });

      this.currentChannelId = channelId;
      this.startVoiceDetection(); // Ses algılamayı başlat
      socketService.getSocket().emit('join_voice_channel', { channelId });
    } catch (error) {
      console.error('Ses kanalına katılma hatası:', error);
      throw error;
    }
  }

  async leaveVoiceChannel() {
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
    }

    this.isSpeaking = false;
    
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.currentChannelId) {
      socketService.getSocket().emit('leave_voice_channel', {
        channelId: this.currentChannelId
      });
      this.currentChannelId = null;
    }
  }

  updateSettings(settings: VoiceSettings) {
    try {
      if (this.localStream) {
        // Mikrofon kapalıysa ses algılamayı durdur
        if (settings.isMuted && this.isSpeaking) {
          this.isSpeaking = false;
          socketService.getSocket().emit('voice_speaking', {
            channelId: this.currentChannelId,
            isSpeaking: false
          });
        }

        this.localStream.getAudioTracks().forEach(track => {
          track.enabled = !settings.isMuted;
        });
      }

      // Ses seviyesini güncelle
      this.peerConnections.forEach((pc) => {
        const audioElement = pc.ontrack && pc.ontrack.toString().includes('audio') 
          ? document.querySelector(`audio[data-peer-id="${pc.id}"]`) as HTMLAudioElement
          : null;
          
        if (audioElement) {
          audioElement.volume = settings.isDeafened ? 0 : settings.volume / 100;
          audioElement.muted = settings.isDeafened;
        }
      });

      // Ses akışını güncelle
      if (settings.isDeafened) {
        this.peerConnections.forEach(pc => {
          const receivers = pc.getReceivers();
          receivers.forEach(receiver => {
            if (receiver.track.kind === 'audio') {
              receiver.track.enabled = false;
            }
          });
        });
      } else {
        this.peerConnections.forEach(pc => {
          const receivers = pc.getReceivers();
          receivers.forEach(receiver => {
            if (receiver.track.kind === 'audio') {
              receiver.track.enabled = true;
            }
          });
        });
      }

      console.log('Ses ayarları güncellendi:', settings);
    } catch (error) {
      console.error('Ses ayarları güncellenirken hata:', error);
    }
  }

  // ... diğer metodlar aynı ...
}

export const voiceService = new VoiceService(); 