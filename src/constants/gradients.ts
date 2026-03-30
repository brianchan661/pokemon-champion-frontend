/**
 * Gradient fallbacks for feature cards based on image URLs
 */

const GRADIENT_MAP: Record<string, string> = {
  'pokemon': 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-700',
  'teams': 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-700',
  'tiers': 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-600',
  'guides': 'bg-gradient-to-br from-violet-400 via-purple-500 to-pink-600',
  'news': 'bg-gradient-to-br from-sky-400 via-indigo-500 to-blue-700',
} as const;

const DEFAULT_GRADIENT = 'bg-gradient-to-br from-gray-500 to-gray-700';

const ACCENT_MAP: Record<string, string> = {
  'pokemon': 'bg-cyan-400',
  'teams': 'bg-emerald-400',
  'tiers': 'bg-amber-400',
  'guides': 'bg-violet-400',
  'news': 'bg-sky-400',
} as const;

const DEFAULT_ACCENT = 'bg-gray-400';

export const getFeatureAccent = (imageUrl: string): string => {
  if (!imageUrl || typeof imageUrl !== 'string') return DEFAULT_ACCENT;
  const urlLower = imageUrl.toLowerCase();
  for (const [key, accent] of Object.entries(ACCENT_MAP)) {
    if (urlLower.includes(key)) return accent;
  }
  return DEFAULT_ACCENT;
};

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