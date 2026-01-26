import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import { AVATAR_EMOJIS } from '../../types';

interface AvatarProps {
  name: string;
  avatarId?: string;
  avatarUrl?: string; // Firebase Storage URL for custom avatars
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  showBorder?: boolean;
  borderColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarId,
  avatarUrl,
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

  // Check if using custom avatar with URL
  const isCustomAvatar = avatarId === 'custom' && avatarUrl;

  // Get emoji from avatar ID or use first letter of name
  const displayContent = avatarId && AVATAR_EMOJIS[avatarId]
    ? AVATAR_EMOJIS[avatarId]
    : name.charAt(0).toUpperCase();

  const containerStyle = [
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
  ];

  // Render custom avatar image
  if (isCustomAvatar) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: avatarUrl }}
          style={[
            styles.customImage,
            {
              width: dimension - (showBorder ? 4 : 0),
              height: dimension - (showBorder ? 4 : 0),
              borderRadius: (dimension - (showBorder ? 4 : 0)) / 2,
            },
          ]}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Render predefined emoji avatar
  return (
    <View style={containerStyle}>
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
  customImage: {
    backgroundColor: colors.surface,
  },
});

export default Avatar;
