import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme/colors';
import { RootStackParamList } from '../types';
import { Button, Card, Timer } from '../components/common';
import { YouTubePlayer, AudioPlayer, VotingCard, RevealAnimation } from '../components/game';
import { useRoom } from '../hooks/useRoom';
import { useGame } from '../hooks/useGame';
import { useAuth } from '../hooks/useAuth';
import { useGameStore } from '../store/gameStore';
import { decodeHtmlEntities } from '../utils/scoring';

type GameScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
  route: RouteProp<RootStackParamList, 'Game'>;
};

export const GameScreen: React.FC<GameScreenProps> = ({ navigation, route }) => {
  const { roomId } = route.params;
  const { user } = useAuth();
  const { room, players, isHost, roomDeleted } = useRoom(roomId);
  const { audioUris } = useGameStore();
  const {
    currentSong,
    currentSongIndex,
    totalSongs,
    hasVoted,
    myVote,
    vote,
    reveal,
    nextSong,
    playbackStarted,
    musicPlaying,
    allPlayersContentReady,
    hostContentReady,
    isContentReadyForVoting,
    allPlayersVoted,
    votingActive,
    startPlayback,
    markContentReady,
  } = useGame(roomId);

  const [showVideo, setShowVideo] = useState(true);
  const allVotedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredAutoReveal = useRef(false);

  // Derive states from room (synced across all clients)
  const isRevealing = room?.status === 'reveal';

  // Handle room deletion (host left)
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
    if (room?.status === 'finished') {
      navigation.replace('Results', { roomId });
    }
  }, [room?.status, roomId, navigation]);

  // Reset local state when moving to next song
  useEffect(() => {
    if (room?.status === 'playing') {
      setShowVideo(true);
      hasTriggeredAutoReveal.current = false;
      // Clear any pending timer
      if (allVotedTimerRef.current) {
        clearTimeout(allVotedTimerRef.current);
        allVotedTimerRef.current = null;
      }
    }
  }, [room?.status, room?.currentSongIndex]);

  // Auto-reveal when all players have voted (after 2 second delay)
  useEffect(() => {
    // Only host triggers reveal, and only during active voting
    if (!isHost || !votingActive || isRevealing) {
      return;
    }

    // Check if all players voted and we haven't triggered yet
    if (allPlayersVoted && !hasTriggeredAutoReveal.current) {
      hasTriggeredAutoReveal.current = true;

      // Clear any existing timer
      if (allVotedTimerRef.current) {
        clearTimeout(allVotedTimerRef.current);
      }

      allVotedTimerRef.current = setTimeout(() => {
        reveal();
      }, 2000); // 2 second delay
    }
  }, [isHost, votingActive, isRevealing, allPlayersVoted, reveal]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (allVotedTimerRef.current) {
        clearTimeout(allVotedTimerRef.current);
      }
    };
  }, []);

  // Content is ready (after ads) - mark player as ready
  const handleContentReady = async () => {
    await markContentReady();
  };

  // Host starts the round (loads videos for everyone)
  const handleStartRound = () => {
    if (isHost) {
      startPlayback();
    }
  };

  // Handle voting time end (host triggers reveal which sets votingActive=false in Firestore)
  const handleVotingComplete = () => {
    if (isHost) {
      reveal();
    }
  };

  // Handle next song
  const handleNextSong = () => {
    nextSong();
    // Note: showVideo and votingActive are reset via the useEffect watching room.status
  };

  if (!room || !currentSong) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if current user is the song owner (can't vote on own song)
  const isOwnSong = currentSong.addedBy === user?.id;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.songProgress}>
          <Text style={styles.songProgressText}>
            Song {currentSongIndex + 1} of {totalSongs}
          </Text>
        </View>

        {votingActive && room.settings.votingTime > 0 && (
          <Timer
            duration={room.settings.votingTime}
            onComplete={handleVotingComplete}
            size="small"
          />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Audio/Video Player - render after host clicks Start Round */}
        {/* In host_only mode, only the host gets the player */}
        {showVideo && playbackStarted && (room.settings.playbackMode === 'all_players' || isHost) && (
          <View style={styles.videoContainer}>
            {audioUris.get(currentSong.id) ? (
              // Use downloaded audio (no ads!)
              <AudioPlayer
                localUri={audioUris.get(currentSong.id)!}
                startTime={currentSong.peakStartTime || 0}
                duration={
                  room.settings.playbackDuration > 0
                    ? room.settings.playbackDuration
                    : undefined
                }
                onReady={handleContentReady}
                playing={musicPlaying}
                songTitle={currentSong.title}
              />
            ) : (
              // Fallback to YouTube player
              <YouTubePlayer
                videoId={currentSong.youtubeId}
                startTime={currentSong.peakStartTime || 0}
                duration={
                  room.settings.playbackDuration > 0
                    ? room.settings.playbackDuration
                    : undefined
                }
                onContentReady={handleContentReady}
                autoPlay={true}
                playing={musicPlaying}
              />
            )}
          </View>
        )}

        {/* Host-only playback message for non-hosts */}
        {showVideo && playbackStarted && room.settings.playbackMode === 'host_only' && !isHost && (
          <View style={styles.hostPlayingPlaceholder}>
            <Ionicons name="volume-high" size={48} color={colors.neonPink} />
            <Text style={styles.hostPlayingText}>
              Host odtwarza muzykę...
            </Text>
            <Text style={styles.hostPlayingSubtext}>
              Słuchaj razem z hostem i zgaduj!
            </Text>
          </View>
        )}

        {/* Placeholder before playback starts */}
        {showVideo && !playbackStarted && (
          <View style={styles.videoPlaceholder}>
            <Ionicons name="musical-notes" size={48} color={colors.neonPink} />
            <Text style={styles.videoPlaceholderText}>
              {isHost ? 'Click "Start Round" to begin' : 'Waiting for host...'}
            </Text>
          </View>
        )}

        {/* Song Info - show when voting is active, or in host_only mode when host's ad is done */}
        {!isRevealing && (votingActive || (room.settings.playbackMode === 'host_only' && hostContentReady)) && (
          <Card style={styles.songInfo}>
            <Ionicons name="musical-note" size={20} color={colors.neonPink} />
            <Text style={styles.songTitle} numberOfLines={1}>
              {decodeHtmlEntities(currentSong.title)}
            </Text>
          </Card>
        )}

        {/* Start Round Button (Host only, before playback starts) */}
        {!playbackStarted && !isRevealing && isHost && (
          <Button
            title="Start Round"
            onPress={handleStartRound}
            size="large"
            fullWidth
            icon={<Ionicons name="play" size={24} color={colors.textPrimary} />}
          />
        )}

        {/* Waiting for host message (non-host, before playback starts) */}
        {!playbackStarted && !isRevealing && !isHost && (
          <Card style={styles.waitingCard}>
            <Ionicons name="hourglass" size={24} color={colors.neonBlue} />
            <Text style={styles.waitingText}>
              Waiting for host to start the round...
            </Text>
          </Card>
        )}

        {/* Loading status - waiting for content to load */}
        {playbackStarted && !votingActive && !isRevealing && (
          <Card style={styles.loadingStatusCard}>
            {room.settings.playbackMode === 'host_only' ? (
              // Host-only mode: just show waiting for host message
              <View style={styles.loadingStatusHeader}>
                <Ionicons
                  name={hostContentReady ? 'checkmark-circle' : 'sync'}
                  size={24}
                  color={hostContentReady ? colors.success : colors.neonBlue}
                />
                <Text style={styles.loadingStatusTitle}>
                  {hostContentReady
                    ? 'Starting...'
                    : isHost ? 'Loading video...' : 'Waiting for host...'
                  }
                </Text>
              </View>
            ) : (
              // All players mode: show detailed player list
              <>
                <View style={styles.loadingStatusHeader}>
                  <Ionicons
                    name={allPlayersContentReady ? 'checkmark-circle' : 'sync'}
                    size={24}
                    color={allPlayersContentReady ? colors.success : colors.neonBlue}
                  />
                  <Text style={styles.loadingStatusTitle}>
                    {allPlayersContentReady
                      ? 'Starting...'
                      : 'Waiting for players'
                    }
                  </Text>
                  <Text style={styles.loadingStatusCount}>
                    {players.filter(p => p.contentPlaying).length}/{players.length}
                  </Text>
                </View>
                <View style={styles.playerStatusList}>
                  {players.map((player) => (
                    <View
                      key={player.id}
                      style={[
                        styles.playerStatusItem,
                        player.contentPlaying && styles.playerStatusItemReady
                      ]}
                    >
                      <View style={styles.playerStatusIcon}>
                        <Ionicons
                          name={player.contentPlaying ? 'checkmark' : 'hourglass'}
                          size={14}
                          color={player.contentPlaying ? colors.success : colors.warning}
                        />
                      </View>
                      <Text
                        style={styles.playerStatusName}
                        numberOfLines={1}
                      >
                        {player.name}
                      </Text>
                      <Text style={[
                        styles.playerStatusLabel,
                        { color: player.contentPlaying ? colors.success : colors.warning }
                      ]}>
                        {player.contentPlaying ? 'Ready' : 'Ad'}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </Card>
        )}

        {/* Own Song Message */}
        {isOwnSong && !isRevealing && (
          <Card style={styles.ownSongCard}>
            <Ionicons name="information-circle" size={24} color={colors.neonBlue} />
            <Text style={styles.ownSongText}>
              This is your song! Watch others guess...
            </Text>
          </Card>
        )}

        {/* Voting Card */}
        {!isOwnSong && !isRevealing && (
          <VotingCard
            players={players}
            currentSongOwnerId={currentSong.addedBy}
            currentUserId={user?.id || ''}
            selectedPlayerId={myVote}
            onVote={vote}
            disabled={hasVoted || !votingActive}
            revealed={false}
          />
        )}

        {/* Voted Confirmation */}
        {hasVoted && !isRevealing && (
          <Card style={styles.votedCard}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.votedText}>
              {allPlayersVoted
                ? 'Everyone voted! Revealing soon...'
                : 'Vote submitted! Waiting for others...'}
            </Text>
          </Card>
        )}

        {/* All Voted Message (for song owner) */}
        {isOwnSong && !isRevealing && allPlayersVoted && votingActive && (
          <Card style={styles.allVotedCard}>
            <Ionicons name="people" size={24} color={colors.neonGreen} />
            <Text style={styles.allVotedText}>
              Everyone voted! Revealing soon...
            </Text>
          </Card>
        )}

      </ScrollView>

      {/* Reveal Animation Overlay */}
      {isRevealing && (
        <RevealAnimation
          isHost={isHost}
          isLastSong={currentSongIndex + 1 >= totalSongs}
          onNext={handleNextSong}
          roundNumber={currentSongIndex + 1}
          totalRounds={totalSongs}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  songProgress: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
  },
  songProgressText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  videoContainer: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  videoPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  videoPlaceholderText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  hostPlayingPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neonPink + '40',
  },
  hostPlayingText: {
    color: colors.neonPink,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  hostPlayingSubtext: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  songTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  ownSongCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.neonBlue + '20',
    borderWidth: 1,
    borderColor: colors.neonBlue,
  },
  ownSongText: {
    flex: 1,
    color: colors.neonBlue,
    fontSize: fontSize.md,
  },
  votedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.success + '20',
    borderWidth: 1,
    borderColor: colors.success,
  },
  votedText: {
    flex: 1,
    color: colors.success,
    fontSize: fontSize.md,
  },
  allVotedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.neonGreen + '20',
    borderWidth: 1,
    borderColor: colors.neonGreen,
  },
  allVotedText: {
    flex: 1,
    color: colors.neonGreen,
    fontSize: fontSize.md,
  },
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.neonBlue + '20',
    borderWidth: 1,
    borderColor: colors.neonBlue,
  },
  waitingText: {
    flex: 1,
    color: colors.neonBlue,
    fontSize: fontSize.md,
  },
  loadingStatusCard: {
    padding: spacing.md,
  },
  loadingStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  loadingStatusTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  loadingStatusCount: {
    color: colors.neonBlue,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  playerStatusList: {
    gap: spacing.sm,
  },
  playerStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  playerStatusItemReady: {
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  playerStatusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerStatusName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  playerStatusLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
});

export default GameScreen;
