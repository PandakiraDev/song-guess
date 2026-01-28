import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';

interface RevealAnimationProps {
  isHost?: boolean;
  isLastSong?: boolean;
  onNext?: () => void;
  roundNumber?: number;
  totalRounds?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COUNTDOWN_DURATION = 3; // seconds

export const RevealAnimation: React.FC<RevealAnimationProps> = ({
  isHost = false,
  isLastSong = false,
  onNext,
  roundNumber = 1,
  totalRounds = 1,
}) => {
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);

  // Animation values
  const containerOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.5);
  const progressValue = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  const exitScale = useSharedValue(1);
  const exitOpacity = useSharedValue(1);

  // Handle countdown and auto-transition
  useEffect(() => {
    // Entrance animations
    containerOpacity.value = withTiming(1, { duration: 300 });
    contentScale.value = withSpring(1, { damping: 15, stiffness: 150 });

    // Progress bar animation
    progressValue.value = withTiming(1, {
      duration: COUNTDOWN_DURATION * 1000,
      easing: Easing.linear,
    });

    // Pulse animation for the icon
    const pulseLoop = () => {
      pulseScale.value = withSequence(
        withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
      );
    };
    pulseLoop();
    const pulseInterval = setInterval(pulseLoop, 1000);

    // Icon rotation
    iconRotation.value = withTiming(360, {
      duration: COUNTDOWN_DURATION * 1000,
      easing: Easing.linear,
    });

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-transition after countdown (only host triggers)
    const transitionTimeout = setTimeout(() => {
      if (isHost && onNext) {
        // Exit animation
        exitScale.value = withTiming(1.1, { duration: 200 });
        exitOpacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(onNext)();
        });
      }
    }, COUNTDOWN_DURATION * 1000);

    return () => {
      clearInterval(pulseInterval);
      clearInterval(countdownInterval);
      clearTimeout(transitionTimeout);
    };
  }, [isHost, onNext]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value * exitOpacity.value,
    transform: [{ scale: exitScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  const iconContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pulseScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const countdownStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progressValue.value, [0, 0.9, 1], [1, 1, 0]),
    transform: [
      {
        scale: interpolate(progressValue.value, [0, 0.9, 1], [1, 1, 1.5]),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.overlay, containerStyle]}>
      <Animated.View style={[styles.content, contentStyle]}>
        {/* Animated Icon */}
        <Animated.View style={[styles.iconContainer, iconContainerStyle]}>
          <View style={styles.iconInner}>
            <Ionicons
              name={isLastSong ? 'trophy' : 'musical-notes'}
              size={40}
              color={colors.background}
            />
          </View>
        </Animated.View>

        {/* Main Text */}
        <Text style={styles.titleText}>
          {isLastSong ? 'Wyniki!' : 'Następna piosenka'}
        </Text>

        {/* Round Progress */}
        <Text style={styles.progressText}>
          {isLastSong
            ? 'Zobaczmy kto wygrał...'
            : `Runda ${roundNumber + 1} z ${totalRounds}`}
        </Text>

        {/* Countdown */}
        <Animated.View style={[styles.countdownContainer, countdownStyle]}>
          <Text style={styles.countdownText}>
            {countdown > 0 ? countdown : ''}
          </Text>
        </Animated.View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, progressBarStyle]} />
        </View>

        {/* Waiting indicator for non-host */}
        {!isHost && (
          <View style={styles.waitingContainer}>
            <Ionicons name="sync" size={16} color={colors.textMuted} />
            <Text style={styles.waitingText}>Synchronizacja...</Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
    width: '100%',
    maxWidth: 300,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.neonPink,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.neonPink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  titleText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  progressText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  countdownContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.neonPink,
  },
  countdownText: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.neonPink,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.neonPink,
    borderRadius: 2,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    opacity: 0.6,
  },
  waitingText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});

export default RevealAnimation;
