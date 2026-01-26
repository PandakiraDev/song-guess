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
  const { signInAsGuest, signIn, signUp, isLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>('guest');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGuestLogin = () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    signInAsGuest(nickname.trim());
    navigation.goBack();
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError(null);
      const user = await signIn(email.trim(), password);
      if (user) {
        navigation.goBack();
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Firebase errors have a 'code' property
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';

      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (errorCode === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if (errorCode === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else if (errorMessage.includes('invalid-credential') || errorMessage.includes('wrong-password')) {
        // Fallback: check message string
        setError('Invalid email or password');
      } else if (errorMessage.includes('user-not-found')) {
        setError('No account found with this email');
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    }
  };

  const handleRegister = async () => {
    if (!nickname.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError(null);
      const user = await signUp(email.trim(), password, nickname.trim());
      if (user) {
        navigation.goBack();
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      // Firebase errors have a 'code' property
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';

      if (errorCode === 'auth/email-already-in-use') {
        setError('This email is already registered');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (errorCode === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else if (errorCode === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else if (errorMessage.includes('email-already-in-use')) {
        setError('This email is already registered');
      } else if (errorMessage.includes('permission')) {
        setError('Database error. Please contact support.');
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  const renderGuestMode = () => (
    <View style={styles.form}>
      <Text style={styles.modeTitle}>Play as Guest</Text>
      <Text style={styles.modeDescription}>
        Enter a nickname to start playing. Your stats won't be saved.
      </Text>

      <Input
        label="Nickname"
        placeholder="Enter your nickname"
        value={nickname}
        onChangeText={setNickname}
        icon="person"
        autoCapitalize="words"
      />

      <Button
        title="Continue as Guest"
        onPress={handleGuestLogin}
        loading={isLoading}
        fullWidth
      />
    </View>
  );

  const renderLoginMode = () => (
    <View style={styles.form}>
      <Text style={styles.modeTitle}>Welcome Back</Text>
      <Text style={styles.modeDescription}>
        Sign in to track your stats and compete with friends.
      </Text>

      <Input
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        icon="mail"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        icon="lock-closed"
        secureTextEntry
      />

      <Button
        title="Sign In"
        onPress={handleEmailLogin}
        loading={isLoading}
        fullWidth
      />
    </View>
  );

  const renderRegisterMode = () => (
    <View style={styles.form}>
      <Text style={styles.modeTitle}>Create Account</Text>
      <Text style={styles.modeDescription}>
        Sign up to save your stats and climb the leaderboard.
      </Text>

      <Input
        label="Nickname"
        placeholder="Choose a nickname"
        value={nickname}
        onChangeText={setNickname}
        icon="person"
        autoCapitalize="words"
      />

      <Input
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        icon="mail"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="Password"
        placeholder="Create a password"
        value={password}
        onChangeText={setPassword}
        icon="lock-closed"
        secureTextEntry
      />

      <Input
        label="Confirm Password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        icon="lock-closed"
        secureTextEntry
      />

      <Button
        title="Create Account"
        onPress={handleRegister}
        loading={isLoading}
        fullWidth
      />
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
                Guest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('login')}
              style={[styles.tab, mode === 'login' && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, mode === 'login' && styles.tabTextActive]}
              >
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('register')}
              style={[styles.tab, mode === 'register' && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, mode === 'register' && styles.tabTextActive]}
              >
                Register
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
});

export default AuthScreen;
