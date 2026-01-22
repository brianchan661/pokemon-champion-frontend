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

    const initializeAd = async () => {
      if (!isMounted) return;

      // Early validation
      if (!clientId) {
        setError('AdSense client ID not configured');
        setIsLoading(false);
        return;
      }

      if (!/^ca-pub-\d{16,30}$/.test(clientId)) {
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
        // Initialize AdSense only if there are unfilled slots matching this ID
        // We do a simple check for the script object. If it's not ready, it might be async loading.

        // Wait a small amount of time to allow script to define window variable if it's racing
        if (!window.adsbygoogle) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (window.adsbygoogle) {
          const adSlots = document.querySelectorAll(`ins.adsbygoogle[data-ad-slot="${adSlot}"]`);
          const hasUnfilledSlots = Array.from(adSlots).some(slot =>
            !slot.hasAttribute('data-adsbygoogle-status') && !slot.hasAttribute('data-ad-status')
          );

          if (hasUnfilledSlots) {
            try {
              window.adsbygoogle.push({});
            } catch (e) {
              console.error('AdSense push error:', e);
            }
          }
        }

        if (isMounted) {
          setIsReady(true);
          setError(null);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('AdSense initialization error:', err);
        // Silent failure is preferred over error state for ads
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