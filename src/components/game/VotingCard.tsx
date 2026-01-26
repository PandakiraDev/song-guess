import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import { Player } from '../../types';
import { Avatar, Card } from '../common';

interface VotingCardProps {
  players: Player[];
  currentSongOwnerId: string;
  currentUserId: string;
  selectedPlayerId: string | null;
  onVote: (playerId: string) => void;
  disabled?: boolean;
  revealed?: boolean;
  correctPlayerId?: string;
}

interface PlayerOptionProps {
  player: Player;
  isSelected: boolean;
  isRevealed: boolean;
  isCorrect: boolean;
  wasSelectedCorrectly: boolean;
  onPress: () => void;
  disabled: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const PlayerOption: React.FC<PlayerOptionProps> = ({
  player,
  isSelected,
  isRevealed,
  isCorrect,
  wasSelectedCorrectly,
  onPress,
  disabled,
}) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1)
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getBorderColor = () => {
    if (isRevealed) {
      if (isCorrect) return colors.success;
      if (isSelected) return colors.error;
    }
    if (isSelected) return colors.neonPink;
    return 'transparent';
  };

  const getBackgroundColor = () => {
    if (isRevealed) {
      if (isCorrect) return colors.success + '20';
      if (isSelected) return colors.error + '20';
    }
    if (isSelected) return colors.neonPink + '20';
    return colors.surface;
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[animatedStyle]}
    >
      <View
        style={[
          styles.playerOption,
          {
            borderColor: getBorderColor(),
            backgroundColor: getBackgroundColor(),
          },
        ]}
      >
        <Avatar
          name={player.name}
          avatarId={player.avatar}
          size="medium"
        />

        <Text style={styles.playerName}>{player.name}</Text>

        {isRevealed && isCorrect && (
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        )}

        {isRevealed && isSelected && !wasSelectedCorrectly && (
          <Ionicons name="close-circle" size={24} color={colors.error} />
        )}

        {!isRevealed && isSelected && (
          <Ionicons name="radio-button-on" size={24} color={colors.neonPink} />
        )}
      </View>
    </AnimatedTouchable>
  );
};

export const VotingCard: React.FC<VotingCardProps> = ({
  players,
  currentSongOwnerId,
  currentUserId,
  selectedPlayerId,
  onVote,
  disabled = false,
  revealed = false,
  correctPlayerId,
}) => {
  // Filter out the song owner (they can't vote for themselves)
  // and the current user if they're the owner
  const votablePlayers = players.filter(
    (p) => p.id !== currentUserId || p.id === currentSongOwnerId
  );

  const renderPlayer = (item: Player) => {
    const isSelected = item.id === selectedPlayerId;
    const isCorrect = revealed && item.id === correctPlayerId;
    const wasSelectedCorrectly = isSelected && isCorrect;

    return (
      <PlayerOption
        key={item.id}
        player={item}
        isSelected={isSelected}
        isRevealed={revealed}
        isCorrect={isCorrect}
        wasSelectedCorrectly={wasSelectedCorrectly}
        onPress={() => onVote(item.id)}
        disabled={disabled || revealed}
      />
    );
  };

  // Create rows of 2 players each
  const rows: Player[][] = [];
  for (let i = 0; i < votablePlayers.length; i += 2) {
    rows.push(votablePlayers.slice(i, i + 2));
  }

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>
        {revealed ? 'The song was added by:' : 'Who added this song?'}
      </Text>

      <View style={styles.list}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((player) => renderPlayer(player))}
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
  playerOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    gap: spacing.sm,
  },
  playerName: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
});

export default VotingCard;
