import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { X, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface AdBlockerNoticeProps {
  onDismiss: () => void;
}

export function AdBlockerNotice({ onDismiss }: AdBlockerNoticeProps) {
  const { t } = useTranslation('common');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for fade out animation
  };

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-50 to-primary-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 rounded-full p-2">
                <Shield className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('adBlocker.title', 'Ad Blocker Detected')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('adBlocker.subtitle', 'We noticed you\'re using an ad blocker')}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              aria-label="Dismiss"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-gray-700 mb-4">
            {t(
              'adBlocker.message',
              'We understand why you use an ad blocker, but ads help us keep Pokemon Champion free for everyone. Please consider supporting us by:'
            )}
          </p>

          <div className="space-y-3 mb-5">
            {/* Option 1: Whitelist */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {t('adBlocker.option1Title', 'Whitelist Our Site')}
                </h4>
                <p className="text-sm text-gray-600">
                  {t(
                    'adBlocker.option1Desc',
                    'Add Pokemon Champion to your ad blocker\'s whitelist. Ads are placed respectfully and won\'t interfere with your experience.'
                  )}
                </p>
              </div>
            </div>

            {/* Option 2: Premium */}
            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-200">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">
                    {t('adBlocker.option2Title', 'Go Premium')}
                  </h4>
                  <Sparkles className="w-4 h-4 text-primary-600" />
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {t(
                    'adBlocker.option2Desc',
                    'Subscribe for $2.99/month and enjoy an ad-free experience with additional features.'
                  )}
                </p>
                <Link
                  href="/premium"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {t('adBlocker.learnMore', 'Learn More')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-xs text-gray-500 text-center">
            {t(
              'adBlocker.footerNote',
              'Your support helps us maintain and improve Pokemon Champion. Thank you!'
            )}
          </p>
        </div>

        {/* Action buttons */}
        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end border-t border-gray-200">
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('adBlocker.maybeLater', 'Maybe Later')}
          </button>
          <a
            href="https://help.getadblock.com/support/solutions/articles/6000055743-how-to-whitelist-a-website"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors text-center"
          >
            {t('adBlocker.howToWhitelist', 'How to Whitelist')}
          </a>
        </div>
      </div>
    </div>
  );
}
