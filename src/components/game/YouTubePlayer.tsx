import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { colors, borderRadius } from '../../theme/colors';

interface YouTubePlayerProps {
  videoId: string;
  startTime?: number;
  duration?: number; // How long to play (0 for full)
  onReady?: () => void;
  onEnd?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  autoPlay?: boolean;
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
  onEnd,
  onTimeUpdate,
  autoPlay = true,
  height = PLAYER_HEIGHT,
}) => {
  const playerRef = useRef<YoutubeIframeRef>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const handleReady = useCallback(() => {
    // Seek to start time
    if (startTime > 0) {
      playerRef.current?.seekTo(startTime, true);
    }
    onReady?.();

    // Start time tracking
    if (duration > 0) {
      startTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          onTimeUpdate?.(elapsed);

          if (elapsed >= duration) {
            // Stop playback after duration
            setIsPlaying(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            onEnd?.();
          }
        }
      }, 100);
    }
  }, [startTime, duration, onReady, onEnd, onTimeUpdate]);

  const handleStateChange = useCallback(
    (state: string) => {
      if (state === 'ended') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onEnd?.();
      }
    },
    [onEnd]
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
