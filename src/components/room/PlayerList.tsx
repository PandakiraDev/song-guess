import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import { Player } from '../../types';
import { Avatar, Card } from '../common';

// Memoized player item component
interface PlayerItemProps {
  player: Player;
  index: number;
  isHost: boolean;
  isCurrentUser: boolean;
  showReady: boolean;
  showScore: boolean;
}

const PlayerItem = React.memo<PlayerItemProps>(({
  player,
  index,
  isHost,
  isCurrentUser,
  showReady,
  showScore,
}) => (
  <Animated.View
    entering={FadeInRight.delay(index * 100)}
    exiting={FadeOutLeft}
  >
    <Card
      style={[
        styles.playerCard,
        isCurrentUser && styles.currentUserCard,
      ]}
    >
      <View style={styles.playerInfo}>
        <Avatar
          name={player.name}
          avatarId={player.avatar}
          avatarUrl={player.avatarUrl}
          size="medium"
          showBorder={isHost}
          borderColor={colors.neonPink}
        />

        <View style={styles.playerDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.playerName}>{player.name}</Text>
            {isHost && (
              <View style={styles.hostBadge}>
                <Ionicons name="star" size={12} color={colors.neonPink} />
                <Text style={styles.hostText}>Host</Text>
              </View>
            )}
            {isCurrentUser && !isHost && (
              <Text style={styles.youText}>(You)</Text>
            )}
          </View>

          {showScore && (
            <Text style={styles.score}>{player.score} pts</Text>
          )}
        </View>
      </View>

      {showReady && !isHost && (
        <View style={styles.readyStatus}>
          {player.isReady ? (
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          ) : (
            <Ionicons name="time-outline" size={24} color={colors.textMuted} />
          )}
        </View>
      )}

      {showScore && player.streak > 1 && (
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={16} color={colors.warning} />
          <Text style={styles.streakText}>{player.streak}</Text>
        </View>
      )}
    </Card>
  </Animated.View>
));

interface PlayerListProps {
  players: Player[];
  hostId?: string;
  showReady?: boolean;
  showScore?: boolean;
  currentUserId?: string;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  hostId,
  showReady = false,
  showScore = false,
  currentUserId,
}) => {
  const renderPlayer = useCallback((item: Player, index: number) => {
    const isHost = item.id === hostId;
    const isCurrentUser = item.id === currentUserId;

    return (
      <PlayerItem
        key={item.id}
        player={item}
        index={index}
        isHost={isHost}
        isCurrentUser={isCurrentUser}
        showReady={showReady}
        showScore={showScore}
      />
    );
  }, [hostId, currentUserId, showReady, showScore]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Players</Text>
        <Text style={styles.count}>{players.length}</Text>
      </View>

      <View style={styles.list}>
        {players.map((player, index) => renderPlayer(player, index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  count: {
    color: colors.neonBlue,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  list: {
    gap: spacing.sm,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  currentUserCard: {
    borderWidth: 1,
    borderColor: colors.neonBlue,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  playerName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  hostText: {
    color: colors.neonPink,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  youText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  score: {
    color: colors.neonGreen,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  readyStatus: {
    marginLeft: spacing.sm,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
    gap: 4,
  },
  streakText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});

export default PlayerList;
