import { useAuth } from '@/contexts/AuthContext';

export interface PremiumStatus {
  isPremium: boolean;
  subscriptionExpiry?: Date;
  isExpired: boolean;
}

/**
 * Hook to check user's premium membership status
 * @returns {PremiumStatus} Premium status information
 */
export function usePremiumStatus(): PremiumStatus {
  const { user } = useAuth();

  if (!user) {
    return {
      isPremium: false,
      isExpired: true,
    };
  }

  const isPremium = user.isPremium || false;
  const subscriptionExpiry = user.subscriptionExpiry
    ? new Date(user.subscriptionExpiry)
    : undefined;

  const isExpired = subscriptionExpiry
    ? subscriptionExpiry < new Date()
    : !isPremium;

  return {
    isPremium: isPremium && !isExpired,
    subscriptionExpiry,
    isExpired,
  };
}
