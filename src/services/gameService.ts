import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Song, Vote, Player, ScoringMode } from '../types';
import { getBestStartTime, getVideoDetails } from './youtubeService';
import { calculateScore } from '../utils/scoring';

// Add a song to the room
export const addSong = async (
  roomId: string,
  youtubeId: string,
  title: string,
  thumbnail: string,
  addedBy: string
): Promise<Song> => {
  // Validate required fields to prevent Firestore errors
  if (!youtubeId || typeof youtubeId !== 'string') {
    throw new Error('Invalid video ID');
  }
  if (!title || typeof title !== 'string') {
    throw new Error('Invalid song title');
  }
  if (!addedBy || typeof addedBy !== 'string') {
    throw new Error('Invalid user ID');
  }

  const songId = 'song_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

  // Get video details for duration
  let duration = 180; // Default 3 minutes
  let peakStartTime = 30; // Default start time

  try {
    const details = await getVideoDetails(youtubeId);
    duration = details.duration;
    peakStartTime = await getBestStartTime(youtubeId, duration);
  } catch (error) {
    console.log('Failed to get video details, using defaults');
  }

  const song: Omit<Song, 'id'> = {
    youtubeId,
    title,
    thumbnail,
    addedBy,
    played: false,
    peakStartTime,
    duration,
  };

  await setDoc(doc(db, 'rooms', roomId, 'songs', songId), song);

  return {
    id: songId,
    ...song,
  };
};

// Remove a song from the room
export const removeSong = async (roomId: string, songId: string): Promise<void> => {
  await deleteDoc(doc(db, 'rooms', roomId, 'songs', songId));
};

// Get all songs in room
export const getSongsInRoom = async (roomId: string): Promise<Song[]> => {
  const songsSnapshot = await getDocs(collection(db, 'rooms', roomId, 'songs'));

  return songsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Song[];
};

// Get songs added by a specific player
export const getSongsByPlayer = async (roomId: string, playerId: string): Promise<Song[]> => {
  const songsQuery = query(
    collection(db, 'rooms', roomId, 'songs'),
    where('addedBy', '==', playerId)
  );
  const snapshot = await getDocs(songsQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Song[];
};

// Subscribe to songs in room
export const subscribeToSongs = (
  roomId: string,
  callback: (songs: Song[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  return onSnapshot(
    collection(db, 'rooms', roomId, 'songs'),
    (snapshot) => {
      const songs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Song[];

      callback(songs);
    },
    (error) => {
      console.error('Songs subscription error:', error);
      onError?.(error);
      callback([]);
    }
  );
};

// Mark song as played
export const markSongAsPlayed = async (roomId: string, songId: string): Promise<void> => {
  await updateDoc(doc(db, 'rooms', roomId, 'songs', songId), {
    played: true,
  });
};

// Shuffle songs for game
export const shuffleSongs = (songs: Song[]): Song[] => {
  const shuffled = [...songs];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Submit a vote
export const submitVote = async (
  roomId: string,
  playerId: string,
  songId: string,
  votedFor: string,
  responseTime: number
): Promise<Vote> => {
  const voteId = `${playerId}_${songId}`;

  const vote: Omit<Vote, 'timestamp'> & { timestamp: any } = {
    playerId,
    songId,
    votedFor,
    timestamp: serverTimestamp(),
    responseTime,
  };

  await setDoc(doc(db, 'rooms', roomId, 'votes', voteId), vote);

  return vote as Vote;
};

// Get votes for a specific song
export const getVotesForSong = async (roomId: string, songId: string): Promise<Vote[]> => {
  const votesQuery = query(
    collection(db, 'rooms', roomId, 'votes'),
    where('songId', '==', songId)
  );
  const snapshot = await getDocs(votesQuery);

  return snapshot.docs.map((doc) => ({
    ...doc.data(),
  })) as Vote[];
};

// Subscribe to votes in room
export const subscribeToVotes = (
  roomId: string,
  callback: (votes: Vote[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  return onSnapshot(
    collection(db, 'rooms', roomId, 'votes'),
    (snapshot) => {
      const votes = snapshot.docs.map((doc) => ({
        ...doc.data(),
      })) as Vote[];

      callback(votes);
    },
    (error) => {
      console.error('Votes subscription error:', error);
      onError?.(error);
      callback([]);
    }
  );
};

// Process votes after reveal and update scores
// Accepts votes parameter to avoid redundant Firestore query
export const processVotesForSong = async (
  roomId: string,
  songId: string,
  correctPlayerId: string,
  votingTime: number,
  players: Player[],
  existingVotes?: Vote[],
  scoringMode: ScoringMode = 'simple'
): Promise<void> => {
  // Use existing votes if provided, otherwise fetch (for backwards compatibility)
  const votes = existingVotes
    ? existingVotes.filter(v => v.songId === songId)
    : await getVotesForSong(roomId, songId);

  // Use batch write for atomic, more efficient multi-document update
  const batch = writeBatch(db);

  for (const vote of votes) {
    const isCorrect = vote.votedFor === correctPlayerId;
    const player = players.find((p) => p.id === vote.playerId);

    if (!player) continue;

    const newStreak = isCorrect ? player.streak + 1 : 0;
    const scoreBreakdown = calculateScore(
      isCorrect,
      vote.responseTime,
      votingTime,
      isCorrect ? player.streak : 0,
      scoringMode
    );

    // Update vote with results
    const voteId = `${vote.playerId}_${songId}`;
    batch.update(doc(db, 'rooms', roomId, 'votes', voteId), {
      correct: isCorrect,
      points: scoreBreakdown.total,
    });

    // Update player score and streak
    batch.update(doc(db, 'rooms', roomId, 'players', vote.playerId), {
      score: player.score + scoreBreakdown.total,
      streak: newStreak,
    });
  }

  await batch.commit();
};

// Get game results
export const getGameResults = async (
  roomId: string
): Promise<{ players: Player[]; votes: Vote[] }> => {
  const players = await getDocs(collection(db, 'rooms', roomId, 'players'));
  const votes = await getDocs(collection(db, 'rooms', roomId, 'votes'));

  return {
    players: players.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Player[],
    votes: votes.docs.map((doc) => ({
      ...doc.data(),
    })) as Vote[],
  };
};

// Reset game for replay using batch writes for better performance
export const resetGameForReplay = async (roomId: string): Promise<void> => {
  const batch = writeBatch(db);

  // Reset all players' scores and streaks
  const playersSnapshot = await getDocs(collection(db, 'rooms', roomId, 'players'));
  playersSnapshot.docs.forEach((playerDoc) => {
    batch.update(playerDoc.ref, {
      score: 0,
      streak: 0,
      isReady: false,
    });
  });

  // Delete all votes
  const votesSnapshot = await getDocs(collection(db, 'rooms', roomId, 'votes'));
  votesSnapshot.docs.forEach((voteDoc) => {
    batch.delete(voteDoc.ref);
  });

  // Delete all songs (clean slate for new game)
  const songsSnapshot = await getDocs(collection(db, 'rooms', roomId, 'songs'));
  songsSnapshot.docs.forEach((songDoc) => {
    batch.delete(songDoc.ref);
  });

  // Reset room status and song index
  batch.update(doc(db, 'rooms', roomId), {
    status: 'lobby',
    currentSongIndex: -1,
  });

  await batch.commit();
};
