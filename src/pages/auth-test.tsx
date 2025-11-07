import { useState } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';

// Simple test page without complex dependencies
export default function AuthTestPage() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <Head>
        <title>Auth Test | Pokemon Champion</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">Auth Test Page</h1>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded">
              <h2 className="font-medium text-blue-900 mb-2">Test Instructions:</h2>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. If you see this page, basic routing works</li>
                <li>2. Check browser console for any errors</li>
                <li>3. Visit /auth for full authentication page</li>
              </ol>
            </div>
            
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <h3 className="font-medium text-green-900 mb-2">Backend Status Check:</h3>
              <BackendTestWidget />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Simple status check component
const BackendTestWidget = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [message, setMessage] = useState('');

  const testBackend = async () => {
    setStatus('checking');
    try {
      const response = await fetch('http://localhost:3001/api/health');
      if (response.ok) {
        const data = await response.json();
        setStatus('connected');
        setMessage(data.message || 'Connected successfully');
      } else {
        setStatus('error');
        setMessage(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Connection failed');
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={testBackend}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={status === 'checking'}
      >
        {status === 'checking' ? 'Testing...' : 'Test Backend Connection'}
      </button>
      
      {message && (
        <div className={`p-2 rounded text-sm ${
          status === 'connected' ? 'bg-green-100 text-green-800' :
          status === 'error' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};