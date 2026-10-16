import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Paintbrush, 
  Eraser, 
  PaintBucket, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Eye, 
  EyeOff,
  Maximize2
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface DrawingCanvasProps {
  partType: 'top' | 'bottom';
  initialTopDrawing?: string; // Passed when drawing part 2
  onSubmit: (dataUrl: string) => void;
  disabled?: boolean;
}

const PALETTE = [
  '#000000', '#ffffff', '#4b5563', '#dc2626', '#ea580c', '#f59e0b',
  '#16a34a', '#059669', '#0284c7', '#2563eb', '#7c3aed', '#c026d3',
  '#db2777', '#854d0e', '#78716c', '#06b6d4', '#84cc16', '#fb7185'
];

const BRUSH_SIZES = [
  { label: 'P', size: 4 },
  { label: 'M', size: 8 },
  { label: 'G', size: 16 },
  { label: 'GG', size: 28 },
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  partType,
  initialTopDrawing,
  onSubmit,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const [color, setColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(8);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [showTopReference, setShowTopReference] = useState<boolean>(true);
  const isDrawing = useRef<boolean>(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 350;

  // Initialize canvas with white background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Save initial state to history
    const initialData = canvas.toDataURL();
    setHistory([initialData]);
    setHistoryIndex(0);
  }, []);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(data);
      if (next.length > 25) next.shift(); // limit history
      return next;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 24));
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex <= 0 || disabled) return;
    sounds.playPop();
    const newIndex = historyIndex - 1;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(img, 0, 0);
      setHistoryIndex(newIndex);
    };
    img.src = history[newIndex];
  };

  const redo = () => {
    if (historyIndex >= history.length - 1 || disabled) return;
    sounds.playPop();
    const newIndex = historyIndex + 1;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(img, 0, 0);
      setHistoryIndex(newIndex);
    };
    img.src = history[newIndex];
  };

  const clearCanvas = () => {
    if (disabled) return;
    sounds.playPop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    saveState();
  };

  // Convert client pointer to canvas coordinates
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Flood fill algorithm
  const performFloodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = Math.floor(startX);
    const y = Math.floor(startY);
    if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) return;

    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const data = imageData.data;

    // Target color to replace
    const startIndex = (y * CANVAS_WIDTH + x) * 4;
    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];
    const targetA = data[startIndex + 3];

    // Parse fill color
    const tempDiv = document.createElement('div');
    tempDiv.style.color = color;
    document.body.appendChild(tempDiv);
    const computed = window.getComputedStyle(tempDiv).color;
    document.body.removeChild(tempDiv);
    const match = computed.match(/\d+/g);
    if (!match) return;

    const fillR = parseInt(match[0], 10);
    const fillG = parseInt(match[1], 10);
    const fillB = parseInt(match[2], 10);
    const fillA = 255;

    // Check if clicked color is already fill color
    if (
      Math.abs(targetR - fillR) < 5 &&
      Math.abs(targetG - fillG) < 5 &&
      Math.abs(targetB - fillB) < 5 &&
      Math.abs(targetA - fillA) < 5
    ) {
      return;
    }

    const colorMatch = (idx: number) => {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      return (
        Math.abs(r - targetR) <= 25 &&
        Math.abs(g - targetG) <= 25 &&
        Math.abs(b - targetB) <= 25 &&
        Math.abs(a - targetA) <= 25
      );
    };

    const pixelStack: [number, number][] = [[x, y]];
    const seen = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);

    while (pixelStack.length > 0) {
      const [curX, curY] = pixelStack.pop()!;
      let pY = curY;
      let pX = curX;
      let pIdx = (pY * CANVAS_WIDTH + pX) * 4;

      while (pY >= 0 && colorMatch(pIdx)) {
        pY--;
        pIdx -= CANVAS_WIDTH * 4;
      }
      pIdx += CANVAS_WIDTH * 4;
      pY++;

      let reachLeft = false;
      let reachRight = false;

      while (pY < CANVAS_HEIGHT && colorMatch(pIdx)) {
        data[pIdx] = fillR;
        data[pIdx + 1] = fillG;
        data[pIdx + 2] = fillB;
        data[pIdx + 3] = fillA;
        seen[pY * CANVAS_WIDTH + pX] = 1;

        if (pX > 0) {
          if (colorMatch(pIdx - 4)) {
            if (!reachLeft) {
              pixelStack.push([pX - 1, pY]);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }

        if (pX < CANVAS_WIDTH - 1) {
          if (colorMatch(pIdx + 4)) {
            if (!reachRight) {
              pixelStack.push([pX + 1, pY]);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }

        pY++;
        pIdx += CANVAS_WIDTH * 4;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    saveState();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const coords = getCanvasCoords(e);

    if (tool === 'fill') {
      sounds.playPop();
      performFloodFill(coords.x, coords.y);
      return;
    }

    isDrawing.current = true;
    lastPos.current = coords;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.fill();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || disabled || tool === 'fill') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !lastPos.current) return;

    const coords = getCanvasCoords(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPos.current = coords;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPos.current = null;
    saveState();
  };

  // Method to get data URL and trigger submit
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    sounds.playWhoosh();
    onSubmit(canvas.toDataURL('image/png'));
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* If Part 2, show the top half reference with playful "Costura de Conexão" seam */}
      {partType === 'bottom' && initialTopDrawing && (
        <div className="w-full max-w-[640px] mb-2 bg-slate-900 rounded-t-2xl p-2 border border-b-0 border-indigo-500/30">
          <div className="flex items-center justify-between px-3 py-1 text-xs text-indigo-300 font-medium">
            <span className="flex items-center gap-1.5">
              <span>Topo desenhado pelo seu amigo</span>
            </span>
            <button
              onClick={() => setShowTopReference(!showTopReference)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-white px-2 py-0.5 rounded transition-colors"
            >
              {showTopReference ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showTopReference ? 'Ocultar Referência' : 'Mostrar Referência'}</span>
            </button>
          </div>

          {showTopReference && (
            <div className="relative w-full aspect-[600/220] bg-white rounded-xl overflow-hidden border border-slate-700 shadow-inner">
              <img
                src={initialTopDrawing}
                alt="Parte de cima"
                className="w-full h-full object-cover object-bottom"
              />
              <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" />
              <div className="absolute bottom-1 inset-x-0 flex items-center justify-center gap-2 text-[11px] font-bold text-amber-300 uppercase tracking-widest bg-slate-950/70 py-0.5">
                <span>✂️ Linha de Costura · Conecte seu desenho abaixo! ✂️</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Drawing Canvas Container */}
      <div className="relative w-full max-w-[640px] bg-slate-900/90 p-3 sm:p-4 rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-md">
        {/* Visual Seam Guides for Part 1 (Top Part) */}
        {partType === 'top' && (
          <div className="mb-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center text-xs text-amber-300">
            💡 <strong>Dica What The Hell:</strong> Desenhe o tronco/cabeça e faça as linhas descerem até o final para que o próximo jogador continue o corpo!
          </div>
        )}

        {/* Canvas Element with Responsive Aspect Ratio */}
        <div className="relative w-full aspect-[600/350] rounded-xl overflow-hidden shadow-inner bg-white touch-none">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`w-full h-full cursor-crosshair ${disabled ? 'pointer-events-none opacity-80' : ''}`}
            style={{ touchAction: 'none' }}
          />

          {/* Dotted seam indicators for Part 1 at bottom */}
          {partType === 'top' && (
            <div className="absolute bottom-0 inset-x-0 h-4 border-b-2 border-dashed border-red-500/60 pointer-events-none flex justify-between px-8 text-[9px] text-red-500 font-bold">
              <span>▼ Conexão esquerda ▼</span>
              <span className="bg-white/80 px-1 rounded">▼ COSTURA ▼</span>
              <span>▼ Conexão direita ▼</span>
            </div>
          )}

          {/* Dotted seam indicators for Part 2 at top */}
          {partType === 'bottom' && (
            <div className="absolute top-0 inset-x-0 h-4 border-t-2 border-dashed border-red-500/60 pointer-events-none flex justify-between px-8 text-[9px] text-red-500 font-bold">
              <span>▲ Conexão esquerda ▲</span>
              <span className="bg-white/80 px-1 rounded">▲ COSTURA ▲</span>
              <span>▲ Conexão direita ▲</span>
            </div>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="mt-4 flex flex-col gap-3">
          {/* Tools & Size Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Tool Selection */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => { sounds.playPop(); setTool('brush'); }}
                title="Pincel"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tool === 'brush' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Paintbrush className="w-4 h-4" />
                <span className="hidden sm:inline">Pincel</span>
              </button>

              <button
                type="button"
                onClick={() => { sounds.playPop(); setTool('fill'); }}
                title="Balde de Tinta"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tool === 'fill' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                <PaintBucket className="w-4 h-4" />
                <span className="hidden sm:inline">Preencher</span>
              </button>

              <button
                type="button"
                onClick={() => { sounds.playPop(); setTool('eraser'); }}
                title="Borracha"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tool === 'eraser' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eraser className="w-4 h-4" />
                <span className="hidden sm:inline">Borracha</span>
              </button>
            </div>

            {/* Brush Sizes */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              {BRUSH_SIZES.map((b) => (
                <button
                  key={b.size}
                  type="button"
                  onClick={() => { sounds.playPop(); setBrushSize(b.size); }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    brushSize === b.size
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span
                    className="rounded-full bg-current"
                    style={{ width: Math.max(3, b.size / 2.5), height: Math.max(3, b.size / 2.5) }}
                  />
                </button>
              ))}
            </div>

            {/* Undo / Redo / Clear */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={undo}
                disabled={historyIndex <= 0 || disabled}
                title="Desfazer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={historyIndex >= history.length - 1 || disabled}
                title="Refazer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={clearCanvas}
                disabled={disabled}
                title="Limpar Tudo"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/20 disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Color Palette Row */}
          <div className="flex items-center gap-1.5 flex-wrap justify-between p-2 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="flex items-center gap-1.5 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { sounds.playPop(); setColor(c); if (tool === 'eraser') setTool('brush'); }}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg transition-transform ${
                    color === c ? 'scale-115 ring-2 ring-amber-400 shadow-lg' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid #cbd5e1' : 'none' }}
                />
              ))}
            </div>

            {/* Custom Color Input */}
            <label className="relative flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer bg-gradient-to-tr from-pink-500 via-amber-400 to-cyan-400 shadow-md hover:scale-105 transition-transform" title="Cor Personalizada">
              <input
                type="color"
                value={color}
                onChange={(e) => { setColor(e.target.value); if (tool === 'eraser') setTool('brush'); }}
                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Done Button Bar */}
      <div className="mt-4 w-full max-w-[640px] flex justify-end">
        <button
          type="button"
          onClick={handleExport}
          disabled={disabled}
          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold rounded-xl shadow-lg hover:shadow-orange-500/25 active:scale-95 transition-all text-base disabled:opacity-50"
        >
          {disabled ? 'Desenho Enviado! Aguardando...' : 'Pronto! Concluir Desenho ✨'}
        </button>
      </div>
    </div>
  );
};
