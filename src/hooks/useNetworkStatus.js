import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkConnection = () => {
      if ('connection' in navigator) {
        const conn = navigator.connection;
        // Consider '2g' as slow, or '3g' if saveData is on
        const slow = conn.effectiveType === '2g' || (conn.saveData && conn.effectiveType === '3g');
        setIsSlow(slow);
      }
    };

    checkConnection();
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', checkConnection);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', checkConnection);
      }
    };
  }, []);

  return { isOffline, isSlow };
};

