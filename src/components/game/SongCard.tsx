import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import { Song } from '../../types';
import { Card } from '../common';

interface SongCardProps {
  song: Song;
  onRemove?: () => void;
  onPlay?: () => void;
  showRemove?: boolean;
  showPlay?: boolean;
  compact?: boolean;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  onRemove,
  onPlay,
  showRemove = false,
  showPlay = false,
  compact = false,
}) => {
  return (
    <Card style={[styles.container, compact && styles.containerCompact]}>
      <Image
        source={{ uri: song.thumbnail }}
        style={[styles.thumbnail, compact && styles.thumbnailCompact]}
      />

      <View style={styles.info}>
        <Text
          style={[styles.title, compact && styles.titleCompact]}
          numberOfLines={compact ? 1 : 2}
        >
          {song.title}
        </Text>

        {!compact && song.duration && (
          <Text style={styles.duration}>
            {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        {showPlay && (
          <TouchableOpacity onPress={onPlay} style={styles.actionButton}>
            <Ionicons name="play-circle" size={32} color={colors.neonBlue} />
          </TouchableOpacity>
        )}

        {showRemove && (
          <TouchableOpacity onPress={onRemove} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.md,
  },
  containerCompact: {
    padding: spacing.xs,
    gap: spacing.sm,
  },
  thumbnail: {
    width: 80,
    height: 45,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
  thumbnailCompact: {
    width: 60,
    height: 34,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  titleCompact: {
    fontSize: fontSize.sm,
  },
  duration: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
  },
});

export default SongCard;
