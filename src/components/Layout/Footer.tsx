import Link from 'next/link';
import { useTranslation } from 'next-i18next';

export const Footer = () => {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-sm text-gray-600">
            © {currentYear} Pokemon Champion. {t('footer.rights', 'All rights reserved.')}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link href="/about" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
              {t('footer.about', 'About')}
            </Link>
            <Link href="/contact" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
              {t('footer.contact', 'Contact')}
            </Link>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
              {t('footer.privacy', 'Privacy Policy')}
            </Link>
            <Link href="/terms" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
              {t('footer.terms', 'Terms of Service')}
            </Link>
          </nav>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {t('footer.disclaimer', 'Pokemon and all related properties are © Nintendo/Creatures Inc./GAME FREAK inc. This website is not affiliated with or endorsed by Nintendo, Creatures Inc., or GAME FREAK inc.')}
          </p>
        </div>
      </div>
    </footer>
  );
};