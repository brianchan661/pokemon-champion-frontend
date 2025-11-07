import { useState, useEffect } from 'react';

interface AdBlockerDetection {
  isBlocking: boolean;
  isChecking: boolean;
  hasChecked: boolean;
}

/**
 * Hook to detect if an ad blocker is active
 *
 * Detection methods:
 * 1. Check if AdSense script loaded successfully
 * 2. Create a fake ad element and check if it's hidden/blocked
 * 3. Check for common ad blocker attributes
 */
export function useAdBlocker(): AdBlockerDetection {
  const [state, setState] = useState<AdBlockerDetection>({
    isBlocking: false,
    isChecking: true,
    hasChecked: false,
  });

  useEffect(() => {
    let isMounted = true;

    const detectAdBlocker = async () => {
      // Wait a bit for ad blockers to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!isMounted) return;

      try {
        // Method 1: Check if AdSense script loaded
        const adSenseScriptLoaded = document.querySelector('script[src*="adsbygoogle"]') !== null;

        // Method 2: Create a bait element that ad blockers typically block
        const baitElement = document.createElement('div');
        baitElement.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links';
        baitElement.style.width = '1px';
        baitElement.style.height = '1px';
        baitElement.style.position = 'absolute';
        baitElement.style.left = '-10000px';
        baitElement.style.top = '-1000px';

        document.body.appendChild(baitElement);

        // Wait for ad blocker to process
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if element was blocked
        const isElementBlocked =
          baitElement.offsetHeight === 0 ||
          baitElement.offsetWidth === 0 ||
          window.getComputedStyle(baitElement).display === 'none' ||
          window.getComputedStyle(baitElement).visibility === 'hidden';

        // Method 3: Check if adsbygoogle array exists and is functional
        const adsByGoogleBlocked = typeof (window as any).adsbygoogle === 'undefined' && adSenseScriptLoaded;

        // Clean up
        document.body.removeChild(baitElement);

        const isBlocking = !adSenseScriptLoaded || isElementBlocked || adsByGoogleBlocked;

        if (isMounted) {
          setState({
            isBlocking,
            isChecking: false,
            hasChecked: true,
          });
        }
      } catch (error) {
        console.error('Ad blocker detection error:', error);
        if (isMounted) {
          setState({
            isBlocking: false, // Assume no blocker if detection fails
            isChecking: false,
            hasChecked: true,
          });
        }
      }
    };

    detectAdBlocker();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
