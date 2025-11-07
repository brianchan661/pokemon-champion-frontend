import { useState, useEffect } from 'react';
import { useAdBlocker } from '@/hooks/useAdBlocker';
import { AdBlockerNotice } from './AdBlockerNotice';

/**
 * Component that detects ad blockers and shows a friendly notice
 * Uses localStorage to remember if user dismissed the notice
 */
export function AdBlockerDetector() {
  const { isBlocking, isChecking, hasChecked } = useAdBlocker();
  const [showNotice, setShowNotice] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed the notice
    const dismissed = localStorage.getItem('adBlockerNoticeDismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    // Show notice again after 7 days
    if (dismissedTime && now - dismissedTime < 7 * dayInMs) {
      setHasDismissed(true);
    }
  }, []);

  useEffect(() => {
    // Show notice if ad blocker detected and user hasn't dismissed recently
    if (hasChecked && isBlocking && !hasDismissed) {
      // Delay showing the notice slightly for better UX
      const timer = setTimeout(() => setShowNotice(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasChecked, isBlocking, hasDismissed]);

  const handleDismiss = () => {
    setShowNotice(false);
    setHasDismissed(true);
    // Remember dismissal for 7 days
    localStorage.setItem('adBlockerNoticeDismissed', Date.now().toString());
  };

  // Don't render anything if:
  // - Still checking
  // - No ad blocker detected
  // - User dismissed the notice
  if (isChecking || !isBlocking || !showNotice) {
    return null;
  }

  return <AdBlockerNotice onDismiss={handleDismiss} />;
}
