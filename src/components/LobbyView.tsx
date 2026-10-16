import React, { useState } from 'react';
import { RoomState, Player } from '../types';
import { PRESET_AVATARS } from '../utils/avatars';
import { 
  Copy, 
  Check, 
  Crown, 
  Play, 
  Settings, 
  Bot, 
  Users, 
  Sparkles, 
  Clock, 
  Layers, 
  Share2, 
  HelpCircle,
  Flame,
  Zap,
  PhoneCall
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface LobbyViewProps {
  roomState: RoomState;
  myPlayerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onUpdateSettings: (settings: { totalRounds?: number; drawDuration?: number; isPublic?: boolean }) => void;
  onAddBot: () => void;
  onRemoveBot: () => void;
  onToggleReady: () => void;
  onLeaveRoom: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomState,
  myPlayerId,
  isHost,
  onStartGame,
  onUpdateSettings,
  onAddBot,
  onRemoveBot,
  onToggleReady,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const me = roomState.players.find((p) => p.id === myPlayerId);

  const handleCopyCode = () => {
    sounds.playPop();
    navigator.clipboard.writeText(roomState.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    sounds.playPop();
    const url = `${window.location.origin}?room=${roomState.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderAvatar = (avatar: string) => {
    if (avatar.startsWith('data:image')) {
      return <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />;
    }
    const preset = PRESET_AVATARS.find((p) => p.id === avatar) || PRESET_AVATARS[0];
    return (
      <div className={`w-full h-full ${preset.bgColor} rounded-2xl flex items-center justify-center text-3xl shadow`}>
        {preset.emoji}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner & Room Code */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              Sala Aberta
            </span>
            <span className="text-xs text-slate-400">· Modo: Misturado / What the hell!</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-fredoka text-white">
            {roomState.name}
          </h1>
        </div>

        {/* Room Code Card */}
        <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 p-2 sm:p-2.5 rounded-2xl">
          <div className="px-3 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Código da Sala</div>
            <div className="text-2xl sm:text-3xl font-black tracking-widest text-amber-400 font-mono">
              {roomState.code}
            </div>
          </div>
          <button
            onClick={handleCopyCode}
            className="p-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl transition-all font-bold flex items-center justify-center shadow-md active:scale-95"
            title="Copiar Código"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
          <button
            onClick={handleCopyLink}
            className="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all flex items-center justify-center active:scale-95"
            title="Copiar Link de Convite"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Game Mode & Rules, Right = Players & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Mode & Info */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Mode Card */}
          <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Modo em Destaque
              </span>
              <button
                onClick={() => setShowHowToPlay(!showHowToPlay)}
                className="text-xs text-indigo-300 hover:text-white flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Como funciona?</span>
              </button>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg">
                🤪
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-fredoka">
                  Misturado / What the hell!
                </h3>
                <p className="text-xs text-slate-400">
                  O desafio de fusão corporal mais imprevisível
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Cada artista desenha a metade superior baseada em um tema louco. Na segunda etapa, os desenhos são embaralhados e você recebe a metade de outro jogador para continuar o corpo com um tema completamente diferente!
            </p>

            {/* Config Badges */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Rodadas</span>
                <span className="text-sm font-black text-amber-400">
                  {roomState.totalRounds} {roomState.totalRounds === 1 ? 'partida' : 'partidas'}
                </span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tempo por etapa</span>
                <span className="text-sm font-black text-cyan-400">
                  {roomState.drawDuration} segundos
                </span>
              </div>
            </div>
          </div>

          {/* Mode Teasers / Future DRAWVERSE Challenges */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
              Outros Modos do DRAWVERSE (Em Breve)
            </span>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 opacity-60">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-bold block">Telefone Sem Fio</span>
                    <span className="text-[10px] text-slate-500">Desenhe, adivinhe e veja a mensagem se transformar</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                  Em Breve
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 opacity-60">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <div>
                    <span className="font-bold block">Speed Draw Blitz</span>
                    <span className="text-[10px] text-slate-500">30 segundos de adrenalina máxima</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                  Em Breve
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Players Grid & Start Action */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between min-h-[420px]">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-black text-white font-fredoka">
                    Jogadores ({roomState.players.length}/{roomState.maxPlayers})
                  </h2>
                </div>

                {/* Host Bot Controls */}
                {isHost && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { sounds.playPop(); onAddBot(); }}
                      className="flex items-center gap-1 text-xs font-semibold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 px-2.5 py-1.5 rounded-xl border border-indigo-500/30 transition-colors"
                      title="Adicionar Bot para jogar ou testar"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>+ Bot</span>
                    </button>
                    {roomState.players.some((p) => p.isBot) && (
                      <button
                        onClick={() => { sounds.playPop(); onRemoveBot(); }}
                        className="text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 px-2.5 py-1.5 rounded-xl border border-rose-500/30 transition-colors"
                      >
                        - Bot
                      </button>
                    )}
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
                      title="Configurações da Sala"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Players Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {roomState.players.map((player) => (
                  <div
                    key={player.id}
                    className={`relative p-3 rounded-2xl border transition-all flex flex-col items-center text-center ${
                      player.id === myPlayerId
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-lg'
                        : 'bg-slate-800/60 border-slate-700/60'
                    }`}
                  >
                    {/* Host Crown */}
                    {player.isHost && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 p-1 rounded-full shadow-md">
                        <Crown className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div className="w-14 h-14 rounded-2xl overflow-hidden mb-2 mt-1 shadow-md">
                      {renderAvatar(player.avatar)}
                    </div>

                    <div className="font-bold text-sm text-white truncate w-full px-1">
                      {player.name}
                      {player.id === myPlayerId && (
                        <span className="text-[10px] text-amber-400 font-semibold block">
                          (Você)
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                      {player.isBot ? '🤖 Amigo Bot' : player.isHost ? '👑 Anfitrião' : '🎨 Artista'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="pt-6 border-t border-slate-800 mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={onLeaveRoom}
                className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition-colors"
              >
                Sair da Sala
              </button>

              <div className="flex-1 w-full flex justify-end">
                {isHost ? (
                  <button
                    onClick={() => { sounds.playFanfare(); onStartGame(); }}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-xl shadow-orange-500/20 active:scale-95 transition-all text-base flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Iniciar Jogo!</span>
                  </button>
                ) : (
                  <div className="w-full text-center sm:text-right py-2 text-sm text-slate-400 font-medium">
                    ⏳ Aguardando o anfitrião iniciar a partida...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Host Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <h3 className="text-xl font-black font-fredoka text-amber-400">
              Configurações da Partida
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                Quantidade de Rodadas (Partidas)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 5].map((rounds) => (
                  <button
                    key={rounds}
                    type="button"
                    onClick={() => onUpdateSettings({ totalRounds: rounds })}
                    className={`py-2 rounded-xl font-bold text-sm transition-all ${
                      roomState.totalRounds === rounds
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {rounds} {rounds === 1 ? 'Rodada' : 'Rodadas'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                Tempo de Desenho por Etapa
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[45, 60, 90, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onUpdateSettings({ drawDuration: sec })}
                    className={`py-2 rounded-xl font-bold text-sm transition-all ${
                      roomState.drawDuration === sec
                        ? 'bg-cyan-400 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl shadow-md transition-all"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
