import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const DEBUG = process.env.NODE_ENV === 'development';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    let cancelled = false;

    setMounted(true);

    // Get stored theme from localStorage
    const storedTheme = getStoredTheme();

    if (!cancelled) {
      if (storedTheme) {
        setThemeState(storedTheme);
      }
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
      saveTheme(theme);
    }
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const value = useMemo<ThemeContextType>(() => ({
    theme,
    toggleTheme,
    setTheme,
  }), [theme, toggleTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Helper functions

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('theme');
    if (stored !== null && (stored === 'light' || stored === 'dark')) {
      return stored as Theme;
    }
    return null;
  } catch (error) {
    console.warn('localStorage unavailable, theme will not persist:', error);
    return null;
  }
}

function saveTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('theme', theme);
    if (DEBUG) {
      console.log('[ThemeContext] Saved theme to localStorage:', theme);
    }
  } catch (error) {
    console.warn('Failed to save theme preference:', error);
  }
}

function getSystemPreference(): Theme {
  if (typeof window === 'undefined') return 'light';

  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return mediaQuery.matches ? 'dark' : 'light';
  } catch (error) {
    console.warn('System preference detection unavailable:', error);
    return 'light';
  }
}

function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  if (DEBUG) {
    console.log('[ThemeContext] Applying theme:', theme);
  }

  const root = document.documentElement;

  // Add no-transition class to prevent animation during initialization
  const isInitializing = !root.classList.contains('theme-initialized');
  if (isInitializing) {
    root.classList.add('no-transition');
  }

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Remove no-transition class after a frame to enable smooth transitions
  if (isInitializing) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('no-transition');
        root.classList.add('theme-initialized');
      });
    });
  }
}
