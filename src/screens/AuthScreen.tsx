import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme/colors';
import { RootStackParamList } from '../types';
import { Button, Input, Card } from '../components/common';
import { useAuth } from '../hooks/useAuth';

type AuthScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Auth'>;
};

type AuthMode = 'guest' | 'login' | 'register';

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const { signInAsGuest, signIn, signUp, signInGoogle, isLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>('guest');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGuestLogin = () => {
    if (!nickname.trim()) {
      setError('Wpisz pseudonim');
      return;
    }

    signInAsGuest(nickname.trim());
    navigation.goBack();
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) {
      setError('Wypełnij wszystkie pola');
      return;
    }

    try {
      setError(null);
      const user = await signIn(email.trim(), password);
      if (user) {
        navigation.goBack();
      } else {
        setError('Logowanie nie powiodło się. Sprawdź dane logowania.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';

      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password') {
        setError('Nieprawidłowy email lub hasło');
      } else if (errorCode === 'auth/user-not-found') {
        setError('Nie znaleziono konta z tym adresem email');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Nieprawidłowy adres email');
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Zbyt wiele prób. Spróbuj ponownie później.');
      } else if (errorCode === 'auth/network-request-failed') {
        setError('Błąd sieci. Sprawdź połączenie internetowe.');
      } else if (errorMessage.includes('invalid-credential') || errorMessage.includes('wrong-password')) {
        setError('Nieprawidłowy email lub hasło');
      } else if (errorMessage.includes('user-not-found')) {
        setError('Nie znaleziono konta z tym adresem email');
      } else {
        setError('Logowanie nie powiodło się. Spróbuj ponownie.');
      }
    }
  };

  const handleRegister = async () => {
    if (!nickname.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Wypełnij wszystkie pola');
      return;
    }

    if (password !== confirmPassword) {
      setError('Hasła nie pasują do siebie');
      return;
    }

    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków');
      return;
    }

    try {
      setError(null);
      const user = await signUp(email.trim(), password, nickname.trim());
      if (user) {
        navigation.goBack();
      } else {
        setError('Rejestracja nie powiodła się. Spróbuj ponownie.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';

      if (errorCode === 'auth/email-already-in-use') {
        setError('Ten email jest już zarejestrowany');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Nieprawidłowy adres email');
      } else if (errorCode === 'auth/weak-password') {
        setError('Hasło jest za słabe. Użyj co najmniej 6 znaków.');
      } else if (errorCode === 'auth/network-request-failed') {
        setError('Błąd sieci. Sprawdź połączenie internetowe.');
      } else if (errorMessage.includes('email-already-in-use')) {
        setError('Ten email jest już zarejestrowany');
      } else if (errorMessage.includes('permission')) {
        setError('Błąd bazy danych. Skontaktuj się z pomocą techniczną.');
      } else {
        setError('Rejestracja nie powiodła się. Spróbuj ponownie.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      const userData = await signInGoogle();
      if (userData) {
        navigation.goBack();
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err?.code === 'SIGN_IN_CANCELLED' || err?.code === '12501') return;
      setError('Logowanie przez Google nie powiodło się. Spróbuj ponownie.');
    }
  };

  const renderGoogleButton = () => (
    <View style={styles.googleSection}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>lub</Text>
        <View style={styles.dividerLine} />
      </View>
      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
        <Ionicons name="logo-google" size={20} color={colors.textPrimary} />
        <Text style={styles.googleButtonText}>Kontynuuj z Google</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGuestMode = () => (
    <View style={styles.form}>
      <Text style={styles.modeTitle}>Graj jako gość</Text>
      <Text style={styles.modeDescription}>
        Wpisz pseudonim, aby zacząć grać. Statystyki nie będą zapisywane.
      </Text>

      <Input
        label="Pseudonim"
        placeholder="Wpisz pseudonim"
        value={nickname}
        onChangeText={setNickname}
        icon="person"
        autoCapitalize="words"
      />

      <Button
        title="Kontynuuj jako gość"
        onPress={handleGuestLogin}
        loading={isLoading}
        fullWidth
      />
    </View>
  );

  const renderLoginMode = () => (
    <View style={styles.form}>
      <Text style={styles.modeTitle}>Witaj ponownie</Text>
      <Text style={styles.modeDescription}>
        Zaloguj się, aby śledzić statystyki i rywalizować ze znajomymi.
      </Text>

      <Input
        label="Email"
        placeholder="Wpisz email"
        value={email}
        onChangeText={setEmail}
        icon="mail"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="Hasło"
        placeholder="Wpisz hasło"
        value={password}
        onChangeText={setPassword}
        icon="lock-closed"
        secureTextEntry
      />

      <Button
        title="Zaloguj się"
        onPress={handleEmailLogin}
        loading={isLoading}
        fullWidth
      />

      {renderGoogleButton()}
    </View>
  );

  const renderRegisterMode = () => (
    <View style={styles.form}>
      <Text style={styles.modeTitle}>Utwórz konto</Text>
      <Text style={styles.modeDescription}>
        Zarejestruj się, aby zapisywać statystyki i wspinać się w rankingu.
      </Text>

      <Input
        label="Pseudonim"
        placeholder="Wybierz pseudonim"
        value={nickname}
        onChangeText={setNickname}
        icon="person"
        autoCapitalize="words"
      />

      <Input
        label="Email"
        placeholder="Wpisz email"
        value={email}
        onChangeText={setEmail}
        icon="mail"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="Hasło"
        placeholder="Utwórz hasło"
        value={password}
        onChangeText={setPassword}
        icon="lock-closed"
        secureTextEntry
      />

      <Input
        label="Potwierdź hasło"
        placeholder="Potwierdź hasło"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        icon="lock-closed"
        secureTextEntry
      />

      <Button
        title="Utwórz konto"
        onPress={handleRegister}
        loading={isLoading}
        fullWidth
      />

      {renderGoogleButton()}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>SongGuess</Text>
          </View>

          {/* Mode Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              onPress={() => setMode('guest')}
              style={[styles.tab, mode === 'guest' && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, mode === 'guest' && styles.tabTextActive]}
              >
                Gość
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('login')}
              style={[styles.tab, mode === 'login' && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, mode === 'login' && styles.tabTextActive]}
              >
                Logowanie
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('register')}
              style={[styles.tab, mode === 'register' && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, mode === 'register' && styles.tabTextActive]}
              >
                Rejestracja
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error && (
            <Card style={styles.errorCard}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </Card>
          )}

          {/* Form Content */}
          <Card style={styles.formCard}>
            {mode === 'guest' && renderGuestMode()}
            {mode === 'login' && renderLoginMode()}
            {mode === 'register' && renderRegisterMode()}
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.neonPink,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.neonPink + '30',
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  tabTextActive: {
    color: colors.neonPink,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error + '20',
    borderWidth: 1,
    borderColor: colors.error,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    flex: 1,
  },
  formCard: {
    padding: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  modeTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  modeDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  googleSection: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surfaceLight,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    backgroundColor: colors.surface,
  },
  googleButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});

export default AuthScreen;
