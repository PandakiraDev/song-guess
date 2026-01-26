import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme/colors';
import { RootStackParamList } from '../types';
import { Button, Card, Input } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { useRoom } from '../hooks/useRoom';

type JoinRoomScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'JoinRoom'>;
  route: RouteProp<RootStackParamList, 'JoinRoom'>;
};

export const JoinRoomScreen: React.FC<JoinRoomScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const { joinRoom, isLoading, error } = useRoom();

  const [code, setCode] = useState(route.params?.code || '');

  useEffect(() => {
    if (route.params?.code) {
      setCode(route.params.code);
    }
  }, [route.params?.code]);

  const handleJoinRoom = async () => {
    if (!user) {
      navigation.navigate('Auth');
      return;
    }

    if (code.length !== 6) {
      return;
    }

    const room = await joinRoom(code);
    if (room) {
      navigation.replace('Lobby', { roomId: room.id });
    }
  };

  const handleCodeChange = (text: string) => {
    // Only allow numbers and limit to 6 characters
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(filtered);
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
          <Text style={styles.title}>Join Room</Text>
        </View>

        <View style={styles.content}>
          <Card style={styles.authPrompt}>
            <Ionicons name="person-circle" size={64} color={colors.neonBlue} />
            <Text style={styles.authTitle}>Sign In Required</Text>
            <Text style={styles.authDescription}>
              You need to sign in or play as a guest to join a room.
            </Text>
            <Button
              title="Continue"
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
        <Text style={styles.title}>Join Room</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.neonBlue} />
          <Text style={styles.infoText}>
            Enter the 6-digit room code shared by the host to join the game.
          </Text>
        </Card>

        {/* Code Input */}
        <View style={styles.codeInputContainer}>
          <Text style={styles.label}>Room Code</Text>
          <View style={styles.codeDisplay}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <View
                key={index}
                style={[
                  styles.codeDigit,
                  code[index] && styles.codeDigitFilled,
                ]}
              >
                <Text style={styles.codeDigitText}>{code[index] || ''}</Text>
              </View>
            ))}
          </View>

          <Input
            placeholder="Enter code"
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.hiddenInput}
            autoFocus
          />
        </View>

        {error && (
          <Card style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {/* Alternative: Scan QR */}
        <TouchableOpacity
          style={styles.scanOption}
          onPress={() => navigation.navigate('QRScanner')}
        >
          <Ionicons name="qr-code" size={24} color={colors.neonBlue} />
          <Text style={styles.scanText}>Or scan QR code</Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <Button
            title="Join Room"
            onPress={handleJoinRoom}
            loading={isLoading}
            disabled={code.length !== 6}
            size="large"
            fullWidth
            icon={
              isLoading ? undefined : (
                <Ionicons name="enter" size={24} color={colors.textPrimary} />
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
  codeInputContainer: {
    gap: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  codeDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  codeDigit: {
    width: 48,
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeDigitFilled: {
    borderColor: colors.neonPink,
    backgroundColor: colors.neonPink + '10',
  },
  codeDigitText: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
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
  scanOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  scanText: {
    color: colors.neonBlue,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
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

export default JoinRoomScreen;
