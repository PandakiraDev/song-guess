import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import { Player } from '../../types';
import { Avatar, Card } from '../common';
import { getRankedPlayers, getPositionSuffix } from '../../utils/scoring';

interface ScoreboardProps {
  players: Player[];
  currentUserId?: string;
  showPodium?: boolean;
}

const PodiumPlace: React.FC<{
  player: Player & { rank: number };
  position: 1 | 2 | 3;
  delay: number;
}> = ({ player, position, delay }) => {
  const heights = { 1: 120, 2: 90, 3: 70 };
  const colors_map = {
    1: colors.neonPink,
    2: colors.neonBlue,
    3: colors.neonGreen,
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).springify()}
      style={[styles.podiumPlace, position === 1 && styles.podiumFirst]}
    >
      <Avatar
        name={player.name}
        avatarId={player.avatar}
        avatarUrl={player.avatarUrl}
        size={position === 1 ? 'large' : 'medium'}
        showBorder
        borderColor={colors_map[position]}
      />
      <Text style={styles.podiumName}>{player.name}</Text>
      <Text style={[styles.podiumScore, { color: colors_map[position] }]}>
        {player.score} pkt
      </Text>
      <View
        style={[
          styles.podiumBar,
          {
            height: heights[position],
            backgroundColor: colors_map[position] + '40',
            borderColor: colors_map[position],
          },
        ]}
      >
        <Text style={[styles.podiumPosition, { color: colors_map[position] }]}>
          {getPositionSuffix(position)}
        </Text>
      </View>
    </Animated.View>
  );
};

export const Scoreboard: React.FC<ScoreboardProps> = ({
  players,
  currentUserId,
  showPodium = false,
}) => {
  const rankedPlayers = getRankedPlayers(players as (Player & { avgResponseTime?: number })[]);

  // Get top 3 for podium (by rank, not index - handles ties)
  const top3 = rankedPlayers.filter(p => p.rank <= 3).slice(0, 3);
  const rest = rankedPlayers.slice(top3.length);

  const renderPodium = () => {
    if (!showPodium || top3.length < 1) return null;

    // Reorder for podium display: 2nd, 1st, 3rd
    const podiumOrder = [
      top3[1], // 2nd place (left)
      top3[0], // 1st place (center, higher)
      top3[2], // 3rd place (right)
    ].filter(Boolean);

    return (
      <View style={styles.podiumContainer}>
        {podiumOrder.map((player, index) => {
          const position = index === 1 ? 1 : index === 0 ? 2 : 3;
          const delays = { 0: 300, 1: 600, 2: 0 };
          return (
            <PodiumPlace
              key={player.id}
              player={player as Player & { rank: number }}
              position={position as 1 | 2 | 3}
              delay={delays[index as 0 | 1 | 2]}
            />
          );
        })}
      </View>
    );
  };

  const renderPlayerRow = (item: Player & { rank: number }, index: number) => {
    const isCurrentUser = item.id === currentUserId;
    const actualIndex = showPodium ? index + 3 : index;

    return (
      <Animated.View key={item.id} entering={FadeInDown.delay(actualIndex * 50)}>
        <Card
          style={[styles.playerRow, isCurrentUser && styles.currentUserRow]}
        >
          <View style={styles.rankContainer}>
            <Text style={styles.rank}>{item.rank}</Text>
          </View>

          <Avatar
            name={item.name}
            avatarId={item.avatar}
            avatarUrl={item.avatarUrl}
            size="small"
          />

          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>
              {item.name}
              {isCurrentUser && ' (You)'}
            </Text>
            {item.streak > 1 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={12} color={colors.warning} />
                <Text style={styles.streakText}>{item.streak}</Text>
              </View>
            )}
          </View>

          <Text style={styles.score}>{item.score}</Text>
        </Card>
      </Animated.View>
    );
  };

  const playersToShow = showPodium ? rest : rankedPlayers;

  return (
    <View style={styles.container}>
      {renderPodium()}

      {playersToShow.length > 0 && (
        <View style={styles.list}>
          {playersToShow.map((player, index) => renderPlayerRow(player, index))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  podiumPlace: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  podiumFirst: {
    marginBottom: 30,
  },
  podiumName: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    maxWidth: 80,
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  podiumBar: {
    width: 80,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumPosition: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  list: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  currentUserRow: {
    borderWidth: 1,
    borderColor: colors.neonBlue,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
  },
  rank: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  playerName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  streakText: {
    color: colors.warning,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  score: {
    color: colors.neonGreen,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});

export default Scoreboard;
