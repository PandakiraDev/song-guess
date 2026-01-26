import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors, spacing, fontSize, fontWeight } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CROP_SIZE = SCREEN_WIDTH - 80; // Circle diameter
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

interface ImageCropPickerProps {
  visible: boolean;
  imageUri: string;
  onConfirm: (croppedUri: string) => void;
  onCancel: () => void;
}

export const ImageCropPicker: React.FC<ImageCropPickerProps> = ({
  visible,
  imageUri,
  onConfirm,
  onCancel,
}) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Shared values for gestures
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Store image dimensions in shared values for UI thread access
  const imageWidth = useSharedValue(0);
  const imageHeight = useSharedValue(0);

  // Handle image load - get dimensions from Image.getSize
  useEffect(() => {
    if (visible && imageUri) {
      setImageLoaded(false);
      Image.getSize(
        imageUri,
        (width, height) => {
          setImageSize({ width, height });
          imageWidth.value = width;
          imageHeight.value = height;

          // Calculate initial scale to fit image in crop area
          const minDimension = Math.min(width, height);
          const initialScale = CROP_SIZE / minDimension;

          scale.value = initialScale;
          savedScale.value = initialScale;
          translateX.value = 0;
          translateY.value = 0;
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
          setImageLoaded(true);
        },
        (error) => {
          console.error('Failed to get image size:', error);
        }
      );
    }
  }, [visible, imageUri]);

  // Pan gesture - simplified without clamping on UI thread
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = Math.min(Math.max(savedScale.value * e.scale, MIN_SCALE), MAX_SCALE);
      scale.value = newScale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // Combine gestures
  const combinedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // Animated style for image
  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Crop and save image
  const handleConfirm = async () => {
    if (!imageSize.width || !imageSize.height) return;

    setIsProcessing(true);
    try {
      // Calculate crop region in original image coordinates
      const currentScale = scale.value;
      const currentTranslateX = translateX.value;
      const currentTranslateY = translateY.value;

      // Size of visible area in original image pixels
      const visibleSize = CROP_SIZE / currentScale;

      // Center of the crop area in scaled image coordinates
      const centerX = imageSize.width / 2 - currentTranslateX / currentScale;
      const centerY = imageSize.height / 2 - currentTranslateY / currentScale;

      // Crop origin
      const originX = Math.max(0, centerX - visibleSize / 2);
      const originY = Math.max(0, centerY - visibleSize / 2);

      // Ensure we don't crop outside the image
      const cropWidth = Math.min(visibleSize, imageSize.width - originX);
      const cropHeight = Math.min(visibleSize, imageSize.height - originY);

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.round(cropWidth),
              height: Math.round(cropHeight),
            },
          },
          { resize: { width: 256, height: 256 } },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      onConfirm(result.uri);
    } catch (error) {
      console.error('Failed to crop image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset state when modal closes
  const handleCancel = () => {
    setImageLoaded(false);
    setImageSize({ width: 0, height: 0 });
    imageWidth.value = 0;
    imageHeight.value = 0;
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleCancel}
    >
      <GestureHandlerRootView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crop Photo</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            style={styles.headerButton}
            disabled={isProcessing || !imageLoaded}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.neonPink} />
            ) : (
              <Ionicons
                name="checkmark"
                size={28}
                color={imageLoaded ? colors.neonPink : colors.textMuted}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Crop Area */}
        <View style={styles.cropContainer}>
          <GestureDetector gesture={combinedGesture}>
            <Animated.Image
              source={{ uri: imageUri }}
              style={[styles.image, animatedImageStyle]}
              resizeMode="contain"
            />
          </GestureDetector>

          {/* Overlay with circular cutout */}
          <View style={styles.overlay} pointerEvents="none">
            {/* Top */}
            <View style={[styles.overlayPart, { height: (SCREEN_HEIGHT - CROP_SIZE) / 2 - 60 }]} />
            {/* Middle row */}
            <View style={styles.middleRow}>
              {/* Left */}
              <View style={[styles.overlayPart, { width: (SCREEN_WIDTH - CROP_SIZE) / 2 }]} />
              {/* Circle cutout */}
              <View style={styles.circleContainer}>
                <View style={styles.circleBorder} />
              </View>
              {/* Right */}
              <View style={[styles.overlayPart, { width: (SCREEN_WIDTH - CROP_SIZE) / 2 }]} />
            </View>
            {/* Bottom */}
            <View style={[styles.overlayPart, { flex: 1 }]} />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            Pinch to zoom, drag to position
          </Text>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    paddingTop: 50, // Account for status bar
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  cropContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  overlayPart: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: CROP_SIZE,
  },
  circleContainer: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBorder: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderRadius: CROP_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.neonPink,
    backgroundColor: 'transparent',
  },
  instructions: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  instructionsText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
});

export default ImageCropPicker;
