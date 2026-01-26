import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '../../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'gradient' | 'neon';
  neonColor?: 'pink' | 'blue' | 'green' | 'purple';
  onPress?: () => void;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  neonColor = 'pink',
  onPress,
  disabled = false,
}) => {
  const neonStyles = {
    pink: {
      borderColor: colors.neonPink,
      ...shadows.neonPink,
    },
    blue: {
      borderColor: colors.neonBlue,
      ...shadows.neonBlue,
    },
    green: {
      borderColor: colors.neonGreen,
      ...shadows.neonGreen,
    },
    purple: {
      borderColor: colors.neonPurple,
      shadowColor: colors.neonPurple,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 5,
    },
  };

  const content = (
    <>
      {variant === 'gradient' ? (
        <LinearGradient
          colors={colors.gradients.darkCard}
          style={[styles.card, styles.gradientCard, style]}
        >
          {children}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.card,
            variant === 'neon' && [styles.neonCard, neonStyles[neonColor]],
            style,
          ]}
        >
          {children}
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  gradientCard: {
    backgroundColor: 'transparent',
  },
  neonCard: {
    borderWidth: 1,
  },
});

export default Card;
