import { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';

/**
 * useMarketplace V2: Global P2P Exchange
 * Migrated to root 'marketplace' and 'payouts' collections.
 * Enforced UID-primary identity for secure transaction routing.
 */
export const useMarketplace = (user, player, syncPlayer, addLog, playSFX, SOUNDS, db) => {
  const [marketplace, setMarketplace] = useState([]);

  // 1. Marketplace Listener (V2: Root Path)
  useEffect(() => {
    if (!db) return;
    try {
      const q = collection(db, 'marketplace');
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
        const q = query(collection(db, 'payouts'), where('recipientUid', '==', user.uid));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return;

        let totalPayout = 0;
        const batchDeletes = snapshot.docs.map(d => deleteDoc(doc(db, 'payouts', d.id)));
        
        snapshot.forEach(d => { totalPayout += d.data().amount || 0; });
        await Promise.all(batchDeletes);

        if (totalPayout > 0) {
          await syncPlayer({ tokens: (player.tokens || 0) + totalPayout });
          addLog(`💸 MARKET UPLINK: +${totalPayout.toLocaleString()} GX secured from your sales!`);
          playSFX(SOUNDS.obtainLoot);
        }
      } catch (e) { console.error('Payout claim error:', e); }
    };
    
    claimPayouts();
  }, [user?.uid, player?.level, db, addLog, syncPlayer, player?.tokens, playSFX, SOUNDS]); 

  // 3. Purchase Logic (V2: Atomic Cleanup)
  const purchaseMarketItem = useCallback(async (listing, requestedQty = 1) => {
    if (!player || !user?.uid) return;
    const qty = Math.min(requestedQty, listing.quantity || 1);
    const totalCost = listing.price * qty;

    if (player.tokens < totalCost) return addLog("🚨 INSUFFICIENT GX: Transaction aborted.");

    try {
      const remainingQty = (listing.quantity || 1) - qty;
      const marketDocRef = doc(db, 'marketplace', listing.id);

      if (remainingQty <= 0) {
        await deleteDoc(marketDocRef);
      } else {
        await setDoc(marketDocRef, { ...listing, quantity: remainingQty });
      }

      const returnedItems = [];
      const timestamp = Date.now();
      for (let i = 0; i < qty; i++) {
        returnedItems.push({ 
          ...listing.item, 
          id: `${listing.item.id?.replace(/(_\d+)+$/, '')}_${timestamp}_${i}` 
        });
      }

      await syncPlayer({
        tokens: player.tokens - totalCost,
        inventory: [...(player.inventory || []), ...returnedItems]
      });

      // 5% Hub Tax / 95% Seller Payout
      const payout = Math.floor(totalCost * 0.95);
      const payoutRef = doc(collection(db, 'payouts'));
      await setDoc(payoutRef, {
        recipientUid: listing.sellerUid,
        amount: payout,
        itemName: `${qty}x ${listing.item.name}`,
        buyerName: player.name,
        createdAt: Date.now()
      });

      addLog(`🤝 DEAL SECURED: Acquired ${qty}x ${listing.item.name} for ${totalCost} GX.`);
      playSFX(SOUNDS.obtainLoot);
    } catch (e) {
      console.error(e);
      addLog("🚨 TRANSACTION FAILED: Signal lost.");
    }
  }, [player, user?.uid, syncPlayer, addLog, db, playSFX, SOUNDS]);

  // 4. Listing Logic (V2: UID Anchor)
  const listMarketItem = useCallback(async (item, totalPrice, quantity = 1) => {
    if (!user?.uid || !player) return;

    try {
      const baseId = item.id?.replace(/(_\d+)+$/, '');
      const itemsToConsume = [];
      let found = 0;
      
      const remainingInventory = (player.inventory || []).filter(invItem => {
         if (invItem.id?.replace(/(_\d+)+$/, '') === baseId && found < quantity) {
            itemsToConsume.push(invItem);
            found++;
            return false;
         }
         return true;
      });

      if (found < quantity) return addLog("🚨 ERROR: Insufficient storage units.");

      await syncPlayer({ inventory: remainingInventory });

      const pricePerUnit = Math.max(1, Math.floor(totalPrice / quantity));
      const listRef = doc(collection(db, 'marketplace'));
      await setDoc(listRef, {
        sellerUid: user.uid,
        sellerName: player.name,
        item: itemsToConsume[0], 
        quantity: quantity,
        price: pricePerUnit,
        createdAt: Date.now()
      });

      addLog(`📡 BROADCAST: ${quantity}x ${itemsToConsume[0].name} listed for ${totalPrice} GX.`);
      playSFX(SOUNDS.useHeal);
    } catch (e) {
      console.error(e);
      addLog("🚨 UPLINK FAILED: Could not broadcast listing.");
    }
  }, [user, player, syncPlayer, addLog, db, playSFX, SOUNDS]);

  // 5. Cancellation Logic
  const cancelMarketListing = useCallback(async (listingId) => {
    if (!player || !db) return;
    try {
      const listing = marketplace.find(l => l.id === listingId);
      if (!listing) return;

      await deleteDoc(doc(db, 'marketplace', listingId));

      const returnedItems = [];
      const qty = listing.quantity || 1;
      const timestamp = Date.now();
      for (let i = 0; i < qty; i++) {
        returnedItems.push({ 
          ...listing.item, 
          id: `${listing.item.id?.replace(/(_\d+)+$/, '')}_${timestamp}_${i}` 
        });
      }

      await syncPlayer({ inventory: [...(player.inventory || []), ...returnedItems] });
      addLog(`🚫 SIGNAL ABORTED: ${returnedItems.length}x ${listing.item.name} recovered.`);
    } catch (e) { console.error("Market cancel error:", e); }
  }, [player, marketplace, syncPlayer, addLog, db]);

  return {
    marketplace,
    purchaseMarketItem,
    listMarketItem,
    cancelMarketListing
  };
};
