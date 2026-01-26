import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { colors, fontSize, fontWeight } from '../../theme/colors';

interface TimerProps {
  duration: number; // in seconds
  onComplete?: () => void;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
}

export const Timer: React.FC<TimerProps> = ({
  duration,
  onComplete,
  size = 'medium',
  showProgress = true,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const progress = useSharedValue(1);

  const sizeMap = {
    small: { dimension: 60, fontSize: fontSize.lg, strokeWidth: 4 },
    medium: { dimension: 80, fontSize: fontSize.xl, strokeWidth: 6 },
    large: { dimension: 120, fontSize: fontSize.xxxl, strokeWidth: 8 },
  };

  const { dimension, fontSize: textSize, strokeWidth } = sizeMap[size];
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    progress.value = withTiming(0, { duration: duration * 1000 });

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  const animatedCircleStyle = useAnimatedStyle(() => {
    const strokeDashoffset = interpolate(progress.value, [0, 1], [circumference, 0]);
    return {
      strokeDashoffset,
    };
  });

  // Determine color based on time left
  const getColor = () => {
    const ratio = timeLeft / duration;
    if (ratio > 0.5) return colors.neonGreen;
    if (ratio > 0.25) return colors.warning;
    return colors.error;
  };

  return (
    <View style={[styles.container, { width: dimension, height: dimension }]}>
      {showProgress && (
        <Animated.View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.progressRing,
              {
                width: dimension,
                height: dimension,
                borderRadius: dimension / 2,
                borderWidth: strokeWidth,
                borderColor: colors.surface,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.progressRing,
              styles.progressFill,
              animatedCircleStyle,
              {
                width: dimension,
                height: dimension,
                borderRadius: dimension / 2,
                borderWidth: strokeWidth,
                borderColor: getColor(),
              },
            ]}
          />
        </Animated.View>
      )}
      <Text style={[styles.text, { fontSize: textSize, color: getColor() }]}>{timeLeft}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRing: {
    position: 'absolute',
  },
  progressFill: {
    transform: [{ rotate: '-90deg' }],
  },
  text: {
    fontWeight: fontWeight.bold,
  },
});

export default Timer;
