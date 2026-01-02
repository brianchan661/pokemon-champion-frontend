import { memo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { AdSense } from './AdSense';
import { AD_PLACEMENTS, getAdSlotForDevice, shouldShowAds, type AdPlacement } from '@/config/adsense';
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

  const finalStyle = {
    ...style,
    // Enforce dimensions if they exist in config (e.g. for sidebar) to ensure placeholder matches
    width: config.style?.width || style?.width || 'auto',
    height: config.style?.height || style?.height || 'auto',
    // If no fixed size, ensure it has some minimums or defaults
    minHeight: config.style?.height ? undefined : '50px'
  };

  // Show ad blocker message if detected AND we are trying to show ads
  if (hasChecked && isBlocking && shouldShowAds()) {
    return (
      <div className={`ad-container ad-container--${placement} ${className} overflow-hidden relative`} style={finalStyle}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-primary-50 border border-primary-200 rounded-lg p-4 text-center flex flex-col justify-center items-center">
          <p className="text-[10px] text-gray-600 mb-2 leading-tight">
            {t(
              'adBlocker.inlineMessage',
              'Ads help us keep Pokemon Champion free. Please consider whitelisting us.'
            )}
          </p>
          <div className="flex flex-col gap-2 justify-center w-full max-w-[200px]">
            <a
              href="https://help.getadblock.com/support/solutions/articles/6000055743-how-to-whitelist-a-website"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-[10px] font-medium text-primary-700 bg-white border border-primary-300 rounded hover:bg-primary-50 transition-colors whitespace-nowrap"
            >
              {t('adBlocker.whitelist', 'Whitelist')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`ad-container ad-container--${placement} ${className} relative overflow-hidden`}
      style={finalStyle}
    >
      {/* Internal Placeholder with "ADVERTISEMENT" text */
      /* This text sits behind the ad and is visible if the ad is transparent or loading */
      /* standard ads (opaque) will cover it. */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded z-0">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
          {t('common.advertisement', 'Advertisement')}
        </span>
      </div>

      {/* AdSense Unit Overlay */
      /* Positioned absolutely to cover the placeholder */}
      <div className="absolute inset-0 z-10">
        <AdSense
          adSlot={adSlot}
          adFormat={config.format}
          fullWidthResponsive={config.format === 'auto'} // Only responsive if auto
          style={config.style} // Pass specific fixed dimensions if defined
        />
      </div>
    </div>
  );
});

AdContainer.displayName = 'AdContainer';