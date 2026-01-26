import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme/colors';
import { RootStackParamList } from '../types';
import { Button, Card, Avatar } from '../components/common';
import { useAuth } from '../hooks/useAuth';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
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
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.notLoggedIn}>
          <Ionicons name="person-circle" size={80} color={colors.textMuted} />
          <Text style={styles.notLoggedInText}>You're not signed in</Text>
          <Button
            title="Sign In"
            onPress={() => navigation.navigate('Auth')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isGuest = user.isGuest;
  const stats = !isGuest ? (user as any) : null;

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
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* User Info */}
      <View style={styles.content}>
        <Card style={styles.profileCard}>
          <Avatar
            name={user.displayName}
            avatarId={'avatar' in user ? user.avatar : undefined}
            size="xlarge"
            showBorder
            borderColor={colors.neonPink}
          />
          <Text style={styles.userName}>{user.displayName}</Text>
          {isGuest ? (
            <View style={styles.guestBadge}>
              <Text style={styles.guestBadgeText}>Guest</Text>
            </View>
          ) : (
            <Text style={styles.userEmail}>{(user as any).email}</Text>
          )}
        </Card>

        {/* Stats (registered users only) */}
        {!isGuest && stats && (
          <Card style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="game-controller" size={24} color={colors.neonBlue} />
                <Text style={styles.statValue}>{stats.gamesPlayed || 0}</Text>
                <Text style={styles.statLabel}>Games Played</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trophy" size={24} color={colors.neonPink} />
                <Text style={styles.statValue}>{stats.totalWins || 0}</Text>
                <Text style={styles.statLabel}>Wins</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="star" size={24} color={colors.neonGreen} />
                <Text style={styles.statValue}>{stats.totalPoints || 0}</Text>
                <Text style={styles.statLabel}>Total Points</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="analytics" size={24} color={colors.neonPurple} />
                <Text style={styles.statValue}>
                  {stats.gamesPlayed > 0
                    ? Math.round((stats.totalWins / stats.gamesPlayed) * 100)
                    : 0}
                  %
                </Text>
                <Text style={styles.statLabel}>Win Rate</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Guest Upgrade Prompt */}
        {isGuest && (
          <Card style={styles.upgradeCard}>
            <Ionicons name="information-circle" size={24} color={colors.neonBlue} />
            <View style={styles.upgradeInfo}>
              <Text style={styles.upgradeTitle}>Create an Account</Text>
              <Text style={styles.upgradeText}>
                Sign up to save your stats and track your progress!
              </Text>
            </View>
            <Button
              title="Sign Up"
              onPress={() => navigation.navigate('Auth')}
              size="small"
            />
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            fullWidth
            icon={<Ionicons name="log-out" size={20} color={colors.neonPink} />}
          />
        </View>
      </View>
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
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  profileCard: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
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
  statsCard: {
    padding: spacing.lg,
  },
  statsTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
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
  actions: {
    marginTop: 'auto',
  },
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
