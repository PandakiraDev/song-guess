import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight } from '../../theme/colors';
import { AVATARS } from '../../types';
import { Avatar } from '../common';

interface AvatarSelectorProps {
  currentAvatar: string;
  onSelectPredefined: (avatarId: string) => void;
  disabled?: boolean;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  currentAvatar,
  onSelectPredefined,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Wybierz awatar</Text>

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
      </View>

      <Text style={styles.hint}>
        Kliknij aby wybrać awatar
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
    justifyContent: 'center',
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
