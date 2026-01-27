import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import { DownloadProgress as DownloadProgressType } from '../../services/audioDownloadService';

interface DownloadProgressProps {
  progress: Map<string, DownloadProgressType>;
  songTitles: Map<string, string>;
}

export const DownloadProgress: React.FC<DownloadProgressProps> = ({
  progress,
  songTitles,
}) => {
  const progressArray = Array.from(progress.values());

  const completedCount = progressArray.filter((p) => p.status === 'completed').length;
  const totalCount = progressArray.length;
  const overallProgress = totalCount > 0 ? completedCount / totalCount : 0;

  const getStatusIcon = (status: DownloadProgressType['status']) => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={20} color={colors.success} />;
      case 'downloading':
        return <Ionicons name="cloud-download" size={20} color={colors.neonBlue} />;
      case 'error':
        return <Ionicons name="alert-circle" size={20} color={colors.error} />;
      default:
        return <Ionicons name="hourglass" size={20} color={colors.textSecondary} />;
    }
  };

  const getStatusColor = (status: DownloadProgressType['status']) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'downloading':
        return colors.neonBlue;
      case 'error':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="cloud-download" size={32} color={colors.neonPink} />
        <Text style={styles.title}>Preparing Game</Text>
        <Text style={styles.subtitle}>
          Downloading songs for ad-free playback
        </Text>
      </View>

      {/* Overall Progress */}
      <View style={styles.overallProgress}>
        <View style={styles.overallProgressBar}>
          <View
            style={[
              styles.overallProgressFill,
              { width: `${overallProgress * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.overallProgressText}>
          {completedCount} / {totalCount} songs ready
        </Text>
      </View>

      {/* Song List */}
      <ScrollView style={styles.songList} showsVerticalScrollIndicator={false}>
        {progressArray.map((item) => (
          <View key={item.songId} style={styles.songItem}>
            <View style={styles.songIcon}>{getStatusIcon(item.status)}</View>

            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {songTitles.get(item.songId) || 'Unknown Song'}
              </Text>

              {item.status === 'downloading' && (
                <View style={styles.songProgressBar}>
                  <View
                    style={[
                      styles.songProgressFill,
                      { width: `${item.progress * 100}%` },
                    ]}
                  />
                </View>
              )}

              {item.status === 'error' && (
                <Text style={styles.errorText} numberOfLines={1}>
                  {item.error || 'Download failed'}
                </Text>
              )}
            </View>

            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status === 'downloading'
                ? `${Math.round(item.progress * 100)}%`
                : item.status}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
        <Text style={styles.infoText}>
          Songs are cached temporarily and deleted after the game
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  overallProgress: {
    marginBottom: spacing.xl,
  },
  overallProgressBar: {
    height: 12,
    backgroundColor: colors.surface,
    borderRadius: 6,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: colors.neonPink,
    borderRadius: 6,
  },
  overallProgressText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  songList: {
    flex: 1,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  songIcon: {
    marginRight: spacing.md,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  songProgressBar: {
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  songProgressFill: {
    height: '100%',
    backgroundColor: colors.neonBlue,
    borderRadius: 2,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    marginLeft: spacing.sm,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
});

export default DownloadProgress;
