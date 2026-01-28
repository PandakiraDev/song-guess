import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SERVER_URL: '@songguess_server_url',
};

// Default: host mode (localhost)
const DEFAULT_SERVER_URL = 'http://127.0.0.1:3001';

// Get current server URL
export const getServerUrl = async (): Promise<string> => {
  try {
    const url = await AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL);
    console.log('[SettingsService] Stored URL:', url, '| Returning:', url || DEFAULT_SERVER_URL);
    return url || DEFAULT_SERVER_URL;
  } catch (error) {
    console.error('Failed to get server URL:', error);
    return DEFAULT_SERVER_URL;
  }
};

// Save server URL
export const setServerUrl = async (url: string): Promise<void> => {
  try {
    console.log('[SettingsService] Saving URL:', url);
    await AsyncStorage.setItem(STORAGE_KEYS.SERVER_URL, url);
    // Verify save
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL);
    console.log('[SettingsService] Verified saved URL:', saved);
  } catch (error) {
    console.error('Failed to save server URL:', error);
  }
};

// Test server connection
export const testServerConnection = async (url: string): Promise<{ success: boolean; message: string }> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Połączono!',
      };
    } else {
      return {
        success: false,
        message: `Błąd serwera: ${response.status}`,
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, message: 'Przekroczono czas połączenia' };
      }
      return { success: false, message: error.message };
    }
    return { success: false, message: 'Nieznany błąd' };
  }
};
