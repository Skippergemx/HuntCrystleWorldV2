import { HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

export const handleSecureGameAction = async (request: any, db: admin.firestore.Firestore) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Security Clearance Denied.');
  }

  const { action, payload } = request.data;
  const uid = request.auth.uid;
  const userRef = db.collection('players').doc(uid);

  return await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) throw new HttpsError('not-found', 'Player Node Missing.');
    const userData = userSnap.data() as any;

    if (action === 'ALLOCATE_STAT') {
      const { statName } = payload;
      const currentAP = userData.abilityPoints || 0;
      if (currentAP <= 0) throw new HttpsError('failed-precondition', 'Insufficient AP.');

      const currentStat = (userData.baseStats?.[statName] || 10);
      transaction.update(userRef, {
        [`baseStats.${statName}`]: currentStat + 1,
        abilityPoints: currentAP - 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, message: `Upgraded ${statName}!` };
    }

    if (action === 'BUY_ITEM') {
      const { item, qty } = payload;
      const totalCost = item.cost * qty;
      const currentTokens = userData.tokens || 0;
      
      if (currentTokens < totalCost) throw new HttpsError('failed-precondition', 'Insufficient GX.');
      if (userData.level < (item.reqLvl || 1)) throw new HttpsError('failed-precondition', 'Level too low.');

      const updates: any = {
        tokens: currentTokens - totalCost,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (item.id === 'hp_potion') {
        updates.potions = (userData.potions || 0) + qty;
      } else if (item.id === 'auto_scroll') {
        updates.autoScrolls = (userData.autoScrolls || 0) + qty;
      } else {
        const inventory = userData.inventory || {};
        for (let i = 0; i < qty; i++) {
          const suffix = Math.random().toString(36).slice(2, 6);
          const uniqueId = `${item.id}_${Date.now()}_${suffix}`;
          inventory[uniqueId] = { ...item, id: uniqueId };
        }
        updates.inventory = inventory;
      }

      transaction.update(userRef, updates);
      return { success: true, message: `Acquired ${item.name}!` };
    }

    if (action === 'MIX_ITEM') {
      const { recipe, itemsToConsumeKeys } = payload;
      const currentTokens = userData.tokens || 0;
      if (currentTokens < (recipe.cost || 0)) throw new HttpsError('failed-precondition', 'Insufficient GX.');

      const inventory = userData.inventory || {};
      itemsToConsumeKeys.forEach((key: string) => {
        if (!inventory[key]) throw new HttpsError('not-found', `Missing material: ${key}`);
        delete inventory[key];
      });

      const updates: any = {
        tokens: currentTokens - (recipe.cost || 0),
        inventory: inventory,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (recipe.id === 'hp_potion') {
        updates.potions = (userData.potions || 0) + 1;
      } else if (recipe.id === 'auto_scroll') {
        updates.autoScrolls = (userData.autoScrolls || 0) + 1;
      } else {
        const suffix = Math.random().toString(36).slice(2, 6);
        const uniqueId = `${recipe.id}_${Date.now()}_${suffix}`;
        inventory[uniqueId] = { ...recipe, id: uniqueId };
        updates.inventory = inventory;
      }

      transaction.update(userRef, updates);
      return { success: true, message: `Fusion Successful!` };
    }

    if (action === 'PROCESS_KILL_REWARDS') {
      const { earnedLoot, earnedXp, nextXp, nextLvl, nextMaxHp, apGained, loots } = payload;
      
      if (earnedLoot > 50000 || earnedXp > 100000) {
        throw new HttpsError('out-of-range', 'Payload Integrity Compromised.');
      }

      const updates: any = {
        tokens: (userData.tokens || 0) + earnedLoot,
        xp: nextXp,
        level: nextLvl,
        maxHp: nextMaxHp,
        hp: Math.min(nextMaxHp, (userData.hp || 0) + 25),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (apGained > 0) {
        updates.abilityPoints = (userData.abilityPoints || 0) + apGained;
      }

      if (loots && loots.length > 0) {
        const inventory = userData.inventory || {};
        loots.forEach((loot: any) => {
          if (loot.id?.includes('_pool_')) return;
          inventory[loot.id] = loot;
        });
        updates.inventory = inventory;
        
        const potCount = loots.filter((l: any) => l.id?.startsWith('hp_potion')).length;
        if (potCount > 0) updates.potions = (userData.potions || 0) + potCount;
        
        const scrollCount = loots.filter((l: any) => l.id?.startsWith('auto_scroll_pool')).length;
        if (scrollCount > 0) updates.autoScrolls = (userData.autoScrolls || 0) + scrollCount;
      }

      transaction.update(userRef, updates);
      return { success: true };
    }

    if (action === 'SELL_ITEM') {
      const { itemId, value, qty } = payload;
      const inventory = userData.inventory || {};
      const targetItem = inventory[itemId];
      if (!targetItem) throw new HttpsError('not-found', 'Item not in inventory.');

      const baseId = targetItem.id?.replace(/_([a-z0-9]+)+$/, '');
      const sellQty = qty || 1;

      const entries = Object.entries(inventory);
      let removed = 0;
      for (const [key, invItem] of entries) {
        if ((invItem as any).id?.replace(/_([a-z0-9]+)+$/, '') === baseId && removed < sellQty) {
          delete inventory[key];
          removed++;
        }
      }

      transaction.update(userRef, {
        tokens: (userData.tokens || 0) + value,
        inventory: inventory,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, message: `Sold ${removed} units.` };
    }

    if (action === 'COMPLETE_TOWN_QUEST') {
      const { quest, rewardFood } = payload;
      const inventory = userData.inventory || {};
      
      // Verify and remove required items
      quest.requires.forEach((req: any) => {
        let removed = 0;
        const entries = Object.entries(inventory);
        for (const [key, val] of entries) {
          if (removed >= req.qty) break;
          if ((val as any)?.id?.startsWith(req.itemId)) {
            delete inventory[key];
            removed++;
          }
        }
        if (removed < req.qty) {
          throw new HttpsError('failed-precondition', `Missing required material: ${req.itemId}`);
        }
      });

      // Add food reward
      if (rewardFood) {
        const rewardKey = `${rewardFood.id}_TOWN_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        inventory[rewardKey] = { ...rewardFood, id: rewardKey };
      }

      // Mark quest slot as completed and rotate
      const currentSlots = [...(userData.townQuestSlots || [])].filter((id: string) => id !== quest.id);
      const completedTownQuests = userData.completedTownQuests || {};
      completedTownQuests[quest.id] = Date.now();

      // Progression
      let nextXp = (userData.crystleTownInfluenceXP || 0) + 5;
      let nextLvl = userData.crystleTownLevel || 1;
      let leveledUp = false;

      while (nextXp >= 25) {
         nextXp -= 25;
         nextLvl++;
         leveledUp = true;
      }

      transaction.update(userRef, {
        inventory,
        townQuestSlots: currentSlots,
        completedTownQuests,
        crystleTownInfluenceXP: nextXp,
        crystleTownLevel: nextLvl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, leveledUp, nextLvl, item: rewardFood ? { ...rewardFood, qty: 1 } : null };
    }

    if (action === 'EQUIP_ITEM') {
      const { itemId, slot } = payload;
      const inventory = userData.inventory || {};
      const equipped = userData.equipped || {};
      const item = inventory[itemId];

      if (!item) throw new HttpsError('not-found', 'Item not in inventory.');

      if (equipped[slot]) {
        const oldItem = equipped[slot];
        inventory[oldItem.id || `OLD_${slot}`] = oldItem;
      }

      equipped[slot] = item;
      delete inventory[itemId];

      transaction.update(userRef, {
        inventory: inventory,
        equipped: equipped,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    }

    if (action === 'UNEQUIP_ITEM') {
      const { slot } = payload;
      const equipped = userData.equipped || {};
      const inventory = userData.inventory || {};
      const item = equipped[slot];

      if (!item) throw new HttpsError('failed-precondition', 'Slot is empty.');

      inventory[item.id || `RET_${slot}`] = item;
      delete equipped[slot];

      transaction.update(userRef, {
        inventory: inventory,
        equipped: equipped,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    }

    if (action === 'HIRE_MATE') {
      const { mateId, cost } = payload;
      const currentTokens = userData.tokens || 0;
      if (currentTokens < cost) throw new HttpsError('failed-precondition', 'Insufficient GX.');

      transaction.update(userRef, {
        tokens: currentTokens - cost,
        hiredMate: mateId,
        buffUntil: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    }

    if (action === 'SUMMON_DRAGON') {
      const { cost, summonUntil } = payload;
      const currentTokens = userData.tokens || 0;
      if (currentTokens < cost) throw new HttpsError('failed-precondition', 'Insufficient GX.');

      transaction.update(userRef, {
        tokens: currentTokens - cost,
        'dragon.summonUntil': summonUntil,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    }

    if (action === 'PROCESS_BOSS_HIT') {
      const { dmg, lootUpdates } = payload;
      const newTotal = (userData.totalBossDamage || 0) + dmg;
      
      const updates: any = {
        totalBossDamage: newTotal,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (lootUpdates && Object.keys(lootUpdates).length > 0) {
        const inventory = userData.inventory || {};
        Object.entries(lootUpdates).forEach(([key, val]: [string, any]) => {
          inventory[key] = val;
        });
        updates.inventory = inventory;
      }

      transaction.update(userRef, updates);
      return { success: true };
    }

    if (action === 'PROCESS_NAGA_HIT') {
      const { warId, mySide, myUid, enemyUid, newMyHp, newEnemyHp, perfectTiming } = payload;
      
      // Basic integrity check to prevent insta-kill payloads (-99999 HP)
      if (newMyHp < 0 || newEnemyHp < 0) {
         throw new HttpsError('out-of-range', 'Negative HP values are unauthorized.');
      }
      
      const oppSide = mySide === 'defendersA' ? 'defendersB' : 'defendersA';
      const warRef = admin.firestore().collection('guild_wars').doc(warId);
      
      const momentumKey = mySide === 'defendersA' ? 'momentumA' : 'momentumB';

      transaction.update(warRef, {
        [`${mySide}.${myUid}.currentHp`]: newMyHp,
        [`${oppSide}.${enemyUid}.currentHp`]: newEnemyHp,
        [momentumKey]: admin.firestore.FieldValue.increment(perfectTiming ? 5 : 1)
      });
      
      return { success: true };
    }

    if (action === 'CLAIM_TREASURY_REWARDS') {
      const { rewards, autoTimeLeftSaved } = payload;
      const updates: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (autoTimeLeftSaved !== undefined) {
        updates.autoTimeLeftSaved = autoTimeLeftSaved;
        updates.autoUntil = 0;
      }

      if (rewards && rewards.length > 0) {
        const inventory = userData.inventory || {};
        rewards.forEach((r: any) => {
          inventory[r.id] = r;
        });
        updates.inventory = inventory;
      }

      transaction.update(userRef, updates);
      return { success: true };
    }

    if (action === 'MARKET_LIST') {
      const { item, totalPrice, quantity } = payload;
      const baseId = item.id?.replace(/(_\d+)+$/, '');
      const inventory = userData.inventory || {};
      
      const itemsToConsume = [];
      const invEntries = Object.entries(inventory);
      for (const [key, invItem] of invEntries) {
        if ((invItem as any).id?.replace(/(_\d+)+$/, '') === baseId && itemsToConsume.length < quantity) {
          itemsToConsume.push(key);
        }
      }

      let counterDeduction = 0;
      if (itemsToConsume.length < quantity) {
        const needed = quantity - itemsToConsume.length;
        let available = 0;
        if (baseId === 'hp_potion') available = userData.potions || 0;
        else if (baseId === 'auto_scroll') available = userData.autoScrolls || 0;

        if (available >= needed) counterDeduction = needed;
        else throw new HttpsError('failed-precondition', 'Insufficient stock.');
      }

      const updates: any = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
      itemsToConsume.forEach(key => delete inventory[key]);
      updates.inventory = inventory;

      if (counterDeduction > 0) {
        if (baseId === 'hp_potion') updates.potions = (userData.potions || 0) - counterDeduction;
        else if (baseId === 'auto_scroll') updates.autoScrolls = (userData.autoScrolls || 0) - counterDeduction;
      }

      transaction.update(userRef, updates);

      const marketRef = db.collection('marketplace').doc();
      transaction.set(marketRef, {
        sellerUid: uid,
        sellerName: userData.name,
        item: item,
        quantity: quantity,
        price: Math.max(1, Math.floor(totalPrice / quantity)),
        createdAt: Date.now()
      });
      return { success: true };
    }

    if (action === 'MARKET_PURCHASE') {
      const { listingId, qty } = payload;
      const marketRef = db.collection('marketplace').doc(listingId);
      const marketSnap = await transaction.get(marketRef);
      if (!marketSnap.exists) throw new HttpsError('not-found', 'Item sold.');

      const listing = marketSnap.data() as any;
      if (listing.quantity < qty) throw new HttpsError('failed-precondition', 'Insufficient quantity.');

      const totalCost = listing.price * qty;
      if ((userData.tokens || 0) < totalCost) throw new HttpsError('failed-precondition', 'Insufficient GX.');

      const payoutRef = db.collection('payouts').doc();
      transaction.set(payoutRef, {
        recipientUid: listing.sellerUid,
        amount: Math.floor(totalCost * 0.95),
        itemName: `${qty}x ${listing.item.name}`,
        buyerName: userData.name,
        createdAt: Date.now()
      });

      if (listing.quantity === qty) transaction.delete(marketRef);
      else transaction.update(marketRef, { quantity: listing.quantity - qty });

      const updates: any = {
        tokens: (userData.tokens || 0) - totalCost,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (listing.item.id?.startsWith('hp_potion')) {
        updates.potions = (userData.potions || 0) + qty;
      } else {
        const inventory = userData.inventory || {};
        for (let i = 0; i < qty; i++) {
          const uniqueId = `${listing.item.id?.replace(/(_\d+)+$/, '')}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${i}`;
          inventory[uniqueId] = { ...listing.item, id: uniqueId };
        }
        updates.inventory = inventory;
      }

      transaction.update(userRef, updates);
      return { success: true };
    }

    if (action === 'MARKET_CANCEL') {
      const { listingId } = payload;
      const marketRef = db.collection('marketplace').doc(listingId);
      const marketSnap = await transaction.get(marketRef);
      if (!marketSnap.exists) throw new HttpsError('not-found', 'Listing missing.');

      const listing = marketSnap.data() as any;
      if (listing.sellerUid !== uid) throw new HttpsError('permission-denied', 'Not your listing.');

      transaction.delete(marketRef);

      const qty = listing.quantity || 1;
      const baseId = listing.item.id?.replace(/(_\d+)+$/, '');
      const updates: any = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

      if (baseId === 'hp_potion') {
        updates.potions = (userData.potions || 0) + qty;
      } else {
        const inventory = userData.inventory || {};
        for (let i = 0; i < qty; i++) {
          const uniqueId = `${baseId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${i}`;
          inventory[uniqueId] = { ...listing.item, id: uniqueId };
        }
        updates.inventory = inventory;
      }

      transaction.update(userRef, updates);
      return { success: true };
    }

    if (action === 'CLAIM_PAYOUTS') {
      const payoutsQuery = db.collection('payouts').where('recipientUid', '==', uid);
      const payoutsSnap = await transaction.get(payoutsQuery);
      if (payoutsSnap.empty) return { success: true, total: 0 };

      let total = 0;
      payoutsSnap.forEach(d => {
        total += d.data().amount || 0;
        transaction.delete(d.ref);
      });

      transaction.update(userRef, {
        tokens: (userData.tokens || 0) + total,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, total };
    }

    if (action === 'ACTIVATE_SCROLL') {
      const { selection, ms, val, view } = payload;
      const inventory = userData.inventory || {};
      const updates: any = {
        autoUntil: Date.now() + ms,
        autoMode: view || 'dungeon',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const possibleScrollIds = ['auto_scroll_12m', 'auto_scroll_9m', 'auto_scroll_6m', 'auto_scroll_3m', 'auto_scroll'];
      const targetKey = Object.keys(inventory).find(key => {
        const item = inventory[key];
        const itemBaseId = possibleScrollIds.find(baseId => item.id.startsWith(baseId));
        return itemBaseId === selection;
      });

      if (targetKey) {
        delete inventory[targetKey];
        updates.inventory = inventory;
      } else if ((userData.autoScrolls || 0) >= val) {
        updates.autoScrolls = (userData.autoScrolls || 0) - val;
      } else {
        throw new HttpsError('failed-precondition', 'Insufficient scrolls.');
      }

      transaction.update(userRef, updates);
      return { success: true };
    }

    throw new HttpsError('unimplemented', 'Action Not Recognized.');
  });
};
