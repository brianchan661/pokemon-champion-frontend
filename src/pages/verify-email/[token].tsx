import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const VerifyEmail = () => {
  const router = useRouter();
  const { token } = router.query;
  const { t } = useTranslation('common');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    const verifyEmail = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/verify-email/${token}`
        );

        if (response.data.success) {
          setStatus('success');
          setMessage(t('auth.emailVerified'));

          // Store the token
          if (response.data.data.token) {
            localStorage.setItem('token', response.data.data.token);
          }

          // Redirect to home after 3 seconds
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      } catch (error: any) {
        setStatus('error');
        const errorMessage =
          error.response?.data?.error || t('auth.emailVerificationFailed');
        setMessage(errorMessage);
      }
    };

    verifyEmail();
  }, [token, router, t]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
      }}>
        {status === 'loading' && (
          <>
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
            <h2 style={{ color: '#333', marginBottom: '10px' }}>
              {t('auth.verifyingEmail')}
            </h2>
            <p style={{ color: '#666' }}>{t('auth.pleaseWait')}</p>
          </>
        )}

        {status === 'success' && (
          <>
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
            <h2 style={{ color: '#333', marginBottom: '10px' }}>
              {t('auth.success')}
            </h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>{message}</p>
            <p style={{ color: '#999', fontSize: '14px' }}>
              {t('auth.redirectingToHome')}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
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
            <h2 style={{ color: '#333', marginBottom: '10px' }}>
              {t('auth.error')}
            </h2>
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
              {t('auth.backToLogin')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
