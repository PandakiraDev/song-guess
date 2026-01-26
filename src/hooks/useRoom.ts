import { useEffect, useCallback, useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUserStore } from '../store/userStore';
import {
  createRoom,
  joinRoomByCode,
  subscribeToRoom,
  subscribeToPlayers,
  updateRoomSettings,
  updateRoomStatus,
  updatePlayerReadyStatus,
  removePlayerFromRoom,
  deleteRoom,
} from '../services/roomService';
import { RoomSettings, RoomStatus } from '../types';

export const useRoom = (roomId?: string) => {
  const { user } = useUserStore();
  const {
    room,
    players,
    setRoom,
    setPlayers,
    leaveRoom,
    updateRoomStatus: updateStoreRoomStatus,
  } = useGameStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomDeleted, setRoomDeleted] = useState(false);
  const hadRoomRef = useRef(false);

  // Subscribe to room and players when roomId changes
  useEffect(() => {
    if (!roomId) return;

    // Reset state when subscribing to new room
    setRoomDeleted(false);
    hadRoomRef.current = false;

    const unsubRoom = subscribeToRoom(
      roomId,
      (roomData) => {
        if (roomData) {
          setRoom(roomData);
          hadRoomRef.current = true;
        } else {
          setRoom(null);
          // Only set roomDeleted if we previously had a room (meaning it was deleted)
          // or if we're trying to access a non-existent room
          if (hadRoomRef.current) {
            setRoomDeleted(true);
            setError('Room has been closed by the host');
          } else {
            setError('Room not found');
          }
        }
      },
      (error) => {
        setError('Connection error: ' + error.message);
      }
    );

    const unsubPlayers = subscribeToPlayers(
      roomId,
      (playersData) => {
        setPlayers(playersData);
      },
      (error) => {
        console.error('Players subscription error:', error);
      }
    );

    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [roomId, setRoom, setPlayers]);

  // Create a new room
  const handleCreateRoom = useCallback(async () => {
    if (!user) {
      setError('You must be logged in to create a room');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newRoom = await createRoom(
        user.id,
        user.displayName,
        'avatar' in user ? user.avatar : 'avatar_1'
      );
      setRoom(newRoom);
      return newRoom;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, setRoom]);

  // Join a room by code
  const handleJoinRoom = useCallback(
    async (code: string) => {
      if (!user) {
        setError('You must be logged in to join a room');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const joinedRoom = await joinRoomByCode(
          code,
          user.id,
          user.displayName,
          'avatar' in user ? user.avatar : 'avatar_1'
        );
        if (joinedRoom) {
          setRoom(joinedRoom);
        }
        return joinedRoom;
      } catch (err) {
        setError((err as Error).message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user, setRoom]
  );

  // Update room settings (host only)
  const handleUpdateSettings = useCallback(
    async (settings: Partial<RoomSettings>) => {
      if (!room || !user || room.hostId !== user.id) {
        setError('Only the host can update settings');
        return;
      }

      try {
        await updateRoomSettings(room.id, settings);
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [room, user]
  );

  // Update room status
  const handleUpdateStatus = useCallback(
    async (status: RoomStatus) => {
      if (!room || !user || room.hostId !== user.id) {
        setError('Only the host can update room status');
        return;
      }

      try {
        await updateRoomStatus(room.id, status);
        updateStoreRoomStatus(status);
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [room, user, updateStoreRoomStatus]
  );

  // Toggle player ready status
  const handleToggleReady = useCallback(
    async (isReady: boolean) => {
      if (!room || !user) return;

      try {
        await updatePlayerReadyStatus(room.id, user.id, isReady);
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [room, user]
  );

  // Leave room
  const handleLeaveRoom = useCallback(async () => {
    if (!room || !user) return;

    try {
      await removePlayerFromRoom(room.id, user.id);

      // If host leaves, delete the room
      if (room.hostId === user.id) {
        await deleteRoom(room.id);
      }

      leaveRoom();
    } catch (err) {
      console.error('Error leaving room:', err);
      leaveRoom();
    }
  }, [room, user, leaveRoom]);

  // Check if current user is host
  const isHost = room && user ? room.hostId === user.id : false;

  // Get current player
  const currentPlayer = user ? players.find((p) => p.id === user.id) : undefined;

  // Check if all players are ready
  const allPlayersReady = players.length > 0 && players.every((p) => p.isHost || p.isReady);

  return {
    room,
    players,
    isHost,
    currentPlayer,
    allPlayersReady,
    isLoading,
    error,
    roomDeleted,
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    updateSettings: handleUpdateSettings,
    updateStatus: handleUpdateStatus,
    toggleReady: handleToggleReady,
    leaveRoom: handleLeaveRoom,
  };
};
