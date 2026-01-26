import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export interface UploadAvatarResult {
  url: string;
  path: string;
}

/**
 * Upload avatar image to Firebase Storage
 * @param userId - User's Firebase UID
 * @param imageUri - Local URI of the image to upload
 * @returns Promise with download URL and storage path
 */
export const uploadAvatar = async (
  userId: string,
  imageUri: string
): Promise<UploadAvatarResult> => {
  // Convert URI to blob
  const response = await fetch(imageUri);
  const blob = await response.blob();

  // Create unique filename with timestamp
  const filename = `avatar_${Date.now()}.jpg`;
  const storagePath = `avatars/${userId}/${filename}`;
  const storageRef = ref(storage, storagePath);

  // Upload with content type
  await uploadBytes(storageRef, blob, {
    contentType: 'image/jpeg',
  });

  // Get download URL
  const url = await getDownloadURL(storageRef);

  return { url, path: storagePath };
};

/**
 * Delete avatar from Firebase Storage
 * @param storagePath - Full storage path to delete
 */
export const deleteAvatar = async (storagePath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    // Ignore errors (file may not exist)
    console.log('Could not delete old avatar:', error);
  }
};
