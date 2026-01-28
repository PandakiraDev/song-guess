import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme/colors';
import { RootStackParamList } from '../types';
import { Button, Card } from '../components/common';

type QRScannerScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'QRScanner'>;
};

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({
  navigation,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);

    // Parse the QR code data
    // Expected format: songguess://join/123456 or just 123456
    let roomCode: string | null = null;

    if (data.startsWith('songguess://join/')) {
      roomCode = data.replace('songguess://join/', '');
    } else if (/^\d{6}$/.test(data)) {
      roomCode = data;
    }

    if (roomCode) {
      navigation.replace('JoinRoom', { code: roomCode });
    } else {
      Alert.alert(
        'Nieprawidłowy kod QR',
        'Ten kod QR nie jest prawidłowym kodem pokoju SongGuess.',
        [
          {
            text: 'Skanuj ponownie',
            onPress: () => setScanned(false),
          },
          {
            text: 'Anuluj',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.message}>Proszę o dostęp do kamery...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Skanuj kod QR</Text>
        </View>

        <View style={styles.centerContent}>
          <Card style={styles.permissionCard}>
            <Ionicons name="camera-outline" size={48} color={colors.error} />
            <Text style={styles.permissionTitle}>Wymagany dostęp do kamery</Text>
            <Text style={styles.permissionText}>
              Włącz dostęp do kamery, aby skanować kody QR.
            </Text>
            <Button
              title="Przyznaj uprawnienie"
              onPress={requestPermission}
            />
            <Button
              title="Wpisz kod ręcznie"
              variant="outline"
              onPress={() => navigation.replace('JoinRoom', {})}
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.title}>Skanuj kod QR</Text>
      </View>

      {/* Scanner */}
      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            <Text style={styles.instructions}>
              Skieruj kamerę na kod QR SongGuess
            </Text>
          </View>
        </View>
      </View>

      {/* Manual Entry Option */}
      <View style={styles.footer}>
        <Button
          title="Wpisz kod ręcznie"
          variant="outline"
          onPress={() => navigation.replace('JoinRoom', {})}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const SCAN_AREA_SIZE = 250;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    zIndex: 10,
  },
  backButton: {
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  message: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
  },
  permissionCard: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    maxWidth: 300,
  },
  permissionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  permissionText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  scannerContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTop: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.neonPink,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  overlayBottom: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  instructions: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.lg,
  },
});

export default QRScannerScreen;
