export type RoomMode = 'misturado' | 'classic' | 'speed';

export type RoomPhase = 'LOBBY' | 'DRAWING_PART1' | 'DRAWING_PART2' | 'REVEAL_SHOWCASE' | 'PODIUM';

export interface Player {
  id: string;
  name: string;
  avatar: string; // preset ID or base64 data url
  isHost: boolean;
  isReady: boolean;
  isBot?: boolean;
  score: number;
}

export interface DrawingPart {
  playerId: string;
  playerName: string;
  playerAvatar: string;
  theme: string;
  dataUrl: string;
}

export interface CombinedArtwork {
  id: string;
  roundIndex: number;
  top: DrawingPart;
  bottom: DrawingPart;
  reactions: Record<string, number>;
  votes: Record<string, 'funny' | 'art' | 'chaos'>;
}

export interface RoomState {
  code: string;
  name: string;
  isPublic: boolean;
  maxPlayers: number;
  mode: RoomMode;
  totalRounds: number;
  currentRound: number;
  drawDuration: number;
  state: RoomPhase;
  players: Player[];
  timerSeconds: number;
  myThemePart1?: string;
  myPart2Assignment?: {
    topDrawing: string;
    topTheme: string;
    bottomTheme: string;
  } | null;
  artworksCount: number;
  currentRevealIndex: number;
  currentArtwork: CombinedArtwork | null;
  allArtworks: CombinedArtwork[];
  submittedCount: number;
}

export interface PublicRoomInfo {
  code: string;
  name: string;
  playersCount: number;
  maxPlayers: number;
  mode: RoomMode;
  totalRounds: number;
}
