import { Timestamp } from 'firebase/firestore';

// User Types
export interface User {
  id: string;
  displayName: string;
  email?: string;
  avatar?: string;
  avatarUrl?: string; // Firebase Storage URL when avatar === 'custom'
  isGuest: boolean;
  gamesPlayed: number;
  totalWins: number;
  totalPoints: number;
  createdAt: Timestamp;
}

export interface GuestUser {
  id: string;
  displayName: string;
  avatar: string;
  isGuest: true;
}

// Room Types
export type RoomStatus = 'lobby' | 'adding_songs' | 'playing' | 'reveal' | 'finished';
export type PlaybackMode = 'host_only' | 'all_players';

export interface RoomSettings {
  songsPerPlayer: number;
  playbackDuration: number; // in seconds: 30, 60, or 0 for full song
  votingTime: number; // in seconds
  playbackMode: PlaybackMode;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  settings: RoomSettings;
  currentSongIndex: number;
  shuffledSongIds?: string[]; // Song IDs in shuffled order for the game
  votingActive?: boolean; // Whether voting is currently active (synced across clients)
  playbackStarted?: boolean; // Whether video player should render (ads may play)
  musicPlaying?: boolean; // Whether actual music should play (after all ready, synced start)
  createdAt: Timestamp;
}

// Player Types
export interface Player {
  id: string;
  name: string;
  avatar: string;
  avatarUrl?: string; // Firebase Storage URL when avatar === 'custom'
  isHost: boolean;
  score: number;
  streak: number;
  joinedAt: Timestamp;
  isReady: boolean;
  readyForSong?: boolean; // Video loaded and ready
  contentPlaying?: boolean; // Actual music content is playing (after ads)
}

// Song Types
export interface Song {
  id: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  addedBy: string;
  played: boolean;
  peakStartTime?: number; // Most Replayed timestamp in seconds
  duration?: number; // Video duration in seconds
}

// Vote Types
export interface Vote {
  playerId: string;
  songId: string;
  votedFor: string;
  timestamp: Timestamp;
  correct?: boolean;
  points?: number;
  responseTime?: number; // ms from song start to vote
}

// Game State Types
export interface GameState {
  currentSong: Song | null;
  currentSongIndex: number;
  totalSongs: number;
  votingStartTime: number | null;
  votingEndTime: number | null;
  isRevealing: boolean;
  revealedPlayerId: string | null;
}

// YouTube Types
export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: string;
}

export interface HeatmapMarker {
  startMillis: number;
  endMillis: number;
  intensityScoreNormalized: number;
}

// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  Auth: undefined;
  CreateRoom: undefined;
  JoinRoom: { code?: string };
  Lobby: { roomId: string };
  AddSongs: { roomId: string };
  Game: { roomId: string };
  Results: { roomId: string };
  Profile: undefined;
  EditProfile: undefined;
  QRScanner: undefined;
};

// Score Calculation
export interface ScoreBreakdown {
  basePoints: number;
  speedBonus: number;
  streakBonus: number;
  total: number;
}

// Avatar options
export const AVATARS = [
  'avatar_1',
  'avatar_2',
  'avatar_3',
  'avatar_4',
  'avatar_5',
  'avatar_6',
  'avatar_7',
  'avatar_8',
] as const;

export type AvatarType = typeof AVATARS[number];

// Emoji avatars (used as fallback)
export const AVATAR_EMOJIS: Record<string, string> = {
  avatar_1: '🎸',
  avatar_2: '🎤',
  avatar_3: '🎹',
  avatar_4: '🥁',
  avatar_5: '🎺',
  avatar_6: '🎻',
  avatar_7: '🎷',
  avatar_8: '🎵',
};
