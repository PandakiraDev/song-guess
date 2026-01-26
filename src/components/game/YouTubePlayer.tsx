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
}) => {
  const playerRef = useRef<YoutubeIframeRef>(null);
  const [internalPlaying, setInternalPlaying] = useState(autoPlay);
  const [contentDetected, setContentDetected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasCalledContentReady = useRef(false);

  // Use external playing state if provided, otherwise use internal state
  // But only allow external control AFTER content is detected (ads finished)
  const isPlaying = contentDetected
    ? (externalPlaying !== undefined ? externalPlaying : internalPlaying)
    : internalPlaying; // During ads, use internal state (autoPlay)

  // Reset flags when videoId changes
  React.useEffect(() => {
    hasCalledContentReady.current = false;
    setContentDetected(false);
  }, [videoId]);

  const handleReady = useCallback(() => {
    // Seek to start time
    if (startTime > 0) {
      playerRef.current?.seekTo(startTime, true);
    }
    onReady?.();
  }, [startTime, onReady]);

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
      if (state === 'ended') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onEnd?.();
      }
      // When video actually starts playing (after any ads), pause and notify parent
      if (state === 'playing' && !hasCalledContentReady.current) {
        // Check current time to confirm it's the actual video, not an ad
        playerRef.current?.getCurrentTime().then((time) => {
          // If we're at or near our start time, the actual video is playing (not ad)
          // Ads typically play from time 0, our video starts at startTime
          if (time >= startTime - 1 && !hasCalledContentReady.current) {
            hasCalledContentReady.current = true;
            setContentDetected(true);
            // Pause immediately - we'll resume when host triggers sync start
            setInternalPlaying(false);
            // Notify parent that content is ready (paused at start)
            onContentReady?.();
          }
        });
      }
      // Start duration tracking when we resume after content ready
      if (state === 'playing' && contentDetected && !startTimeRef.current) {
        startDurationTracking();
      }
    },
    [onEnd, onContentReady, startTime, startDurationTracking, contentDetected]
  );

  // Cleanup interval on unmount
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
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
        webViewProps={{
          injectedJavaScript: `
            var element = document.getElementsByClassName('container')[0];
            element.style.position = 'unset';
            element.style.paddingBottom = 'unset';
            true;
          `,
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
