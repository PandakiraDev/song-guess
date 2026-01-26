import {
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  SharedValue,
  withRepeat,
} from 'react-native-reanimated';

// Animation configurations
export const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

export const bounceConfig = {
  damping: 8,
  stiffness: 200,
  mass: 0.5,
};

// Timing configurations
export const timingConfig = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

// Fade in animation
export const fadeIn = (value: SharedValue<number>, delay = 0) => {
  'worklet';
  value.value = withDelay(
    delay,
    withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    })
  );
};

// Fade out animation
export const fadeOut = (value: SharedValue<number>, delay = 0) => {
  'worklet';
  value.value = withDelay(
    delay,
    withTiming(0, {
      duration: 300,
      easing: Easing.in(Easing.ease),
    })
  );
};

// Scale bounce animation
export const scaleBounce = (value: SharedValue<number>, delay = 0) => {
  'worklet';
  value.value = withDelay(
    delay,
    withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1, bounceConfig)
    )
  );
};

// Pulse animation (for highlighting)
export const pulse = (value: SharedValue<number>) => {
  'worklet';
  value.value = withRepeat(
    withSequence(
      withTiming(1.1, { duration: 500 }),
      withTiming(1, { duration: 500 })
    ),
    -1, // infinite
    true // reverse
  );
};

// Shake animation (for wrong answer)
export const shake = (value: SharedValue<number>) => {
  'worklet';
  value.value = withSequence(
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(0, { duration: 50 })
  );
};

// Slide up animation
export const slideUp = (value: SharedValue<number>, delay = 0, distance = 100) => {
  'worklet';
  value.value = distance;
  value.value = withDelay(
    delay,
    withSpring(0, springConfig)
  );
};

// Slide down animation
export const slideDown = (value: SharedValue<number>, delay = 0, distance = 100) => {
  'worklet';
  value.value = withDelay(
    delay,
    withSpring(distance, springConfig)
  );
};

// Rotate animation
export const rotate = (value: SharedValue<number>, degrees: number) => {
  'worklet';
  value.value = withSpring(degrees, springConfig);
};

// Score pop animation
export const scorePop = (scaleValue: SharedValue<number>, opacityValue: SharedValue<number>, delay = 0) => {
  'worklet';
  scaleValue.value = 0;
  opacityValue.value = 0;

  scaleValue.value = withDelay(
    delay,
    withSequence(
      withSpring(1.3, bounceConfig),
      withSpring(1, springConfig)
    )
  );

  opacityValue.value = withDelay(
    delay,
    withTiming(1, { duration: 200 })
  );
};

// Confetti burst (returns random values)
export const getConfettiValues = (count: number) => {
  const confetti = [];
  for (let i = 0; i < count; i++) {
    confetti.push({
      x: Math.random() * 400 - 200,
      y: -(Math.random() * 300 + 100),
      rotation: Math.random() * 360,
      scale: Math.random() * 0.5 + 0.5,
      color: ['#ff00ff', '#00d4ff', '#00ff88', '#ffff00', '#bf00ff'][
        Math.floor(Math.random() * 5)
      ],
    });
  }
  return confetti;
};

// Stagger delay helper
export const getStaggerDelay = (index: number, baseDelay = 100) => {
  return index * baseDelay;
};

// Podium animation delays
export const podiumAnimationDelays = {
  third: 0,
  second: 300,
  first: 600,
};
