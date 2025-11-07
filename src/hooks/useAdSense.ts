import { useEffect, useState } from 'react';

interface UseAdSenseReturn {
  isLoading: boolean;
  error: string | null;
  isReady: boolean;
}

/**
 * Custom hook for managing AdSense state and initialization
 * @param adSlot - The ad slot ID
 * @param clientId - The AdSense client ID
 * @returns Object containing loading state, error, and ready status
 */
export const useAdSense = (adSlot: string, clientId?: string): UseAdSenseReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const initializeAd = async () => {
      if (!isMounted) return;

      // Early validation
      if (!clientId) {
        setError('AdSense client ID not configured');
        setIsLoading(false);
        return;
      }

      if (!/^ca-pub-\d{16}$/.test(clientId)) {
        setError('Invalid AdSense client ID format');
        setIsLoading(false);
        return;
      }

      if (typeof window === 'undefined') {
        setError('Server-side rendering detected');
        setIsLoading(false);
        return;
      }

      try {
        // Wait for AdSense script with retry logic
        const checkAdSense = () => {
          return new Promise<void>((resolve, reject) => {
            const checkInterval = setInterval(() => {
              if (!isMounted) {
                clearInterval(checkInterval);
                reject(new Error('Component unmounted'));
                return;
              }

              if (window.adsbygoogle) {
                clearInterval(checkInterval);
                resolve();
              } else if (retryCount >= maxRetries) {
                clearInterval(checkInterval);
                reject(new Error('AdSense script failed to load after retries'));
              }
            }, 100);

            // Timeout after 5 seconds
            setTimeout(() => {
              clearInterval(checkInterval);
              reject(new Error('AdSense script load timeout'));
            }, 5000);
          });
        };

        await checkAdSense();

        if (!isMounted) return;

        // Initialize AdSense
        window.adsbygoogle?.push({});
        
        if (isMounted) {
          setIsReady(true);
          setError(null);
        }
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('AdSense initialization error:', err);
        
        // Retry logic
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initializeAd, 1000 * retryCount); // Exponential backoff
        } else {
          setError(`Advertisement initialization failed: ${errorMessage}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Debounce initialization
    const timer = setTimeout(initializeAd, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [adSlot, clientId]);

  return { isLoading, error, isReady };
};