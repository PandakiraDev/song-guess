import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, fontWeight } from '../theme/colors';
import { RootStackParamList } from '../types';
import { Button, Avatar } from '../components/common';
import { useAuth } from '../hooks/useAuth';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <LinearGradient
        colors={[colors.background, colors.surface]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          {user ? (
            <View style={styles.userInfo}>
              <Avatar
                name={user.displayName}
                avatarId={'avatar' in user ? user.avatar : undefined}
                size="small"
              />
              <Text style={styles.userName}>{user.displayName}</Text>
            </View>
          ) : (
            <View />
          )}

          <Button
            title=""
            variant="ghost"
            onPress={handleProfile}
            icon={<Ionicons name="person-circle" size={28} color={colors.neonBlue} />}
          />
        </View>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
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
