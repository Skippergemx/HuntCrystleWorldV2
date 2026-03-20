import { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export const useMarketplace = (user, player, syncPlayer, addLog, playSFX, SOUNDS, db, appId) => {
  const [marketplace, setMarketplace] = useState([]);

  useEffect(() => {
    if (!user) return;
    try {
      const q = collection(db, 'artifacts', appId, 'public', 'data', 'marketplace');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setMarketplace(data);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, [user, db, appId]);

  // Auto-claim pending GX payouts from marketplace sales
  useEffect(() => {
    if (!user || !player) return;
    const identifier = user.email || user.uid;
    const claimPayouts = async () => {
      try {
        const { getDocs, query: fsQuery, where } = await import('firebase/firestore');
        const q = collection(db, 'artifacts', appId, 'public', 'data', 'payouts');
        const snapshot = await getDocs(fsQuery(q, where('recipientEmail', '==', identifier)));
        if (snapshot.empty) return;
        let totalPayout = 0;
        const deletePromises = [];
        snapshot.forEach(d => {
          totalPayout += d.data().amount || 0;
          deletePromises.push(deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payouts', d.id)));
        });
        await Promise.all(deletePromises);
        if (totalPayout > 0) {
          await syncPlayer({ tokens: (player.tokens || 0) + totalPayout });
          addLog(`💸 Marketplace: +${totalPayout} GX from your sales!`);
        }
      } catch (e) {
        console.error('Payout claim error:', e);
      }
    };
    claimPayouts();
  }, [user?.uid, player?.level, db, appId, addLog, syncPlayer, player?.tokens]); 

  const purchaseMarketItem = useCallback(async (listing) => {
    if (!player || player.tokens < listing.price) return addLog("Out of GX!");

    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'marketplace', listing.id));

      const newInventory = [...(player.inventory || []), listing.item];
      await syncPlayer({
        tokens: player.tokens - listing.price,
        inventory: newInventory
      });

      const payout = Math.floor(listing.price * 0.95);
      const payoutRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'payouts'));
      await setDoc(payoutRef, {
        recipientEmail: listing.sellerEmail,
        amount: payout,
        itemName: listing.item.name,
        buyerName: player.name,
        createdAt: Date.now()
      });

      addLog(`\uD83E\uDD1D Market Deal: Acquired ${listing.item.name} for ${listing.price} GX.`);
      playSFX(SOUNDS.obtainLoot);
    } catch (e) {
      console.error(e);
      addLog("Transaction failed: listing may have been acquired.");
    }
  }, [player, syncPlayer, addLog, db, appId, playSFX, SOUNDS]);

  const listMarketItem = useCallback(async (item, price) => {
    if (!user || !player) return;

    try {
      const index = player.inventory.findIndex(i => i.id === item.id);
      const newInventory = [...player.inventory];
      newInventory.splice(index, 1);

      await syncPlayer({ inventory: newInventory });

      const listRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'marketplace'));
      await setDoc(listRef, {
        sellerUid: user.uid,
        sellerEmail: user.email || user.uid,
        sellerName: player.name,
        item: item,
        price: price,
        createdAt: Date.now()
      });

      addLog(`📡 Broadcast: ${item.name} listed for ${price} GX.`);
    } catch (e) {
      console.error(e);
      addLog("Broadcasting failed.");
    }
  }, [user, player, syncPlayer, addLog, db, appId]);

  const cancelMarketListing = useCallback(async (listingId) => {
    if (!player) return;
    try {
      const listing = marketplace.find(l => l.id === listingId);
      if (!listing) return;

      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'marketplace', listingId));

      await syncPlayer({ inventory: [...(player.inventory || []), listing.item] });
      addLog(`🚫 Signal Terminated: ${listing.item.name} returned to storage.`);
    } catch (e) {
      console.error(e);
    }
  }, [player, marketplace, syncPlayer, addLog, db, appId]);

  return {
    marketplace,
    purchaseMarketItem,
    listMarketItem,
    cancelMarketListing
  };
};
