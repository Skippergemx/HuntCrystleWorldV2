import { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, getDocs, limit, runTransaction, deleteField } from 'firebase/firestore';

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
      const marketDocRef = doc(db, 'marketplace', listing.id);

      await runTransaction(db, async (transaction) => {
        const marketSnap = await transaction.get(marketDocRef);
        if (!marketSnap.exists()) throw new Error("ITEM_SOLD");

        const currentData = marketSnap.data();
        const availableQty = currentData.quantity || 1;
        if (availableQty < qty) throw new Error("INSUFFICIENT_QTY");

        const remainingQty = availableQty - qty;

        if (remainingQty <= 0) {
          transaction.delete(marketDocRef);
        } else {
          transaction.update(marketDocRef, { quantity: remainingQty });
        }

        // 5% Hub Tax / 95% Seller Payout (Atomic inside transaction)
        const payout = Math.floor(totalCost * 0.95);
        const payoutRef = doc(collection(db, 'payouts'));
        transaction.set(payoutRef, {
          recipientUid: listing.sellerUid,
          amount: payout,
          itemName: `${qty}x ${listing.item.name}`,
          buyerName: player.name,
          createdAt: Date.now()
        });
      });

      const returnedItems = [];
      const timestamp = Date.now();
      for (let i = 0; i < qty; i++) {
        const suffix = Math.random().toString(36).slice(2, 6);
        returnedItems.push({ 
          ...listing.item, 
          id: `${listing.item.id?.replace(/(_\d+)+$/, '')}_${timestamp}_${suffix}_${i}` 
        });
      }

      const updates = { tokens: player.tokens - totalCost };
      
      if (listing.item.id?.startsWith('hp_potion')) {
        updates.potions = (player.potions || 0) + qty;
      } else {
        returnedItems.forEach(item => { updates[`inventory.${item.id}`] = item; });
      }

      await syncPlayer(updates);

      addLog(`🤝 DEAL SECURED: Acquired ${qty}x ${listing.item.name} for ${totalCost} GX.`);
      playSFX(SOUNDS.obtainLoot);
      return true;
    } catch (e) {
      console.error(e);
      if (e.message === "ITEM_SOLD") {
         addLog("🚨 TOO LATE: Item was snatched by another hunter!");
      } else if (e.message === "INSUFFICIENT_QTY") {
         addLog("🚨 ERROR: Not enough quantity left.");
      } else {
         addLog("🚨 TRANSACTION FAILED: Signal lost.");
      }
      return false;
    }
  }, [player, user?.uid, syncPlayer, addLog, db, playSFX, SOUNDS]);

  // 4. Listing Logic (V2: UID Anchor)
  const listMarketItem = useCallback(async (item, totalPrice, quantity = 1) => {
    if (!user?.uid || !player) return;

    try {
      const baseId = item.id?.replace(/(_\d+)+$/, '');

      await runTransaction(db, async (transaction) => {
        const playerRef = doc(db, 'players', user.uid);
        const playerSnap = await transaction.get(playerRef);
        if (!playerSnap.exists()) throw new Error("UNAUTHORIZED");
        
        const playerData = playerSnap.data();
        const inventory = Object.entries(playerData.inventory || {});
        
        const itemsToConsume = [];
        inventory.forEach(([key, invItem]) => {
          if (invItem.id?.replace(/(_\d+)+$/, '') === baseId && itemsToConsume.length < quantity) {
            itemsToConsume.push({ key, ...invItem });
          }
        });

        // Hub Strategy: Check counters if inventory is shallow
        let counterDeduction = 0;
        if (itemsToConsume.length < quantity) {
           const needed = quantity - itemsToConsume.length;
           let availableInCounter = 0;
           if (baseId === 'hp_potion') availableInCounter = playerData.potions || 0;
           else if (baseId === 'auto_scroll') availableInCounter = playerData.autoScrolls || 0;

           if (availableInCounter >= needed) {
              counterDeduction = needed;
           } else {
              throw new Error("INSUFFICIENT_STOCK");
           }
        }

        // Delete from player inventory
        const updates = {};
        itemsToConsume.forEach(loot => {
          updates[`inventory.${loot.key}`] = deleteField();
        });

        // Deduct from counter if needed
        if (counterDeduction > 0) {
           if (baseId === 'hp_potion') updates.potions = (playerData.potions || 0) - counterDeduction;
           else if (baseId === 'auto_scroll') updates.autoScrolls = (playerData.autoScrolls || 0) - counterDeduction;
        }
        
        transaction.update(playerRef, updates);

        // Add to global marketplace
        const pricePerUnit = Math.max(1, Math.floor(totalPrice / quantity));
        const listRef = doc(collection(db, 'marketplace'));
        
        // Use a consistent item template for market entries (prevents UUID-bloated IDs in market docs)
        const marketItemTemplate = itemsToConsume.length > 0 ? itemsToConsume[0] : { 
           id: baseId, 
           name: baseId === 'hp_potion' ? "Small Potion" : "Auto-Hunt Scroll",
           icon: baseId === 'hp_potion' ? "🧪" : "🤖"
        };

        transaction.set(listRef, {
          sellerUid: user.uid,
          sellerName: player.name,
          item: marketItemTemplate, 
          quantity: quantity,
          price: pricePerUnit,
          createdAt: Date.now()
        });

        console.log(`📡 TRANSACTION_LISTING: Atomic broadcast for ${quantity}x ${item.name} successful.`);
      });

      addLog(`📡 BROADCAST: ${quantity}x ${item.name} listed for ${totalPrice} GX.`);
      playSFX(SOUNDS.useHeal);
    } catch (e) {
      console.error(e);
      if (e.message === "INSUFFICIENT_STOCK") addLog("🚨 ERROR: Stashed units have shifted or vanished.");
      else addLog("🚨 UPLINK FAILED: Market transaction aborted.");
    }
  }, [user, player, addLog, db, playSFX, SOUNDS]);

  // 5. Cancellation Logic
  const cancelMarketListing = useCallback(async (listingId) => {
    if (!player || !user?.uid || !db) return;
    try {
      await runTransaction(db, async (transaction) => {
        const listingRef = doc(db, 'marketplace', listingId);
        const listingSnap = await transaction.get(listingRef);
        if (!listingSnap.exists()) throw new Error("LISTING_GHOSTED");
        
        const listing = listingSnap.data();
        if (listing.sellerUid !== user.uid) throw new Error("FORBIDDEN");

        transaction.delete(listingRef);

        const qty = listing.quantity || 1;
        const timestamp = Date.now();
        const playerRef = doc(db, 'players', user.uid);
        const updates = {};
        const baseId = listing.item.id?.replace(/(_\d+)+$/, '');

        // Standardize: Return to numeric counters for stackable essentials
        if (baseId === 'hp_potion') {
           const pSnap = await transaction.get(playerRef);
           updates.potions = (pSnap.data()?.potions || 0) + qty;
        } else {
           for (let i = 0; i < qty; i++) {
             const suffix = Math.random().toString(36).slice(2, 6);
             const newId = `${baseId}_${timestamp}_${suffix}_${i}`;
             updates[`inventory.${newId}`] = { ...listing.item, id: newId };
           }
        }
        
        transaction.update(playerRef, updates);
      });

      addLog(`🚫 SIGNAL ABORTED: Market listing recovered.`);
    } catch (e) { 
      console.error("Market cancel error:", e);
      if (e.message === "LISTING_GHOSTED") addLog("🚨 ERROR: Listing no longer exists (potentially sold).");
      else addLog("🚨 ABORT FAILED: Could not recover stashed items.");
    }
  }, [player, user?.uid, addLog, db]);

  return {
    marketplace,
    purchaseMarketItem,
    listMarketItem,
    cancelMarketListing
  };
};
