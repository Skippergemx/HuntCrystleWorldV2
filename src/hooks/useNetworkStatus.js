import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  // Detector deactivated by request
  const [isOffline, setIsOffline] = useState(false);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    // Disabled
  }, []);

  return { isOffline: false, isSlow: false };
};
