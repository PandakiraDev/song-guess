import { useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUserStore } from '../store/userStore';
import {
  addSong,
  removeSong,
  subscribeToSongs,
  subscribeToVotes,
  shuffleSongs,
  submitVote as submitVoteToFirebase,
  markSongAsPlayed,
  processVotesForSong,
  resetGameForReplay,
} from '../services/gameService';
import {
  updateRoomStatus,
  updateCurrentSongIndex,
  updatePlayerReadyForSong,
  resetAllPlayersReadyForSong,
  updatePlayerContentPlaying,
} from '../services/roomService';
import { Song } from '../types';

export const useGame = (roomId?: string) => {
  const { user } = useUserStore();
  const {
    room,
    players,
    songs,
    votes,
    currentSongIndex,
    shuffledSongs,
    isPlaying,
    votingStartTime,
    hasVoted,
    myVote,
    isRevealing,
    revealedSong,
    roundResults,
    setSongs,
    setVotes,
    startGame,
    setCurrentSongIndex,
    setIsPlaying,
    setVotingStartTime,
    submitVote,
    startReveal,
    setRoundResults,
    endReveal,
    resetGame,
    getCurrentSong,
  } = useGameStore();

  const votingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevSongIndexRef = useRef<number | null>(null);

  // Subscribe to songs and votes
  useEffect(() => {
    if (!roomId) return;

    const unsubSongs = subscribeToSongs(
      roomId,
      setSongs,
      (error) => console.error('Songs subscription error:', error)
    );
    const unsubVotes = subscribeToVotes(
      roomId,
      setVotes,
      (error) => console.error('Votes subscription error:', error)
    );

    return () => {
      unsubSongs();
      unsubVotes();
    };
  }, [roomId, setSongs, setVotes]);

  // Clear vote state when song index changes (for all players, including non-host)
  useEffect(() => {
    const currentIdx = room?.currentSongIndex ?? -1;
    if (prevSongIndexRef.current !== null && prevSongIndexRef.current !== currentIdx) {
      // Song changed, clear vote state
      setCurrentSongIndex(currentIdx);
    }
    prevSongIndexRef.current = currentIdx;
  }, [room?.currentSongIndex, setCurrentSongIndex]);

  // Add a song
  const handleAddSong = useCallback(
    async (youtubeId: string, title: string, thumbnail: string) => {
      if (!roomId || !user) return null;

      try {
        return await addSong(roomId, youtubeId, title, thumbnail, user.id);
      } catch (error) {
        console.error('Failed to add song:', error);
        return null;
      }
    },
    [roomId, user]
  );

  // Remove a song
  const handleRemoveSong = useCallback(
    async (songId: string) => {
      if (!roomId) return;

      try {
        await removeSong(roomId, songId);
      } catch (error) {
        console.error('Failed to remove song:', error);
      }
    },
    [roomId]
  );

  // Start the game (host only)
  const handleStartGame = useCallback(async () => {
    if (!roomId || !room || !user || room.hostId !== user.id) return;

    try {
      // Shuffle songs and get their IDs
      const shuffled = shuffleSongs(songs);
      const shuffledIds = shuffled.map(s => s.id);

      // Reset all players' readyForSong status for the first round
      await resetAllPlayersReadyForSong(roomId);

      // Update room with shuffled order and status
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      await updateDoc(doc(db, 'rooms', roomId), {
        shuffledSongIds: shuffledIds,
        currentSongIndex: 0,
        status: 'playing',
        playbackStarted: false,
        musicPlaying: false,
        votingActive: false,
      });

      // Start game in store
      startGame(shuffled);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  }, [roomId, room, user, songs, startGame]);

  // Handle voting
  const handleVote = useCallback(
    async (votedForPlayerId: string) => {
      if (!roomId || !user || hasVoted) return;

      const currentSong = getCurrentSong();
      if (!currentSong) return;

      const responseTime = votingStartTime ? Date.now() - votingStartTime : 0;

      try {
        await submitVoteToFirebase(roomId, user.id, currentSong.id, votedForPlayerId, responseTime);
        submitVote(votedForPlayerId);
      } catch (error) {
        console.error('Failed to submit vote:', error);
      }
    },
    [roomId, user, hasVoted, votingStartTime, getCurrentSong, submitVote]
  );

  // Start voting timer - records start time and syncs votingActive to Firestore
  // The actual reveal is triggered by the Timer UI component in GameScreen (host only)
  const startVotingTimer = useCallback(async () => {
    if (!room || !roomId) return;

    const startTime = Date.now();
    setVotingStartTime(startTime);

    // Clear any existing timer
    if (votingTimerRef.current) {
      clearTimeout(votingTimerRef.current);
      votingTimerRef.current = null;
    }

    // Sync voting state to Firestore so all clients know voting has started
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      await updateDoc(doc(db, 'rooms', roomId), {
        votingActive: true
      });
    } catch (error) {
      console.error('Failed to start voting:', error);
    }
  }, [room, roomId, setVotingStartTime]);

  // Handle reveal (host only triggers this)
  const handleReveal = useCallback(async () => {
    if (!roomId || !room || !user) return;

    // Only host can trigger reveal
    if (room.hostId !== user.id) return;

    const currentSong = getCurrentSong();
    if (!currentSong) return;

    // Clear voting timer
    if (votingTimerRef.current) {
      clearTimeout(votingTimerRef.current);
    }

    // Mark song as played
    await markSongAsPlayed(roomId, currentSong.id);

    // Process votes and update scores
    await processVotesForSong(
      roomId,
      currentSong.id,
      currentSong.addedBy,
      room.settings.votingTime,
      players
    );

    // Update room status to 'reveal' and reset votingActive - this syncs across all clients
    const { updateDoc, doc } = await import('firebase/firestore');
    const { db } = await import('../services/firebase');
    await updateDoc(doc(db, 'rooms', roomId), {
      status: 'reveal',
      votingActive: false
    });
  }, [roomId, room, user, players, getCurrentSong]);

  // Move to next song
  const handleNextSong = useCallback(async () => {
    if (!roomId || !room) return;

    const currentIdx = room.currentSongIndex ?? currentSongIndex;
    const nextIndex = currentIdx + 1;
    const totalCount = room.shuffledSongIds?.length || shuffledSongs.length;

    // Clear local vote state for next round
    endReveal();

    // Reset all players' readyForSong status for the next round
    await resetAllPlayersReadyForSong(roomId);

    if (nextIndex >= totalCount) {
      // Game finished
      await updateRoomStatus(roomId, 'finished');
    } else {
      // Move to next song and set status back to playing
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      await updateDoc(doc(db, 'rooms', roomId), {
        currentSongIndex: nextIndex,
        status: 'playing',
        votingActive: false,
        playbackStarted: false,
        musicPlaying: false,
      });
      setCurrentSongIndex(nextIndex);
    }
  }, [roomId, room, currentSongIndex, shuffledSongs, setCurrentSongIndex, endReveal]);

  // Play again
  const handlePlayAgain = useCallback(async () => {
    if (!roomId) return;

    try {
      await resetGameForReplay(roomId);
      resetGame();
    } catch (error) {
      console.error('Failed to reset game:', error);
    }
  }, [roomId, resetGame]);

  // Mark current player as ready for the song (after video/ads loaded)
  const markReadyForSong = useCallback(async () => {
    if (!roomId || !user) return;

    try {
      await updatePlayerReadyForSong(roomId, user.id, true);
    } catch (error) {
      console.error('Failed to mark ready for song:', error);
    }
  }, [roomId, user]);

  // Start playback for everyone (host only) - only sets playbackStarted
  // Voting starts automatically when all players' content is actually playing
  const startPlayback = useCallback(async () => {
    if (!roomId || !room || !user || room.hostId !== user.id) return;

    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      await updateDoc(doc(db, 'rooms', roomId), {
        playbackStarted: true,
        votingActive: false, // Will be set to true when all players' content is playing
      });
    } catch (error) {
      console.error('Failed to start playback:', error);
    }
  }, [roomId, room, user]);

  // Mark current player's content as ready (paused at start, waiting for sync)
  const markContentReady = useCallback(async () => {
    if (!roomId || !user) return;

    try {
      await updatePlayerContentPlaying(roomId, user.id, true);
    } catch (error) {
      console.error('Failed to mark content ready:', error);
    }
  }, [roomId, user]);

  // Start actual music playback for everyone (host only, after all content ready)
  const startMusic = useCallback(async () => {
    if (!roomId || !room || !user || room.hostId !== user.id) return;

    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      await updateDoc(doc(db, 'rooms', roomId), {
        musicPlaying: true,
        votingActive: true,
      });
      setVotingStartTime(Date.now());
    } catch (error) {
      console.error('Failed to start music:', error);
    }
  }, [roomId, room, user, setVotingStartTime]);

  // Check if all players are ready for the current song (video loaded)
  const allPlayersReadyForSong = players.length > 0 &&
    players.every((player) => player.readyForSong === true);

  // Check if current player is ready for song
  const isReadyForSong = user ? players.find(p => p.id === user.id)?.readyForSong === true : false;

  // Playback started state from room (video player rendered, ads may play)
  const playbackStarted = room?.playbackStarted || false;

  // Music playing state from room (actual music playing after sync)
  const musicPlaying = room?.musicPlaying || false;

  // Check if all players' content is ready (paused at start, waiting for sync)
  const allPlayersContentReady = players.length > 0 &&
    players.every((player) => player.contentPlaying === true);

  // Voting active state from room
  const votingActive = room?.votingActive || false;

  // Get songs added by current user
  const mySongs = user ? songs.filter((s) => s.addedBy === user.id) : [];

  // Get required songs count
  const requiredSongsCount = room?.settings.songsPerPlayer || 2;

  // Check if current user has added enough songs
  const hasEnoughSongs = mySongs.length >= requiredSongsCount;

  // Check if all players have added enough songs
  const allPlayersHaveEnoughSongs =
    players.length > 0 &&
    players.every((player) => {
      const playerSongs = songs.filter((s) => s.addedBy === player.id);
      return playerSongs.length >= requiredSongsCount;
    });

  // Get the current song
  const currentSong = getCurrentSong();

  // Get vote count for current song
  const currentSongVoteCount = currentSong
    ? votes.filter((v) => v.songId === currentSong.id).length
    : 0;

  // Check if all players have voted (except the song owner)
  const playersWhoNeedToVote = currentSong
    ? players.filter((p) => p.id !== currentSong.addedBy).length
    : 0;
  const allPlayersVoted =
    currentSong &&
    playersWhoNeedToVote > 0 &&
    currentSongVoteCount >= playersWhoNeedToVote;

  // Auto-start voting when all players' content is ready (after ads)
  useEffect(() => {
    const autoStartVoting = async () => {
      if (!roomId || !room || !user) return;
      if (room.hostId !== user.id) return; // Only host triggers this
      if (!playbackStarted) return; // Videos must be loading
      if (musicPlaying) return; // Already playing
      if (votingActive) return; // Voting already active
      if (!allPlayersContentReady) return; // Wait for all players to finish ads

      try {
        const { updateDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        await updateDoc(doc(db, 'rooms', roomId), {
          musicPlaying: true,
          votingActive: true,
        });
        setVotingStartTime(Date.now());
      } catch (error) {
        console.error('Failed to auto-start voting:', error);
      }
    };

    autoStartVoting();
  }, [roomId, room, user, playbackStarted, musicPlaying, votingActive, allPlayersContentReady, setVotingStartTime]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (votingTimerRef.current) {
        clearTimeout(votingTimerRef.current);
      }
    };
  }, []);

  // Get total songs from room's shuffled order or local state
  const totalSongs = room?.shuffledSongIds?.length || shuffledSongs.length;

  return {
    songs,
    votes,
    mySongs,
    currentSong,
    currentSongIndex: room?.currentSongIndex ?? currentSongIndex,
    totalSongs,
    isPlaying,
    votingStartTime,
    hasVoted,
    myVote,
    isRevealing,
    revealedSong,
    roundResults,
    requiredSongsCount,
    hasEnoughSongs,
    allPlayersHaveEnoughSongs,
    currentSongVoteCount,
    allPlayersVoted,
    allPlayersReadyForSong,
    isReadyForSong,
    playbackStarted,
    musicPlaying,
    allPlayersContentReady,
    votingActive,
    addSong: handleAddSong,
    removeSong: handleRemoveSong,
    startGame: handleStartGame,
    vote: handleVote,
    startVotingTimer,
    reveal: handleReveal,
    nextSong: handleNextSong,
    playAgain: handlePlayAgain,
    markReadyForSong,
    startPlayback,
    markContentReady,
    startMusic,
  };
};
