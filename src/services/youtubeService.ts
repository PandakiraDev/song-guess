import { YouTubeSearchResult, HeatmapMarker } from '../types';

// YouTube Data API key - replace with your own
// TODO: Replace with your YouTube Data API v3 key
const YOUTUBE_API_KEY = 'AIzaSyD2xTrw7tW41AiiRLr-3vi6QWc2WaSSmus';

// Cache for search results (reduces API calls)
const searchCache = new Map<string, { results: YouTubeSearchResult[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for video details
const videoDetailsCache = new Map<string, { duration: number; title: string; thumbnail: string; timestamp: number }>();

// Search YouTube for videos (with caching)
export const searchYouTube = async (query: string): Promise<YouTubeSearchResult[]> => {
  const cacheKey = query.toLowerCase().trim();
  const cached = searchCache.get(cacheKey);

  // Return cached results if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.results;
  }

  try {
    // Reduced maxResults to 5 to save API quota
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(
        query
      )}&type=video&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('YouTube search failed');
    }

    const data = await response.json();

    const results = data.items
      .filter((item: any) => item.id?.videoId && item.snippet?.title)
      .map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || '',
        channelTitle: item.snippet.channelTitle || '',
      }));

    // Cache the results
    searchCache.set(cacheKey, { results, timestamp: Date.now() });

    return results;
  } catch (error) {
    console.error('YouTube search error:', error);
    throw error;
  }
};

// Get video details (including duration) - with caching
export const getVideoDetails = async (videoId: string): Promise<{
  duration: number;
  title: string;
  thumbnail: string;
}> => {
  // Check cache first
  const cached = videoDetailsCache.get(videoId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return {
      duration: cached.duration,
      title: cached.title,
      thumbnail: cached.thumbnail,
    };
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to get video details');
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = data.items[0];
    const duration = parseDuration(video.contentDetails.duration);
    const title = video.snippet.title;
    const thumbnail = video.snippet.thumbnails.medium.url;

    // Cache the result
    videoDetailsCache.set(videoId, { duration, title, thumbnail, timestamp: Date.now() });

    return { duration, title, thumbnail };
  } catch (error) {
    console.error('Get video details error:', error);
    throw error;
  }
};

// Parse ISO 8601 duration to seconds
const parseDuration = (duration: string): number => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

  if (!match) return 0;

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;

  return hours * 3600 + minutes * 60 + seconds;
};

// Get "Most Replayed" timestamp (peak moment)
// This attempts to fetch the heatmap data from YouTube
export const getMostReplayedTimestamp = async (videoId: string): Promise<number | null> => {
  try {
    // Note: This is a workaround that may not work consistently
    // In production, consider using a Cloud Function as proxy
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Try to extract heatmap data
    const heatmapMatch = html.match(/"heatMarkers":\[(.*?)\]/);

    if (heatmapMatch) {
      try {
        const markers: HeatmapMarker[] = JSON.parse(`[${heatmapMatch[1]}]`);

        if (markers.length > 0) {
          // Find the marker with highest intensity
          const peak = markers.reduce((max, m) =>
            m.intensityScoreNormalized > max.intensityScoreNormalized ? m : max
          );

          return peak.startMillis / 1000; // Convert to seconds
        }
      } catch (e) {
        console.log('Failed to parse heatmap data');
      }
    }

    return null;
  } catch (error) {
    console.log('getMostReplayedTimestamp error:', error);
    return null;
  }
};

// Estimate a good start time based on video duration
// Fallback when "Most Replayed" data is not available
export const estimatePeakTime = (duration: number): number => {
  // Most songs have chorus/hook around 25-35% of the song
  // We start at approximately 30% of the duration
  const estimatedPeak = Math.floor(duration * 0.3);

  // Clamp between 10 seconds and 2 minutes
  return Math.max(10, Math.min(estimatedPeak, 120));
};

// Get the best start time for a video
// Simplified: just use estimated peak time (faster, no extra network request)
export const getBestStartTime = async (_videoId: string, duration: number): Promise<number> => {
  // Use estimated peak time based on duration
  // Skipping heatmap fetch as it's slow and unreliable
  return estimatePeakTime(duration);
};

// Format duration for display (mm:ss)
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Extract video ID from YouTube URL
export const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
};
