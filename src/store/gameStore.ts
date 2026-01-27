import { create } from 'zustand';
import { Room, Player, Song, Vote, RoomSettings, RoomStatus } from '../types';
import { DownloadProgress } from '../services/audioDownloadService';

interface GameState {
  // Room state
  room: Room | null;
  players: Player[];
  songs: Song[];
  votes: Vote[];

  // Download state
  downloadProgress: Map<string, DownloadProgress>;
  audioUris: Map<string, string>; // songId -> localUri

  // Game state
  currentSongIndex: number;
  shuffledSongs: Song[];
  isPlaying: boolean;
  votingStartTime: number | null;
  hasVoted: boolean;
  myVote: string | null;

  // Reveal state
  isRevealing: boolean;
  revealedSong: Song | null;
  roundResults: {
    playerId: string;
    correct: boolean;
    points: number;
  }[];

  // Actions - Room
  setRoom: (room: Room | null) => void;
  setPlayers: (players: Player[]) => void;
  setSongs: (songs: Song[]) => void;
  setVotes: (votes: Vote[]) => void;
  updateRoomStatus: (status: RoomStatus) => void;

  // Actions - Game
  startGame: (shuffledSongs: Song[]) => void;
  setCurrentSongIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setVotingStartTime: (time: number | null) => void;
  submitVote: (votedFor: string) => void;
  clearVote: () => void;

  // Actions - Reveal
  startReveal: (song: Song) => void;
  setRoundResults: (results: { playerId: string; correct: boolean; points: number }[]) => void;
  endReveal: () => void;

  // Actions - Download
  setDownloadProgress: (progress: Map<string, DownloadProgress>) => void;
  setAudioUri: (songId: string, uri: string) => void;
  clearDownloads: () => void;

  // Actions - Reset
  resetGame: () => void;
  leaveRoom: () => void;

  // Computed
  getCurrentSong: () => Song | null;
  getPlayerById: (id: string) => Player | undefined;
  isHost: (playerId: string) => boolean;
  getMyPlayerSongs: (playerId: string) => Song[];
  getSortedPlayers: () => Player[];
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  room: null,
  players: [],
  songs: [],
  votes: [],
  downloadProgress: new Map(),
  audioUris: new Map(),
  currentSongIndex: -1,
  shuffledSongs: [],
  isPlaying: false,
  votingStartTime: null,
  hasVoted: false,
  myVote: null,
  isRevealing: false,
  revealedSong: null,
  roundResults: [],

  // Room actions
  setRoom: (room) => set({ room }),

  setPlayers: (players) => set({ players }),

  setSongs: (songs) => set({ songs }),

  setVotes: (votes) => set({ votes }),

  updateRoomStatus: (status) =>
    set((state) => ({
      room: state.room ? { ...state.room, status } : null,
    })),

  // Game actions
  startGame: (shuffledSongs) =>
    set({
      shuffledSongs,
      currentSongIndex: 0,
      isPlaying: true,
      hasVoted: false,
      myVote: null,
    }),

  setCurrentSongIndex: (index) =>
    set({
      currentSongIndex: index,
      hasVoted: false,
      myVote: null,
      isRevealing: false,
      revealedSong: null,
      roundResults: [],
    }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setVotingStartTime: (votingStartTime) => set({ votingStartTime }),

  submitVote: (votedFor) =>
    set({
      hasVoted: true,
      myVote: votedFor,
    }),

  clearVote: () =>
    set({
      hasVoted: false,
      myVote: null,
    }),

  // Reveal actions
  startReveal: (song) =>
    set({
      isRevealing: true,
      revealedSong: song,
      isPlaying: false,
    }),

  setRoundResults: (roundResults) => set({ roundResults }),

  // Download actions
  setDownloadProgress: (downloadProgress) => set({ downloadProgress: new Map(downloadProgress) }),

  setAudioUri: (songId, uri) =>
    set((state) => {
      const newUris = new Map(state.audioUris);
      newUris.set(songId, uri);
      return { audioUris: newUris };
    }),

  clearDownloads: () =>
    set({
      downloadProgress: new Map(),
      audioUris: new Map(),
    }),

  endReveal: () =>
    set({
      isRevealing: false,
      revealedSong: null,
      roundResults: [],
    }),

  // Reset actions
  resetGame: () =>
    set({
      currentSongIndex: -1,
      shuffledSongs: [],
      isPlaying: false,
      votingStartTime: null,
      hasVoted: false,
      myVote: null,
      isRevealing: false,
      revealedSong: null,
      roundResults: [],
      votes: [],
      downloadProgress: new Map(),
      audioUris: new Map(),
    }),

  leaveRoom: () =>
    set({
      room: null,
      players: [],
      songs: [],
      votes: [],
      downloadProgress: new Map(),
      audioUris: new Map(),
      currentSongIndex: -1,
      shuffledSongs: [],
      isPlaying: false,
      votingStartTime: null,
      hasVoted: false,
      myVote: null,
      isRevealing: false,
      revealedSong: null,
      roundResults: [],
    }),

  // Computed
  getCurrentSong: () => {
    const state = get();
    const { room, songs, shuffledSongs, currentSongIndex } = state;

    // Use room's shuffledSongIds if available (synced from Firestore)
    if (room?.shuffledSongIds && room.shuffledSongIds.length > 0) {
      const index = room.currentSongIndex >= 0 ? room.currentSongIndex : currentSongIndex;
      if (index < 0 || index >= room.shuffledSongIds.length) {
        return null;
      }
      const songId = room.shuffledSongIds[index];
      return songs.find(s => s.id === songId) || null;
    }

    // Fallback to local shuffledSongs (for host during transition)
    if (currentSongIndex < 0 || currentSongIndex >= shuffledSongs.length) {
      return null;
    }
    return shuffledSongs[currentSongIndex];
  },

  getPlayerById: (id) => {
    return get().players.find((p) => p.id === id);
  },

  isHost: (playerId) => {
    const room = get().room;
    return room?.hostId === playerId;
  },

  getMyPlayerSongs: (playerId) => {
    return get().songs.filter((s) => s.addedBy === playerId);
  },

  getSortedPlayers: () => {
    return [...get().players].sort((a, b) => b.score - a.score);
  },
}));

// Selector hooks
export const useRoom = () => useGameStore((state) => state.room);
export const usePlayers = () => useGameStore((state) => state.players);
export const useSongs = () => useGameStore((state) => state.songs);
export const useCurrentSong = () => useGameStore((state) => state.getCurrentSong());
export const useIsRevealing = () => useGameStore((state) => state.isRevealing);
export const useDownloadProgress = () => useGameStore((state) => state.downloadProgress);
export const useAudioUris = () => useGameStore((state) => state.audioUris);
