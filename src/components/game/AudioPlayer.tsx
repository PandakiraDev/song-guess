import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '../../theme/colors';

interface AudioPlayerProps {
  localUri: string;
  startTime?: number;
  duration?: number;
  onReady?: () => void;
  onEnd?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  playing?: boolean;
  songTitle?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLAYER_WIDTH = SCREEN_WIDTH - 32;
const NUM_BARS = 32;
const BAR_WIDTH = 6;
const BAR_GAP = 4;

// Individual animated bar component
const AnimatedBar: React.FC<{ index: number; isPlaying: boolean }> = ({ index, isPlaying }) => {
  const height = useSharedValue(8);
  const baseDelay = index * 50;

  useEffect(() => {
    if (isPlaying) {
      // Create unique animation pattern for each bar
      const minHeight = 8 + (index % 3) * 4;
      const maxHeight = 40 + (index % 5) * 15;
      const duration = 300 + (index % 4) * 100;

      height.value = withDelay(
        baseDelay,
        withRepeat(
          withSequence(
            withTiming(maxHeight, { duration, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
            withTiming(minHeight, { duration: duration * 0.8, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
            withTiming(maxHeight * 0.7, { duration: duration * 0.6, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
            withTiming(minHeight + 10, { duration: duration * 0.5, easing: Easing.bezier(0.4, 0, 0.2, 1) })
          ),
          -1,
          false
        )
      );
    } else {
      cancelAnimation(height);
      height.value = withTiming(8, { duration: 400, easing: Easing.out(Easing.cubic) });
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  // Color based on position (gradient effect)
  const getBarColor = () => {
    const position = index / NUM_BARS;
    if (position < 0.3) return colors.neonPink;
    if (position < 0.6) return colors.neonPurple;
    return colors.neonBlue;
  };

  return (
    <Animated.View
      style={[
        styles.bar,
        animatedStyle,
        {
          backgroundColor: isPlaying ? getBarColor() : colors.surfaceLight,
          opacity: isPlaying ? 0.9 : 0.4,
        },
      ]}
    />
  );
};

// Pulsing glow ring
const PulsingRing: React.FC<{ isPlaying: boolean; delay: number; size: number }> = ({
  isPlaying,
  delay,
  size,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (isPlaying) {
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1.3, { duration: 1500, easing: Easing.out(Easing.cubic) }),
            withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.cubic) })
          ),
          -1,
          false
        )
      );
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.2, { duration: 1500, easing: Easing.out(Easing.cubic) }),
            withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.cubic) })
          ),
          -1,
          false
        )
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = withTiming(1, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.pulsingRing,
        animatedStyle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    />
  );
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  localUri,
  startTime = 0,
  duration = 0,
  onReady,
  onEnd,
  onTimeUpdate,
  playing = false,
  songTitle,
}) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const hasCalledEnd = useRef(false);

  // Animated values
  const progressWidth = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  const containerGlow = useSharedValue(0);

  // Initialize audio
  useEffect(() => {
    const loadSound = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound, status } = await Audio.Sound.createAsync(
          {
            uri: localUri,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
              'Referer': 'https://www.youtube.com/',
            }
          },
          { shouldPlay: false, positionMillis: startTime * 1000 },
          onPlaybackStatusUpdate
        );

        soundRef.current = sound;

        if (status.isLoaded) {
          setIsLoaded(true);
          setTotalDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
          onReady?.();
        }
      } catch (error) {
        console.error('AudioPlayer: Failed to load sound:', error);
        console.error('AudioPlayer: URL was:', localUri);
        // Call onReady anyway to not block the game
        onReady?.();
      }
    };

    loadSound();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [localUri]);

  // Handle playback status updates
  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;

      const current = status.positionMillis / 1000;
      setCurrentTime(current);

      if (duration > 0 && startTimeRef.current !== null) {
        const elapsed = current - startTime;
        onTimeUpdate?.(elapsed);

        if (elapsed >= duration && !hasCalledEnd.current) {
          hasCalledEnd.current = true;
          soundRef.current?.pauseAsync();
          onEnd?.();
        }
      }

      if (status.didJustFinish && !hasCalledEnd.current) {
        hasCalledEnd.current = true;
        onEnd?.();
      }
    },
    [duration, startTime, onTimeUpdate, onEnd]
  );

  // Control playback
  useEffect(() => {
    if (!soundRef.current || !isLoaded) return;

    const controlPlayback = async () => {
      if (playing) {
        hasCalledEnd.current = false;
        startTimeRef.current = Date.now();
        await soundRef.current?.playAsync();
      } else {
        await soundRef.current?.pauseAsync();
      }
    };

    controlPlayback();
  }, [playing, isLoaded]);

  // Animate icon and glow based on playing state
  useEffect(() => {
    if (playing) {
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      iconRotation.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(-5, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      containerGlow.value = withTiming(1, { duration: 500 });
    } else {
      cancelAnimation(iconScale);
      cancelAnimation(iconRotation);
      iconScale.value = withTiming(1, { duration: 300 });
      iconRotation.value = withTiming(0, { duration: 300 });
      containerGlow.value = withTiming(0, { duration: 300 });
    }
  }, [playing]);

  // Update progress bar smoothly
  useEffect(() => {
    const effectiveDuration = duration > 0 ? duration : totalDuration - startTime;
    const elapsed = currentTime - startTime;
    const progress = effectiveDuration > 0 ? Math.min(Math.max(elapsed / effectiveDuration, 0), 1) : 0;

    progressWidth.value = withTiming(progress * 100, {
      duration: 100,
      easing: Easing.linear,
    });
  }, [currentTime, startTime, duration, totalDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.floor(Math.max(0, seconds) % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const effectiveDuration = duration > 0 ? duration : totalDuration - startTime;
  const elapsed = currentTime - startTime;

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(containerGlow.value, [0, 1], [0, 0.5]),
    shadowRadius: interpolate(containerGlow.value, [0, 1], [0, 20]),
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {/* Visualizer area */}
      <View style={styles.visualizer}>
        {/* Background gradient effect */}
        <View style={styles.visualizerBackground} />

        {/* Animated bars */}
        <View style={styles.barsContainer}>
          {[...Array(NUM_BARS)].map((_, i) => (
            <AnimatedBar key={i} index={i} isPlaying={playing} />
          ))}
        </View>

        {/* Center icon with pulsing rings */}
        <View style={styles.centerIconContainer}>
          <PulsingRing isPlaying={playing} delay={0} size={100} />
          <PulsingRing isPlaying={playing} delay={300} size={80} />
          <PulsingRing isPlaying={playing} delay={600} size={60} />

          <Animated.View style={[styles.iconWrapper, iconAnimatedStyle]}>
            <View style={[styles.iconBackground, playing && styles.iconBackgroundPlaying]}>
              <Ionicons
                name={playing ? 'musical-notes' : 'pause'}
                size={32}
                color={playing ? colors.textPrimary : colors.textSecondary}
              />
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Song title */}
      {songTitle && (
        <View style={styles.titleContainer}>
          <Ionicons name="musical-note" size={16} color={colors.neonPink} />
          <Text style={styles.songTitle} numberOfLines={1}>
            {songTitle}
          </Text>
        </View>
      )}

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(elapsed)}</Text>
          <Text style={styles.timeText}>{formatTime(effectiveDuration)}</Text>
        </View>
      </View>

      {/* Status indicator */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, playing ? styles.statusDotPlaying : styles.statusDotReady]} />
        <Text style={[styles.statusText, playing && styles.statusTextPlaying]}>
          {!isLoaded ? 'Loading...' : playing ? 'Now Playing' : 'Ready'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: PLAYER_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    shadowColor: colors.neonPink,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  visualizer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
  },
  visualizerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    opacity: 0.5,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BAR_GAP,
    height: 100,
    position: 'absolute',
    bottom: 20,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
    minHeight: 8,
  },
  centerIconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsingRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.neonPink,
  },
  iconWrapper: {
    zIndex: 10,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceLight,
  },
  iconBackgroundPlaying: {
    backgroundColor: colors.neonPink,
    borderColor: colors.neonPink,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  songTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  progressContainer: {
    gap: spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.neonPink,
    borderRadius: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontFamily: 'monospace',
    fontWeight: fontWeight.medium,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotReady: {
    backgroundColor: colors.textMuted,
  },
  statusDotPlaying: {
    backgroundColor: colors.neonGreen,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  statusTextPlaying: {
    color: colors.neonGreen,
  },
});

export default AudioPlayer;
