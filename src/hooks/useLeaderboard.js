import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

/**
 * useLeaderboard V2: Real-time Global Rankings
 * Directly queries the 'players' root collection for the highest efficiency.
 * No redundant 'leaderboard' artifacts needed.
 */
export const useLeaderboard = (user, player, db) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeBoard, setActiveBoard] = useState('level'); // Default sort

  useEffect(() => {
    if (!db) return;

    // Mapping of Tab IDs to Document Fields
    const fieldMap = {
      'boss': 'totalBossDamage',
      'level': 'level',
      'depth': 'maxDepth',
      'gx': 'tokens'
    };

    const sortField = fieldMap[activeBoard] || 'level';
    console.log(`System V2: Querying Hall of Fame [Sort: ${sortField}]`);

    const q = query(
      collection(db, 'players'),
      orderBy(sortField, 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        uid: d.id,
        ...d.data(),
        // Normalized fields for the View
        score: d.data().totalBossDamage || 0,
        gx: d.data().tokens || 0
      }));
      setLeaderboard(data);
    }, (err) => {
      console.error("Leaderboard Query Error:", err);
    });

    return () => unsubscribe();
  }, [db, activeBoard]);

  // V2: updateLeaderboard is now a no-op because 'players' IS the leaderboard
  const updateLeaderboard = useCallback(async () => {
    // Data is already synced via usePlayerSync to the 'players' collection
  }, []);

  return {
    leaderboard,
    updateLeaderboard,
    setActiveBoard,
    activeBoard
  };
};
