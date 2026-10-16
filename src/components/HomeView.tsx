import React, { useState, useEffect } from 'react';
import { PRESET_AVATARS } from '../utils/avatars';
import { PublicRoomInfo } from '../types';
import { 
  Sparkles, 
  Plus, 
  LogIn, 
  Users, 
  Flame, 
  RotateCw, 
  Layers, 
  ShieldCheck, 
  Edit3, 
  Crown,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface HomeViewProps {
  playerName: string;
  playerAvatar: string;
  onOpenProfile: () => void;
  onCreateRoom: (params: {
    roomName: string;
    isPublic: boolean;
    totalRounds: number;
    drawDuration: number;
  }) => void;
  onJoinRoom: (code: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  playerName,
  playerAvatar,
  onOpenProfile,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [tab, setTab] = useState<'create' | 'join' | 'public'>('create');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [roomNameInput, setRoomNameInput] = useState(`Sala de ${playerName}`);
  const [totalRounds, setTotalRounds] = useState(2);
  const [drawDuration, setDrawDuration] = useState(60);
  const [isPublic, setIsPublic] = useState(true);

  const [publicRooms, setPublicRooms] = useState<PublicRoomInfo[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Fetch public rooms
  const loadPublicRooms = async () => {
    try {
      setIsLoadingRooms(true);
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (tab === 'public') {
      loadPublicRooms();
    }
  }, [tab]);

  // Update room name default if player name changes
  useEffect(() => {
    setRoomNameInput(`Sala de ${playerName}`);
  }, [playerName]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playPop();
    onCreateRoom({
      roomName: roomNameInput.trim() || `Sala de ${playerName}`,
      isPublic,
      totalRounds,
      drawDuration,
    });
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    sounds.playPop();
    onJoinRoom(roomCodeInput.trim().toUpperCase());
  };

  const renderAvatarPreview = (avatarStr: string) => {
    if (avatarStr.startsWith('data:image')) {
      return (
        <img
          src={avatarStr}
          alt="Avatar"
          className="w-full h-full object-cover rounded-2xl"
        />
      );
    }
    const preset = PRESET_AVATARS.find((p) => p.id === avatarStr) || PRESET_AVATARS[0];
    return (
      <div className={`w-full h-full ${preset.bgColor} rounded-2xl flex items-center justify-center text-3xl shadow`}>
        {preset.emoji}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Hero Brand Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-widest uppercase shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>O Jogo Multiplayer de Desafios & Desenho</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-fredoka tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 drop-shadow-xl">
          DRAWVERSE
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto font-medium">
          Inspirado em Gartic Phone! Jogue o modo <strong>Misturado / What the hell!</strong>, desenhe temas insanos, continue o desenho dos seus amigos e veja o resultado final!
        </p>
      </div>

      {/* User Profile Bar Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 p-0.5 shadow-md">
            {renderAvatarPreview(playerAvatar)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Artista Atual</span>
            </div>
            <div className="text-lg font-black text-white">{playerName}</div>
          </div>
        </div>

        <button
          onClick={() => { sounds.playPop(); onOpenProfile(); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-bold border border-slate-700 transition-colors shadow-sm"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Trocar Foto / Nome</span>
        </button>
      </div>

      {/* Action Center Tabs: Criar Sala | Entrar com Código | Salas Públicas */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => { sounds.playPop(); setTab('create'); }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'create'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Criar Sala</span>
          </button>

          <button
            type="button"
            onClick={() => { sounds.playPop(); setTab('join'); }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'join'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar por Código</span>
          </button>

          <button
            type="button"
            onClick={() => { sounds.playPop(); setTab('public'); }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'public'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Salas Abertas</span>
          </button>
        </div>

        {/* Tab 1: Create Room */}
        {tab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="max-w-md mx-auto space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nome da Sala
              </label>
              <input
                type="text"
                required
                maxLength={24}
                value={roomNameInput}
                onChange={(e) => setRoomNameInput(e.target.value)}
                placeholder="Ex: Sala do Caos, Desafio Maluco..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            {/* Rounds Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Número de Rodadas (Partidas)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 5].map((rounds) => (
                  <button
                    key={rounds}
                    type="button"
                    onClick={() => { sounds.playPop(); setTotalRounds(rounds); }}
                    className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
                      totalRounds === rounds
                        ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {rounds} {rounds === 1 ? 'Rodada' : 'Rodadas'}
                  </button>
                ))}
              </div>
            </div>

            {/* Draw Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Tempo de Desenho por Etapa
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[45, 60, 90, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => { sounds.playPop(); setDrawDuration(sec); }}
                    className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
                      drawDuration === sec
                        ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Preview Badge */}
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center gap-3">
              <span className="text-2xl">🤪</span>
              <div className="text-left text-xs">
                <span className="font-bold text-indigo-300 block">Modo: Misturado / What the hell!</span>
                <span className="text-slate-400">Cada jogador desenha uma parte e passa para o próximo!</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-xl shadow-orange-500/25 active:scale-98 transition-all text-base flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Criar Sala e Começar!</span>
            </button>
          </form>
        )}

        {/* Tab 2: Join by Code */}
        {tab === 'join' && (
          <form onSubmit={handleJoinSubmit} className="max-w-md mx-auto space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Digite o Código da Sala (5 letras)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="Ex: WX82K"
                className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-center text-3xl font-mono font-black text-amber-400 tracking-widest uppercase focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!roomCodeInput.trim()}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-xl shadow-orange-500/25 active:scale-98 transition-all text-base flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-5 h-5" />
              <span>Entrar na Sala</span>
            </button>
          </form>
        )}

        {/* Tab 3: Public Rooms Browser */}
        {tab === 'public' && (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Salas Disponíveis Agora
              </span>
              <button
                onClick={loadPublicRooms}
                disabled={isLoadingRooms}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>

            {publicRooms.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-800 space-y-2">
                <p className="text-slate-400 text-sm">
                  Nenhuma sala pública aberta no momento.
                </p>
                <button
                  onClick={() => setTab('create')}
                  className="text-xs font-bold text-amber-400 hover:underline"
                >
                  Crie a primeira sala agora!
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {publicRooms.map((room) => (
                  <div
                    key={room.code}
                    className="flex items-center justify-between p-3.5 bg-slate-800/70 hover:bg-slate-800 rounded-2xl border border-slate-700/60 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{room.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Código: <strong className="text-amber-400 font-mono">{room.code}</strong></span>
                        <span>·</span>
                        <span>{room.playersCount}/{room.maxPlayers} jogadores</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onJoinRoom(room.code)}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1"
                    >
                      <span>Entrar</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
