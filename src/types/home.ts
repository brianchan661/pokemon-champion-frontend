/**
 * Types for homepage components
 */

export interface FeatureCardProps {
  /** Navigation href for the feature */
  href: string;
  /** Feature title to display */
  title: string;
  /** Background image URL */
  backgroundImage: string;
}

// Define category colors as const for better type safety
export const CATEGORY_COLORS = ['primary', 'green', 'orange'] as const;
export type CategoryColor = typeof CATEGORY_COLORS[number];

export interface NewsItem {
  /** Navigation href for the news item */
  href: string;
  /** Translation key for the news item */
  translationKey: string;
  /** Category translation key */
  categoryKey: string;
  /** Category color theme */
  categoryColor: CategoryColor;
}

export interface Feature {
  /** Navigation href for the feature */
  href: string;
  /** Background image URL */
  backgroundImage: string;
  /** Translation key for the feature */
  translationKey: string;
}