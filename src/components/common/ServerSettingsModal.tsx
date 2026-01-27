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
  SERVER_PRESETS,
  ServerPreset,
} from '../../services/settingsService';
import { Button } from './Button';

interface ServerSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface PresetOption {
  key: ServerPreset;
  label: string;
  description: string;
  url: string;
}

const PRESET_OPTIONS: PresetOption[] = [
  {
    key: 'localhost',
    label: 'Ten telefon (Termux)',
    description: 'Serwer działa na tym samym telefonie',
    url: SERVER_PRESETS.localhost,
  },
  {
    key: 'emulator',
    label: 'Emulator Android',
    description: 'Serwer na komputerze, gra w emulatorze',
    url: SERVER_PRESETS.emulator,
  },
  {
    key: 'custom',
    label: 'Inny telefon / komputer',
    description: 'Podaj IP urządzenia w sieci lokalnej',
    url: '',
  },
];

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ServerPreset>('localhost');
  const [customUrl, setCustomUrl] = useState('http://192.168.1.100:3001');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      const url = await getServerUrl();

      // Determine which preset matches
      if (url === SERVER_PRESETS.localhost) {
        setSelectedPreset('localhost');
      } else if (url === SERVER_PRESETS.emulator) {
        setSelectedPreset('emulator');
      } else {
        setSelectedPreset('custom');
        setCustomUrl(url);
      }
    };

    if (visible) {
      loadSettings();
      setTestResult(null);
    }
  }, [visible]);

  const getCurrentUrl = (): string => {
    if (selectedPreset === 'custom') {
      return customUrl;
    }
    return SERVER_PRESETS[selectedPreset];
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    const url = getCurrentUrl();
    const result = await testServerConnection(url);

    setTestResult(result);
    setIsTesting(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const url = getCurrentUrl();
    await setServerUrl(url);
    setIsSaving(false);
    onClose();
  };

  const handlePresetSelect = (preset: ServerPreset) => {
    setSelectedPreset(preset);
    setTestResult(null);
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
            {/* Info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={colors.neonBlue} />
              <Text style={styles.infoText}>
                Serwer działa tylko lokalnie (Termux lub komputer w tej samej sieci WiFi). Tryb "YouTube" działa bez serwera.
              </Text>
            </View>

            {/* Preset Options */}
            <Text style={styles.sectionTitle}>Wybierz lokalizację serwera</Text>

            {PRESET_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.presetOption,
                  selectedPreset === option.key && styles.presetOptionSelected,
                ]}
                onPress={() => handlePresetSelect(option.key)}
              >
                <View style={styles.presetRadio}>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedPreset === option.key && styles.radioOuterSelected,
                    ]}
                  >
                    {selectedPreset === option.key && <View style={styles.radioInner} />}
                  </View>
                </View>
                <View style={styles.presetContent}>
                  <Text style={styles.presetLabel}>{option.label}</Text>
                  <Text style={styles.presetDescription}>{option.description}</Text>
                  {option.key !== 'custom' && (
                    <Text style={styles.presetUrl}>{option.url}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {/* Custom URL Input */}
            {selectedPreset === 'custom' && (
              <View style={styles.customUrlContainer}>
                <Text style={styles.inputLabel}>Adres serwera</Text>
                <TextInput
                  style={styles.input}
                  value={customUrl}
                  onChangeText={(text) => {
                    setCustomUrl(text);
                    setTestResult(null);
                  }}
                  placeholder="http://192.168.1.100:3001"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <Text style={styles.inputHint}>
                  Podaj IP urządzenia z serwerem (znajdziesz je w ustawieniach WiFi)
                </Text>
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

            {/* Help Section */}
            <TouchableOpacity
              style={styles.helpToggle}
              onPress={() => setShowHelp(!showHelp)}
            >
              <Ionicons
                name={showHelp ? 'chevron-up' : 'help-circle-outline'}
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.helpToggleText}>
                {showHelp ? 'Ukryj instrukcję' : 'Jak uruchomić serwer?'}
              </Text>
            </TouchableOpacity>

            {showHelp && (
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>Termux (na telefonie):</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>pkg install python nodejs</Text>
                  <Text style={styles.codeText}>pip install yt-dlp</Text>
                  <Text style={styles.codeText}>cd song-guess-server</Text>
                  <Text style={styles.codeText}>npm start</Text>
                </View>

                <Text style={styles.helpTitle}>Komputer (Node.js):</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>cd server</Text>
                  <Text style={styles.codeText}>npm install</Text>
                  <Text style={styles.codeText}>npm start</Text>
                </View>

                <Text style={styles.helpNote}>
                  Serwer wymaga zainstalowanego yt-dlp.{'\n'}
                  Windows: winget install yt-dlp{'\n'}
                  Mac: brew install yt-dlp
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title={isSaving ? 'Zapisywanie...' : 'Zapisz'}
              onPress={handleSave}
              fullWidth
              disabled={isSaving}
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
    maxHeight: '90%',
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
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  presetOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetOptionSelected: {
    borderColor: colors.neonBlue,
    backgroundColor: colors.neonBlue + '10',
  },
  presetRadio: {
    marginRight: spacing.md,
    paddingTop: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.neonBlue,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neonBlue,
  },
  presetContent: {
    flex: 1,
  },
  presetLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  presetDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  presetUrl: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontFamily: 'monospace',
    marginTop: spacing.xs,
  },
  customUrlContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontFamily: 'monospace',
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  inputHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  testSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
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
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
  },
  helpToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  helpToggleText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  helpContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  helpTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  codeBlock: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  codeText: {
    color: colors.neonGreen,
    fontSize: fontSize.xs,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  helpNote: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 16,
    marginTop: spacing.sm,
  },
});

export default ServerSettingsModal;
