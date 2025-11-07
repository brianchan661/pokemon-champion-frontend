import Link from 'next/link';
import { memo, useMemo, useEffect } from 'react';
import { FeatureCardProps } from '@/types/home';
import { useImageLoader } from '@/hooks/useImageLoader';
import { getFeatureGradient } from '@/constants/gradients';

export const FeatureCard = memo(({ 
  href, 
  title, 
  backgroundImage
}: FeatureCardProps) => {
  const { imageLoaded, imageError, handleImageLoad, handleImageError, resetImageState } = useImageLoader();

  // Memoize gradient calculation to prevent recalculation on re-renders
  const gradientFallback = useMemo(() => getFeatureGradient(backgroundImage), [backgroundImage]);

  // Reset image state when backgroundImage changes
  useEffect(() => {
    resetImageState();
  }, [backgroundImage, resetImageState]);

  // Simplified image preloading with better error handling
  useEffect(() => {
    let isMounted = true;
    let img: HTMLImageElement | null = null;
    let timeoutId: NodeJS.Timeout;

    const loadImage = () => {
      // Validate image URL before loading
      if (!backgroundImage || typeof backgroundImage !== 'string') {
        if (isMounted) handleImageError();
        return;
      }

      img = new Image();
      
      const onLoad = () => {
        if (isMounted) {
          clearTimeout(timeoutId);
          handleImageLoad();
        }
      };
      
      const onError = () => {
        if (isMounted) {
          clearTimeout(timeoutId);
          console.warn(`Failed to load feature image: ${backgroundImage}`);
          handleImageError();
        }
      };
      
      // Set timeout for slow loading images (reduced from 10s to 5s)
      timeoutId = setTimeout(() => {
        if (isMounted && img) {
          console.warn(`Image loading timeout: ${backgroundImage}`);
          handleImageError();
        }
      }, 5000);
      
      img.onload = onLoad;
      img.onerror = onError;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = backgroundImage;
    };

    loadImage();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (img) {
        img.onload = null;
        img.onerror = null;
      }
    };
  }, [backgroundImage, handleImageLoad, handleImageError]);

  return (
    <Link 
      href={href} 
      className="group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
      aria-label={`Navigate to ${title} section`}
    >
      <div className="relative overflow-hidden rounded-lg hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 h-64">
        {/* Gradient fallback background */}
        <div className={`absolute inset-0 ${gradientFallback}`} />
        
        {/* Background image with loading states */}
        {!imageError && (
          <div 
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${backgroundImage})` }}
            role="img"
            aria-label={`${title} feature illustration`}
          />
        )}
        
        {/* Loading shimmer effect */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        )}
        
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-300" />
        
        {/* Content */}
        <div className="relative z-10 flex items-end justify-center h-full p-6">
          <h3 className="text-2xl font-bold text-white text-center drop-shadow-lg">
            {title}
          </h3>
        </div>
      </div>
    </Link>
  );
});

FeatureCard.displayName = 'FeatureCard';