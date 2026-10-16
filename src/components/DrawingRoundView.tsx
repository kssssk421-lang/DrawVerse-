import React, { useState, useEffect } from 'react';
import { RoomState } from '../types';
import { DrawingCanvas } from './DrawingCanvas';
import { Clock, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { sounds } from '../utils/sound';

interface DrawingRoundViewProps {
  roomState: RoomState;
  myPlayerId: string;
  onSubmitDrawing: (dataUrl: string) => void;
}

export const DrawingRoundView: React.FC<DrawingRoundViewProps> = ({
  roomState,
  myPlayerId,
  onSubmitDrawing,
}) => {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [lastSubmittedImage, setLastSubmittedImage] = useState<string | null>(null);

  const isPart1 = roomState.state === 'DRAWING_PART1';
  const currentTheme = isPart1
    ? roomState.myThemePart1 || 'Crie algo incrivelmente maluco!'
    : roomState.myPart2Assignment?.bottomTheme || 'Complete o corpo com algo bizarro!';

  // Reset submitted state when phase changes
  useEffect(() => {
    setHasSubmitted(false);
    setLastSubmittedImage(null);
  }, [roomState.state, roomState.currentRound]);

  // Tick sound effect on last 5 seconds
  useEffect(() => {
    if (roomState.timerSeconds <= 5 && roomState.timerSeconds > 0) {
      sounds.playTick();
    } else if (roomState.timerSeconds === 0) {
      sounds.playTimeUp();
    }
  }, [roomState.timerSeconds]);

  const handleSubmit = (dataUrl: string) => {
    setHasSubmitted(true);
    setLastSubmittedImage(dataUrl);
    onSubmitDrawing(dataUrl);
  };

  const timerColor =
    roomState.timerSeconds <= 10
      ? 'text-rose-400 bg-rose-500/20 border-rose-500/40 animate-pulse'
      : roomState.timerSeconds <= 20
      ? 'text-amber-400 bg-amber-500/20 border-amber-500/40'
      : 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Top Header Bar: Round, Timer, Submissions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Round & Mode indicator */}
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <span>Rodada {roomState.currentRound} de {roomState.totalRounds}</span>
            <span>·</span>
            <span>{isPart1 ? 'Etapa 1: Cabeça / Tronco' : 'Etapa 2: Pernas / Base'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-fredoka text-white">
            {isPart1 ? 'Desenhe a Parte Superior!' : 'O Que é Isso?! Complete o Personagem!'}
          </h2>
        </div>

        {/* Timer & Submissions status */}
        <div className="flex items-center gap-3">
          {/* Submissions counter */}
          <div className="bg-slate-800/80 px-3 py-2 rounded-2xl border border-slate-700 text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Prontos</span>
            <span className="text-sm font-black text-white">
              {roomState.submittedCount} / {roomState.players.length}
            </span>
          </div>

          {/* Countdown Clock */}
          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 font-mono font-black text-2xl ${timerColor}`}>
            <Clock className="w-5 h-5" />
            <span>{roomState.timerSeconds}s</span>
          </div>
        </div>
      </div>

      {/* Prominent Theme Card Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border border-amber-500/40 rounded-3xl p-4 sm:p-5 text-center shadow-lg relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isPart1 ? 'Seu Desafio Secreto' : 'Novo Desafio para a Parte de Baixo'}</span>
        </div>
        <div className="text-xl sm:text-2xl md:text-3xl font-black text-white font-fredoka drop-shadow-md">
          "{currentTheme}"
        </div>
        {!isPart1 && roomState.myPart2Assignment && (
          <div className="mt-2 text-xs text-slate-400 font-medium">
            (O topo recebido era: <span className="text-amber-300 font-semibold">{roomState.myPart2Assignment.topTheme}</span>)
          </div>
        )}
      </div>

      {/* Canvas Area or Waiting Card */}
      {hasSubmitted ? (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md max-w-[640px] mx-auto space-y-4">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black font-fredoka text-white">
            Desenho Enviado com Sucesso!
          </h3>
          <p className="text-sm text-slate-300 max-w-sm mx-auto">
            Aguardando os outros artistas terminarem seus rabiscos ou o tempo acabar...
          </p>

          {lastSubmittedImage && (
            <div className="w-48 aspect-[600/350] mx-auto rounded-xl overflow-hidden border border-slate-700 shadow-md">
              <img src={lastSubmittedImage} alt="Seu desenho" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="text-xs text-slate-400 font-medium">
            ⏳ Tempo restante: {roomState.timerSeconds}s
          </div>
        </div>
      ) : (
        <DrawingCanvas
          partType={isPart1 ? 'top' : 'bottom'}
          initialTopDrawing={isPart1 ? undefined : roomState.myPart2Assignment?.topDrawing}
          onSubmit={handleSubmit}
          disabled={hasSubmitted}
        />
      )}
    </div>
  );
};
