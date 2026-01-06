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
  // Using the one verified slot ID for all positions temporarily to prevent 400 errors
  // until specific ad units are created for each position.
  HEADER_BANNER: '8010124940',
  SIDEBAR_RECTANGLE: '8010124940',
  SIDEBAR_SQUARE: '8010124940',
  SIDE_ADV: '8010124940', // Verified Verification Unit
  SIDEBAR_BOTTOM: '8010124940',
  CONTENT_INLINE: '8010124940',
  FOOTER_BANNER: '8010124940',
  HOME_BOTTOM_BANNER: '8010124940',
  MOBILE_BANNER: '8010124940',
  HOME_SIDEBAR_TOP: '1842325931',
} as const;

/**
 * Ad placement configurations with responsive slot selection
 */
export interface AdPlacementConfig {
  desktop: string;
  mobile: string;
  format: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  style?: React.CSSProperties | { [key: string]: string | number };
}

const RAW_PLACEMENTS = {
  header: {
    desktop: AD_SLOTS.HEADER_BANNER,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'horizontal',
  },
  sidebar: {
    desktop: AD_SLOTS.SIDE_ADV,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'rectangle',
  },
  'sidebar-top': {
    desktop: AD_SLOTS.HOME_SIDEBAR_TOP,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'auto',
    style: { display: 'block', width: '300px', height: '250px' },
  },
  'sidebar-middle': {
    desktop: AD_SLOTS.SIDEBAR_SQUARE,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'rectangle',
  },
  'sidebar-bottom': {
    desktop: AD_SLOTS.SIDEBAR_BOTTOM,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'rectangle',
  },
  content: {
    desktop: AD_SLOTS.CONTENT_INLINE,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'auto',
  },
  footer: {
    desktop: AD_SLOTS.FOOTER_BANNER,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'horizontal',
  },
  'home-bottom-banner': {
    desktop: AD_SLOTS.HOME_BOTTOM_BANNER,
    mobile: AD_SLOTS.MOBILE_BANNER,
    format: 'horizontal',
  },
} as const;

export const AD_PLACEMENTS: Record<keyof typeof RAW_PLACEMENTS, AdPlacementConfig> = RAW_PLACEMENTS;

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