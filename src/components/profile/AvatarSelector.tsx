import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import { AVATARS, AVATAR_EMOJIS } from '../../types';
import { Avatar } from '../common';

interface AvatarSelectorProps {
  currentAvatar: string;
  currentAvatarUrl?: string;
  onSelectPredefined: (avatarId: string) => void;
  onSelectCustom: () => void;
  disabled?: boolean;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  currentAvatar,
  currentAvatarUrl,
  onSelectPredefined,
  onSelectCustom,
  disabled = false,
}) => {
  const isCustomSelected = currentAvatar === 'custom';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Choose Avatar</Text>

      <View style={styles.grid}>
        {/* Predefined avatars */}
        {AVATARS.map((avatarId) => (
          <TouchableOpacity
            key={avatarId}
            onPress={() => onSelectPredefined(avatarId)}
            disabled={disabled}
            activeOpacity={0.7}
            style={[
              styles.avatarOption,
              currentAvatar === avatarId && styles.selectedOption,
            ]}
          >
            <Avatar name="" avatarId={avatarId} size="medium" />
            {currentAvatar === avatarId && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={20} color={colors.neonPink} />
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Custom photo option */}
        <TouchableOpacity
          onPress={onSelectCustom}
          disabled={disabled}
          activeOpacity={0.7}
          style={[
            styles.avatarOption,
            styles.uploadOption,
            isCustomSelected && styles.selectedOption,
          ]}
        >
          {currentAvatarUrl ? (
            <Image
              source={{ uri: currentAvatarUrl }}
              style={styles.customPreview}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="camera" size={24} color={colors.textSecondary} />
            </View>
          )}
          {isCustomSelected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={20} color={colors.neonPink} />
            </View>
          )}
          <View style={styles.uploadBadge}>
            <Ionicons name="add" size={14} color={colors.textPrimary} />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        {isCustomSelected ? 'Using custom photo' : 'Tap to select or upload a photo'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  label: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: colors.neonPink,
    backgroundColor: colors.neonPink + '20',
  },
  uploadOption: {
    backgroundColor: colors.surface,
  },
  uploadPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  uploadBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.neonBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});

export default AvatarSelector;
