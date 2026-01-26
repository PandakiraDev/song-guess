import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';

interface RevealAnimationProps {
  isHost?: boolean;
  isLastSong?: boolean;
  onNext?: () => void;
  roundNumber?: number;
  totalRounds?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const RevealAnimation: React.FC<RevealAnimationProps> = ({
  isHost = false,
  isLastSong = false,
  onNext,
  roundNumber = 1,
  totalRounds = 1,
}) => {
  // Animation values
  const containerOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0);

  useEffect(() => {
    // Fade in container
    containerOpacity.value = withTiming(1, { duration: 250 });

    // Card entrance
    cardOpacity.value = withTiming(1, { duration: 300 });
    cardScale.value = withSpring(1, { damping: 18, stiffness: 200 });

    // Icon animation
    iconScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.15, { damping: 8, stiffness: 250 }),
        withSpring(1, { damping: 12, stiffness: 150 })
      )
    );
  }, []);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Modal
      visible={true}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.container, containerStyle]}>
          <Animated.View style={[styles.card, cardStyle]}>
            <LinearGradient
              colors={[colors.neonPink + '20', colors.neonPink + '05']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Content */}
              <View style={styles.content}>
                {/* Icon */}
                <Animated.View style={[styles.iconWrapper, iconStyle]}>
                  <View style={styles.iconLarge}>
                    <Ionicons
                      name="musical-notes"
                      size={48}
                      color={colors.background}
                    />
                  </View>
                </Animated.View>

                {/* Title */}
                <Text style={styles.titleText}>
                  Round Complete!
                </Text>

                {/* Progress */}
                <Text style={styles.progressText}>
                  {roundNumber} of {totalRounds} songs
                </Text>

                {/* Message */}
                <Text style={styles.messageText}>
                  {isLastSong
                    ? 'All songs played! Ready to see the results?'
                    : 'Get ready for the next song...'}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Action Button */}
          <View style={styles.footer}>
            {isHost && onNext ? (
              <TouchableOpacity style={styles.nextButton} onPress={onNext} activeOpacity={0.8}>
                <Ionicons
                  name={isLastSong ? 'trophy' : 'arrow-forward'}
                  size={24}
                  color={colors.background}
                />
                <Text style={styles.nextButtonText}>
                  {isLastSong ? 'View Results' : 'Next Song'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.waitingBadge}>
                <Ionicons name="hourglass" size={18} color={colors.neonBlue} />
                <Text style={styles.waitingText}>Waiting for host...</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: SCREEN_WIDTH - 48,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surface,
    backgroundColor: colors.card,
  },
  cardGradient: {},
  content: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iconWrapper: {
    marginBottom: spacing.sm,
  },
  iconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.neonPink,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.neonPink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  titleText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  progressText: {
    fontSize: fontSize.md,
    color: colors.neonPink,
    fontWeight: fontWeight.medium,
  },
  messageText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  footer: {
    width: '100%',
    maxWidth: SCREEN_WIDTH - 48,
    marginTop: spacing.lg,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neonPink,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  nextButtonText: {
    color: colors.background,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neonBlue + '20',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neonBlue,
  },
  waitingText: {
    color: colors.neonBlue,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});

export default RevealAnimation;
