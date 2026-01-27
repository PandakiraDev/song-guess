import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SERVER_URL: '@songguess_server_url',
};

// Default server URLs
export const SERVER_PRESETS = {
  localhost: 'http://127.0.0.1:3001',
  emulator: 'http://10.0.2.2:3001',
} as const;

export type ServerPreset = keyof typeof SERVER_PRESETS | 'custom';

export interface AppSettings {
  serverUrl: string;
  serverPreset: ServerPreset;
}

const DEFAULT_SETTINGS: AppSettings = {
  serverUrl: SERVER_PRESETS.localhost,
  serverPreset: 'localhost',
};

// Get current server URL
export const getServerUrl = async (): Promise<string> => {
  try {
    const url = await AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL);
    return url || DEFAULT_SETTINGS.serverUrl;
  } catch (error) {
    console.error('Failed to get server URL:', error);
    return DEFAULT_SETTINGS.serverUrl;
  }
};

// Save server URL
export const setServerUrl = async (url: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SERVER_URL, url);
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
        message: data.message || 'Connected!',
      };
    } else {
      return {
        success: false,
        message: `Server error: ${response.status}`,
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, message: 'Connection timeout' };
      }
      return { success: false, message: error.message };
    }
    return { success: false, message: 'Unknown error' };
  }
};
