import { Feature, NewsItem } from '@/types/home';

/**
 * Valid translation keys for features - ensures type safety
 */
const FEATURE_TRANSLATION_KEYS = ['database', 'teamBuilder', 'tiers'] as const;
type FeatureTranslationKey = typeof FEATURE_TRANSLATION_KEYS[number];

/**
 * Valid translation keys for news items - ensures type safety
 */
const NEWS_TRANSLATION_KEYS = ['balanceUpdate', 'newFeatures', 'tournament'] as const;
type NewsTranslationKey = typeof NEWS_TRANSLATION_KEYS[number];

/**
 * Enhanced validation with specific error messages and type checking
 */
const validateConfiguration = () => {
  // Validate features
  FEATURES.forEach((feature, index) => {
    if (!feature.href.startsWith('/')) {
      throw new Error(`Feature ${index}: href must start with '/' (got: ${feature.href})`);
    }
    if (!feature.backgroundImage.match(/\.(svg|jpg|png|webp)$/i)) {
      throw new Error(`Feature ${index}: backgroundImage must be a valid image file (got: ${feature.backgroundImage})`);
    }
    if (!FEATURE_TRANSLATION_KEYS.includes(feature.translationKey as FeatureTranslationKey)) {
      throw new Error(`Feature ${index}: invalid translationKey '${feature.translationKey}'`);
    }
  });

  // Validate news items
  NEWS_ITEMS.forEach((item, index) => {
    if (!item.href.startsWith('/')) {
      throw new Error(`News item ${index}: href must start with '/' (got: ${item.href})`);
    }
    if (!NEWS_TRANSLATION_KEYS.includes(item.translationKey as NewsTranslationKey)) {
      throw new Error(`News item ${index}: invalid translationKey '${item.translationKey}'`);
    }
  });
};

/**
 * Homepage feature cards configuration
 * Using readonly arrays for better performance and immutability
 */
export const FEATURES = [
  {
    href: '/pokemon',
    backgroundImage: '/images/features/pokemon-database.svg',
    translationKey: 'database',
  },
  {
    href: '/teams',
    backgroundImage: '/images/features/team-builder.svg',
    translationKey: 'teamBuilder',
  },
  {
    href: '/tiers',
    backgroundImage: '/images/features/tier-lists.svg',
    translationKey: 'tiers',
  },
] as const satisfies readonly Feature[];

/**
 * Homepage news items configuration
 * Using readonly arrays for better performance and immutability
 */
export const NEWS_ITEMS = [
  {
    href: '/news/balance-update',
    translationKey: 'balanceUpdate',
    categoryKey: 'update',
    categoryColor: 'primary',
  },
  {
    href: '/news/new-features',
    translationKey: 'newFeatures',
    categoryKey: 'feature',
    categoryColor: 'green',
  },
  {
    href: '/news/tournament',
    translationKey: 'tournament',
    categoryKey: 'event',
    categoryColor: 'orange',
  },
] as const satisfies readonly NewsItem[];

// Validate configuration on module load (development only)
if (process.env.NODE_ENV === 'development') {
  validateConfiguration();
}