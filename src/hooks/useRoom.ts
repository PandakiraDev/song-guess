import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
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
import { RoomSettings, RoomStatus, User } from '../types';

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
  const mountedRef = useRef(true);
  const initialLoadRef = useRef(true);
  const roomDeletedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to room and players when roomId changes
  useEffect(() => {
    if (!roomId) return;

    // Reset state when subscribing to new room
    setRoomDeleted(false);
    hadRoomRef.current = false;
    mountedRef.current = true;
    initialLoadRef.current = true;
    if (roomDeletedTimeoutRef.current) {
      clearTimeout(roomDeletedTimeoutRef.current);
      roomDeletedTimeoutRef.current = null;
    }

    const unsubRoom = subscribeToRoom(
      roomId,
      (roomData) => {
        if (!mountedRef.current) return;

        if (roomData) {
          // Clear any pending "room deleted" timeout - room is back
          if (roomDeletedTimeoutRef.current) {
            clearTimeout(roomDeletedTimeoutRef.current);
            roomDeletedTimeoutRef.current = null;
          }
          setRoom(roomData);
          hadRoomRef.current = true;
          initialLoadRef.current = false;
        } else {
          setRoom(null);
          // Only set roomDeleted if we previously had a room (meaning it was deleted)
          // AND we're past the initial load phase
          // Use a delay to avoid false positives during document updates
          if (hadRoomRef.current && !initialLoadRef.current) {
            if (!roomDeletedTimeoutRef.current) {
              roomDeletedTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current) {
                  setRoomDeleted(true);
                  setError('Pokój został zamknięty przez hosta');
                }
              }, 2000); // Wait 2 seconds before declaring room deleted
            }
          } else if (!initialLoadRef.current) {
            setError('Pokój nie znaleziony');
          }
          // During initial load, just wait - room data may still be coming
        }
      },
      (error) => {
        if (!mountedRef.current) return;
        setError('Błąd połączenia: ' + error.message);
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
      mountedRef.current = false;
      if (roomDeletedTimeoutRef.current) {
        clearTimeout(roomDeletedTimeoutRef.current);
      }
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
      const avatarUrl = !user.isGuest ? (user as User).avatarUrl : undefined;
      const newRoom = await createRoom(
        user.id,
        user.displayName,
        user.avatar || 'avatar_1',
        avatarUrl
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
        const avatarUrl = !user.isGuest ? (user as User).avatarUrl : undefined;
        const joinedRoom = await joinRoomByCode(
          code,
          user.id,
          user.displayName,
          user.avatar || 'avatar_1',
          avatarUrl
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

  // Memoized computed properties to avoid recalculation on every render
  const isHost = useMemo(
    () => room && user ? room.hostId === user.id : false,
    [room, user]
  );

  const currentPlayer = useMemo(
    () => user ? players.find((p) => p.id === user.id) : undefined,
    [user, players]
  );

  const allPlayersReady = useMemo(
    () => players.length > 0 && players.every((p) => p.isHost || p.isReady),
    [players]
  );

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
