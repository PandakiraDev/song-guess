import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme/colors';
import { RootStackParamList } from '../types';
import { Button, Avatar, ServerSettingsModal } from '../components/common';
import { useAuth } from '../hooks/useAuth';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [showServerSettings, setShowServerSettings] = useState(false);

  const handleCreateRoom = () => {
    navigation.navigate('CreateRoom');
  };

  const handleJoinRoom = () => {
    navigation.navigate('JoinRoom', {});
  };

  const handleProfile = () => {
    if (user) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('Auth');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={[colors.background, colors.surface]}
        style={styles.gradient}
      >
        {/* Header */}
        <TouchableOpacity
          style={styles.header}
          onPress={handleProfile}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.surface, colors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.userSection}>
              {user ? (
                <Avatar
                  name={user.displayName}
                  avatarId={'avatar' in user ? user.avatar : undefined}
                  size="medium"
                  showBorder
                  borderColor={user.isGuest ? colors.textMuted : colors.neonPink}
                />
              ) : (
                <View style={styles.guestAvatarPlaceholder}>
                  <Ionicons name="person" size={24} color={colors.textMuted} />
                </View>
              )}

              <View style={styles.userTextContainer}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user ? user.displayName : 'Not signed in'}
                </Text>
                <View style={styles.statusRow}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: user && !user.isGuest ? colors.neonGreen : colors.textMuted }
                  ]} />
                  <Text style={styles.userStatus}>
                    {user ? (user.isGuest ? 'Guest' : 'Signed in') : 'Tap to sign in'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.headerArrow}>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Logo/Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>SongGuess</Text>
          <Text style={styles.subtitle}>Guess who added the song!</Text>
        </View>

        {/* Main Actions */}
        <View style={styles.actions}>
          <Button
            title="Create Room"
            onPress={handleCreateRoom}
            size="large"
            fullWidth
            icon={<Ionicons name="add-circle" size={24} color={colors.textPrimary} />}
          />

          <Button
            title="Join Room"
            onPress={handleJoinRoom}
            variant="outline"
            size="large"
            fullWidth
            icon={<Ionicons name="enter" size={24} color={colors.neonPink} />}
          />

          <Button
            title="Scan QR Code"
            onPress={() => navigation.navigate('QRScanner')}
            variant="secondary"
            size="large"
            fullWidth
            icon={<Ionicons name="qr-code" size={24} color={colors.textPrimary} />}
          />
        </View>

        {/* Server Settings */}
        <TouchableOpacity
          style={styles.serverButton}
          onPress={() => setShowServerSettings(true)}
          activeOpacity={0.7}
        >
          <View style={styles.serverButtonIcon}>
            <Ionicons name="server" size={18} color={colors.neonBlue} />
          </View>
          <View style={styles.serverButtonText}>
            <Text style={styles.serverButtonTitle}>Ustawienia serwera</Text>
            <Text style={styles.serverButtonSubtitle}>Skonfiguruj serwer audio (Termux)</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* How to Play */}
        <View style={styles.howToPlay}>
          <Text style={styles.howToPlayTitle}>How to Play</Text>
          <View style={styles.steps}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Create or join a room</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Everyone adds their favorite songs</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Guess who added each song!</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Server Settings Modal */}
      <ServerSettingsModal
        visible={showServerSettings}
        onClose={() => setShowServerSettings(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neonPurple + '30',
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  guestAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  userStatus: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  headerArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neonPurple + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  title: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.neonPink,
    textShadowColor: colors.neonPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  serverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neonBlue + '25',
    gap: spacing.md,
  },
  serverButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neonBlue + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serverButtonText: {
    flex: 1,
  },
  serverButtonTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  serverButtonSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  howToPlay: {
    marginTop: 'auto',
    paddingVertical: spacing.xl,
  },
  howToPlayTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  steps: {
    gap: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neonPurple + '40',
    borderWidth: 1,
    borderColor: colors.neonPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: colors.neonPurple,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  stepText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    flex: 1,
  },
});

export default HomeScreen;
