import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LinkSuccessPage() {
  const router = useRouter();
  const { success, error, popup } = router.query;

  useEffect(() => {
    // Wait for router to be ready
    if (!router.isReady) return;

    // Check if this is a popup by looking at the popup URL parameter
    const isPopup = popup === 'true';

    if (isPopup) {
      // Use localStorage to communicate since window.opener might be null after redirects
      const linkResult = {
        type: 'oauth-link-complete',
        success: success === 'google_linked',
        error: error as string,
        timestamp: Date.now()
      };

      localStorage.setItem('oauth_link_result', JSON.stringify(linkResult));

      // Also try postMessage if window.opener exists
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(linkResult, window.location.origin);
        } catch (e) {
          // Silently fail
        }
      }

      // Close the popup after a short delay to ensure localStorage is written
      setTimeout(() => {
        window.close();
      }, 500);
    } else {
      // If not in a popup, redirect to profile
      router.push('/profile');
    }
  }, [router.isReady, success, error, popup, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-700">
          {success === 'google_linked' ? 'Account linked successfully!' : error ? 'Link failed' : 'Processing...'}
        </p>
        <p className="text-sm text-gray-500 mt-2">This window will close automatically.</p>
      </div>
    </div>
  );
}
