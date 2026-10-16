import React, { useState, useEffect, useRef } from 'react';
import { CombinedArtwork, RoomState } from '../types';
import { PRESET_AVATARS } from '../utils/avatars';
import { 
  Download, 
  ChevronRight, 
  Sparkles, 
  Trophy, 
  Laugh, 
  Palette, 
  Flame, 
  Skull, 
  Heart,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sound';

interface RevealShowcaseViewProps {
  roomState: RoomState;
  myPlayerId: string;
  isHost: boolean;
  onNextReveal: () => void;
  onSendReaction: (emoji: string) => void;
  onVote: (badge: 'funny' | 'art' | 'chaos') => void;
}

export const RevealShowcaseView: React.FC<RevealShowcaseViewProps> = ({
  roomState,
  myPlayerId,
  isHost,
  onNextReveal,
  onSendReaction,
  onVote,
}) => {
  const currentArt = roomState.currentArtwork;
  const [revealStage, setRevealStage] = useState<'top' | 'bottom' | 'combined'>('combined');
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; x: number }[]>([]);
  const combinedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger fanfare and confetti when new artwork is revealed
  useEffect(() => {
    sounds.playFanfare();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, [roomState.currentRevealIndex]);

  // Handle reaction emoji click
  const handleEmojiClick = (emoji: string) => {
    sounds.playPop();
    onSendReaction(emoji);
    triggerLocalReaction(emoji);
  };

  const triggerLocalReaction = (emoji: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    const x = Math.floor(Math.random() * 80) + 10;
    setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 1800);
  };

  const renderAvatar = (avatar: string, size = 'w-10 h-10 text-xl') => {
    if (avatar.startsWith('data:image')) {
      return <img src={avatar} alt="Avatar" className={`${size} object-cover rounded-xl shadow`} />;
    }
    const preset = PRESET_AVATARS.find((p) => p.id === avatar) || PRESET_AVATARS[0];
    return (
      <div className={`${size} ${preset.bgColor} rounded-xl flex items-center justify-center shadow`}>
        {preset.emoji}
      </div>
    );
  };

  // Generate combined high-resolution image for download
  const handleDownload = () => {
    if (!currentArt) return;
    sounds.playPop();

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 700);

    const imgTop = new Image();
    imgTop.onload = () => {
      ctx.drawImage(imgTop, 0, 0, 600, 350);
      const imgBottom = new Image();
      imgBottom.onload = () => {
        ctx.drawImage(imgBottom, 0, 350, 600, 350);

        // Watermark badge
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`DRAWVERSE · ${currentArt.top.playerName} + ${currentArt.bottom.playerName}`, 20, 685);

        const link = document.createElement('a');
        link.download = `drawverse-${currentArt.top.playerName}-${currentArt.bottom.playerName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      imgBottom.src = currentArt.bottom.dataUrl;
    };
    imgTop.src = currentArt.top.dataUrl;
  };

  if (!currentArt) {
    return (
      <div className="text-center py-12 text-white">
        Aguardando montagem das obras...
      </div>
    );
  }

  const myVote = currentArt.votes?.[myPlayerId];
  const votesCounts = {
    funny: Object.values(currentArt.votes || {}).filter((v) => v === 'funny').length,
    art: Object.values(currentArt.votes || {}).filter((v) => v === 'art').length,
    chaos: Object.values(currentArt.votes || {}).filter((v) => v === 'chaos').length,
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 relative overflow-hidden">
      {/* Floating Emojis Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-10 text-4xl animate-float-fade"
            style={{ left: `${item.x}%` }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Top Bar: Navigation & Index */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-2xl flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
            Galeria What The Hell · O Museu dos Monstros!
          </span>
          <h2 className="text-xl sm:text-2xl font-black font-fredoka text-white">
            Obra {roomState.currentRevealIndex + 1} de {roomState.artworksCount}
          </h2>
        </div>

        {/* Host Next Reveal Button */}
        {isHost ? (
          <button
            onClick={() => { sounds.playWhoosh(); onNextReveal(); }}
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2 text-sm"
          >
            <span>
              {roomState.currentRevealIndex < roomState.artworksCount - 1
                ? 'Próxima Obra'
                : roomState.currentRound < roomState.totalRounds
                ? 'Próxima Rodada'
                : 'Pódio Final! 🏆'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="text-xs text-slate-400 font-medium">
            ⏳ O anfitrião controla os slides
          </div>
        )}
      </div>

      {/* Combined Masterpiece Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row gap-6 items-center">
        {/* The Combined Canvas Display */}
        <div className="relative w-full max-w-[420px] aspect-[600/700] rounded-2xl overflow-hidden bg-white shadow-2xl border-4 border-slate-800 flex flex-col">
          {/* Top Half */}
          <div className="relative w-full h-1/2 overflow-hidden border-b border-dashed border-slate-300">
            <img
              src={currentArt.top.dataUrl}
              alt="Metade de cima"
              className="w-full h-full object-cover object-bottom"
            />
          </div>

          {/* Bottom Half */}
          <div className="relative w-full h-1/2 overflow-hidden">
            <img
              src={currentArt.bottom.dataUrl}
              alt="Metade de baixo"
              className="w-full h-full object-cover object-top"
            />
          </div>

          {/* Fusion seam badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/80 backdrop-blur-sm text-amber-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-400/30 tracking-widest shadow">
            FUSÃO MISTURADA
          </div>
        </div>

        {/* Artwork Info & Interactive Voting/Reactions */}
        <div className="flex-1 w-full space-y-5">
          {/* Top Creator Info */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2.5">
              {renderAvatar(currentArt.top.playerAvatar)}
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Parte Superior (Topo)
                </span>
                <span className="font-bold text-white text-base">
                  {currentArt.top.playerName}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-300 font-medium pl-1">
              Tema: <span className="text-amber-300 font-bold">"{currentArt.top.theme}"</span>
            </div>
          </div>

          {/* Bottom Creator Info */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2.5">
              {renderAvatar(currentArt.bottom.playerAvatar)}
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Parte Inferior (Base)
                </span>
                <span className="font-bold text-white text-base">
                  {currentArt.bottom.playerName}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-300 font-medium pl-1">
              Tema: <span className="text-cyan-300 font-bold">"{currentArt.bottom.theme}"</span>
            </div>
          </div>

          {/* Reactions Bar */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Reaja em Tempo Real!
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {['😂', '💀', '🔥', '🎨', '👏', '🤯'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xl hover:scale-115 active:scale-95 transition-all shadow-md"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Badges / Voting */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Vote na Melhor Categoria desta Obra
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { sounds.playPop(); onVote('funny'); }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  myVote === 'funny'
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-md ring-2 ring-amber-400/40'
                    : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Laugh className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">Mais Hilário</span>
                <span className="text-[10px] text-slate-400">({votesCounts.funny})</span>
              </button>

              <button
                onClick={() => { sounds.playPop(); onVote('art'); }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  myVote === 'art'
                    ? 'bg-indigo-400/20 border-indigo-400 text-indigo-300 shadow-md ring-2 ring-indigo-400/40'
                    : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Palette className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">Obra Prima</span>
                <span className="text-[10px] text-slate-400">({votesCounts.art})</span>
              </button>

              <button
                onClick={() => { sounds.playPop(); onVote('chaos'); }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  myVote === 'chaos'
                    ? 'bg-rose-400/20 border-rose-400 text-rose-300 shadow-md ring-2 ring-rose-400/40'
                    : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Flame className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold">Puro Caos</span>
                <span className="text-[10px] text-slate-400">({votesCounts.chaos})</span>
              </button>
            </div>
          </div>

          {/* Download Button */}
          <div className="pt-2">
            <button
              onClick={handleDownload}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Salvar Imagem Combinada (.png)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
