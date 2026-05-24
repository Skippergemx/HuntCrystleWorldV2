import { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, getDocs, limit, runTransaction, deleteField } from 'firebase/firestore';

import { httpsCallable } from 'firebase/functions';

/**
 * useMarketplace V2: Global P2P Exchange
 * Migrated to root 'marketplace' and 'payouts' collections.
 * Enforced UID-primary identity for secure transaction routing.
 */
export const useMarketplace = (user, player, syncPlayer, addLog, playSFX, SOUNDS, db, functions, setPlayer) => {
  const [marketplace, setMarketplace] = useState([]);

  // 1. Marketplace Listener (V2: Root Path)
  useEffect(() => {
    // Dev mode: skip Firestore listener (no auth session available)
    if (__DEV_MODE__) return;
    if (!db) return;
    try {
      const q = query(collection(db, 'marketplace'), limit(50));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setMarketplace(data);
      });
      return () => unsubscribe();
    } catch (e) { console.error("Market listener error:", e); }
  }, [db]);

  // 2. Automated Payout Protocol (V2: Root Path & UID Key)
  useEffect(() => {
    if (!user?.uid || !player) return;
    
    const claimPayouts = async () => {
      try {
        const callAction = httpsCallable(functions, 'secureGameAction');
        const result = await callAction({ action: 'CLAIM_PAYOUTS', payload: {} });
        const { success, total } = result.data || { success: false, total: 0 };

        if (success && total > 0) {
          syncPlayer({ tokens: (player.tokens || 0) + total });
          addLog(`💸 MARKET UPLINK: +${total.toLocaleString()} GX secured from your sales!`);
          playSFX(SOUNDS.obtainLoot);
        }
      } catch (e) { console.error('Payout claim error:', e); }
    };
    
    claimPayouts();
  }, [user?.uid, db, addLog, functions, setPlayer, playSFX, SOUNDS]); 

  // 3. Purchase Logic (V2: Atomic Cleanup)
  const purchaseMarketItem = useCallback(async (listing, requestedQty = 1) => {
    if (!player || !user?.uid) return;
    const qty = Math.min(requestedQty, listing.quantity || 1);
    const totalCost = listing.price * qty;

    if (player.tokens < totalCost) return addLog("🚨 INSUFFICIENT GX: Transaction aborted.");

    try {
      const callAction = httpsCallable(functions, 'secureGameAction');
      
      // The backend Cloud Function will handle the transaction securely.

      const result = await callAction({ 
        action: 'MARKET_PURCHASE', 
        payload: { listingId: listing.id, qty } 
      });

      if (result.data.success) {
        addLog(`🤝 DEAL SECURED: Acquired ${qty}x ${listing.item.name} for ${totalCost} GX.`);
        playSFX(SOUNDS.obtainLoot);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      addLog("🚨 TRANSACTION FAILED: Signal lost.");
      return false;
    }
  }, [player, user?.uid, functions, setPlayer, addLog, playSFX, SOUNDS]);

  // 4. Listing Logic (V2: UID Anchor)
  const listMarketItem = useCallback(async (item, totalPrice, quantity = 1) => {
    if (!user?.uid || !player) return;

    try {
      const callAction = httpsCallable(functions, 'secureGameAction');
      
      // The backend Cloud Function will handle the transaction securely.

      await callAction({ 
        action: 'MARKET_LIST', 
        payload: { item, totalPrice, quantity } 
      });

      addLog(`📡 BROADCAST: ${quantity}x ${item.name} listed for ${totalPrice} GX.`);
      playSFX(SOUNDS.useHeal);
    } catch (e) {
      console.error(e);
      addLog("🚨 UPLINK FAILED: Market transaction aborted.");
    }
  }, [user, player, functions, setPlayer, addLog, playSFX, SOUNDS]);

  // 5. Cancellation Logic
  const cancelMarketListing = useCallback(async (listingId) => {
    if (!player || !user?.uid || !functions) return;
    try {
      const callAction = httpsCallable(functions, 'secureGameAction');
      
      // The backend Cloud Function will handle the transaction securely.

      await callAction({ 
        action: 'MARKET_CANCEL', 
        payload: { listingId } 
      });

      addLog(`🚫 SIGNAL ABORTED: Market listing recovered.`);
    } catch (e) { 
      console.error("Market cancel error:", e);
      addLog("🚨 ABORT FAILED: Could not recover stashed items.");
    }
  }, [player, user?.uid, marketplace, functions, setPlayer, addLog]);

  return {
    marketplace,
    purchaseMarketItem,
    listMarketItem,
    cancelMarketListing
  };
};
