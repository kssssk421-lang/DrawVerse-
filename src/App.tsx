import React, { useState, useEffect, useRef } from 'react';
import { RoomState } from './types';
import { HomeView } from './components/HomeView';
import { LobbyView } from './components/LobbyView';
import { DrawingRoundView } from './components/DrawingRoundView';
import { RevealShowcaseView } from './components/RevealShowcaseView';
import { PodiumView } from './components/PodiumView';
import { ProfileModal } from './components/ProfileModal';
import { Volume2, VolumeX, Sparkles, AlertCircle } from 'lucide-react';
import { sounds } from './utils/sound';

export default function App() {
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('drawverse_name') || 'Rabiscador';
  });
  const [playerAvatar, setPlayerAvatar] = useState<string>(() => {
    return localStorage.getItem('drawverse_avatar') || 'cat';
  });
  const [showProfileModal, setShowProfileModal] = useState<boolean>(() => {
    return !localStorage.getItem('drawverse_name');
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pendingActionRef = useRef<any>(null);

  // Initialize or connect WebSocket
  const setupWebSocket = () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      // If there was a pending room action (e.g. from query param or button), send it
      if (pendingActionRef.current) {
        ws.send(JSON.stringify(pendingActionRef.current));
        pendingActionRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.event) {
          case 'ROOM_JOINED':
            setMyPlayerId(msg.data.playerId);
            break;

          case 'ROOM_STATE':
            setRoomState(msg.data);
            break;

          case 'TIMER_TICK':
            setRoomState((prev) => (prev ? { ...prev, timerSeconds: msg.data.timerSeconds } : prev));
            break;

          case 'SUBMISSION_UPDATE':
            setRoomState((prev) => (prev ? { ...prev, submittedCount: msg.data.submittedCount } : prev));
            break;

          case 'ERROR':
            setErrorMessage(msg.data.message);
            setTimeout(() => setErrorMessage(null), 4000);
            break;
        }
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Auto reconnect after 2 seconds
      setTimeout(setupWebSocket, 2000);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    setupWebSocket();

    // Check URL params for room invite link (e.g. ?room=ABCD)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      handleJoinRoom(roomParam.toUpperCase());
    }

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const sendWsMessage = (event: string, data: any) => {
    const message = { event, data };
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      pendingActionRef.current = message;
      setupWebSocket();
    }
  };

  // Actions
  const handleSaveProfile = (name: string, avatar: string) => {
    setPlayerName(name);
    setPlayerAvatar(avatar);
    localStorage.setItem('drawverse_name', name);
    localStorage.setItem('drawverse_avatar', avatar);
    setShowProfileModal(false);
  };

  const handleCreateRoom = (params: {
    roomName: string;
    isPublic: boolean;
    totalRounds: number;
    drawDuration: number;
  }) => {
    sendWsMessage('CREATE_ROOM', {
      ...params,
      playerName,
      playerAvatar,
    });
  };

  const handleJoinRoom = (code: string) => {
    sendWsMessage('JOIN_ROOM', {
      roomCode: code,
      playerName,
      playerAvatar,
    });
  };

  const handleStartGame = () => {
    sendWsMessage('START_GAME', {});
  };

  const handleUpdateSettings = (settings: { totalRounds?: number; drawDuration?: number; isPublic?: boolean }) => {
    sendWsMessage('UPDATE_SETTINGS', settings);
  };

  const handleAddBot = () => {
    sendWsMessage('ADD_BOT', {});
  };

  const handleRemoveBot = () => {
    sendWsMessage('REMOVE_BOT', {});
  };

  const handleToggleReady = () => {
    sendWsMessage('TOGGLE_READY', {});
  };

  const handleSubmitDrawing = (dataUrl: string) => {
    if (!roomState) return;
    if (roomState.state === 'DRAWING_PART1') {
      sendWsMessage('SUBMIT_PART1', { dataUrl });
    } else if (roomState.state === 'DRAWING_PART2') {
      sendWsMessage('SUBMIT_PART2', { dataUrl });
    }
  };

  const handleNextReveal = () => {
    sendWsMessage('NEXT_REVEAL', {});
  };

  const handleSendReaction = (emoji: string) => {
    sendWsMessage('REACTION', { emoji });
  };

  const handleVote = (badge: 'funny' | 'art' | 'chaos') => {
    sendWsMessage('VOTE_ARTWORK', { badge });
  };

  const handleRestartGame = () => {
    sendWsMessage('RESTART_GAME', {});
  };

  const handleLeaveRoom = () => {
    sendWsMessage('LEAVE_ROOM', {});
    setRoomState(null);
    setMyPlayerId(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const toggleSoundMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const isHost = roomState?.players.find((p) => p.id === myPlayerId)?.isHost ?? false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 relative overflow-x-hidden">
      {/* Background Party Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-rose-600/15 rounded-full blur-[140px]" />
      </div>

      {/* Global Top Header Bar */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div
          onClick={() => { if (!roomState) return; sounds.playPop(); handleLeaveRoom(); }}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black font-fredoka text-xl shadow-md">
            D
          </div>
          <div>
            <span className="text-lg font-black font-fredoka tracking-wider text-white">
              DRAWVERSE
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 ml-2">
              Misturado / What the hell!
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSoundMute}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title={isMuted ? 'Desmutar Som' : 'Mutar Som'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Connection Indicator if disconnected */}
          {!connected && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold rounded-xl animate-pulse">
              <span>Reconectando...</span>
            </div>
          )}
        </div>
      </header>

      {/* Global Toast Error Message */}
      {errorMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-bold border border-rose-400 animate-bounce">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main View Router */}
      <main className="relative z-10 flex-1 p-4 sm:p-6 md:p-8 flex flex-col justify-center">
        {!roomState ? (
          <HomeView
            playerName={playerName}
            playerAvatar={playerAvatar}
            onOpenProfile={() => setShowProfileModal(true)}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        ) : roomState.state === 'LOBBY' ? (
          <LobbyView
            roomState={roomState}
            myPlayerId={myPlayerId || ''}
            isHost={isHost}
            onStartGame={handleStartGame}
            onUpdateSettings={handleUpdateSettings}
            onAddBot={handleAddBot}
            onRemoveBot={handleRemoveBot}
            onToggleReady={handleToggleReady}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : roomState.state === 'DRAWING_PART1' || roomState.state === 'DRAWING_PART2' ? (
          <DrawingRoundView
            roomState={roomState}
            myPlayerId={myPlayerId || ''}
            onSubmitDrawing={handleSubmitDrawing}
          />
        ) : roomState.state === 'REVEAL_SHOWCASE' ? (
          <RevealShowcaseView
            roomState={roomState}
            myPlayerId={myPlayerId || ''}
            isHost={isHost}
            onNextReveal={handleNextReveal}
            onSendReaction={handleSendReaction}
            onVote={handleVote}
          />
        ) : roomState.state === 'PODIUM' ? (
          <PodiumView
            roomState={roomState}
            isHost={isHost}
            onRestartGame={handleRestartGame}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : null}
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          initialName={playerName}
          initialAvatar={playerAvatar}
          onSave={handleSaveProfile}
          onClose={() => setShowProfileModal(false)}
          isFirstTime={!localStorage.getItem('drawverse_name')}
        />
      )}
    </div>
  );
}
