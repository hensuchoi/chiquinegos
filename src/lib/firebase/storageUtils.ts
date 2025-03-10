import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask,
} from 'firebase/storage';
import { storage } from './firebase';

interface ProgressCallback {
  progress: number;
}

export const uploadBusinessImage = async (
  file: File,
  businessId: string,
  onProgress?: (progress: ProgressCallback) => void
): Promise<string> => {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `businesses/${businessId}/${fileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, filePath);
    
    // Start upload
    const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);
    
    // Return promise that resolves with download URL
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        // Progress callback
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.({ progress });
        },
        // Error callback
        (error) => {
          console.error('Error uploading image:', error);
          reject(error);
        },
        // Complete callback
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress?.({ progress: 100 });
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error in uploadBusinessImage:', error);
    throw error;
  }
};

export const deleteBusinessImage = async (imageUrl: string): Promise<void> => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Helper function to get user-friendly error messages
const getErrorMessage = (error: any): string => {
  if (error.code === 'storage/unauthorized') {
    return 'No tienes permiso para subir archivos. Por favor, inicia sesión.';
  }
  if (error.code === 'storage/canceled') {
    return 'La subida fue cancelada.';
  }
  if (error.code === 'storage/unknown') {
    return 'Ocurrió un error desconocido. Por favor, intenta de nuevo.';
  }
  return error.message || 'Error al subir el archivo.';
}; 