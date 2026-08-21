import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { isAppLockSuppressed } from './appLockSuppression';

export function useAppLock() {
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' && !isAppLockSuppressed()) {
        setIsLocked(true);
      }
    });

    return () => subscription.remove();
  }, []);

  return { isLocked, unlock: () => setIsLocked(false), lock: () => setIsLocked(true) };
}
