import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json({ limit: '15mb' }));

// --- GAME DATA & THEMES ---
const TOP_THEMES = [
  'Um astronauta vampiro tomando suco',
  'Um gato ninja com óculos 3D comendo pizza',
  'Um monstro fofo com três olhos e dentes de ouro',
  'Um mago elétrico furioso com barba de nuvem',
  'Um robô confeiteiro estressado decorando bolo',
  'Um dinossauro influencer gravando stories',
  'Um pirata zumbi com papagaio mecânico',
  'Uma girafa roqueira com jaqueta de couro e moicano',
  'Um alienígena de smoking com cabeça de lâmpada',
  'Um super-herói idoso e muito sonolento',
  'Um unicórnio boxeador com luvas brilhantes',
  'Um chef de cozinha que na verdade é um rato gigante',
  'Um fantasma motoqueiro com óculos escuros',
  'Um coelho ciborgue futurista atirando laser',
  'Um urso polar detetive com sobretudo e cachimbo de bolhas',
  'Um pato imperador da galáxia com coroa de cristal',
  'Um leão cantor de ópera dramático',
  'Um palhaço cibernético com sorriso misterioso',
  'Um cacto mexicano usando sombrero e bigode chique',
  'Um cachorro astronauta com capacete de aquário',
  'Um bicho-preguiça skatista radical',
  'Um viking moderno com fone de ouvido gamer',
  'Um dragão bebê espirrando arco-íris',
  'Um polvo barista concentrado fazendo café',
];

const BOTTOM_THEMES = [
  'Pernas de polvo gigante com botas de cowboy',
  'Corpo de trator a vapor soltando fumaça preta',
  'Pernas de bailarina em patins fluorescentes',
  'Cauda de sereia brilhante equilibrada num skate',
  'Pernas minúsculas de galinha usando meias listradas',
  'Corpo de gelatina quicando com tênis de corrida neon',
  'Propulsores de foguete a jato com chamas coloridas',
  'Pernas de aranha robótica com rodinhas de carrinho',
  'Corpo de cobra gigante enrolada numa mola maluca',
  'Pernas musculosas de fisiculturista com meia de bolinha',
  'Cauda de dragão brilhante com patinete elétrico',
  'Um monociclo enferrujado com suspensão a gás',
  'Centopeia com 16 pés usando chinelos de dedo',
  'Pernas de pato gigantescas dançando samba',
  'Tronco de árvore ambulante com raízes musculosas',
  'Lagarta gigante mecânica estilo tanque de guerra',
  'Pernas elásticas de mola saltitante',
  'Vassoura voadora turbinada com rodinhas de supermercado',
  'Pernas de flamingo dourado andando na corda bamba',
  'Nuvem mágica voadora com raios e trovões',
];

const BOT_AVATARS = ['robot', 'alien', 'cat', 'ninja', 'monster', 'duck'];
const BOT_NAMES = ['RobôPicasso', 'ZecaRabisco', 'DonaTinta', 'PixelBot', 'RabiscoTron', 'ArteFrita'];

interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isBot?: boolean;
  score: number;
}

interface DrawingSubmission {
  playerId: string;
  theme: string;
  dataUrl: string;
}

interface CombinedArtwork {
  id: string;
  roundIndex: number;
  top: {
    playerId: string;
    playerName: string;
    playerAvatar: string;
    theme: string;
    dataUrl: string;
  };
  bottom: {
    playerId: string;
    playerName: string;
    playerAvatar: string;
    theme: string;
    dataUrl: string;
  };
  reactions: Record<string, number>;
  votes: Record<string, 'funny' | 'art' | 'chaos'>; // voterId -> category
}

type RoomState = 'LOBBY' | 'DRAWING_PART1' | 'DRAWING_PART2' | 'REVEAL_SHOWCASE' | 'PODIUM';

interface Room {
  code: string;
  name: string;
  isPublic: boolean;
  maxPlayers: number;
  mode: 'misturado';
  totalRounds: number;
  currentRound: number;
  drawDuration: number; // in seconds
  state: RoomState;
  createdAt: number;
  players: Map<string, Player>;
  sockets: Map<string, WebSocket>;
  // Round state
  assignedPart1Themes: Map<string, string>; // playerId -> theme
  part1Submissions: Map<string, DrawingSubmission>;
  part2Assignments: Map<string, {
    topOwnerId: string;
    topTheme: string;
    topDrawing: string;
    bottomTheme: string;
  }>;
  part2Submissions: Map<string, DrawingSubmission>;
  artworks: CombinedArtwork[];
  currentRevealIndex: number;
  timerSeconds: number;
  timerInterval?: NodeJS.Timeout;
}

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateSimpleBotDrawing(part: 'top' | 'bottom'): string {
  // Generate a fun abstract SVG converted to dataURL
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
  const c1 = getRandomItem(colors);
  const c2 = getRandomItem(colors);
  const c3 = getRandomItem(colors);
  
  let svg = '';
  if (part === 'top') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350">
      <rect width="600" height="350" fill="#ffffff" />
      <circle cx="300" cy="150" r="90" fill="${c1}" stroke="#1e293b" stroke-width="8" />
      <circle cx="270" cy="140" r="14" fill="#ffffff" stroke="#1e293b" stroke-width="5" />
      <circle cx="330" cy="140" r="14" fill="#ffffff" stroke="#1e293b" stroke-width="5" />
      <circle cx="272" cy="140" r="6" fill="#0f172a" />
      <circle cx="332" cy="140" r="6" fill="#0f172a" />
      <path d="M 260 190 Q 300 230 340 190" fill="none" stroke="#1e293b" stroke-width="7" stroke-linecap="round" />
      <path d="M 230 70 L 300 20 L 370 70 Z" fill="${c2}" stroke="#1e293b" stroke-width="6" />
      <path d="M 240 240 L 240 350" stroke="#1e293b" stroke-width="12" stroke-linecap="round" />
      <path d="M 360 240 L 360 350" stroke="#1e293b" stroke-width="12" stroke-linecap="round" />
      <circle cx="300" cy="290" r="25" fill="${c3}" stroke="#1e293b" stroke-width="6" />
    </svg>`;
  } else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350">
      <rect width="600" height="350" fill="#ffffff" />
      <path d="M 240 0 L 240 120 Q 200 260 160 310" stroke="#1e293b" stroke-width="14" fill="none" stroke-linecap="round" />
      <path d="M 360 0 L 360 120 Q 400 260 440 310" stroke="#1e293b" stroke-width="14" fill="none" stroke-linecap="round" />
      <ellipse cx="140" cy="315" rx="45" ry="22" fill="${c1}" stroke="#1e293b" stroke-width="7" />
      <ellipse cx="460" cy="315" rx="45" ry="22" fill="${c1}" stroke="#1e293b" stroke-width="7" />
      <circle cx="300" cy="160" r="50" fill="${c2}" stroke="#1e293b" stroke-width="7" />
      <path d="M 270 160 Q 300 200 330 160" stroke="#1e293b" stroke-width="6" fill="none" />
    </svg>`;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function broadcastRoom(room: Room, event: string, payload: any) {
  const message = JSON.stringify({ event, data: payload });
  room.sockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

function getSanitizedRoomState(room: Room, forPlayerId?: string) {
  const playersList = Array.from(room.players.values());
  const myAssignedPart2 = forPlayerId ? room.part2Assignments.get(forPlayerId) : undefined;
  const myThemePart1 = forPlayerId ? room.assignedPart1Themes.get(forPlayerId) : undefined;
  
  return {
    code: room.code,
    name: room.name,
    isPublic: room.isPublic,
    maxPlayers: room.maxPlayers,
    mode: room.mode,
    totalRounds: room.totalRounds,
    currentRound: room.currentRound,
    drawDuration: room.drawDuration,
    state: room.state,
    players: playersList,
    timerSeconds: room.timerSeconds,
    // Turn specific info
    myThemePart1,
    myPart2Assignment: myAssignedPart2 ? {
      topDrawing: myAssignedPart2.topDrawing,
      topTheme: myAssignedPart2.topTheme,
      bottomTheme: myAssignedPart2.bottomTheme,
    } : null,
    artworksCount: room.artworks.length,
    currentRevealIndex: room.currentRevealIndex,
    currentArtwork: room.artworks[room.currentRevealIndex] || null,
    allArtworks: room.state === 'PODIUM' ? room.artworks : [],
    submittedCount: room.state === 'DRAWING_PART1' 
      ? room.part1Submissions.size 
      : room.state === 'DRAWING_PART2' 
      ? room.part2Submissions.size 
      : 0,
  };
}

function syncRoomState(room: Room) {
  room.sockets.forEach((ws, playerId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: 'ROOM_STATE',
        data: getSanitizedRoomState(room, playerId),
      }));
    }
  });
}

function clearRoomTimer(room: Room) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = undefined;
  }
}

function startPart1(room: Room) {
  clearRoomTimer(room);
  room.state = 'DRAWING_PART1';
  room.timerSeconds = room.drawDuration;
  room.part1Submissions.clear();
  room.part2Assignments.clear();
  room.part2Submissions.clear();
  room.assignedPart1Themes.clear();

  // Assign random themes to all players
  room.players.forEach((player) => {
    room.assignedPart1Themes.set(player.id, getRandomItem(TOP_THEMES));
  });

  syncRoomState(room);

  // Timer loop
  room.timerInterval = setInterval(() => {
    room.timerSeconds--;
    if (room.timerSeconds <= 0) {
      clearRoomTimer(room);
      handlePart1Finished(room);
    } else {
      broadcastRoom(room, 'TIMER_TICK', { timerSeconds: room.timerSeconds });
    }
  }, 1000);
}

function handlePart1Finished(room: Room) {
  clearRoomTimer(room);
  
  // Fill missing submissions with placeholder/bot drawings
  room.players.forEach((player) => {
    if (!room.part1Submissions.has(player.id)) {
      const theme = room.assignedPart1Themes.get(player.id) || getRandomItem(TOP_THEMES);
      room.part1Submissions.set(player.id, {
        playerId: player.id,
        theme,
        dataUrl: generateSimpleBotDrawing('top'),
      });
    }
  });

  // Now assign drawings for Part 2!
  // In What the Hell, player B receives player A's top drawing + a new bottom theme!
  const playerIds = Array.from(room.players.keys());
  
  if (playerIds.length === 1) {
    // Solo player mode: gets their own top, or bot's top
    const soloId = playerIds[0];
    const topSub = room.part1Submissions.get(soloId)!;
    room.part2Assignments.set(soloId, {
      topOwnerId: soloId,
      topTheme: topSub.theme,
      topDrawing: topSub.dataUrl,
      bottomTheme: getRandomItem(BOTTOM_THEMES),
    });
  } else {
    // Derangement: rotate players by 1 or more positions so nobody gets their own drawing
    const shuffled = [...playerIds];
    // Rotate by 1
    const rotated = [...shuffled.slice(1), shuffled[0]];
    
    for (let i = 0; i < shuffled.length; i++) {
      const drawerForPart2 = shuffled[i];
      const topOwnerId = rotated[i];
      const topSub = room.part1Submissions.get(topOwnerId)!;
      
      room.part2Assignments.set(drawerForPart2, {
        topOwnerId,
        topTheme: topSub.theme,
        topDrawing: topSub.dataUrl,
        bottomTheme: getRandomItem(BOTTOM_THEMES),
      });
    }
  }

  startPart2(room);
}

function startPart2(room: Room) {
  clearRoomTimer(room);
  room.state = 'DRAWING_PART2';
  room.timerSeconds = room.drawDuration;
  room.part2Submissions.clear();

  syncRoomState(room);

  room.timerInterval = setInterval(() => {
    room.timerSeconds--;
    if (room.timerSeconds <= 0) {
      clearRoomTimer(room);
      handlePart2Finished(room);
    } else {
      broadcastRoom(room, 'TIMER_TICK', { timerSeconds: room.timerSeconds });
    }
  }, 1000);
}

function handlePart2Finished(room: Room) {
  clearRoomTimer(room);

  // Fill missing part 2 submissions
  room.players.forEach((player) => {
    if (!room.part2Submissions.has(player.id)) {
      const assignment = room.part2Assignments.get(player.id);
      const theme = assignment?.bottomTheme || getRandomItem(BOTTOM_THEMES);
      room.part2Submissions.set(player.id, {
        playerId: player.id,
        theme,
        dataUrl: generateSimpleBotDrawing('bottom'),
      });
    }
  });

  // Assemble the completed Artworks!
  room.artworks = [];
  room.part2Assignments.forEach((assignment, drawerPart2Id) => {
    const topPlayer = room.players.get(assignment.topOwnerId);
    const bottomPlayer = room.players.get(drawerPart2Id);
    const bottomSub = room.part2Submissions.get(drawerPart2Id);

    if (topPlayer && bottomPlayer && bottomSub) {
      room.artworks.push({
        id: `art_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        roundIndex: room.currentRound,
        top: {
          playerId: topPlayer.id,
          playerName: topPlayer.name,
          playerAvatar: topPlayer.avatar,
          theme: assignment.topTheme,
          dataUrl: assignment.topDrawing,
        },
        bottom: {
          playerId: bottomPlayer.id,
          playerName: bottomPlayer.name,
          playerAvatar: bottomPlayer.avatar,
          theme: assignment.bottomTheme,
          dataUrl: bottomSub.dataUrl,
        },
        reactions: {},
        votes: {},
      });
    }
  });

  room.currentRevealIndex = 0;
  room.state = 'REVEAL_SHOWCASE';
  syncRoomState(room);
}

// --- REST ROUTES ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

app.get('/api/rooms', (req, res) => {
  const publicRooms = Array.from(rooms.values())
    .filter((r) => r.isPublic && r.state === 'LOBBY')
    .map((r) => ({
      code: r.code,
      name: r.name,
      playersCount: r.players.size,
      maxPlayers: r.maxPlayers,
      mode: r.mode,
      totalRounds: r.totalRounds,
    }));
  res.json(publicRooms);
});

// --- WEBSOCKET HANDLER ---
wss.on('connection', (ws) => {
  let currentRoomCode: string | null = null;
  let currentPlayerId: string | null = null;

  ws.on('message', (rawData) => {
    try {
      const message = JSON.parse(rawData.toString());
      const { event, data } = message;

      switch (event) {
        case 'CREATE_ROOM': {
          const { playerName, playerAvatar, roomName, isPublic, maxPlayers, totalRounds, drawDuration } = data;
          const code = generateRoomCode();
          const playerId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          
          const room: Room = {
            code,
            name: roomName || `Sala de ${playerName}`,
            isPublic: isPublic ?? true,
            maxPlayers: Math.min(12, Math.max(2, maxPlayers || 8)),
            mode: 'misturado',
            totalRounds: Math.min(5, Math.max(1, totalRounds || 2)),
            currentRound: 1,
            drawDuration: drawDuration || 60,
            state: 'LOBBY',
            createdAt: Date.now(),
            players: new Map(),
            sockets: new Map(),
            assignedPart1Themes: new Map(),
            part1Submissions: new Map(),
            part2Assignments: new Map(),
            part2Submissions: new Map(),
            artworks: [],
            currentRevealIndex: 0,
            timerSeconds: 0,
          };

          const hostPlayer: Player = {
            id: playerId,
            name: (playerName || 'Jogador').trim(),
            avatar: playerAvatar || 'cat',
            isHost: true,
            isReady: true,
            score: 0,
          };

          room.players.set(playerId, hostPlayer);
          room.sockets.set(playerId, ws);
          rooms.set(code, room);

          currentRoomCode = code;
          currentPlayerId = playerId;

          ws.send(JSON.stringify({
            event: 'ROOM_JOINED',
            data: {
              roomCode: code,
              playerId,
              isHost: true,
            },
          }));

          syncRoomState(room);
          break;
        }

        case 'JOIN_ROOM': {
          const { roomCode, playerName, playerAvatar } = data;
          const cleanCode = (roomCode || '').toUpperCase().trim();
          const room = rooms.get(cleanCode);

          if (!room) {
            ws.send(JSON.stringify({ event: 'ERROR', data: { message: 'Sala não encontrada! Verifique o código.' } }));
            return;
          }

          if (room.players.size >= room.maxPlayers) {
            ws.send(JSON.stringify({ event: 'ERROR', data: { message: 'A sala está cheia!' } }));
            return;
          }

          const playerId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const newPlayer: Player = {
            id: playerId,
            name: (playerName || `Jogador ${room.players.size + 1}`).trim(),
            avatar: playerAvatar || 'duck',
            isHost: room.players.size === 0,
            isReady: false,
            score: 0,
          };

          room.players.set(playerId, newPlayer);
          room.sockets.set(playerId, ws);
          currentRoomCode = cleanCode;
          currentPlayerId = playerId;

          ws.send(JSON.stringify({
            event: 'ROOM_JOINED',
            data: {
              roomCode: cleanCode,
              playerId,
              isHost: newPlayer.isHost,
            },
          }));

          syncRoomState(room);
          break;
        }

        case 'ADD_BOT': {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.state !== 'LOBBY') return;
          const player = room.players.get(currentPlayerId);
          if (!player?.isHost) return;

          if (room.players.size >= room.maxPlayers) return;

          const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
          const bot: Player = {
            id: botId,
            name: getRandomItem(BOT_NAMES) + ' (BOT)',
            avatar: getRandomItem(BOT_AVATARS),
            isHost: false,
            isReady: true,
            isBot: true,
            score: 0,
          };

          room.players.set(botId, bot);
          syncRoomState(room);
          break;
        }

        case 'REMOVE_BOT': {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.state !== 'LOBBY') return;
          const player = room.players.get(currentPlayerId);
          if (!player?.isHost) return;

          const bot = Array.from(room.players.values()).find(p => p.isBot);
          if (bot) {
            room.players.delete(bot.id);
            syncRoomState(room);
          }
          break;
        }

        case 'UPDATE_SETTINGS': {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(currentPlayerId);
          if (!player?.isHost) return;

          if (data.totalRounds) room.totalRounds = Math.min(5, Math.max(1, data.totalRounds));
          if (data.drawDuration) room.drawDuration = Math.min(180, Math.max(30, data.drawDuration));
          if (data.name) room.name = data.name;
          if (data.isPublic !== undefined) room.isPublic = data.isPublic;

          syncRoomState(room);
          break;
        }

        case 'TOGGLE_READY': {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(currentPlayerId);
          if (!player) return;

          player.isReady = !player.isReady;
          syncRoomState(room);
          break;
        }

        case 'START_GAME': {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(currentPlayerId);
          if (!player?.isHost) return;

          room.currentRound = 1;
          startPart1(room);
          break;
        }

        case 'SUBMIT_PART1': {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.state !== 'DRAWING_PART1') return;

          const theme = room.assignedPart1Themes.get(currentPlayerId) || 'Parte Superior';
          room.part1Submissions.set(currentPlayerId, {
            playerId: currentPlayerId,
            theme,
            dataUrl: data.dataUrl,
          });

          // Check if all players (or bots) submitted
          const realPlayersCount = Array.from(room.players.values()).filter(p => !p.isBot).length;
          const realSubmissions = Array.from(room.part1Submissions.keys()).filter(id => !room.players.get(id)?.isBot).length;

          broadcastRoom(room, 'SUBMISSION_UPDATE', {
            submittedCount: room.part1Submissions.size,
            totalCount: room.players.size,
          });

          if (realSubmissions >= realPlayersCount) {
            handlePart1Finished(room);
          }
          break;
        }

        case 'SUBMIT_PART2': {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.state !== 'DRAWING_PART2') return;

          const assignment = room.part2Assignments.get(currentPlayerId);
          const theme = assignment?.bottomTheme || 'Parte Inferior';
          room.part2Submissions.set(currentPlayerId, {
            playerId: currentPlayerId,
            theme,
            dataUrl: data.dataUrl,
          });

          const realPlayersCount = Array.from(room.players.values()).filter(p => !p.isBot).length;
          const realSubmissions = Array.from(room.part2Submissions.keys()).filter(id => !room.players.get(id)?.isBot).length;

          broadcastRoom(room, 'SUBMISSION_UPDATE', {
            submittedCount: room.part2Submissions.size,
            totalCount: room.players.size,
          });

          if (realSubmissions >= realPlayersCount) {
            handlePart2Finished(room);
          }
          break;
        }

        case 'REACTION': {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.state !== 'REVEAL_SHOWCASE') return;

          const currentArt = room.artworks[room.currentRevealIndex];
          if (currentArt && data.emoji) {
            currentArt.reactions[data.emoji] = (currentArt.reactions[data.emoji] || 0) + 1;
            broadcastRoom(room, 'REACTION_BURST', {
              emoji: data.emoji,
              playerId: currentPlayerId,
              reactions: currentArt.reactions,
            });
          }
          break;
        }

        case 'VOTE_ARTWORK': {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.state !== 'REVEAL_SHOWCASE') return;

          const currentArt = room.artworks[room.currentRevealIndex];
          if (currentArt && data.badge) {
            currentArt.votes[currentPlayerId] = data.badge; // 'funny' | 'art' | 'chaos'
            syncRoomState(room);
          }
          break;
        }

        case 'NEXT_REVEAL': {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.state !== 'REVEAL_SHOWCASE') return;
          const player = room.players.get(currentPlayerId);
          if (!player?.isHost) return;

          if (room.currentRevealIndex < room.artworks.length - 1) {
            room.currentRevealIndex++;
            syncRoomState(room);
          } else {
            // All artworks revealed! Check if there is next round
            if (room.currentRound < room.totalRounds) {
              room.currentRound++;
              startPart1(room);
            } else {
              // Final Podium!
              room.state = 'PODIUM';
              syncRoomState(room);
            }
          }
          break;
        }

        case 'RESTART_GAME': {
          if (!currentRoomCode || !currentPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(currentPlayerId);
          if (!player?.isHost) return;

          clearRoomTimer(room);
          room.state = 'LOBBY';
          room.currentRound = 1;
          room.artworks = [];
          room.currentRevealIndex = 0;
          syncRoomState(room);
          break;
        }

        case 'LEAVE_ROOM': {
          if (currentRoomCode && currentPlayerId) {
            const room = rooms.get(currentRoomCode);
            if (room) {
              room.players.delete(currentPlayerId);
              room.sockets.delete(currentPlayerId);
              if (room.players.size === 0) {
                clearRoomTimer(room);
                rooms.delete(currentRoomCode);
              } else {
                // If host left, elect new host
                const remaining = Array.from(room.players.values());
                if (!remaining.some(p => p.isHost)) {
                  remaining[0].isHost = true;
                }
                syncRoomState(room);
              }
            }
          }
          currentRoomCode = null;
          currentPlayerId = null;
          break;
        }
      }
    } catch (err) {
      console.error('WS Error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomCode && currentPlayerId) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        room.sockets.delete(currentPlayerId);
        // Only remove player if in lobby
        if (room.state === 'LOBBY') {
          room.players.delete(currentPlayerId);
          if (room.players.size === 0) {
            clearRoomTimer(room);
            rooms.delete(currentRoomCode);
          } else {
            const remaining = Array.from(room.players.values());
            if (!remaining.some(p => p.isHost)) {
              remaining[0].isHost = true;
            }
            syncRoomState(room);
          }
        }
      }
    }
  });
});

// Vite or Static Assets handler
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`DRAWVERSE server running on port ${PORT}`);
  });
}

startServer();
