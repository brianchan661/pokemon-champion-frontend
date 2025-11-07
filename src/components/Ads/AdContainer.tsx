import { memo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { AdSense } from './AdSense';
import { AD_PLACEMENTS, getAdSlotForDevice, type AdPlacement } from '@/config/adsense';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAdBlocker } from '@/hooks/useAdBlocker';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { Shield, Sparkles } from 'lucide-react';

interface AdContainerProps {
  /** Ad placement type */
  placement: AdPlacement;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * High-level ad container that handles placement-specific logic
 * and responsive ad slot selection
 */
export const AdContainer = memo(({ placement, className = '', style }: AdContainerProps) => {
  // Always call hooks first, before any conditional logic
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { isBlocking, hasChecked } = useAdBlocker();
  const { isPremium } = usePremiumStatus();
  const { t } = useTranslation('common');

  const config = AD_PLACEMENTS[placement];

  if (!config) {
    console.warn(`Invalid ad placement: ${placement}`);
    return null;
  }

  // Premium users don't see ads
  if (isPremium) {
    return null;
  }

  const adSlot = getAdSlotForDevice(placement, isMobile);

  // Show ad blocker message if detected
  if (hasChecked && isBlocking) {
    return (
      <div className={`ad-container ad-container--${placement} ${className}`} style={style}>
        <div className="bg-gradient-to-br from-blue-50 to-primary-50 border border-primary-200 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-600 mb-3">
            {t(
              'adBlocker.inlineMessage',
              'Ads help us keep Pokemon Champion free. Please consider whitelisting us or upgrading to Premium.'
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <a
              href="https://help.getadblock.com/support/solutions/articles/6000055743-how-to-whitelist-a-website"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-700 bg-white border border-primary-300 rounded hover:bg-primary-50 transition-colors"
            >
              {t('adBlocker.whitelist', 'Whitelist Site')}
            </a>
            <Link
              href="/premium"
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              {t('adBlocker.goPremium', 'Go Premium')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container ad-container--${placement} ${className}`} style={style}>
      <AdSense
        adSlot={adSlot}
        adFormat={config.format}
        fullWidthResponsive={true}
      />
    </div>
  );
});

AdContainer.displayName = 'AdContainer';