import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { SetPasswordForm } from '@/components/Auth/SetPasswordForm';
import { getApiBaseUrl } from '@/config/api';

const VerifyEmail = () => {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState<'loading' | 'new-user' | 'existing-user' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token || typeof token !== 'string') return;

    const verifyToken = async () => {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/auth/verify-login/${token}`
        );

        const data = await response.json();

        if (data.success) {
          setEmail(data.data.email);

          if (data.data.isNewUser) {
            // New user - show password setup form
            setStatus('new-user');
          } else {
            // Existing user - auto-login
            setStatus('existing-user');

            // For existing users, we need to get the actual JWT token
            // by calling verify-email endpoint (old flow for existing users)
            const loginResponse = await fetch(
              `${getApiBaseUrl()}/auth/verify-email/${token}`
            );

            const loginData = await loginResponse.json();

            if (loginData.success && loginData.data.token) {
              // Store the token
              localStorage.setItem('token', loginData.data.token);

              // Redirect to last accessed page or home
              const returnUrl = sessionStorage.getItem('returnUrl') || '/';
              sessionStorage.removeItem('returnUrl');

              setTimeout(() => {
                router.push(returnUrl);
              }, 2000);
            }
          }
        } else {
          setStatus('error');
          setMessage(data.error || 'Invalid or expired link');
        }
      } catch (error: any) {
        console.error('Verify token error:', error);
        setStatus('error');
        setMessage('An error occurred. Please try again.');
      }
    };

    verifyToken();
  }, [token, router]);

  const handleRegistrationSuccess = (authToken: string) => {
    // Store the token
    localStorage.setItem('token', authToken);

    // Redirect to profile page for new users
    router.push('/profile');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {status === 'loading' && (
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>Verifying...</h2>
          <p style={{ color: '#666' }}>Please wait</p>
        </div>
      )}

      {status === 'new-user' && token && typeof token === 'string' && (
        <SetPasswordForm
          token={token}
          email={email}
          onSuccess={handleRegistrationSuccess}
          onError={setMessage}
        />
      )}

      {status === 'existing-user' && (
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#4CAF50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '30px',
            color: 'white'
          }}>
            ✓
          </div>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>Welcome back!</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Signing you in...</p>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#f44336',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '30px',
            color: 'white'
          }}>
            ✕
          </div>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>Error</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>{message}</p>
          <button
            onClick={() => router.push('/auth')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;
