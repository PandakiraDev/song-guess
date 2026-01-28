import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight } from '../theme/colors';
import { RootStackParamList } from '../types';
import { Button, Card } from '../components/common';
import { QRCodeDisplay, PlayerList, RoomSettingsComponent } from '../components/room';
import { useRoom } from '../hooks/useRoom';
import { useAuth } from '../hooks/useAuth';

type LobbyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Lobby'>;
  route: RouteProp<RootStackParamList, 'Lobby'>;
};

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ navigation, route }) => {
  const { roomId } = route.params;
  const { user } = useAuth();
  const isLeavingRef = useRef(false);
  const {
    room,
    players,
    isHost,
    currentPlayer,
    allPlayersReady,
    isLoading,
    error,
    roomDeleted,
    updateSettings,
    updateStatus,
    toggleReady,
    leaveRoom,
  } = useRoom(roomId);

  // Handle room status changes
  useEffect(() => {
    if (room?.status === 'adding_songs') {
      navigation.replace('AddSongs', { roomId });
    }
  }, [room?.status, roomId, navigation]);

  // Handle room deletion (host left)
  useEffect(() => {
    if (roomDeleted && !isLeavingRef.current) {
      Alert.alert(
        'Pokój zamknięty',
        'Host zamknął pokój.',
        [{ text: 'OK', onPress: () => navigation.replace('Home') }],
        { cancelable: false }
      );
    }
  }, [roomDeleted, navigation]);

  const handleLeaveRoom = () => {
    Alert.alert(
      isHost ? 'Zamknij pokój' : 'Opuść pokój',
      isHost
        ? 'Na pewno chcesz zamknąć pokój? Wszyscy gracze zostaną usunięci.'
        : 'Na pewno chcesz opuścić pokój?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: isHost ? 'Zamknij' : 'Opuść',
          style: 'destructive',
          onPress: async () => {
            isLeavingRef.current = true;
            await leaveRoom();
            navigation.replace('Home');
          },
        },
      ]
    );
  };

  const handleStartGame = async () => {
    if (players.length < 2) {
      Alert.alert('Za mało graczy', 'Potrzebujesz co najmniej 2 graczy aby rozpocząć grę.');
      return;
    }

    await updateStatus('adding_songs');
  };

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Ładowanie pokoju...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeaveRoom} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Lobby</Text>
        <View style={styles.roomCode}>
          <Text style={styles.roomCodeLabel}>Kod:</Text>
          <Text style={styles.roomCodeValue}>{room.code}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Code (Host only) */}
        {isHost && (
          <QRCodeDisplay
            value={`songguess://join/${room.code}`}
            roomCode={room.code}
            size={150}
          />
        )}

        {/* Room Settings */}
        <RoomSettingsComponent
          settings={room.settings}
          onUpdate={updateSettings}
          disabled={!isHost}
        />

        {/* Player List */}
        <View style={styles.playerSection}>
          <PlayerList
            players={players}
            hostId={room.hostId}
            showReady
            currentUserId={user?.id}
          />
        </View>

        {/* Ready Status (non-host) */}
        {!isHost && currentPlayer && (
          <Card style={styles.readyCard}>
            <View style={styles.readyInfo}>
              <Ionicons
                name={currentPlayer.isReady ? 'checkmark-circle' : 'time-outline'}
                size={24}
                color={currentPlayer.isReady ? colors.success : colors.textSecondary}
              />
              <Text style={styles.readyText}>
                {currentPlayer.isReady
                  ? 'Gotowy! Czekam aż host rozpocznie...'
                  : 'Kliknij Gotowy gdy jesteś gotowy do gry'}
              </Text>
            </View>
            <Button
              title={currentPlayer.isReady ? 'Nie gotowy' : 'Gotowy'}
              variant={currentPlayer.isReady ? 'outline' : 'primary'}
              onPress={() => toggleReady(!currentPlayer.isReady)}
            />
          </Card>
        )}

        {/* Waiting Info (Host) */}
        {isHost && !allPlayersReady && players.length > 1 && (
          <Card style={styles.waitingCard}>
            <Ionicons name="time-outline" size={24} color={colors.warning} />
            <Text style={styles.waitingText}>
              Czekam aż wszyscy gracze będą gotowi...
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Start Button (Host only) */}
      {isHost && (
        <View style={styles.footer}>
          <Button
            title="Rozpocznij grę"
            onPress={handleStartGame}
            size="large"
            fullWidth
            disabled={players.length < 2 || !allPlayersReady}
            icon={<Ionicons name="play" size={24} color={colors.textPrimary} />}
          />
          {players.length < 2 && (
            <Text style={styles.minPlayersText}>
              Potrzeba co najmniej 2 graczy
            </Text>
          )}
          {players.length >= 2 && !allPlayersReady && (
            <Text style={styles.minPlayersText}>
              Czekam aż wszyscy gracze będą gotowi
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
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
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  roomCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  roomCodeLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  roomCodeValue: {
    color: colors.neonPink,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  playerSection: {
    flex: 1,
    minHeight: 200,
  },
  readyCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  readyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  readyText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.warning + '20',
    borderWidth: 1,
    borderColor: colors.warning,
  },
  waitingText: {
    flex: 1,
    color: colors.warning,
    fontSize: fontSize.sm,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  minPlayersText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});

export default LobbyScreen;
