import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { LanguageSelector } from './LanguageSelector';
import { useAuth } from '@/contexts/AuthContext';
import { BuyMeCoffeeButton } from '@/components/BuyMeCoffeeButton';
import { ThemeToggle } from '@/components/ThemeToggle';

// Move navigation config outside component to prevent recreation
const NAVIGATION_ITEMS = [
  { key: 'news', href: '/news' },
  { key: 'pokemon', href: '/pokemon' },
  { key: 'teams', href: '/teams' },
  {
    key: 'data',
    href: '/data',
    dropdown: [
      { key: 'abilities', href: '/data/abilities' },
      { key: 'moves', href: '/data/moves' },
      { key: 'items', href: '/data/items' },
    ]
  },
  { key: 'tiers', href: '/tiers' },
  {
    key: 'guides',
    href: '/guides',
    dropdown: [
      { key: 'typeChart', href: '/guides/type-chart' }
    ]
  },
] as const;

export const Header = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  // Helper to get login URL with return path
  const getLoginUrl = () => {
    // Don't include returnUrl if already on auth page, or if path is just '/'
    if (router.pathname.startsWith('/auth') || router.asPath === '/') {
      return '/auth';
    }
    return `/auth?returnUrl=${encodeURIComponent(router.asPath)}`;
  };

  // Memoize navigation items to prevent recreation on each render
  const navigation = useMemo(() =>
    NAVIGATION_ITEMS.map(item => {
      const base = {
        name: t(`nav.${item.key}`),
        href: item.href,
        key: item.key,
      };

      // Include dropdown if it exists
      if ('dropdown' in item && item.dropdown) {
        return {
          ...base,
          dropdown: item.dropdown
        };
      }

      return base;
    }), [t]);

  // Split navigation for responsive display
  // Show first 2 items on medium screens, rest in "More" dropdown
  const primaryNavItems = navigation.slice(0, 2);
  const moreNavItems = navigation.slice(2);

  // Memoize toggle function to prevent child re-renders
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <header className="bg-white dark:bg-dark-bg-secondary shadow-sm border-b border-gray-200 dark:border-dark-border relative z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">PC</span>
              </div>
              {/* Full name on large screens, 2 rows on medium */}
              <span className="hidden lg:inline text-xl font-bold text-gray-900 dark:text-dark-text-primary whitespace-nowrap">
                Pokemon Champion
              </span>
              <div className="hidden md:flex lg:hidden flex-col leading-tight">
                <span className="text-sm font-bold text-gray-900 dark:text-dark-text-primary">Pokemon</span>
                <span className="text-sm font-bold text-gray-900 dark:text-dark-text-primary">Champion</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2 lg:space-x-8 flex-1 justify-center">
            {/* Show all items on large screens */}
            <div className="hidden lg:flex space-x-6">
              {navigation.map((item) => {
                const hasDropdown = 'dropdown' in item && item.dropdown;

                if (hasDropdown) {
                  return (
                    <div
                      key={item.name}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(item.key)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button
                        className="text-gray-600 dark:text-dark-text-secondary hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors duration-200 flex items-center whitespace-nowrap"
                      >
                        {item.name}
                        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openDropdown === item.key && (
                        <div className="absolute left-0 pt-2 w-48 z-50">
                          <div className="rounded-md shadow-lg bg-white dark:bg-dark-bg-tertiary ring-1 ring-black ring-opacity-5 dark:ring-dark-border py-1">
                            {item.dropdown.map((subItem) => (
                              <Link
                                key={subItem.key}
                                href={subItem.href}
                                className="block px-4 py-2 text-sm text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-secondary hover:text-primary-600 dark:hover:text-primary-400"
                              >
                                {t(`nav.${subItem.key}`)}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-600 dark:text-dark-text-secondary hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap"
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Show primary items + More dropdown on medium screens */}
            <div className="flex lg:hidden space-x-2">
              {primaryNavItems.map((item) => {
                const hasDropdown = 'dropdown' in item && item.dropdown;

                if (hasDropdown) {
                  return (
                    <div
                      key={item.name}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(item.key)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button
                        className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200 flex items-center whitespace-nowrap"
                      >
                        {item.name}
                        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openDropdown === item.key && (
                        <div className="absolute left-0 pt-2 w-48 z-50">
                          <div className="rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1">
                            {item.dropdown.map((subItem) => (
                              <Link
                                key={subItem.key}
                                href={subItem.href}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600"
                              >
                                {t(`nav.${subItem.key}`)}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-600 hover:text-primary-600 px-2 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap"
                  >
                    {item.name}
                  </Link>
                );
              })}

              {/* More dropdown for remaining items */}
              <div
                className="relative"
                onMouseEnter={() => setMoreDropdownOpen(true)}
                onMouseLeave={() => setMoreDropdownOpen(false)}
              >
                <button
                  className="text-gray-600 hover:text-primary-600 px-2 py-2 text-sm font-medium transition-colors duration-200 flex items-center whitespace-nowrap"
                >
                  {t('nav.more', 'More')}
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {moreDropdownOpen && (
                  <div className="absolute left-0 pt-2 w-48 z-50">
                    <div className="rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1">
                      {moreNavItems.map((item) => {
                        const hasDropdown = 'dropdown' in item && item.dropdown;

                        if (hasDropdown) {
                          return (
                            <div key={item.key}>
                              <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b border-gray-100">
                                {item.name}
                              </div>
                              {item.dropdown.map((subItem) => (
                                <Link
                                  key={subItem.key}
                                  href={subItem.href}
                                  className="block px-6 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600"
                                >
                                  {t(`nav.${subItem.key}`)}
                                </Link>
                              ))}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={item.key}
                            href={item.href}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600"
                          >
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-1 md:space-x-2 lg:space-x-4 flex-shrink-0">
            <LanguageSelector />

            <ThemeToggle />

            {/* Buy Me a Coffee Button - Compact icon on medium, full on xl */}
            <div className="hidden md:block xl:hidden">
              <BuyMeCoffeeButton compact />
            </div>
            <div className="hidden xl:block">
              <BuyMeCoffeeButton />
            </div>

            {/* Auth section */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {isAuthenticated ? (
                <div className="flex items-center space-x-1 lg:space-x-2">
                  {user?.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="text-xs lg:text-sm text-red-600 hover:text-red-700 font-medium whitespace-nowrap"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="text-xs lg:text-sm text-gray-600 hover:text-primary-600 font-medium whitespace-nowrap max-w-[80px] lg:max-w-none truncate"
                    title={user?.username}
                  >
                    {user?.username}
                  </Link>
                  <button
                    onClick={logout}
                    className="btn-secondary text-xs lg:text-sm whitespace-nowrap px-2 py-1 lg:px-3 lg:py-2"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link href={getLoginUrl()} className="btn-secondary text-xs lg:text-sm whitespace-nowrap px-2 py-1 lg:px-3 lg:py-2">
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200 flex-shrink-0"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              {/* Theme Toggle - Mobile */}
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium text-gray-700 dark:text-dark-text-primary">
                  {t('theme.toggle', 'Theme')}
                </span>
                <ThemeToggle />
              </div>

              {navigation.map((item) => {
                const hasDropdown = 'dropdown' in item && item.dropdown;

                if (hasDropdown) {
                  return (
                    <div key={item.key}>
                      <button
                        onClick={() => setOpenDropdown(openDropdown === item.key ? null : item.key)}
                        className="w-full text-left text-gray-600 hover:text-primary-600 px-3 py-2 text-base font-medium transition-colors duration-200 flex items-center justify-between"
                      >
                        {item.name}
                        <svg
                          className={`h-4 w-4 transition-transform ${openDropdown === item.key ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openDropdown === item.key && (
                        <div className="pl-6 space-y-1">
                          {item.dropdown.map((subItem) => (
                            <Link
                              key={subItem.key}
                              href={subItem.href}
                              className="block text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                              onClick={closeMenu}
                            >
                              {t(`nav.${subItem.key}`)}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="text-gray-600 hover:text-primary-600 px-3 py-2 text-base font-medium transition-colors duration-200"
                    onClick={closeMenu}
                  >
                    {item.name}
                  </Link>
                );
              })}
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                {/* Buy Me a Coffee Button - Mobile */}
                <div className="mx-3">
                  <BuyMeCoffeeButton />
                </div>

                {isAuthenticated ? (
                  <>
                    <div className="px-3 py-2">
                      <span className="text-sm text-gray-600">{user?.username}</span>
                    </div>
                    {user?.role === 'admin' && (
                      <Link href="/admin" className="btn-secondary text-sm mx-3 bg-red-600 hover:bg-red-700 text-white" onClick={closeMenu}>
                        Admin Dashboard
                      </Link>
                    )}
                    <Link href="/profile" className="btn-secondary text-sm mx-3" onClick={closeMenu}>
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        closeMenu();
                      }}
                      className="btn-secondary text-sm mx-3"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link href={getLoginUrl()} className="btn-secondary text-sm mx-3" onClick={closeMenu}>
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};