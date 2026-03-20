import { useState, useRef, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';

export const usePlayerSync = (user, db, appId) => {
  const [player, setPlayer] = useState(null);
  
  // Throttled sync mechanism
  const syncTimeoutRef = useRef(null);
  const pendingUpdatesRef = useRef({});

  const syncPlayer = useCallback(async (updates) => {
    if (!user) return;

    // Immediate local update for UI responsiveness
    setPlayer(prev => {
      const next = { ...prev, ...updates };

      // Batch updates for remote sync
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      syncTimeoutRef.current = setTimeout(async () => {
        try {
          const identifier = user.email || user.uid;
          const docRef = doc(db, 'artifacts', appId, 'users', identifier, 'profile', 'data');
          await setDoc(docRef, pendingUpdatesRef.current, { merge: true });
          pendingUpdatesRef.current = {};
        } catch (e) {
          console.error("Sync error:", e);
        }
      }, 2000); // Wait 2s of silence before syncing to Firebase

      return next;
    });
  }, [user, db, appId]);

  return { player, setPlayer, syncPlayer };
};
