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

  const isPremium = (user as any).is_premium || false;
  const subscriptionExpiry = (user as any).subscription_expiry
    ? new Date((user as any).subscription_expiry)
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
