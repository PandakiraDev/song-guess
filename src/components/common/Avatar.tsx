import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import { AVATAR_EMOJIS } from '../../types';

interface AvatarProps {
  name: string;
  avatarId?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  showBorder?: boolean;
  borderColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarId,
  size = 'medium',
  style,
  showBorder = false,
  borderColor = colors.neonPink,
}) => {
  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 96,
  };

  const fontSizeMap = {
    small: fontSize.sm,
    medium: fontSize.lg,
    large: fontSize.xl,
    xlarge: fontSize.xxxl,
  };

  const dimension = sizeMap[size];
  const textSize = fontSizeMap[size];

  // Get emoji from avatar ID or use first letter of name
  const displayContent = avatarId && AVATAR_EMOJIS[avatarId]
    ? AVATAR_EMOJIS[avatarId]
    : name.charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
        showBorder && {
          borderWidth: 2,
          borderColor,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[colors.neonPurple, colors.neonBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            width: dimension - (showBorder ? 4 : 0),
            height: dimension - (showBorder ? 4 : 0),
            borderRadius: (dimension - (showBorder ? 4 : 0)) / 2,
          },
        ]}
      >
        <Text style={[styles.text, { fontSize: textSize }]}>{displayContent}</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
});

export default Avatar;
