import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme/colors';
import { RootStackParamList } from '../types';
import { Button, Card } from '../components/common';
import { Scoreboard } from '../components/game';
import { useRoom } from '../hooks/useRoom';
import { useGame } from '../hooks/useGame';
import { useAuth } from '../hooks/useAuth';
import { getRankedPlayers, decodeHtmlEntities } from '../utils/scoring';
import { updateUserStats, getUserData } from '../services/authService';
import { useUserStore } from '../store/userStore';
import { clearAudioCache } from '../services/audioDownloadService';

type ResultsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Results'>;
  route: RouteProp<RootStackParamList, 'Results'>;
};

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  navigation,
  route,
}) => {
  const { roomId } = route.params;
  const { user } = useAuth();
  const { room, players, isHost, leaveRoom, roomDeleted } = useRoom(roomId);
  const { songs, votes, playAgain } = useGame(roomId);

  const confettiScale = useSharedValue(0);
  const statsUpdated = useRef(false);
  const isLeavingRef = useRef(false);

  useEffect(() => {
    // Animate confetti
    confettiScale.value = withDelay(500, withSpring(1, { damping: 8 }));
  }, []);

  // Handle room deletion (host left)
  useEffect(() => {
    if (roomDeleted && !isLeavingRef.current) {
      Alert.alert(
        'Room Closed',
        'The host has closed the room.',
        [{ text: 'OK', onPress: () => navigation.replace('Home') }],
        { cancelable: false }
      );
    }
  }, [roomDeleted, navigation]);

  const setUser = useUserStore((state) => state.setUser);

  // Update user stats once when results are shown
  useEffect(() => {
    const updateStats = async () => {
      if (!user || user.isGuest || statsUpdated.current || players.length === 0) return;

      const rankedList = getRankedPlayers(players);
      const myPlayer = rankedList.find(p => p.id === user.id);

      if (myPlayer) {
        statsUpdated.current = true;
        const isWinner = myPlayer.rank === 1;
        await updateUserStats(user.id, isWinner, myPlayer.score);

        // Refresh user data to update stats in the store
        const updatedUser = await getUserData(user.id);
        if (updatedUser) {
          setUser(updatedUser);
        }
      }
    };

    updateStats();
  }, [user, players, setUser]);

  const confettiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confettiScale.value }],
  }));

  // Memoize computed values to avoid recalculation on every render
  const rankedPlayers = useMemo(() => getRankedPlayers(players), [players]);
  const winner = rankedPlayers[0];
  const currentUserRank = useMemo(
    () => rankedPlayers.find((p) => p.id === user?.id)?.rank || 0,
    [rankedPlayers, user?.id]
  );

  // Calculate stats - memoized
  const gameStats = useMemo(() => {
    const totalCorrectGuesses = votes.filter((v) => v.correct).length;
    const totalVotes = votes.length;
    const accuracy = totalVotes > 0 ? Math.round((totalCorrectGuesses / totalVotes) * 100) : 0;
    return { totalCorrectGuesses, totalVotes, accuracy };
  }, [votes]);

  const handlePlayAgain = async () => {
    // Clear audio cache for fresh start
    await clearAudioCache();
    await playAgain();
    navigation.replace('Lobby', { roomId });
  };

  const handleLeaveGame = () => {
    Alert.alert(
      isHost ? 'Close Room' : 'Leave Game',
      isHost
        ? 'Are you sure you want to close the room? All players will be removed.'
        : 'Are you sure you want to leave?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isHost ? 'Close' : 'Leave',
          style: 'destructive',
          onPress: async () => {
            isLeavingRef.current = true;
            // Clear audio cache when leaving
            await clearAudioCache();
            await leaveRoom();
            navigation.replace('Home');
          },
        },
      ]
    );
  };

  const handleGoHome = async () => {
    // Clear audio cache when leaving
    await clearAudioCache();
    navigation.replace('Home');
  };

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Winner Announcement */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.winnerSection}>
            <Animated.View style={[styles.confetti, confettiStyle]}>
              <Text style={styles.confettiEmoji}>🎉</Text>
            </Animated.View>

            <Text style={styles.winnerLabel}>Winner</Text>
            <Text style={styles.winnerName}>{winner?.name}</Text>
            <Text style={styles.winnerScore}>{winner?.score} points</Text>
          </View>
        </Animated.View>

        {/* Your Result */}
        {user && currentUserRank > 0 && (
          <Animated.View entering={FadeInUp.delay(400)}>
            <Card
              style={[
                styles.yourResultCard,
                currentUserRank === 1 && styles.yourResultCardWinner,
              ]}
            >
              <Ionicons
                name={currentUserRank === 1 ? 'trophy' : 'ribbon'}
                size={32}
                color={
                  currentUserRank === 1
                    ? colors.neonPink
                    : currentUserRank <= 3
                    ? colors.neonBlue
                    : colors.textSecondary
                }
              />
              <View style={styles.yourResultInfo}>
                <Text style={styles.yourResultLabel}>Your Finish</Text>
                <Text style={styles.yourResultRank}>
                  {currentUserRank === 1
                    ? '1st Place!'
                    : currentUserRank === 2
                    ? '2nd Place'
                    : currentUserRank === 3
                    ? '3rd Place'
                    : `${currentUserRank}th Place`}
                </Text>
              </View>
              <Text style={styles.yourResultScore}>
                {rankedPlayers.find((p) => p.id === user.id)?.score || 0} pts
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Game Stats */}
        <Animated.View entering={FadeInUp.delay(600)}>
          <Card style={styles.statsCard}>
            <Text style={styles.statsTitle}>Game Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{songs.length}</Text>
                <Text style={styles.statLabel}>Songs Played</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{players.length}</Text>
                <Text style={styles.statLabel}>Players</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{gameStats.accuracy}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{gameStats.totalCorrectGuesses}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Final Scoreboard */}
        <Animated.View entering={FadeInUp.delay(800)}>
          <Text style={styles.sectionTitle}>Final Standings</Text>
          <Scoreboard
            players={players}
            currentUserId={user?.id}
            showPodium
          />
        </Animated.View>

        {/* Round-by-Round Summary */}
        <Animated.View entering={FadeInUp.delay(1000)}>
          <Text style={styles.sectionTitle}>Round Summary</Text>
          {songs.map((song, index) => {
            const songOwner = players.find(p => p.id === song.addedBy);
            const songVotes = votes.filter(v => v.songId === song.id);

            return (
              <Card key={song.id} style={styles.roundCard}>
                <View style={styles.roundHeader}>
                  <View style={styles.roundNumber}>
                    <Text style={styles.roundNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.roundInfo}>
                    <Text style={styles.roundSongTitle} numberOfLines={2}>
                      {decodeHtmlEntities(song.title)}
                    </Text>
                    <Text style={styles.roundAddedBy}>
                      Added by: <Text style={styles.roundOwnerName}>{songOwner?.name || 'Unknown'}</Text>
                    </Text>
                  </View>
                </View>

                {/* Votes for this song */}
                <View style={styles.votesSection}>
                  {songVotes.length > 0 ? (
                    songVotes.map((vote) => {
                      const voter = players.find(p => p.id === vote.playerId);
                      const votedFor = players.find(p => p.id === vote.votedFor);
                      const isCorrect = vote.votedFor === song.addedBy;

                      return (
                        <View key={vote.playerId} style={styles.voteRow}>
                          <Text style={styles.voterName} numberOfLines={1}>
                            {voter?.name || 'Unknown'}
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.votedForName,
                              isCorrect ? styles.voteCorrect : styles.voteWrong
                            ]}
                            numberOfLines={1}
                          >
                            {votedFor?.name || 'Unknown'}
                          </Text>
                          <Ionicons
                            name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                            size={18}
                            color={isCorrect ? colors.success : colors.error}
                          />
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.noVotesText}>No votes recorded</Text>
                  )}
                </View>
              </Card>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.footer}>
        {isHost ? (
          <View style={styles.hostActions}>
            <Button
              title="Play Again"
              onPress={handlePlayAgain}
              size="large"
              fullWidth
              icon={<Ionicons name="refresh" size={24} color={colors.textPrimary} />}
            />
            <Button
              title="Leave Game"
              onPress={handleLeaveGame}
              variant="outline"
              size="large"
              fullWidth
            />
          </View>
        ) : (
          <Button
            title="Back to Home"
            onPress={handleGoHome}
            size="large"
            fullWidth
            icon={<Ionicons name="home" size={24} color={colors.textPrimary} />}
          />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  winnerSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    position: 'relative',
  },
  confetti: {
    position: 'absolute',
    top: 0,
  },
  confettiEmoji: {
    fontSize: 48,
  },
  winnerLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.lg,
  },
  winnerName: {
    color: colors.neonPink,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    textShadowColor: colors.neonPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  winnerScore: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },
  yourResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  yourResultCardWinner: {
    borderWidth: 2,
    borderColor: colors.neonPink,
    backgroundColor: colors.neonPink + '10',
  },
  yourResultInfo: {
    flex: 1,
  },
  yourResultLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  yourResultRank: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  yourResultScore: {
    color: colors.neonGreen,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  statsCard: {
    padding: spacing.lg,
  },
  statsTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    color: colors.neonBlue,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  roundCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  roundNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neonPink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundNumberText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  roundInfo: {
    flex: 1,
  },
  roundSongTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  roundAddedBy: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  roundOwnerName: {
    color: colors.neonBlue,
    fontWeight: fontWeight.semibold,
  },
  votesSection: {
    gap: spacing.sm,
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  voterName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
  },
  votedForName: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  voteCorrect: {
    color: colors.success,
  },
  voteWrong: {
    color: colors.error,
  },
  noVotesText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    padding: spacing.lg,
  },
  hostActions: {
    gap: spacing.md,
  },
});

export default ResultsScreen;
