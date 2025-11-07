/**
 * Gradient fallbacks for feature cards based on image URLs
 */

const GRADIENT_MAP: Record<string, string> = {
  'pokemon': 'bg-gradient-to-br from-blue-500 to-purple-600',
  'teams': 'bg-gradient-to-br from-green-500 to-teal-600',
  'tiers': 'bg-gradient-to-br from-orange-500 to-red-600',
  'guides': 'bg-gradient-to-br from-purple-500 to-pink-600',
  'news': 'bg-gradient-to-br from-indigo-500 to-blue-600',
} as const;

const DEFAULT_GRADIENT = 'bg-gradient-to-br from-gray-500 to-gray-700';

/**
 * Gets appropriate gradient fallback based on image URL or content type
 */
export const getFeatureGradient = (imageUrl: string): string => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return DEFAULT_GRADIENT;
  }

  // Extract feature type from URL or filename
  const urlLower = imageUrl.toLowerCase();
  
  for (const [key, gradient] of Object.entries(GRADIENT_MAP)) {
    if (urlLower.includes(key)) {
      return gradient;
    }
  }

  return DEFAULT_GRADIENT;
};