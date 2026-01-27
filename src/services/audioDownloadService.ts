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

// Get audio stream URL from local yt-dlp server
const getAudioUrl = async (videoId: string): Promise<string> => {
  const serverUrl = await getServerUrl();
  console.log(`Getting audio URL from server (${serverUrl}) for: ${videoId}`);

  try {
    const response = await fetch(`${serverUrl}/audio/${videoId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.success || !data.url) {
      throw new Error(data.error || 'No audio URL returned');
    }

    console.log(`Got audio URL for ${videoId}`);
    return data.url;

  } catch (error) {
    console.error(`Failed to get audio URL:`, error);

    // Helpful error message
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to local server. Make sure the server is running on port 3001.');
    }

    throw error;
  }
};

// Get streaming URL for a song (no download needed - instant!)
export const downloadSongAudio = async (
  videoId: string,
  songId: string,
  onProgress?: (progress: number) => void
): Promise<DownloadResult> => {
  try {
    console.log(`Getting streaming URL for: ${videoId}`);
    onProgress?.(0.5);

    const audioUrl = await getAudioUrl(videoId);

    console.log(`Got streaming URL for: ${songId}`);
    onProgress?.(1);

    // Return the streaming URL directly - no download needed!
    return { success: true, localUri: audioUrl };
  } catch (error) {
    console.error(`Failed to get audio URL for ${songId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Download all songs for a game
export const downloadAllSongs = async (
  songs: Array<{ id: string; youtubeId: string }>,
  onProgressUpdate: (progress: Map<string, DownloadProgress>) => void
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

  // Download songs sequentially to avoid rate limiting
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
      }
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
