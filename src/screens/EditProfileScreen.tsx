import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme/colors';
import { RootStackParamList, User } from '../types';
import { Card } from '../components/common';
import { AvatarSelector } from '../components/profile';
import { useAuth } from '../hooks/useAuth';
import { useUserStore } from '../store/userStore';
import { updateUserProfile } from '../services/authService';

type EditProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;
};

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const setUser = useUserStore((state) => state.setUser);

  // Form state
  const [nickname, setNickname] = useState(user?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(
    (user && 'avatar' in user ? user.avatar : 'avatar_1') || 'avatar_1'
  );

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  // Check if anything changed
  const hasChanges = useCallback(() => {
    if (!user) return false;
    const originalNickname = user.displayName;
    const originalAvatar = 'avatar' in user ? user.avatar : 'avatar_1';

    return (
      nickname.trim() !== originalNickname ||
      selectedAvatar !== originalAvatar
    );
  }, [user, nickname, selectedAvatar]);

  // Handle predefined avatar selection
  const handleSelectPredefined = (avatarId: string) => {
    setSelectedAvatar(avatarId);
  };

  // Validate nickname
  const validateNickname = (): boolean => {
    const trimmed = nickname.trim();
    if (trimmed.length < 2) {
      setNicknameError('Pseudonim musi mieć co najmniej 2 znaki');
      return false;
    }
    if (trimmed.length > 20) {
      setNicknameError('Pseudonim musi mieć mniej niż 20 znaków');
      return false;
    }
    setNicknameError(null);
    return true;
  };

  // Save profile
  const handleSave = async () => {
    if (!user || user.isGuest) return;
    if (!validateNickname()) return;
    if (!hasChanges()) {
      navigation.goBack();
      return;
    }

    setIsSaving(true);
    try {
      // Update Firestore
      await updateUserProfile(user.id, {
        displayName: nickname.trim(),
        avatar: selectedAvatar,
      });

      // Update local store
      setUser({
        ...user,
        displayName: nickname.trim(),
        avatar: selectedAvatar,
      } as User);

      navigation.goBack();
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Błąd', 'Nie udało się zapisać profilu. Spróbuj ponownie.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (hasChanges()) {
      Alert.alert(
        'Odrzucić zmiany?',
        'Masz niezapisane zmiany. Na pewno chcesz wrócić?',
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Odrzuć', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (!user || user.isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edytuj profil</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Tylko zarejestrowani użytkownicy mogą edytować profil</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edytuj profil</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.neonPink} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Zapisz</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nickname Input */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Pseudonim</Text>
            <TextInput
              style={[styles.input, nicknameError && styles.inputError]}
              value={nickname}
              onChangeText={(text) => {
                setNickname(text);
                if (nicknameError) setNicknameError(null);
              }}
              placeholder="Wpisz pseudonim"
              placeholderTextColor={colors.textMuted}
              maxLength={20}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {nicknameError && (
              <Text style={styles.errorMessage}>{nicknameError}</Text>
            )}
            <Text style={styles.charCount}>{nickname.length}/20</Text>
          </Card>

          {/* Avatar Selector */}
          <Card style={styles.section}>
            <AvatarSelector
              currentAvatar={selectedAvatar}
              onSelectPredefined={handleSelectPredefined}
              disabled={isSaving}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  saveButton: {
    minWidth: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  saveButtonText: {
    color: colors.neonPink,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: colors.error,
  },
  errorMessage: {
    color: colors.error,
    fontSize: fontSize.sm,
  },
  charCount: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'right',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
});

export default EditProfileScreen;
