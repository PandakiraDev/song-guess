import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { colors, borderRadius } from '../../theme/colors';

interface YouTubePlayerProps {
  videoId: string;
  startTime?: number;
  duration?: number; // How long to play (0 for full)
  onReady?: () => void; // Called when player is ready (video loaded)
  onContentReady?: () => void; // Called when actual content is ready (after ads, paused)
  onEnd?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  autoPlay?: boolean;
  playing?: boolean; // External control for play state (true = play, false = pause)
  height?: number;
  muted?: boolean; // Mute during ad detection
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLAYER_WIDTH = SCREEN_WIDTH - 32;
const PLAYER_HEIGHT = (PLAYER_WIDTH * 9) / 16;

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  startTime = 0,
  duration = 0,
  onReady,
  onContentReady,
  onEnd,
  onTimeUpdate,
  autoPlay = true,
  playing: externalPlaying,
  height = PLAYER_HEIGHT,
  muted = false,
}) => {
  const playerRef = useRef<YoutubeIframeRef>(null);
  const [internalPlaying, setInternalPlaying] = useState(autoPlay);
  const [contentDetected, setContentDetected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasCalledContentReady = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const adCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playingStateCount = useRef(0);
  const lastTimeCheck = useRef(0);

  // Use external playing state if provided, otherwise use internal state
  // But only allow external control AFTER content is detected (ads finished)
  const isPlaying = contentDetected
    ? (externalPlaying !== undefined ? externalPlaying : internalPlaying)
    : internalPlaying; // During ads, use internal state (autoPlay)

  // Reset flags when videoId changes
  React.useEffect(() => {
    hasCalledContentReady.current = false;
    setContentDetected(false);
    playingStateCount.current = 0;
    lastTimeCheck.current = 0;

    // Clear any existing intervals/timeouts
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    if (adCheckIntervalRef.current) {
      clearInterval(adCheckIntervalRef.current);
    }
  }, [videoId]);

  // Start ad detection polling when video starts
  const startAdDetection = useCallback(() => {
    if (adCheckIntervalRef.current) {
      clearInterval(adCheckIntervalRef.current);
    }

    // Poll every 500ms to check if we're past ads
    adCheckIntervalRef.current = setInterval(async () => {
      if (hasCalledContentReady.current) {
        if (adCheckIntervalRef.current) {
          clearInterval(adCheckIntervalRef.current);
        }
        return;
      }

      try {
        const currentTime = await playerRef.current?.getCurrentTime();
        if (currentTime === undefined) return;

        // Check if time is progressing normally (not stuck at 0 or jumping around like ads)
        const timeDiff = currentTime - lastTimeCheck.current;
        lastTimeCheck.current = currentTime;

        // If we're at or past our start time and time is progressing normally
        // This means actual content is playing, not an ad
        if (currentTime >= Math.max(0, startTime - 2) && timeDiff > 0 && timeDiff < 2) {
          // Content is playing - pause and notify
          hasCalledContentReady.current = true;
          setContentDetected(true);
          setInternalPlaying(false);

          if (adCheckIntervalRef.current) {
            clearInterval(adCheckIntervalRef.current);
          }

          console.log('YouTubePlayer: Content detected at time', currentTime);
          onContentReady?.();
        }
      } catch (error) {
        // Ignore errors during polling
      }
    }, 500);
  }, [startTime, onContentReady]);

  // Fallback timeout - if content doesn't load in 25 seconds, mark as ready anyway
  React.useEffect(() => {
    if (!hasCalledContentReady.current) {
      loadingTimeoutRef.current = setTimeout(() => {
        if (!hasCalledContentReady.current) {
          console.log('YouTubePlayer: Loading timeout, marking as ready');
          hasCalledContentReady.current = true;
          setContentDetected(true);
          setInternalPlaying(false);

          if (adCheckIntervalRef.current) {
            clearInterval(adCheckIntervalRef.current);
          }

          onContentReady?.();
        }
      }, 25000); // 25 second timeout
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [videoId, onContentReady]);

  const handleReady = useCallback(() => {
    // Seek to start time
    if (startTime > 0) {
      playerRef.current?.seekTo(startTime, true);
    }
    onReady?.();

    // Start ad detection polling
    startAdDetection();
  }, [startTime, onReady, startAdDetection]);

  // Start duration tracking only when actual content is playing (after ads)
  const startDurationTracking = useCallback(() => {
    if (duration > 0 && !startTimeRef.current) {
      startTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          onTimeUpdate?.(elapsed);

          if (elapsed >= duration) {
            // Stop playback after duration
            setInternalPlaying(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            onEnd?.();
          }
        }
      }, 100);
    }
  }, [duration, onTimeUpdate, onEnd]);

  // Reset tracking when not playing
  React.useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
    }
  }, [isPlaying]);

  const handleStateChange = useCallback(
    (state: string) => {
      console.log('YouTubePlayer: State changed to', state);

      if (state === 'ended') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onEnd?.();
      }

      // Track playing state changes
      if (state === 'playing') {
        playingStateCount.current += 1;
      }

      // Start duration tracking when we resume after content ready
      if (state === 'playing' && contentDetected && !startTimeRef.current) {
        startDurationTracking();
      }
    },
    [onEnd, startDurationTracking, contentDetected]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (adCheckIntervalRef.current) {
        clearInterval(adCheckIntervalRef.current);
      }
    };
  }, []);

  return (
    <View style={[styles.container, { height }]}>
      <YoutubePlayer
        ref={playerRef}
        height={height}
        width={PLAYER_WIDTH}
        play={isPlaying}
        videoId={videoId}
        onReady={handleReady}
        onChangeState={handleStateChange}
        initialPlayerParams={{
          preventFullScreen: true,
          modestbranding: true,
          rel: false,
          iv_load_policy: 3, // Hide annotations
        }}
        webViewProps={{
          androidLayerType: 'hardware', // Better performance on Android
          injectedJavaScript: `
            var element = document.getElementsByClassName('container')[0];
            element.style.position = 'unset';
            element.style.paddingBottom = 'unset';
            true;
          `,
          mediaPlaybackRequiresUserAction: false,
          allowsInlineMediaPlayback: true,
          startInLoadingState: true,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: PLAYER_WIDTH,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
});

export default YouTubePlayer;
