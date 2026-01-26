import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCodeSVG from 'react-native-qrcode-svg';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import { Card } from '../common';

interface QRCodeDisplayProps {
  value: string;
  roomCode: string;
  size?: number;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  roomCode,
  size = 200,
}) => {
  return (
    <Card variant="neon" neonColor="blue" style={styles.container}>
      <Text style={styles.title}>Scan to Join</Text>

      <View style={styles.qrContainer}>
        <QRCodeSVG
          value={value}
          size={size}
          color={colors.textPrimary}
          backgroundColor={colors.card}
        />
      </View>

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Room Code</Text>
        <Text style={styles.code}>{roomCode}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    color: colors.neonBlue,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  qrContainer: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
  },
  codeContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  codeLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  code: {
    color: colors.neonPink,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    letterSpacing: 8,
  },
});

export default QRCodeDisplay;
