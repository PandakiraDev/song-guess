import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import {
  getServerUrl,
  setServerUrl,
  testServerConnection,
} from '../../services/settingsService';
import { Button } from './Button';

interface ServerSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const [serverIp, setServerIp] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      const url = await getServerUrl();
      // Extract IP from URL like http://192.168.1.100:3001
      const match = url.match(/http:\/\/([^:]+):3001/);
      if (match) {
        setServerIp(match[1]);
      }
    };

    if (visible) {
      loadSettings();
      setTestResult(null);
    }
  }, [visible]);

  const getCurrentUrl = (): string => {
    if (!serverIp.trim()) {
      return '';
    }
    return `http://${serverIp.trim()}:3001`;
  };

  const handleTest = async () => {
    const url = getCurrentUrl();
    if (!url) {
      setTestResult({ success: false, message: 'Wpisz adres IP serwera' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testServerConnection(url);

    setTestResult(result);
    setIsTesting(false);
  };

  const handleSave = async () => {
    const url = getCurrentUrl();
    if (!url) {
      setTestResult({ success: false, message: 'Wpisz adres IP serwera' });
      return;
    }

    setIsSaving(true);
    await setServerUrl(url);
    setIsSaving(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <Ionicons name="server" size={24} color={colors.neonBlue} />
              <Text style={styles.title}>Ustawienia serwera</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={colors.neonBlue} />
              <Text style={styles.infoText}>
                Wpisz adres IP telefonu z serwerem (Termux).{'\n'}
                Znajdziesz go w: Ustawienia → WiFi → szczegóły sieci
              </Text>
            </View>

            {/* IP Input */}
            <View style={styles.ipInputContainer}>
              <Text style={styles.inputLabel}>Adres IP serwera</Text>
              <TextInput
                style={styles.input}
                value={serverIp}
                onChangeText={(text) => {
                  setServerIp(text);
                  setTestResult(null);
                }}
                placeholder="np. 192.168.1.100"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numeric"
              />
            </View>

            {/* Current URL Preview */}
            {serverIp.trim() && (
              <View style={styles.urlPreview}>
                <Text style={styles.urlLabel}>Pełny adres:</Text>
                <Text style={styles.urlValue}>{getCurrentUrl()}</Text>
              </View>
            )}

            {/* Test Connection */}
            <View style={styles.testSection}>
              <TouchableOpacity
                style={styles.testButton}
                onPress={handleTest}
                disabled={isTesting}
              >
                {isTesting ? (
                  <ActivityIndicator color={colors.neonBlue} size="small" />
                ) : (
                  <Ionicons name="pulse" size={20} color={colors.neonBlue} />
                )}
                <Text style={styles.testButtonText}>
                  {isTesting ? 'Testowanie...' : 'Testuj połączenie'}
                </Text>
              </TouchableOpacity>

              {testResult && (
                <View
                  style={[
                    styles.testResult,
                    testResult.success ? styles.testResultSuccess : styles.testResultError,
                  ]}
                >
                  <Ionicons
                    name={testResult.success ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color={testResult.success ? colors.success : colors.error}
                  />
                  <Text
                    style={[
                      styles.testResultText,
                      { color: testResult.success ? colors.success : colors.error },
                    ]}
                  >
                    {testResult.message}
                  </Text>
                </View>
              )}
            </View>

            {/* Help */}
            <View style={styles.helpBox}>
              <Text style={styles.helpTitle}>Jak znaleźć IP?</Text>
              <Text style={styles.helpText}>
                Na telefonie z Termuxem:{'\n'}
                • Otwórz Termux{'\n'}
                • Wpisz: ip addr | grep inet{'\n'}
                • Szukaj adresu zaczynającego się od 192.168.x.x lub 10.x.x.x
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title={isSaving ? 'Zapisywanie...' : 'Zapisz'}
              onPress={handleSave}
              fullWidth
              disabled={isSaving || !serverIp.trim()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.neonBlue + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    flex: 1,
    color: colors.neonBlue,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  ipInputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontFamily: 'monospace',
    borderWidth: 2,
    borderColor: colors.surfaceLight,
    textAlign: 'center',
  },
  urlPreview: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  urlLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  urlValue: {
    color: colors.neonGreen,
    fontSize: fontSize.md,
    fontFamily: 'monospace',
  },
  testSection: {
    marginBottom: spacing.lg,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.neonBlue + '15',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neonBlue + '30',
  },
  testButtonText: {
    color: colors.neonBlue,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  testResultSuccess: {
    backgroundColor: colors.success + '15',
  },
  testResultError: {
    backgroundColor: colors.error + '15',
  },
  testResultText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  helpBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  helpTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  helpText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
  },
});

export default ServerSettingsModal;
