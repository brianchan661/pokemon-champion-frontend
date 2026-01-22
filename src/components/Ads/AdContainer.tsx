import { memo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { AdSense } from './AdSense';
import { AD_PLACEMENTS, getAdSlotForDevice, shouldShowAds, type AdPlacement } from '@/config/adsense';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAdBlocker } from '@/hooks/useAdBlocker';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useGlobalConfig } from '@/contexts/GlobalConfigContext';
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
  const { adsDisabled } = useGlobalConfig();
  const { t } = useTranslation('common');



  const config = AD_PLACEMENTS[placement];

  if (!config) {
    console.warn(`Invalid ad placement: ${placement}`);
    return null;
  }

  // Premium users don't see ads
  if (isPremium || adsDisabled) {
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
  // REMOVED: User requested to remove the "Please unblock" message container
  // if (hasChecked && isBlocking && shouldShowAds()) { ... }

  return (
    <div
      className={`ad-container ad-container--${placement} ${className} relative overflow-hidden`}
      style={finalStyle}
    >
      {/* Internal Placeholder with "ADVERTISEMENT" text - REMOVED per user request */}

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