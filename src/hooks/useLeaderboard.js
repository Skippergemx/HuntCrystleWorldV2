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

  // V2.1: Echo public stats to the isolated 'leaderboard' collection to secure the root 'players' collection
  const updateLeaderboard = useCallback(async (updates = {}) => {
    if (!db || !user?.uid || !player) return;
    try {
       const publicData = {
          name: player.name || "Unknown",
          avatar: player.avatar || 1,
          platform: player.platform || 'web',
          level: updates.level || player.level || 1,
          totalBossDamage: updates.score !== undefined ? updates.score : (updates.totalBossDamage || player.totalBossDamage || 0),
          maxDepthScore: updates.maxDepthScore !== undefined ? updates.maxDepthScore : (player.maxDepthScore || 0),
          tokens: updates.tokens !== undefined ? updates.tokens : (player.tokens || 0),
          updatedAt: Date.now()
       };
       setDoc(doc(db, 'leaderboard', user.uid), publicData, { merge: true }).catch(() => {});
    } catch (e) {
       console.error("Failed to push public leaderboard footprint:", e);
    }
  }, [db, user?.uid, player]);

  return {
    leaderboard,
    updateLeaderboard,
    setActiveBoard,
    activeBoard
  };
};
