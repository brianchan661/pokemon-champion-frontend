import { memo, useMemo } from 'react';
import { useAdSense } from '@/hooks/useAdSense';
import { ADSENSE_CONFIG, shouldShowAds } from '@/config/adsense';

// Extend Window interface for AdSense
declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, any>>;
  }
}

export interface AdSenseProps {
  /** AdSense ad slot ID */
  adSlot: string;
  /** Ad format type */
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  /** Enable responsive ad sizing */
  fullWidthResponsive?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Validates AdSense client ID format with enhanced security checks
 * Uses singleton pattern with LRU cache for better performance
 */
class AdSenseValidator {
  private static instance: AdSenseValidator;
  private validationCache = new Map<string, boolean>();
  private readonly MAX_CACHE_SIZE = 10;

  static getInstance(): AdSenseValidator {
    if (!AdSenseValidator.instance) {
      AdSenseValidator.instance = new AdSenseValidator();
    }
    return AdSenseValidator.instance;
  }

  validateClientId(clientId: string): boolean {
    // Validate input type and basic format
    if (!clientId || typeof clientId !== 'string' || (clientId.length !== 23 && clientId.length !== 24)) {
      return false;
    }

    // Check cache first
    if (this.validationCache.has(clientId)) {
      return this.validationCache.get(clientId)!;
    }

    // Implement LRU cache behavior instead of clearing all
    if (this.validationCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.validationCache.keys().next().value;
      if (firstKey !== undefined) {
        this.validationCache.delete(firstKey);
      }
    }

    // Strict validation with comprehensive security checks
    const isValid = this.performValidation(clientId);

    this.validationCache.set(clientId, isValid);
    return isValid;
  }

  private performValidation(clientId: string): boolean {
    // Basic format check - must be exactly ca-pub- followed by 16 digits
    if (!/^ca-pub-\d{16}$/.test(clientId)) {
      return false;
    }

    // Security checks for malicious content
    const maliciousPatterns = [
      /<script/i, /javascript:/i, /data:/i, /vbscript:/i, /file:/i,
      /[<>'"&\x00-\x1f\x7f-\x9f]/, // XSS and control characters
      /\s/, // No whitespace allowed
      /[^\w-]/, // Only alphanumeric, hyphens allowed
    ];

    if (maliciousPatterns.some(pattern => pattern.test(clientId))) {
      return false;
    }

    // Ensure no leading/trailing whitespace and validate length
    return clientId === clientId.trim() && (clientId.length === 23 || clientId.length === 24);
  }
}

const isValidAdSenseClientId = (clientId: string): boolean => {
  return AdSenseValidator.getInstance().validateClientId(clientId);
};

/**
 * Google AdSense component with error handling and loading states
 * Requires NEXT_PUBLIC_ADSENSE_CLIENT_ID environment variable
 */
export const AdSense = memo(({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = ''
}: AdSenseProps) => {
  const { isLoading, error } = useAdSense(adSlot, ADSENSE_CONFIG.CLIENT_ID);

  // Memoize validation result to prevent repeated calculations
  const isValidClient = useMemo(() =>
    ADSENSE_CONFIG.CLIENT_ID && isValidAdSenseClientId(ADSENSE_CONFIG.CLIENT_ID),
    [ADSENSE_CONFIG.CLIENT_ID]
  );

  // Don't render if ads are disabled or no valid client ID
  if (!shouldShowAds() || !isValidClient) {
    return null;
  }

  // Show error state in development only
  if (error && process.env.NODE_ENV === 'development') {
    return (
      <div className={`adsense-container border-2 border-dashed border-gray-300 p-4 text-center text-gray-500 ${className}`}>
        <p className="text-sm">Ad Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={`adsense-container ${className}`}>
      {isLoading && (
        <div className="animate-pulse bg-gray-200 h-24 rounded flex items-center justify-center">
          <span className="text-gray-400 text-sm">Loading ad...</span>
        </div>
      )}
      <ins
        className="adsbygoogle"
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CONFIG.CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
        aria-label="Advertisement"
        role="banner"
        data-testid={`adsense-${adSlot}`}
      />
    </div>
  );
});

AdSense.displayName = 'AdSense';