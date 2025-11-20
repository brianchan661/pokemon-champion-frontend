import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { QueryClient, useIsRestoring } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState, useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import '@/styles/globals.css';

const HydrationWrapper = ({ children }: { children: React.ReactNode }) => {
  const isRestoring = useIsRestoring();
  if (isRestoring) {
    return null; // Render nothing while restoring cache to avoid loading flash
  }
  return <>{children}</>;
};

function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
      },
    },
  }));

  const [persister, setPersister] = useState<any>(null);

  useEffect(() => {
    // Ensure localStorage is available (client-side only)
    if (typeof window !== 'undefined') {
      setPersister(createSyncStoragePersister({
        storage: window.localStorage,
      }));
    }
  }, []);

  if (!persister) {
    // Render without persistence during SSR or initial client mount before persister is ready
    // This avoids hydration mismatches
    return null;
  }

  return (
    <ThemeProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <HydrationWrapper>
          <AuthProvider>
            <Component {...pageProps} />
          </AuthProvider>
        </HydrationWrapper>
      </PersistQueryClientProvider>
    </ThemeProvider>
  );
}

export default appWithTranslation(App);