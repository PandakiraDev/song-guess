import * as FileSystemLegacy from 'expo-file-system/legacy';
import { getServerUrl } from './settingsService';

const AUDIO_CACHE_DIR = `${FileSystemLegacy.cacheDirectory}song-guess-audio/`;

export interface DownloadProgress {
  songId: string;
  videoId: string;
  progress: number; // 0-1
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
  localUri?: string;
}

export interface DownloadResult {
  success: boolean;
  localUri?: string;
  error?: string;
}

// Ensure cache directory exists
const ensureCacheDir = async (): Promise<void> => {
  const dirInfo = await FileSystemLegacy.getInfoAsync(AUDIO_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystemLegacy.makeDirectoryAsync(AUDIO_CACHE_DIR, { intermediates: true });
  }
};

// Download audio file from server to local storage
export const downloadSongAudio = async (
  videoId: string,
  songId: string,
  onProgress?: (progress: number) => void,
  serverUrl?: string
): Promise<DownloadResult> => {
  try {
    await ensureCacheDir();

    const localUri = `${AUDIO_CACHE_DIR}${songId}.m4a`;

    // Check if already downloaded
    const fileInfo = await FileSystemLegacy.getInfoAsync(localUri);
    if (fileInfo.exists && 'size' in fileInfo && fileInfo.size > 0) {
      console.log(`Already cached: ${songId}`);
      onProgress?.(1);
      return { success: true, localUri };
    }

    const server = serverUrl || await getServerUrl();
    const downloadUrl = `${server}/download/${videoId}`;

    console.log(`Downloading ${videoId} from ${downloadUrl}`);
    onProgress?.(0.1);

    // Download file
    const downloadResult = await FileSystemLegacy.downloadAsync(
      downloadUrl,
      localUri,
      {
        headers: {
          'Accept': 'audio/mp4,audio/*',
        },
      }
    );

    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }

    // Verify file was downloaded
    const downloadedInfo = await FileSystemLegacy.getInfoAsync(localUri);
    if (!downloadedInfo.exists || !('size' in downloadedInfo) || downloadedInfo.size === 0) {
      throw new Error('Downloaded file is empty or missing');
    }

    console.log(`Downloaded ${songId}: ${downloadedInfo.size} bytes`);
    onProgress?.(1);

    return { success: true, localUri };
  } catch (error) {
    console.error(`Failed to download ${songId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Download all songs for a game
export const downloadAllSongs = async (
  songs: Array<{ id: string; youtubeId: string }>,
  onProgressUpdate: (progress: Map<string, DownloadProgress>) => void,
  serverUrl?: string
): Promise<Map<string, DownloadProgress>> => {
  const progressMap = new Map<string, DownloadProgress>();

  // Initialize progress for all songs
  songs.forEach((song) => {
    progressMap.set(song.id, {
      songId: song.id,
      videoId: song.youtubeId,
      progress: 0,
      status: 'pending',
    });
  });

  onProgressUpdate(new Map(progressMap));

  // Download songs sequentially
  for (const song of songs) {
    progressMap.set(song.id, {
      ...progressMap.get(song.id)!,
      status: 'downloading',
    });
    onProgressUpdate(new Map(progressMap));

    const result = await downloadSongAudio(
      song.youtubeId,
      song.id,
      (progress) => {
        progressMap.set(song.id, {
          ...progressMap.get(song.id)!,
          progress,
        });
        onProgressUpdate(new Map(progressMap));
      },
      serverUrl
    );

    if (result.success) {
      progressMap.set(song.id, {
        ...progressMap.get(song.id)!,
        progress: 1,
        status: 'completed',
        localUri: result.localUri,
      });
    } else {
      progressMap.set(song.id, {
        ...progressMap.get(song.id)!,
        status: 'error',
        error: result.error,
      });
    }

    onProgressUpdate(new Map(progressMap));
  }

  return progressMap;
};

// Get local URI for a song (if downloaded)
export const getSongLocalUri = async (songId: string): Promise<string | null> => {
  const localUri = `${AUDIO_CACHE_DIR}${songId}.m4a`;
  const fileInfo = await FileSystemLegacy.getInfoAsync(localUri);
  return fileInfo.exists ? localUri : null;
};

// Clear all cached audio files
export const clearAudioCache = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystemLegacy.getInfoAsync(AUDIO_CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystemLegacy.deleteAsync(AUDIO_CACHE_DIR, { idempotent: true });
      console.log('Audio cache cleared');
    }
  } catch (error) {
    console.error('Failed to clear audio cache:', error);
  }
};

// Clear specific song from cache
export const clearSongFromCache = async (songId: string): Promise<void> => {
  try {
    const localUri = `${AUDIO_CACHE_DIR}${songId}.m4a`;
    const fileInfo = await FileSystemLegacy.getInfoAsync(localUri);
    if (fileInfo.exists) {
      await FileSystemLegacy.deleteAsync(localUri);
    }
  } catch (error) {
    console.error(`Failed to clear song ${songId} from cache:`, error);
  }
};

// Get cache size
export const getAudioCacheSize = async (): Promise<number> => {
  try {
    const dirInfo = await FileSystemLegacy.getInfoAsync(AUDIO_CACHE_DIR);
    if (!dirInfo.exists) return 0;

    const files = await FileSystemLegacy.readDirectoryAsync(AUDIO_CACHE_DIR);
    let totalSize = 0;

    for (const file of files) {
      const fileInfo = await FileSystemLegacy.getInfoAsync(`${AUDIO_CACHE_DIR}${file}`);
      if (fileInfo.exists && 'size' in fileInfo) {
        totalSize += fileInfo.size || 0;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Failed to get cache size:', error);
    return 0;
  }
};
