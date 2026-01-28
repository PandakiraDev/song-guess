import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme/colors';
import { RootStackParamList, User } from '../types';
import { Button, Card, Avatar } from '../components/common';
import { useAuth } from '../hooks/useAuth';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

const StatBox: React.FC<{
  icon: string;
  iconColor: string;
  value: string;
  label: string;
  wide?: boolean;
}> = ({ icon, iconColor, value, label, wide }) => (
  <View style={[styles.statBox, wide && styles.statBoxWide]}>
    <View style={[styles.statIconBg, { backgroundColor: iconColor + '20' }]}>
      <Ionicons name={icon as any} size={18} color={iconColor} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Wyloguj',
      'Na pewno chcesz się wylogować?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyloguj',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            navigation.replace('Home');
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Profil</Text>
        </View>

        <View style={styles.notLoggedIn}>
          <Ionicons name="person-circle" size={80} color={colors.textMuted} />
          <Text style={styles.notLoggedInText}>Nie jesteś zalogowany</Text>
          <Button
            title="Zaloguj się"
            onPress={() => navigation.navigate('Auth')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isGuest = user.isGuest;
  const u = !isGuest ? (user as User) : null;

  // Computed stats
  const winRate = u && u.gamesPlayed > 0
    ? Math.round((u.totalWins / u.gamesPlayed) * 100)
    : 0;
  const accuracy = u && u.totalGuesses > 0
    ? Math.round((u.totalCorrectGuesses / u.totalGuesses) * 100)
    : 0;
  const avgResponseTime = u && u.totalResponseCount > 0
    ? (u.totalResponseTimeMs / u.totalResponseCount / 1000).toFixed(2)
    : '—';
  const fastestTime = u && u.fastestCorrectMs > 0
    ? (u.fastestCorrectMs / 1000).toFixed(2)
    : '—';
  const avgPointsPerGame = u && u.gamesPlayed > 0
    ? (u.totalPoints / u.gamesPlayed).toFixed(1)
    : '0';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Profil</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <LinearGradient
            colors={[colors.neonPink + '15', colors.neonPurple + '10', 'transparent']}
            style={styles.profileGradient}
          >
            <Avatar
              name={user.displayName}
              avatarId={'avatar' in user ? user.avatar : undefined}
              avatarUrl={'avatarUrl' in user ? (user as User).avatarUrl : undefined}
              size="xlarge"
              showBorder
              borderColor={colors.neonPink}
            />
            <Text style={styles.userName}>{user.displayName}</Text>
            {isGuest ? (
              <View style={styles.guestBadge}>
                <Text style={styles.guestBadgeText}>Gość</Text>
              </View>
            ) : (
              <Text style={styles.userEmail}>{(user as User).email}</Text>
            )}
            {!isGuest && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Ionicons name="pencil" size={14} color={colors.neonPink} />
                <Text style={styles.editButtonText}>Edytuj profil</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Card>

        {/* Stats for registered users */}
        {!isGuest && u && (
          <>
            {/* Main Stats Row */}
            <View style={styles.mainStatsRow}>
              <View style={styles.mainStat}>
                <Text style={[styles.mainStatValue, { color: colors.neonBlue }]}>
                  {u.gamesPlayed || 0}
                </Text>
                <Text style={styles.mainStatLabel}>Gier</Text>
              </View>
              <View style={[styles.mainStat, styles.mainStatCenter]}>
                <Text style={[styles.mainStatValue, { color: colors.neonPink }]}>
                  {u.totalWins || 0}
                </Text>
                <Text style={styles.mainStatLabel}>Zwycięstw</Text>
              </View>
              <View style={styles.mainStat}>
                <Text style={[styles.mainStatValue, { color: colors.neonGreen }]}>
                  {winRate}%
                </Text>
                <Text style={styles.mainStatLabel}>% wygranych</Text>
              </View>
            </View>

            {/* Detailed Stats */}
            <Text style={styles.sectionTitle}>Statystyki</Text>
            <View style={styles.statsGrid}>
              <StatBox
                icon="star"
                iconColor={colors.neonGreen}
                value={`${u.totalPoints || 0}`}
                label="Łącznie punktów"
              />
              <StatBox
                icon="trending-up"
                iconColor={colors.neonBlue}
                value={avgPointsPerGame}
                label="Śr. punkty/grę"
              />
              <StatBox
                icon="checkmark-done-circle"
                iconColor={colors.success}
                value={`${accuracy}%`}
                label="Celność"
              />
              <StatBox
                icon="flame"
                iconColor={colors.warning}
                value={`${u.bestStreak || 0}x`}
                label="Najlepsza seria"
              />
              <StatBox
                icon="time"
                iconColor={colors.neonPurple}
                value={avgResponseTime === '—' ? '—' : `${avgResponseTime}s`}
                label="Śr. czas odpowiedzi"
              />
              <StatBox
                icon="flash"
                iconColor={colors.neonPink}
                value={fastestTime === '—' ? '—' : `${fastestTime}s`}
                label="Najszybsza odpowiedź"
              />
            </View>

            {/* Progress Bar - Accuracy */}
            <Card style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Poprawne odpowiedzi</Text>
                <Text style={styles.progressValue}>
                  {u.totalCorrectGuesses || 0} / {u.totalGuesses || 0}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${accuracy}%` },
                  ]}
                />
              </View>
            </Card>
          </>
        )}

        {/* Guest Upgrade Prompt */}
        {isGuest && (
          <Card style={styles.upgradeCard}>
            <Ionicons name="information-circle" size={24} color={colors.neonBlue} />
            <View style={styles.upgradeInfo}>
              <Text style={styles.upgradeTitle}>Załóż konto</Text>
              <Text style={styles.upgradeText}>
                Zarejestruj się aby śledzić swoje statystyki!
              </Text>
            </View>
            <Button
              title="Rejestracja"
              onPress={() => navigation.navigate('Auth')}
              size="small"
            />
          </Card>
        )}

        {/* Sign Out */}
        <View style={styles.actions}>
          <Button
            title="Wyloguj"
            onPress={handleSignOut}
            variant="outline"
            fullWidth
            icon={<Ionicons name="log-out" size={20} color={colors.neonPink} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backButton: {
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    overflow: 'hidden',
    padding: 0,
  },
  profileGradient: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.sm,
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  guestBadge: {
    backgroundColor: colors.neonPurple + '30',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  guestBadgeText: {
    color: colors.neonPurple,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neonPink + '20',
    borderRadius: borderRadius.round,
  },
  editButtonText: {
    color: colors.neonPink,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // Main stats row (games / wins / win rate)
  mainStatsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  mainStat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  mainStatCenter: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.surfaceLight,
  },
  mainStatValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  mainStatLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // Section title
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statBox: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  statBoxWide: {
    width: '100%',
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },

  // Progress card
  progressCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  progressValue: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.neonGreen,
    borderRadius: 4,
  },

  // Upgrade card
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.neonBlue + '10',
    borderWidth: 1,
    borderColor: colors.neonBlue + '30',
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  upgradeText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },

  // Actions
  actions: {
    marginTop: spacing.md,
  },

  // Not logged in
  notLoggedIn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  notLoggedInText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
  },
});

export default ProfileScreen;
