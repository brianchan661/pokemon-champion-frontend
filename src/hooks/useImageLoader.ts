import { useState, useCallback } from 'react';

interface UseImageLoaderReturn {
  imageLoaded: boolean;
  imageError: boolean;
  handleImageLoad: () => void;
  handleImageError: () => void;
  resetImageState: () => void;
}

/**
 * Custom hook for managing image loading states
 */
export const useImageLoader = (): UseImageLoaderReturn => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoaded(false);
    setImageError(true);
  }, []);

  const resetImageState = useCallback(() => {
    setImageLoaded(false);
    setImageError(false);
  }, []);

  return {
    imageLoaded,
    imageError,
    handleImageLoad,
    handleImageError,
    resetImageState,
  };
};