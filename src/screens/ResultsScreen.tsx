import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
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
  withTiming,
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
import { updateUserStats, getUserData, GameStatsUpdate } from '../services/authService';
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
  const [showRoomClosed, setShowRoomClosed] = useState(false);
  const [waitingForHost, setWaitingForHost] = useState(false);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate confetti
    confettiScale.value = withDelay(500, withSpring(1, { damping: 8 }));
  }, []);

  // Handle room deletion (host left) - smooth overlay instead of Alert
  useEffect(() => {
    if (roomDeleted && !isLeavingRef.current) {
      setShowRoomClosed(true);
      overlayOpacity.value = withTiming(1, { duration: 400 });
      // Auto-navigate home after 2.5 seconds
      const timeout = setTimeout(() => {
        navigation.replace('Home');
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [roomDeleted, navigation]);

  // Handle room status change to 'lobby' (host triggered play again)
  useEffect(() => {
    if (room?.status === 'lobby' && !isLeavingRef.current) {
      isLeavingRef.current = true;
      clearAudioCache();
      navigation.replace('Lobby', { roomId });
    }
  }, [room?.status, roomId, navigation]);

  const setUser = useUserStore((state) => state.setUser);

  const confettiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confettiScale.value }],
  }));

  const roomClosedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  // Compute avg response time per player for tiebreaking
  const playersWithAvgTime = useMemo(() => {
    return players.map(p => {
      const playerVotes = votes.filter(v => v.playerId === p.id && v.correct);
      const avg = playerVotes.length > 0
        ? playerVotes.reduce((sum, v) => sum + (v.responseTime || 0), 0) / playerVotes.length
        : undefined;
      return { ...p, avgResponseTime: avg };
    });
  }, [players, votes]);

  const rankedPlayers = useMemo(() => getRankedPlayers(playersWithAvgTime), [playersWithAvgTime]);
  const winners = useMemo(() => rankedPlayers.filter(p => p.rank === 1), [rankedPlayers]);
  const currentUserRank = useMemo(
    () => rankedPlayers.find((p) => p.id === user?.id)?.rank || 0,
    [rankedPlayers, user?.id]
  );

  // Update user stats once when results are shown
  useEffect(() => {
    const updateStats = async () => {
      if (!user || user.isGuest || statsUpdated.current || rankedPlayers.length === 0) return;

      const myPlayer = rankedPlayers.find(p => p.id === user.id);
      if (!myPlayer) return;

      statsUpdated.current = true;

      // Compute per-game stats for this player
      const myVotes = votes.filter(v => v.playerId === user.id);
      const correctVotes = myVotes.filter(v => v.correct);
      const votesWithTime = myVotes.filter(v => v.responseTime != null && v.responseTime > 0);
      const correctWithTime = correctVotes.filter(v => v.responseTime != null && v.responseTime > 0);

      // Best streak from this game
      const songOrder = room?.shuffledSongIds || [];
      let currentStreak = 0;
      let maxStreak = 0;
      for (const songId of songOrder) {
        const v = myVotes.find(vote => vote.songId === songId);
        if (v?.correct) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }

      const fastestCorrect = correctWithTime.length > 0
        ? Math.min(...correctWithTime.map(v => v.responseTime!))
        : 0;

      const gameStats: GameStatsUpdate = {
        won: myPlayer.rank === 1,
        points: myPlayer.score,
        correctGuesses: correctVotes.length,
        totalGuesses: myVotes.length,
        totalResponseTimeMs: votesWithTime.reduce((sum, v) => sum + (v.responseTime || 0), 0),
        responseCount: votesWithTime.length,
        fastestCorrectMs: fastestCorrect,
        bestStreak: maxStreak,
      };

      await updateUserStats(user.id, gameStats);

      // Refresh user data to update stats in the store
      const updatedUser = await getUserData(user.id);
      if (updatedUser) {
        setUser(updatedUser);
      }
    };

    updateStats();
  }, [user, rankedPlayers, votes, room?.shuffledSongIds, setUser]);

  // Calculate interesting stats
  const gameStats = useMemo(() => {
    const votesWithTime = votes.filter(v => v.responseTime != null && v.responseTime > 0);

    // Average response time across all votes
    const avgResponseTime = votesWithTime.length > 0
      ? votesWithTime.reduce((sum, v) => sum + (v.responseTime || 0), 0) / votesWithTime.length
      : 0;

    // Best streak: find which player had the highest streak
    let bestStreakPlayer: string | null = null;
    let bestStreakValue = 0;
    for (const p of players) {
      // Calculate max streak from votes
      const playerVotesBySong = (room?.shuffledSongIds || []).map(songId =>
        votes.find(v => v.playerId === p.id && v.songId === songId)
      );
      let currentStreak = 0;
      let maxStreak = 0;
      for (const v of playerVotesBySong) {
        if (v?.correct) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
      if (maxStreak > bestStreakValue) {
        bestStreakValue = maxStreak;
        bestStreakPlayer = p.name;
      }
    }

    // Most accurate player (highest % correct, min 1 vote)
    let mostAccuratePlayer: string | null = null;
    let bestAccuracy = 0;
    for (const p of players) {
      const pVotes = votes.filter(v => v.playerId === p.id);
      if (pVotes.length === 0) continue;
      const acc = pVotes.filter(v => v.correct).length / pVotes.length;
      if (acc > bestAccuracy) {
        bestAccuracy = acc;
        mostAccuratePlayer = p.name;
      }
    }

    // Fastest single answer
    let fastestPlayer: string | null = null;
    let fastestTime = Infinity;
    for (const v of votesWithTime) {
      if (v.correct && (v.responseTime || Infinity) < fastestTime) {
        fastestTime = v.responseTime!;
        fastestPlayer = players.find(p => p.id === v.playerId)?.name || null;
      }
    }

    return {
      avgResponseTime,
      bestStreakPlayer,
      bestStreakValue,
      mostAccuratePlayer,
      bestAccuracy: Math.round(bestAccuracy * 100),
      fastestPlayer,
      fastestTime: fastestTime === Infinity ? 0 : fastestTime,
    };
  }, [votes, players, room?.shuffledSongIds]);

  const handlePlayAgain = async () => {
    if (isHost) {
      // Host resets the room → all players auto-navigate to lobby via status listener
      isLeavingRef.current = true;
      await clearAudioCache();
      await playAgain();
      navigation.replace('Lobby', { roomId });
    } else {
      // Non-host: show waiting state
      setWaitingForHost(true);
    }
  };

  const handleLeaveGame = async () => {
    isLeavingRef.current = true;
    await clearAudioCache();
    await leaveRoom();
    navigation.replace('Home');
  };

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Ładowanie wyników...</Text>
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

            <Text style={styles.winnerLabel}>
              {winners.length > 1 ? 'Zwycięzcy' : 'Zwycięzca'}
            </Text>
            <Text style={styles.winnerName}>
              {winners.map(w => w.name).join(' & ')}
            </Text>
            <Text style={styles.winnerScore}>{winners[0]?.score} pkt</Text>
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
                <Text style={styles.yourResultLabel}>Twój wynik</Text>
                <Text style={styles.yourResultRank}>
                  {currentUserRank === 1
                    ? '1. miejsce!'
                    : currentUserRank === 2
                    ? '2. miejsce'
                    : currentUserRank === 3
                    ? '3. miejsce'
                    : `${currentUserRank}. miejsce`}
                </Text>
              </View>
              <Text style={styles.yourResultScore}>
                {rankedPlayers.find((p) => p.id === user.id)?.score || 0} pkt
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Game Stats */}
        <Animated.View entering={FadeInUp.delay(600)}>
          <Card style={styles.statsCard}>
            <Text style={styles.statsTitle}>
              {songs.length} piosenek  ·  {players.length} graczy
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="time" size={20} color={colors.neonBlue} />
                <Text style={styles.statValue}>
                  {(gameStats.avgResponseTime / 1000).toFixed(2)}s
                </Text>
                <Text style={styles.statLabel}>Śr. czas odpowiedzi</Text>
              </View>
              {gameStats.bestStreakValue > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="flame" size={20} color={colors.warning} />
                  <Text style={styles.statValue}>{gameStats.bestStreakValue}x</Text>
                  <Text style={styles.statLabel}>{gameStats.bestStreakPlayer}</Text>
                </View>
              )}
              {gameStats.mostAccuratePlayer && (
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-done-circle" size={20} color={colors.neonGreen} />
                  <Text style={styles.statValue}>{gameStats.bestAccuracy}%</Text>
                  <Text style={styles.statLabel}>{gameStats.mostAccuratePlayer}</Text>
                </View>
              )}
              {gameStats.fastestPlayer && (
                <View style={styles.statItem}>
                  <Ionicons name="flash" size={20} color={colors.neonPink} />
                  <Text style={styles.statValue}>
                    {(gameStats.fastestTime / 1000).toFixed(2)}s
                  </Text>
                  <Text style={styles.statLabel}>{gameStats.fastestPlayer}</Text>
                </View>
              )}
            </View>
          </Card>
        </Animated.View>

        {/* Final Scoreboard */}
        <Animated.View entering={FadeInUp.delay(800)}>
          <Text style={styles.sectionTitle}>Klasyfikacja końcowa</Text>
          <Scoreboard
            players={players}
            currentUserId={user?.id}
            showPodium
          />
        </Animated.View>

        {/* Round-by-Round Summary */}
        <Animated.View entering={FadeInUp.delay(1000)}>
          <Text style={styles.sectionTitle}>Podsumowanie rund</Text>
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
                      Dodane przez: <Text style={styles.roundOwnerName}>{songOwner?.name || 'Nieznany'}</Text>
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
                          {vote.responseTime != null && (
                            <Text style={styles.responseTime}>
                              {(vote.responseTime / 1000).toFixed(2)}s
                            </Text>
                          )}
                          <Ionicons
                            name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                            size={18}
                            color={isCorrect ? colors.success : colors.error}
                          />
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.noVotesText}>Brak głosów</Text>
                  )}
                </View>
              </Card>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.footer}>
        <View style={styles.footerActions}>
          {waitingForHost ? (
            <View style={styles.waitingContainer}>
              <ActivityIndicator color={colors.neonPink} size="small" />
              <Text style={styles.waitingText}>Czekam na hosta...</Text>
            </View>
          ) : (
            <Button
              title={isHost ? 'Zagraj ponownie' : 'Zagraj ponownie'}
              onPress={handlePlayAgain}
              size="large"
              fullWidth
              icon={<Ionicons name="refresh" size={24} color={colors.textPrimary} />}
            />
          )}
          <Button
            title="Wyjdź"
            onPress={handleLeaveGame}
            variant="outline"
            size="large"
            fullWidth
          />
        </View>
      </View>

      {/* Room Closed Overlay */}
      {showRoomClosed && (
        <Animated.View style={[styles.roomClosedOverlay, roomClosedStyle]}>
          <View style={styles.roomClosedContent}>
            <Ionicons name="close-circle" size={64} color={colors.neonPink} />
            <Text style={styles.roomClosedTitle}>Pokój zamknięty</Text>
            <Text style={styles.roomClosedSubtitle}>Host zamknął pokój</Text>
          </View>
        </Animated.View>
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
  responseTime: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontFamily: 'monospace',
    minWidth: 45,
    textAlign: 'right',
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
  footerActions: {
    gap: spacing.md,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neonPink + '30',
  },
  waitingText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  roomClosedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  roomClosedContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  roomClosedTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  roomClosedSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
});

export default ResultsScreen;
