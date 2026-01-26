import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import { Player, Song } from '../../types';
import { Avatar, Card } from '../common';

interface RevealAnimationProps {
  song: Song;
  player: Player;
  isCorrect: boolean;
  points?: number;
  onAnimationComplete?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const RevealAnimation: React.FC<RevealAnimationProps> = ({
  song,
  player,
  isCorrect,
  points = 0,
  onAnimationComplete,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const resultScale = useSharedValue(0);
  const resultOpacity = useSharedValue(0);
  const pointsY = useSharedValue(0);
  const pointsOpacity = useSharedValue(0);

  useEffect(() => {
    // Main card animation
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSequence(
      withSpring(1.1, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 150 })
    );

    // Result animation (delayed)
    resultOpacity.value = withDelay(500, withTiming(1, { duration: 300 }));
    resultScale.value = withDelay(
      500,
      withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 150 })
      )
    );

    // Points animation (delayed more)
    if (isCorrect && points > 0) {
      pointsOpacity.value = withDelay(800, withTiming(1, { duration: 300 }));
      pointsY.value = withDelay(
        800,
        withSequence(
          withSpring(-20, { damping: 8, stiffness: 200 }),
          withSpring(0, { damping: 15, stiffness: 150 })
        )
      );
    }

    // Callback after animation
    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const resultAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
    opacity: resultOpacity.value,
  }));

  const pointsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pointsY.value }],
    opacity: pointsOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, cardAnimatedStyle]}>
        <Card variant="neon" neonColor={isCorrect ? 'green' : 'pink'} style={styles.innerCard}>
          <Text style={styles.label}>Added by</Text>

          <Avatar
            name={player.name}
            avatarId={player.avatar}
            size="xlarge"
            showBorder
            borderColor={isCorrect ? colors.success : colors.neonPink}
          />

          <Text style={styles.playerName}>{player.name}</Text>

          <Animated.View style={[styles.resultContainer, resultAnimatedStyle]}>
            <View
              style={[
                styles.resultBadge,
                { backgroundColor: isCorrect ? colors.success + '30' : colors.error + '30' },
              ]}
            >
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={32}
                color={isCorrect ? colors.success : colors.error}
              />
              <Text
                style={[
                  styles.resultText,
                  { color: isCorrect ? colors.success : colors.error },
                ]}
              >
                {isCorrect ? 'Correct!' : 'Wrong!'}
              </Text>
            </View>
          </Animated.View>

          {isCorrect && points > 0 && (
            <Animated.View style={[styles.pointsContainer, pointsAnimatedStyle]}>
              <Text style={styles.pointsText}>+{points}</Text>
              <Text style={styles.pointsLabel}>points</Text>
            </Animated.View>
          )}
        </Card>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background + 'E0',
    zIndex: 100,
  },
  card: {
    width: SCREEN_WIDTH - 64,
  },
  innerCard: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  playerName: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  resultContainer: {
    marginTop: spacing.md,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.round,
  },
  resultText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  pointsContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  pointsText: {
    color: colors.neonGreen,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
  },
  pointsLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});

export default RevealAnimation;
