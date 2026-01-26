import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Animation values
  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const noteOpacity = useSharedValue(0);
  const questionOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const floatingNote1Y = useSharedValue(0);
  const floatingNote2Y = useSharedValue(0);
  const floatingNote3Y = useSharedValue(0);

  useEffect(() => {
    // Sequence of animations
    // 1. Logo appears with bounce
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    logoRotate.value = withSequence(
      withTiming(-10, { duration: 200 }),
      withSpring(0, { damping: 8 })
    );

    // 2. Note fades in
    noteOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

    // 3. Question mark fades in
    questionOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));

    // 4. Title slides up and fades in
    titleOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(800, withSpring(0, { damping: 15 }));

    // 5. Subtitle fades in
    subtitleOpacity.value = withDelay(1100, withTiming(1, { duration: 400 }));

    // 6. Continuous pulse animation on logo
    pulseScale.value = withDelay(
      1500,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // 7. Floating notes animation
    floatingNote1Y.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    floatingNote2Y.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(-15, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    floatingNote3Y.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(-25, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Call onFinish after animations complete
    const timer = setTimeout(() => {
      onFinish?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Animated styles
  const logoContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value * pulseScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const noteStyle = useAnimatedStyle(() => ({
    opacity: noteOpacity.value,
  }));

  const questionStyle = useAnimatedStyle(() => ({
    opacity: questionOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const floatingNote1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingNote1Y.value }],
  }));

  const floatingNote2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingNote2Y.value }],
  }));

  const floatingNote3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingNote3Y.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Background gradient circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Floating music notes */}
      <Animated.Text style={[styles.floatingNote, styles.floatingNote1, floatingNote1Style]}>
        ♪
      </Animated.Text>
      <Animated.Text style={[styles.floatingNote, styles.floatingNote2, floatingNote2Style]}>
        ♫
      </Animated.Text>
      <Animated.Text style={[styles.floatingNote, styles.floatingNote3, floatingNote3Style]}>
        ♬
      </Animated.Text>

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
        <View style={styles.logoInner}>
          {/* Musical note */}
          <Animated.View style={[styles.noteContainer, noteStyle]}>
            <LinearGradient
              colors={[colors.neonPink, colors.neonBlue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.noteHead}
            />
            <LinearGradient
              colors={[colors.neonPink, colors.neonBlue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.noteStem}
            />
            <LinearGradient
              colors={[colors.neonPink, colors.neonBlue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.noteFlag}
            />
          </Animated.View>

          {/* Question mark */}
          <Animated.View style={[styles.questionContainer, questionStyle]}>
            <LinearGradient
              colors={[colors.neonPurple, colors.neonBlue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.questionCurve}
            />
            <LinearGradient
              colors={[colors.neonPurple, colors.neonBlue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.questionDot}
            />
          </Animated.View>

          {/* Sound waves */}
          <View style={styles.soundWaves}>
            <View style={[styles.soundWave, styles.soundWave1]} />
            <View style={[styles.soundWave, styles.soundWave2]} />
            <View style={[styles.soundWave, styles.soundWave3]} />
          </View>
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.View style={[styles.titleContainer, titleStyle]}>
        <Text style={styles.title}>Song</Text>
        <Text style={styles.titleAccent}>Guess</Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, subtitleStyle]}>
        Guess the song, beat your friends!
      </Animated.Text>

      {/* Loading indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDots}>
          <Animated.View style={[styles.loadingDot, { backgroundColor: colors.neonPink }]} />
          <Animated.View style={[styles.loadingDot, { backgroundColor: colors.neonPurple }]} />
          <Animated.View style={[styles.loadingDot, { backgroundColor: colors.neonBlue }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    top: height * 0.1,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.neonPink,
    opacity: 0.03,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: height * 0.15,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.neonBlue,
    opacity: 0.03,
  },
  floatingNote: {
    position: 'absolute',
    fontSize: 40,
    opacity: 0.2,
  },
  floatingNote1: {
    top: height * 0.2,
    left: width * 0.1,
    color: colors.neonPink,
  },
  floatingNote2: {
    top: height * 0.25,
    right: width * 0.15,
    color: colors.neonBlue,
    fontSize: 35,
  },
  floatingNote3: {
    bottom: height * 0.3,
    left: width * 0.2,
    color: colors.neonPurple,
    fontSize: 30,
  },
  logoContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: 150,
    height: 150,
    position: 'relative',
  },
  noteContainer: {
    position: 'absolute',
    left: 10,
    top: 20,
  },
  noteHead: {
    width: 40,
    height: 30,
    borderRadius: 20,
    transform: [{ rotate: '-20deg' }],
  },
  noteStem: {
    position: 'absolute',
    left: 35,
    top: -70,
    width: 8,
    height: 90,
    borderRadius: 4,
  },
  noteFlag: {
    position: 'absolute',
    left: 43,
    top: -70,
    width: 30,
    height: 40,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 30,
  },
  questionContainer: {
    position: 'absolute',
    right: 15,
    top: 10,
  },
  questionCurve: {
    width: 50,
    height: 70,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
  },
  questionDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 10,
    marginLeft: 17,
  },
  soundWaves: {
    position: 'absolute',
    right: -10,
    top: 50,
  },
  soundWave: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.neonBlue,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    opacity: 0.4,
  },
  soundWave1: {
    width: 15,
    height: 30,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
  },
  soundWave2: {
    left: 10,
    width: 15,
    height: 40,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    top: -5,
    opacity: 0.3,
  },
  soundWave3: {
    left: 20,
    width: 15,
    height: 50,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    top: -10,
    opacity: 0.2,
  },
  titleContainer: {
    flexDirection: 'row',
    marginTop: 30,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.neonPink,
    textShadowColor: colors.neonPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleAccent: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.neonBlue,
    textShadowColor: colors.neonBlue,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default SplashScreen;
