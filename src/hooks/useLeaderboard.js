import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, setDoc } from 'firebase/firestore';

/**
 * useLeaderboard V2: Real-time Global Rankings
 * Directly queries the 'players' root collection for the highest efficiency.
 * No redundant 'leaderboard' artifacts needed.
 */
export const useLeaderboard = (user, player, db) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeBoard, setActiveBoard] = useState('level'); // Default sort

  const fetchLeaderboard = useCallback(async (sortField) => {
    if (!db) return;
    try {
      console.log(`System V2: Static Fetch Hall of Fame [Sort: ${sortField}]`);
      const q = query(collection(db, 'leaderboard'), orderBy(sortField, 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({
        uid: d.id,
        ...d.data(),
        score: d.data().totalBossDamage || 0,
        gx: d.data().tokens || 0
      }));
      setLeaderboard(data);
    } catch (err) {
      console.error("Leaderboard Query Error:", err);
    }
  }, [db]);

  useEffect(() => {
    const fieldMap = {
      'boss': 'totalBossDamage',
      'level': 'level',
      'depth': 'maxDepthScore',
      'gx': 'tokens'
    };
    const sortField = fieldMap[activeBoard] || 'level';
    fetchLeaderboard(sortField);
  }, [activeBoard, fetchLeaderboard]);

  // updateLeaderboard removed: V3 now uses the unified 'Echo' pattern in usePlayerSync
  // to prevent duplicate entries caused by conflicting Auth UID vs Global Identity ID.

  return {
    leaderboard,
    setActiveBoard,
    activeBoard
  };
};
