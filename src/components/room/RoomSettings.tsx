import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import { RoomSettings as RoomSettingsType, PlaybackMode, AudioSource } from '../../types';
import { Card } from '../common';

interface RoomSettingsProps {
  settings: RoomSettingsType;
  onUpdate: (settings: Partial<RoomSettingsType>) => void;
  disabled?: boolean;
}

interface OptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const OptionButton: React.FC<OptionButtonProps> = ({
  label,
  selected,
  onPress,
  disabled,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.optionButton,
      selected && styles.optionButtonSelected,
      disabled && styles.optionButtonDisabled,
    ]}
  >
    <Text
      style={[
        styles.optionText,
        selected && styles.optionTextSelected,
        disabled && styles.optionTextDisabled,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export const RoomSettingsComponent: React.FC<RoomSettingsProps> = ({
  settings,
  onUpdate,
  disabled = false,
}) => {
  const songsOptions = [1, 2, 3, 4, 5];
  const durationOptions = [
    { label: '30s', value: 30 },
    { label: '1 min', value: 60 },
    { label: 'Full', value: 0 },
  ];
  const votingTimeOptions = [
    { label: '10s', value: 10 },
    { label: '15s', value: 15 },
    { label: '20s', value: 20 },
    { label: '30s', value: 30 },
  ];
  const playbackModeOptions: { label: string; value: PlaybackMode; icon: string }[] = [
    { label: 'Host Only', value: 'host_only', icon: 'person' },
    { label: 'All Players', value: 'all_players', icon: 'people' },
  ];
  const audioSourceOptions: { label: string; value: AudioSource; icon: string; description: string }[] = [
    { label: 'YouTube', value: 'youtube', icon: 'logo-youtube', description: 'Standard (may have ads)' },
    { label: 'Stream', value: 'stream', icon: 'cloud-download', description: 'Ad-free (requires server)' },
  ];

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Game Settings</Text>

      {/* Songs per player */}
      <View style={styles.settingGroup}>
        <View style={styles.settingHeader}>
          <Ionicons name="musical-notes" size={20} color={colors.neonPink} />
          <Text style={styles.settingLabel}>Songs per player</Text>
        </View>
        <View style={styles.optionsRow}>
          {songsOptions.map((num) => (
            <OptionButton
              key={num}
              label={num.toString()}
              selected={settings.songsPerPlayer === num}
              onPress={() => onUpdate({ songsPerPlayer: num })}
              disabled={disabled}
            />
          ))}
        </View>
      </View>

      {/* Playback duration */}
      <View style={styles.settingGroup}>
        <View style={styles.settingHeader}>
          <Ionicons name="time" size={20} color={colors.neonBlue} />
          <Text style={styles.settingLabel}>Playback duration</Text>
        </View>
        <View style={styles.optionsRow}>
          {durationOptions.map((option) => (
            <OptionButton
              key={option.value}
              label={option.label}
              selected={settings.playbackDuration === option.value}
              onPress={() => onUpdate({ playbackDuration: option.value })}
              disabled={disabled}
            />
          ))}
        </View>
      </View>

      {/* Voting time */}
      <View style={styles.settingGroup}>
        <View style={styles.settingHeader}>
          <Ionicons name="hand-left" size={20} color={colors.neonGreen} />
          <Text style={styles.settingLabel}>Voting time</Text>
        </View>
        <View style={styles.optionsRow}>
          {votingTimeOptions.map((option) => (
            <OptionButton
              key={option.value}
              label={option.label}
              selected={settings.votingTime === option.value}
              onPress={() => onUpdate({ votingTime: option.value })}
              disabled={disabled}
            />
          ))}
        </View>
      </View>

      {/* Playback mode */}
      <View style={styles.settingGroup}>
        <View style={styles.settingHeader}>
          <Ionicons name="volume-high" size={20} color={colors.neonPurple} />
          <Text style={styles.settingLabel}>Playback mode</Text>
        </View>
        <View style={styles.optionsRow}>
          {playbackModeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => onUpdate({ playbackMode: option.value })}
              disabled={disabled}
              style={[
                styles.modeButton,
                settings.playbackMode === option.value && styles.modeButtonSelected,
                disabled && styles.optionButtonDisabled,
              ]}
            >
              <Ionicons
                name={option.icon as any}
                size={20}
                color={
                  settings.playbackMode === option.value
                    ? colors.textPrimary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.modeText,
                  settings.playbackMode === option.value && styles.modeTextSelected,
                  disabled && styles.optionTextDisabled,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Audio source */}
      <View style={styles.settingGroup}>
        <View style={styles.settingHeader}>
          <Ionicons name="musical-note" size={20} color={colors.neonBlue} />
          <Text style={styles.settingLabel}>Audio source</Text>
        </View>
        <View style={styles.optionsRow}>
          {audioSourceOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => onUpdate({ audioSource: option.value })}
              disabled={disabled}
              style={[
                styles.sourceButton,
                settings.audioSource === option.value && styles.sourceButtonSelected,
                disabled && styles.optionButtonDisabled,
              ]}
            >
              <Ionicons
                name={option.icon as any}
                size={20}
                color={
                  settings.audioSource === option.value
                    ? colors.neonBlue
                    : colors.textSecondary
                }
              />
              <View style={styles.sourceTextContainer}>
                <Text
                  style={[
                    styles.modeText,
                    settings.audioSource === option.value && styles.sourceTextSelected,
                    disabled && styles.optionTextDisabled,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.sourceDescription}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.lg,
  },
  settingGroup: {
    marginBottom: spacing.lg,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  settingLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: colors.neonPink + '20',
    borderColor: colors.neonPink,
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  optionText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  optionTextSelected: {
    color: colors.neonPink,
  },
  optionTextDisabled: {
    color: colors.textMuted,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeButtonSelected: {
    backgroundColor: colors.neonPurple + '20',
    borderColor: colors.neonPurple,
  },
  modeText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  modeTextSelected: {
    color: colors.textPrimary,
  },
  sourceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sourceButtonSelected: {
    backgroundColor: colors.neonBlue + '20',
    borderColor: colors.neonBlue,
  },
  sourceTextContainer: {
    flex: 1,
  },
  sourceTextSelected: {
    color: colors.neonBlue,
  },
  sourceDescription: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});

export default RoomSettingsComponent;
