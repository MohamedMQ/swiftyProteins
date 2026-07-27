import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Security requirement: the login screen must always reappear when the app
 * backgrounds, regardless of prior authentication. isLocked starts `true`
 * (covers first launch) and is only ever cleared by an explicit unlock()
 * call after a real login/registration — never automatically by returning
 * to the foreground.
 */
export function useAppLock() {
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        setIsLocked(true);
      }
    });

    return () => subscription.remove();
  }, []);

  return { isLocked, unlock: () => setIsLocked(false) };
}
