import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { colors, spacing, fontSize, fontWeight } from '../theme/colors';
import { RootStackParamList } from '../types';
import { Button } from '../components/common';
import { DownloadProgress } from '../components/game';
import { useRoom } from '../hooks/useRoom';
import { useGame } from '../hooks/useGame';
import { useGameStore } from '../store/gameStore';
import { updateAudioStreamUrls } from '../services/roomService';
import {
  downloadAllSongs,
  clearAudioCache,
  DownloadProgress as DownloadProgressType,
} from '../services/audioDownloadService';

type DownloadScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Download'>;
  route: RouteProp<RootStackParamList, 'Download'>;
};

export const DownloadScreen: React.FC<DownloadScreenProps> = ({
  navigation,
  route,
}) => {
  const { roomId } = route.params;
  const { room, isHost, roomDeleted } = useRoom(roomId);
  const { songs } = useGame(roomId);
  const { setDownloadProgress, setAudioUri } = useGameStore();

  const [localProgress, setLocalProgress] = useState<Map<string, DownloadProgressType>>(new Map());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const downloadStarted = useRef(false);

  // Build song titles map
  const songTitles = new Map(songs.map((s) => [s.id, s.title]));

  // Handle room deletion
  useEffect(() => {
    if (roomDeleted) {
      Alert.alert(
        'Game Ended',
        'The host has closed the room.',
        [{ text: 'OK', onPress: () => navigation.replace('Home') }],
        { cancelable: false }
      );
    }
  }, [roomDeleted, navigation]);

  // Handle room status changes
  useEffect(() => {
    if (room?.status === 'playing') {
      // Non-host players: load streaming URLs from Firebase before navigating
      if (!isHost && room.audioStreamUrls) {
        Object.entries(room.audioStreamUrls).forEach(([songId, uri]) => {
          setAudioUri(songId, uri);
        });
        console.log('Loaded streaming URLs from Firebase');
      }
      navigation.replace('Game', { roomId });
    } else if (room?.status === 'finished') {
      navigation.replace('Results', { roomId });
    }
  }, [room?.status, roomId, navigation, isHost, room?.audioStreamUrls, setAudioUri]);

  // Start download when screen loads (host only)
  useEffect(() => {
    if (!isHost || downloadStarted.current || songs.length === 0) return;
    downloadStarted.current = true;
    startDownload();
  }, [isHost, songs]);

  const startDownload = async () => {
    setIsDownloading(true);
    setHasError(false);

    try {
      // Clear old cache first
      await clearAudioCache();

      // Download all songs
      const songsToDownload = songs.map((s) => ({
        id: s.id,
        youtubeId: s.youtubeId,
      }));

      const result = await downloadAllSongs(songsToDownload, (progress) => {
        setLocalProgress(progress);
        setDownloadProgress(progress);

        // Save URIs as they complete
        progress.forEach((p) => {
          if (p.status === 'completed' && p.localUri) {
            setAudioUri(p.songId, p.localUri);
          }
        });
      });

      // Check for errors
      const errors = Array.from(result.values()).filter((p) => p.status === 'error');
      if (errors.length > 0) {
        setHasError(true);
        console.error('Download errors:', errors);
      }

      // Check if all downloads completed
      const allCompleted = Array.from(result.values()).every(
        (p) => p.status === 'completed'
      );

      // Sync streaming URLs to Firebase so all players can access them
      if (allCompleted) {
        const streamUrls: Record<string, string> = {};
        result.forEach((p) => {
          if (p.localUri) {
            streamUrls[p.songId] = p.localUri;
          }
        });

        if (Object.keys(streamUrls).length > 0) {
          await updateAudioStreamUrls(roomId, streamUrls);
          console.log('Synced streaming URLs to Firebase');
        }
      }

      setDownloadComplete(allCompleted);
    } catch (error) {
      console.error('Download failed:', error);
      setHasError(true);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRetry = () => {
    downloadStarted.current = false;
    setLocalProgress(new Map());
    startDownload();
  };

  const handleStartGame = async () => {
    if (!roomId || !isHost) return;

    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'playing',
        playbackStarted: false,
        musicPlaying: false,
        votingActive: false,
      });
    } catch (error) {
      console.error('Failed to start game:', error);
      Alert.alert('Error', 'Failed to start game. Please try again.');
    }
  };

  const handleSkipDownload = async () => {
    // Go back to original YouTube-based playback
    Alert.alert(
      'Skip Download',
      'This will use YouTube playback instead (with ads). Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            if (roomId && isHost) {
              await updateDoc(doc(db, 'rooms', roomId), {
                status: 'playing',
              });
            }
          },
        },
      ]
    );
  };

  // Non-host view
  if (!isHost) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingTitle}>Preparing Game</Text>
          <Text style={styles.waitingSubtitle}>
            Host is downloading songs for ad-free playback...
          </Text>
          <View style={styles.loadingDots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <DownloadProgress progress={localProgress} songTitles={songTitles} />

      <View style={styles.footer}>
        {downloadComplete && !hasError ? (
          <Button
            title="Start Game"
            onPress={handleStartGame}
            size="large"
            fullWidth
          />
        ) : hasError ? (
          <View style={styles.errorButtons}>
            <Button
              title="Retry Download"
              onPress={handleRetry}
              size="large"
              fullWidth
            />
            <Button
              title="Skip (Use YouTube)"
              onPress={handleSkipDownload}
              variant="outline"
              size="large"
              fullWidth
            />
          </View>
        ) : (
          <View style={styles.downloadingInfo}>
            <Text style={styles.downloadingText}>
              {isDownloading ? 'Downloading...' : 'Preparing...'}
            </Text>
            <Button
              title="Skip Download"
              onPress={handleSkipDownload}
              variant="ghost"
              size="small"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  waitingTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  waitingSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.neonPink,
    opacity: 0.7,
  },
  footer: {
    padding: spacing.lg,
  },
  errorButtons: {
    gap: spacing.md,
  },
  downloadingInfo: {
    alignItems: 'center',
    gap: spacing.md,
  },
  downloadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
});

export default DownloadScreen;
