/**
 * Google AdSense configuration and ad slot definitions
 */

export const ADSENSE_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '',
} as const;

/**
 * Ad slot IDs for different placements
 * Update these with your actual AdSense ad slot IDs
 */
export const AD_SLOTS = {
  HEADER_BANNER: '1234567890',
  SIDEBAR_RECTANGLE: '1234567891',
  SIDEBAR_SQUARE: '1234567895',
  SIDE_ADV: '8010124940', // Verified Verification Unit
  SIDEBAR_BOTTOM: '1234567896',
  CONTENT_INLINE: '1234567892',
  FOOTER_BANNER: '1234567893',
  HOME_BOTTOM_BANNER: '1234567897',
  MOBILE_BANNER: '1234567894',
} as const;

/**
 * Ad placement configurations with responsive slot selection
 */
export const AD_PLACEMENTS = {
  header: {
    desktop: AD_SLOTS.HEADER_BANNER,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'horizontal' as const,
  },
  sidebar: {
    desktop: AD_SLOTS.SIDE_ADV,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'rectangle' as const,
  },
  'sidebar-top': {
    desktop: AD_SLOTS.SIDE_ADV,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'auto' as const, // Changed to auto per user snippet
  },
  'sidebar-middle': {
    desktop: AD_SLOTS.SIDEBAR_SQUARE,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'rectangle' as const,
  },
  'sidebar-bottom': {
    desktop: AD_SLOTS.SIDEBAR_BOTTOM,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'rectangle' as const,
  },
  content: {
    desktop: AD_SLOTS.CONTENT_INLINE,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'auto' as const,
  },
  footer: {
    desktop: AD_SLOTS.FOOTER_BANNER,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'horizontal' as const,
  },
  'home-bottom-banner': {
    desktop: AD_SLOTS.HOME_BOTTOM_BANNER,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'horizontal' as const,
  },
} as const;

export type AdPlacement = keyof typeof AD_PLACEMENTS;

/**
 * Determines if ads should be shown based on environment and configuration
 */
export const shouldShowAds = (): boolean => {
  return (
    process.env.NODE_ENV === 'production' &&
    Boolean(ADSENSE_CONFIG.CLIENT_ID) &&
    ADSENSE_CONFIG.CLIENT_ID !== '' &&
    !ADSENSE_CONFIG.CLIENT_ID.includes('1234567890') && // Prevent placeholder IDs
    /^ca-pub-\d{16}$/.test(ADSENSE_CONFIG.CLIENT_ID) // Validate format
  );
};

/**
 * Gets the appropriate ad slot for the current device
 */
export const getAdSlotForDevice = (placement: AdPlacement, isMobile: boolean): string => {
  const config = AD_PLACEMENTS[placement];
  return isMobile ? config.mobile : config.desktop;
};