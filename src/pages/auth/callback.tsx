import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

const OAuthCallback = () => {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get token and newUser flag from URL parameters
        const { token, error: urlError, newUser } = router.query;

        if (urlError) {
          // Handle error from OAuth flow
          const errorMessages: Record<string, string> = {
            oauth_failed: 'OAuth authentication failed. Please try again.',
            oauth_no_user: 'Failed to create or find user account.',
            oauth_error: 'An error occurred during authentication.',
          };

          setError(errorMessages[urlError as string] || 'Authentication failed');
          setProcessing(false);

          // Redirect to auth page after 3 seconds
          setTimeout(() => {
            router.push('/auth');
          }, 3000);
          return;
        }

        if (!token) {
          setError('No authentication token received');
          setProcessing(false);
          setTimeout(() => {
            router.push('/auth');
          }, 3000);
          return;
        }

        // Store token using authService (updates both localStorage and internal state)
        // Explicitly clear any existing session first to ensure no cross-contamination
        localStorage.removeItem('authToken');

        // Use authService to set the NEW token
        const tokenString = Array.isArray(token) ? token[0] : token;
        authService.setToken(tokenString);

        console.log('Processed OAuth Token:', tokenString.substring(0, 10) + '...');

        // Refresh user profile to update auth context
        await refreshProfile();

        // Redirect based on whether this is a new user
        if (newUser === 'true') {
          // New user - redirect to profile page to complete setup
          router.push('/profile');
        } else {
          // Existing user - redirect to last accessed page or teams page
          const returnUrl = sessionStorage.getItem('returnUrl') || '/teams';
          sessionStorage.removeItem('returnUrl');
          router.push(returnUrl);
        }
      } catch (err) {
        console.error('Error handling OAuth callback:', err);
        setError('Failed to complete authentication');
        setProcessing(false);

        setTimeout(() => {
          router.push('/auth');
        }, 3000);
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router.isReady, router.query, refreshProfile, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {processing ? (
            <>
              <div className="mb-4">
                <svg
                  className="animate-spin h-12 w-12 mx-auto text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Completing Sign In
              </h2>
              <p className="text-gray-600">
                Please wait while we finish setting up your account...
              </p>
            </>
          ) : error ? (
            <>
              <div className="mb-4">
                <svg
                  className="h-12 w-12 mx-auto text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <p className="text-sm text-gray-500">
                Redirecting back to login page...
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
