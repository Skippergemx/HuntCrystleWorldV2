import { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

export const useLeaderboard = (user, player, db, appId) => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (!user) return;
    try {
      const q = collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => d.data());
        setLeaderboard(data.sort((a, b) => b.score - a.score).slice(0, 10));
      });
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, [user, db, appId]);

  const updateLeaderboard = useCallback(async (updates = {}) => {
    if (!user || !player) return;
    const identifier = user.email || user.uid;
    const lbRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', identifier);

    const entry = {
      uid: identifier,
      name: player.name,
      email: user.email || '',
      level: player.level,
      score: player.totalBossDamage || 0,
      gx: player.gx || 0,
      maxDepth: player.maxDepth || 1,
      heroAvatar: player.avatar || 1,
      ...updates
    };

    setDoc(lbRef, entry, { merge: true }).catch(err => console.error("Leaderboard Sync Error:", err));
  }, [user, player, db, appId]);

  return {
    leaderboard,
    updateLeaderboard
  };
};
