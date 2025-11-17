import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'next-i18next';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation('common');
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isDark = theme === 'dark';
  
  // Return a placeholder with the same dimensions during SSR
  if (!mounted) {
    return (
      <div className="p-2 w-9 h-9 flex-shrink-0" aria-hidden="true">
        <div className="h-5 w-5" />
      </div>
    );
  }
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-dark-text-secondary dark:hover:text-dark-text-primary dark:hover:bg-dark-bg-tertiary transition-all duration-200 flex-shrink-0 relative group"
      aria-label={isDark ? t('theme.switchToLight', 'Switch to light mode') : t('theme.switchToDark', 'Switch to dark mode')}
      aria-pressed={isDark}
      title={isDark ? t('theme.lightMode', 'Light mode') : t('theme.darkMode', 'Dark mode')}
    >
      {/* Sun icon for light mode */}
      <svg
        className={`h-5 w-5 transition-all duration-300 ${
          isDark ? 'opacity-0 scale-0 rotate-90 absolute' : 'opacity-100 scale-100 rotate-0'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      
      {/* Moon icon for dark mode */}
      <svg
        className={`h-5 w-5 transition-all duration-300 ${
          isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-90 absolute'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
      
      {/* Tooltip */}
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {isDark ? t('theme.lightMode', 'Light mode') : t('theme.darkMode', 'Dark mode')}
      </span>
    </button>
  );
};
