import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let connectionInterval;

    if (navigator.connection) {
      const checkConnection = () => {
        const { effectiveType, downlink, rtt } = navigator.connection;
        // Consider slow if it's 2g, slow-2g, or downlink is very low
        if (effectiveType === '2g' || effectiveType === 'slow-2g' || downlink < 0.5 || rtt > 1500) {
          setIsSlow(true);
        } else {
          setIsSlow(false);
        }
      };

      navigator.connection.addEventListener('change', checkConnection);
      checkConnection();
      
      // Periodically check just in case
      connectionInterval = setInterval(checkConnection, 5000);
    } else {
        // Fallback ping if navigator.connection is not available (like on iOS)
        const pingCheck = async () => {
            if (!navigator.onLine) return;
            try {
                const startTime = Date.now();
                // Fetch a tiny resource or the current page
                await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
                const rtt = Date.now() - startTime;
                if (rtt > 2000) {
                    setIsSlow(true);
                } else {
                    setIsSlow(false);
                }
            } catch (e) {
                // If it completely fails, we might be offline
                setIsOffline(true);
            }
        };
        connectionInterval = setInterval(pingCheck, 10000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', () => {});
      }
      if (connectionInterval) clearInterval(connectionInterval);
    };
  }, []);

  return { isOffline, isSlow };
};
