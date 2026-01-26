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
} from 'firebase/firestore';
import { db } from './firebase';
import { Room, RoomSettings, Player, RoomStatus } from '../types';

// Generate a 6-digit room code
export const generateRoomCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate a unique room ID
export const generateRoomId = (): string => {
  return 'room_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
};

// Default room settings
export const defaultRoomSettings: RoomSettings = {
  songsPerPlayer: 2,
  playbackDuration: 30,
  votingTime: 15,
  playbackMode: 'host_only',
};

// Create a new room
export const createRoom = async (hostId: string, hostName: string, hostAvatar: string): Promise<Room> => {
  const roomId = generateRoomId();
  let code = generateRoomCode();

  // Ensure code is unique
  let codeExists = true;
  while (codeExists) {
    const existingRoom = await getRoomByCode(code);
    if (!existingRoom) {
      codeExists = false;
    } else {
      code = generateRoomCode();
    }
  }

  const room: Omit<Room, 'id'> = {
    code,
    hostId,
    status: 'lobby',
    settings: defaultRoomSettings,
    currentSongIndex: -1,
    createdAt: serverTimestamp() as Timestamp,
  };

  await setDoc(doc(db, 'rooms', roomId), room);

  // Add host as first player
  await addPlayerToRoom(roomId, hostId, hostName, hostAvatar, true);

  return {
    id: roomId,
    ...room,
  };
};

// Get room by ID
export const getRoom = async (roomId: string): Promise<Room | null> => {
  const roomDoc = await getDoc(doc(db, 'rooms', roomId));

  if (!roomDoc.exists()) {
    return null;
  }

  return {
    id: roomId,
    ...roomDoc.data(),
  } as Room;
};

// Get room by code
export const getRoomByCode = async (code: string): Promise<Room | null> => {
  const roomsQuery = query(collection(db, 'rooms'), where('code', '==', code));
  const snapshot = await getDocs(roomsQuery);

  if (snapshot.empty) {
    return null;
  }

  const roomDoc = snapshot.docs[0];
  return {
    id: roomDoc.id,
    ...roomDoc.data(),
  } as Room;
};

// Join room by code
export const joinRoomByCode = async (
  code: string,
  playerId: string,
  playerName: string,
  playerAvatar: string
): Promise<Room | null> => {
  const room = await getRoomByCode(code);

  if (!room) {
    throw new Error('Room not found');
  }

  if (room.status !== 'lobby') {
    throw new Error('Game already in progress');
  }

  await addPlayerToRoom(room.id, playerId, playerName, playerAvatar, false);

  return room;
};

// Add player to room
export const addPlayerToRoom = async (
  roomId: string,
  playerId: string,
  name: string,
  avatar: string,
  isHost: boolean
): Promise<void> => {
  const player: Omit<Player, 'id'> = {
    name: name,
    avatar: avatar,
    isHost,
    score: 0,
    streak: 0,
    joinedAt: serverTimestamp() as Timestamp,
    isReady: false,
  };

  await setDoc(doc(db, 'rooms', roomId, 'players', playerId), player);
};

// Remove player from room
export const removePlayerFromRoom = async (
  roomId: string,
  playerId: string
): Promise<void> => {
  await deleteDoc(doc(db, 'rooms', roomId, 'players', playerId));
};

// Update room settings
export const updateRoomSettings = async (
  roomId: string,
  settings: Partial<RoomSettings>
): Promise<void> => {
  await updateDoc(doc(db, 'rooms', roomId), {
    settings: settings,
  });
};

// Update room status
export const updateRoomStatus = async (
  roomId: string,
  status: RoomStatus
): Promise<void> => {
  await updateDoc(doc(db, 'rooms', roomId), { status });
};

// Update current song index
export const updateCurrentSongIndex = async (
  roomId: string,
  index: number
): Promise<void> => {
  await updateDoc(doc(db, 'rooms', roomId), { currentSongIndex: index });
};

// Get all players in room
export const getPlayersInRoom = async (roomId: string): Promise<Player[]> => {
  const playersSnapshot = await getDocs(collection(db, 'rooms', roomId, 'players'));

  return playersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Player[];
};

// Subscribe to room changes
export const subscribeToRoom = (
  roomId: string,
  callback: (room: Room | null) => void
): (() => void) => {
  return onSnapshot(doc(db, 'rooms', roomId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback({
      id: snapshot.id,
      ...snapshot.data(),
    } as Room);
  });
};

// Subscribe to players in room
export const subscribeToPlayers = (
  roomId: string,
  callback: (players: Player[]) => void
): (() => void) => {
  return onSnapshot(collection(db, 'rooms', roomId, 'players'), (snapshot) => {
    const players = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Player[];

    callback(players);
  });
};

// Update player ready status
export const updatePlayerReadyStatus = async (
  roomId: string,
  playerId: string,
  isReady: boolean
): Promise<void> => {
  await updateDoc(doc(db, 'rooms', roomId, 'players', playerId), {
    isReady: isReady,
  });
};

// Update player score
export const updatePlayerScore = async (
  roomId: string,
  playerId: string,
  score: number,
  streak: number
): Promise<void> => {
  await updateDoc(doc(db, 'rooms', roomId, 'players', playerId), {
    score,
    streak,
  });
};

// Delete room
export const deleteRoom = async (roomId: string): Promise<void> => {
  // Delete all players
  const playersSnapshot = await getDocs(collection(db, 'rooms', roomId, 'players'));
  for (const playerDoc of playersSnapshot.docs) {
    await deleteDoc(playerDoc.ref);
  }

  // Delete all songs
  const songsSnapshot = await getDocs(collection(db, 'rooms', roomId, 'songs'));
  for (const songDoc of songsSnapshot.docs) {
    await deleteDoc(songDoc.ref);
  }

  // Delete all votes
  const votesSnapshot = await getDocs(collection(db, 'rooms', roomId, 'votes'));
  for (const voteDoc of votesSnapshot.docs) {
    await deleteDoc(voteDoc.ref);
  }

  // Delete room
  await deleteDoc(doc(db, 'rooms', roomId));
};
