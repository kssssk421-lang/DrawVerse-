import React from 'react';
import { CombinedArtwork, RoomState } from '../types';
import { PRESET_AVATARS } from '../utils/avatars';
import { Trophy, RotateCcw, Download, Sparkles, Laugh, Palette, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sound';

interface PodiumViewProps {
  roomState: RoomState;
  isHost: boolean;
  onRestartGame: () => void;
  onLeaveRoom: () => void;
}

export const PodiumView: React.FC<PodiumViewProps> = ({
  roomState,
  isHost,
  onRestartGame,
  onLeaveRoom,
}) => {
  React.useEffect(() => {
    sounds.playFanfare();
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
    });
  }, []);

  const artworks = roomState.allArtworks || [];

  // Compute award winners
  let mostFunnyArt: CombinedArtwork | null = null;
  let mostArtisticArt: CombinedArtwork | null = null;
  let mostChaosArt: CombinedArtwork | null = null;

  let maxFunny = -1;
  let maxArt = -1;
  let maxChaos = -1;

  artworks.forEach((art) => {
    const votes = Object.values(art.votes || {});
    const funnyCount = votes.filter((v) => v === 'funny').length;
    const artCount = votes.filter((v) => v === 'art').length;
    const chaosCount = votes.filter((v) => v === 'chaos').length;

    if (funnyCount > maxFunny) {
      maxFunny = funnyCount;
      mostFunnyArt = art;
    }
    if (artCount > maxArt) {
      maxArt = artCount;
      mostArtisticArt = art;
    }
    if (chaosCount > maxChaos) {
      maxChaos = chaosCount;
      mostChaosArt = art;
    }
  });

  const downloadArt = (art: CombinedArtwork) => {
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
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`DRAWVERSE · ${art.top.playerName} + ${art.bottom.playerName}`, 20, 685);

        const link = document.createElement('a');
        link.download = `drawverse-${art.top.playerName}-${art.bottom.playerName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      imgBottom.src = art.bottom.dataUrl;
    };
    imgTop.src = art.top.dataUrl;
  };

  const renderAvatar = (avatar: string) => {
    if (avatar.startsWith('data:image')) {
      return <img src={avatar} alt="Avatar" className="w-6 h-6 object-cover rounded-md" />;
    }
    const preset = PRESET_AVATARS.find((p) => p.id === avatar) || PRESET_AVATARS[0];
    return (
      <div className={`w-6 h-6 ${preset.bgColor} rounded-md flex items-center justify-center text-xs`}>
        {preset.emoji}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-2xl text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-400 mb-3 shadow-lg">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-fredoka text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 mb-2">
          Pódio dos Monstros!
        </h1>
        <p className="text-sm text-slate-300 max-w-md mx-auto">
          Fim da partida! Veja todas as bizarrices e obras primas criadas nessa sessão de DRAWVERSE.
        </p>

        {/* Action Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {isHost ? (
            <button
              onClick={() => { sounds.playFanfare(); onRestartGame(); }}
              className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-lg active:scale-95 transition-all text-sm flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jogar Novamente</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400">
              Aguardando o anfitrião decidir a próxima rodada...
            </div>
          )}

          <button
            onClick={onLeaveRoom}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-sm transition-colors"
          >
            Sair para o Menu
          </button>
        </div>
      </div>

      {/* Awards Highlights Row */}
      {artworks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Most Funny */}
          {mostFunnyArt && (
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4 shadow-xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                <Laugh className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Troféu Mais Hilário 🏆
                </span>
                <span className="text-sm font-bold text-white truncate block">
                  {(mostFunnyArt as CombinedArtwork).top.playerName} + {(mostFunnyArt as CombinedArtwork).bottom.playerName}
                </span>
                <span className="text-xs text-slate-400">
                  {maxFunny > 0 ? `${maxFunny} votos` : 'Favorito do público'}
                </span>
              </div>
            </div>
          )}

          {/* Master of Art */}
          {mostArtisticArt && (
            <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 shadow-xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-400/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Palette className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  Troféu Obra de Arte 🎨
                </span>
                <span className="text-sm font-bold text-white truncate block">
                  {(mostArtisticArt as CombinedArtwork).top.playerName} + {(mostArtisticArt as CombinedArtwork).bottom.playerName}
                </span>
                <span className="text-xs text-slate-400">
                  {maxArt > 0 ? `${maxArt} votos` : 'Puro talento'}
                </span>
              </div>
            </div>
          )}

          {/* Master of Chaos */}
          {mostChaosArt && (
            <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-4 shadow-xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-400/20 text-rose-400 flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                  Troféu Puro Caos 💥
                </span>
                <span className="text-sm font-bold text-white truncate block">
                  {(mostChaosArt as CombinedArtwork).top.playerName} + {(mostChaosArt as CombinedArtwork).bottom.playerName}
                </span>
                <span className="text-xs text-slate-400">
                  {maxChaos > 0 ? `${maxChaos} votos` : 'Inclassificável'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Gallery Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-black font-fredoka text-white px-1">
          Galeria Completa de Obras
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {artworks.map((art, index) => (
            <div
              key={art.id || index}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col justify-between"
            >
              <div>
                {/* Image composite */}
                <div className="relative aspect-[600/700] rounded-2xl overflow-hidden bg-white border border-slate-700 shadow-md mb-3 flex flex-col">
                  <div className="w-full h-1/2 overflow-hidden border-b border-dashed border-slate-300">
                    <img src={art.top.dataUrl} alt="Topo" className="w-full h-full object-cover object-bottom" />
                  </div>
                  <div className="w-full h-1/2 overflow-hidden">
                    <img src={art.bottom.dataUrl} alt="Base" className="w-full h-full object-cover object-top" />
                  </div>
                </div>

                {/* Creators */}
                <div className="space-y-1.5 text-xs text-slate-300 mb-3">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    {renderAvatar(art.top.playerAvatar)}
                    <span className="truncate">{art.top.playerName}</span>
                    <span className="text-slate-500 font-normal">({art.top.theme})</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    {renderAvatar(art.bottom.playerAvatar)}
                    <span className="truncate">{art.bottom.playerName}</span>
                    <span className="text-slate-500 font-normal">({art.bottom.theme})</span>
                  </div>
                </div>
              </div>

              {/* Download */}
              <button
                onClick={() => downloadArt(art)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Arte</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
