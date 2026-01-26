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
import { updateRoomStatus, updateCurrentSongIndex } from '../services/roomService';
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

  // Subscribe to songs and votes
  useEffect(() => {
    if (!roomId) return;

    const unsubSongs = subscribeToSongs(roomId, setSongs);
    const unsubVotes = subscribeToVotes(roomId, setVotes);

    return () => {
      unsubSongs();
      unsubVotes();
    };
  }, [roomId, setSongs, setVotes]);

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
      // Shuffle songs
      const shuffled = shuffleSongs(songs);

      // Update room status
      await updateRoomStatus(roomId, 'playing');
      await updateCurrentSongIndex(roomId, 0);

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

  // Start voting timer
  const startVotingTimer = useCallback(() => {
    if (!room) return;

    const startTime = Date.now();
    setVotingStartTime(startTime);

    // Clear any existing timer
    if (votingTimerRef.current) {
      clearTimeout(votingTimerRef.current);
    }

    // Set timer for voting end
    votingTimerRef.current = setTimeout(() => {
      // Voting time ended, trigger reveal
      handleReveal();
    }, room.settings.votingTime * 1000);
  }, [room, setVotingStartTime]);

  // Handle reveal
  const handleReveal = useCallback(async () => {
    if (!roomId) return;

    const currentSong = getCurrentSong();
    if (!currentSong) return;

    // Clear voting timer
    if (votingTimerRef.current) {
      clearTimeout(votingTimerRef.current);
    }

    // Start reveal animation
    startReveal(currentSong);

    // Mark song as played
    await markSongAsPlayed(roomId, currentSong.id);

    // Process votes and update scores
    if (room) {
      await processVotesForSong(
        roomId,
        currentSong.id,
        currentSong.addedBy,
        room.settings.votingTime,
        players
      );

      // Calculate round results for display
      const songVotes = votes.filter((v) => v.songId === currentSong.id);
      const results = songVotes.map((v) => ({
        playerId: v.playerId,
        correct: v.votedFor === currentSong.addedBy,
        points: v.points || 0,
      }));
      setRoundResults(results);
    }
  }, [roomId, room, players, votes, getCurrentSong, startReveal, setRoundResults]);

  // Move to next song
  const handleNextSong = useCallback(async () => {
    if (!roomId || !room) return;

    const nextIndex = currentSongIndex + 1;

    if (nextIndex >= shuffledSongs.length) {
      // Game finished
      await updateRoomStatus(roomId, 'finished');
    } else {
      // Move to next song
      await updateCurrentSongIndex(roomId, nextIndex);
      setCurrentSongIndex(nextIndex);
      endReveal();
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
  const allPlayersVoted =
    currentSong &&
    players.filter((p) => p.id !== currentSong.addedBy).length <= currentSongVoteCount;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (votingTimerRef.current) {
        clearTimeout(votingTimerRef.current);
      }
    };
  }, []);

  return {
    songs,
    votes,
    mySongs,
    currentSong,
    currentSongIndex,
    totalSongs: shuffledSongs.length,
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
    addSong: handleAddSong,
    removeSong: handleRemoveSong,
    startGame: handleStartGame,
    vote: handleVote,
    startVotingTimer,
    reveal: handleReveal,
    nextSong: handleNextSong,
    playAgain: handlePlayAgain,
  };
};
