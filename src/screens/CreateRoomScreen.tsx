import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, fontWeight } from '../theme/colors';
import { RootStackParamList } from '../types';
import { Button, Card, Input } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { useRoom } from '../hooks/useRoom';

type CreateRoomScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateRoom'>;
};

export const CreateRoomScreen: React.FC<CreateRoomScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { createRoom, isLoading, error } = useRoom();

  const [guestName, setGuestName] = useState('');
  const [showGuestInput, setShowGuestInput] = useState(!user);

  const handleCreateRoom = async () => {
    // If no user, need guest name
    if (!user && !guestName.trim()) {
      return;
    }

    // If no user, create guest first (this would be handled in auth flow)
    // For now, we redirect to auth
    if (!user) {
      navigation.navigate('Auth');
      return;
    }

    const room = await createRoom();
    if (room) {
      navigation.replace('Lobby', { roomId: room.id });
    }
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
          <Text style={styles.title}>Utwórz pokój</Text>
        </View>

        <View style={styles.content}>
          <Card style={styles.authPrompt}>
            <Ionicons name="person-circle" size={64} color={colors.neonBlue} />
            <Text style={styles.authTitle}>Wymagane logowanie</Text>
            <Text style={styles.authDescription}>
              Musisz się zalogować lub grać jako gość, aby utworzyć pokój.
            </Text>
            <Button
              title="Kontynuuj"
              onPress={() => navigation.navigate('Auth')}
              fullWidth
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Utwórz pokój</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.neonBlue} />
          <Text style={styles.infoText}>
            Utwórz pokój i udostępnij kod znajomym, aby zacząć grać!
          </Text>
        </Card>

        <View style={styles.userPreview}>
          <Text style={styles.previewLabel}>Grasz jako</Text>
          <Card style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.userName}>{user.displayName}</Text>
                <Text style={styles.userRole}>Host (Gospodarz)</Text>
              </View>
            </View>
          </Card>
        </View>

        {error && (
          <Card style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        <View style={styles.actions}>
          <Button
            title="Utwórz pokój"
            onPress={handleCreateRoom}
            loading={isLoading}
            size="large"
            fullWidth
            icon={
              isLoading ? undefined : (
                <Ionicons name="add-circle" size={24} color={colors.textPrimary} />
              )
            }
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.neonBlue + '10',
    borderWidth: 1,
    borderColor: colors.neonBlue + '30',
  },
  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  userPreview: {
    gap: spacing.sm,
  },
  previewLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  userCard: {
    padding: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neonPurple + '40',
    borderWidth: 2,
    borderColor: colors.neonPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  userRole: {
    color: colors.neonPink,
    fontSize: fontSize.sm,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error + '20',
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    flex: 1,
  },
  actions: {
    marginTop: 'auto',
  },
  authPrompt: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  authTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  authDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
});

export default CreateRoomScreen;
