import WebApp from '@twa-dev/sdk';
import { useEffect } from 'react';

export function useTelegram() {
  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
      WebApp.setHeaderColor('#0D0D0D');
      WebApp.setBackgroundColor('#0D0D0D');
    } catch {
      // Not in Telegram context
    }
  }, []);

  const haptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      WebApp.HapticFeedback.impactOccurred(type);
    } catch {
      // noop
    }
  };

  const showBackButton = (callback: () => void) => {
    try {
      WebApp.BackButton.show();
      WebApp.BackButton.onClick(callback);
      return () => {
        WebApp.BackButton.offClick(callback);
        WebApp.BackButton.hide();
      };
    } catch {
      return () => {};
    }
  };

  return { haptic, showBackButton, user: WebApp.initDataUnsafe?.user };
}
