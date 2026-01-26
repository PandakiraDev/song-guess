import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme/colors';
import { RootStackParamList } from '../types';
import { Button, Card, Timer } from '../components/common';
import { YouTubePlayer, VotingCard, Scoreboard, RevealAnimation } from '../components/game';
import { useRoom } from '../hooks/useRoom';
import { useGame } from '../hooks/useGame';
import { useAuth } from '../hooks/useAuth';

type GameScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
  route: RouteProp<RootStackParamList, 'Game'>;
};

export const GameScreen: React.FC<GameScreenProps> = ({ navigation, route }) => {
  const { roomId } = route.params;
  const { user } = useAuth();
  const { room, players, isHost } = useRoom(roomId);
  const {
    currentSong,
    currentSongIndex,
    totalSongs,
    hasVoted,
    myVote,
    isRevealing,
    revealedSong,
    roundResults,
    vote,
    startVotingTimer,
    reveal,
    nextSong,
  } = useGame(roomId);

  const [showVideo, setShowVideo] = useState(true);
  const [votingActive, setVotingActive] = useState(false);

  // Handle room status changes
  useEffect(() => {
    if (room?.status === 'finished') {
      navigation.replace('Results', { roomId });
    }
  }, [room?.status, roomId, navigation]);

  // Start voting when video is ready
  const handleVideoReady = () => {
    setVotingActive(true);
    startVotingTimer();
  };

  // Handle voting time end
  const handleVotingComplete = () => {
    setVotingActive(false);
    if (isHost) {
      reveal();
    }
  };

  // Handle next song
  const handleNextSong = () => {
    nextSong();
    setShowVideo(true);
    setVotingActive(false);
  };

  // Get current player's vote result
  const getMyResult = () => {
    if (!user || !currentSong) return null;
    return roundResults.find((r) => r.playerId === user.id);
  };

  const myResult = getMyResult();
  const songOwner = players.find((p) => p.id === currentSong?.addedBy);

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
        {/* Video Player */}
        {showVideo && (
          <View style={styles.videoContainer}>
            <YouTubePlayer
              videoId={currentSong.youtubeId}
              startTime={currentSong.peakStartTime || 0}
              duration={
                room.settings.playbackDuration > 0
                  ? room.settings.playbackDuration
                  : undefined
              }
              onReady={handleVideoReady}
              autoPlay
            />
          </View>
        )}

        {/* Song Info (minimal during voting) */}
        {!isRevealing && (
          <Card style={styles.songInfo}>
            <Ionicons name="musical-note" size={20} color={colors.neonPink} />
            <Text style={styles.songTitle} numberOfLines={1}>
              {currentSong.title}
            </Text>
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
              Vote submitted! Waiting for others...
            </Text>
          </Card>
        )}

        {/* Mini Scoreboard */}
        <View style={styles.scoreboardSection}>
          <Text style={styles.sectionTitle}>Scores</Text>
          <Scoreboard
            players={players}
            currentUserId={user?.id}
            showPodium={false}
          />
        </View>
      </ScrollView>

      {/* Reveal Animation Overlay */}
      {isRevealing && songOwner && (
        <RevealAnimation
          song={currentSong}
          player={songOwner}
          isCorrect={myResult?.correct || false}
          points={myResult?.points || 0}
        />
      )}

      {/* Next Song Button (Host, after reveal) */}
      {isHost && isRevealing && (
        <View style={styles.footer}>
          <Button
            title={currentSongIndex + 1 >= totalSongs ? 'View Results' : 'Next Song'}
            onPress={handleNextSong}
            size="large"
            fullWidth
            icon={
              <Ionicons
                name={
                  currentSongIndex + 1 >= totalSongs
                    ? 'trophy'
                    : 'arrow-forward'
                }
                size={24}
                color={colors.textPrimary}
              />
            }
          />
        </View>
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
  scoreboardSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  footer: {
    padding: spacing.lg,
  },
});

export default GameScreen;
