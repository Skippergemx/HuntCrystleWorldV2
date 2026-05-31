import { useCallback, useRef, useEffect } from 'react';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp, collection, addDoc, deleteDoc, deleteField, runTransaction } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { calculateNagaStats, getXpRequired, AP_PER_LEVEL, getMonsterElement } from '../utils/gameLogic';

/**
 * usePlayerActions V2: Unified Action Engine
 * Centralizes all high-level game logic and database writes.
 * Migrated to root collections and UID-primary identity keys.
 */
export const usePlayerActions = (
  player,
  setPlayer,
  syncPlayer,
  addLog,
  playSFX,
  SOUNDS,
  TAVERN_MATES,
  ITEMS,
  setForgeResult,
  totalStats,
  db,
  appId,
  PETS_METADATA,
  gvgActions = {},
  functions = null,
  setFaucetResult = null,
  addOptimisticUpdate = null
) => {
  const { setBattleMode, setGvgContext, setEnemy, setView } = gvgActions;

  // Track synchronous AP to prevent rapid-click negative balances
  const remainingApRef = useRef(0);
  useEffect(() => {
    remainingApRef.current = player?.abilityPoints || 0;
  }, [player?.abilityPoints]);

  // ── DUNGEON LOADOUT SYSTEM ──
  // Session-only caps: 20 potion uses & 20 scroll uses per dungeon run.
  // Stored in a ref so reads are always current without re-render chains.
  const EMPTY_LOADOUT = {
    potions: { hp_potion: 0, mega_hp_potion: 0, ultra_hp_potion: 0 },
    scrolls: { auto_scroll: 0, auto_scroll_3m: 0, auto_scroll_6m: 0, auto_scroll_9m: 0, auto_scroll_12m: 0 }
  };
  const freshLoadout = () => ({
    potions: { ...EMPTY_LOADOUT.potions },
    scrolls: { ...EMPTY_LOADOUT.scrolls }
  });
  const loadoutRef = useRef(freshLoadout());
  const isLoadoutReadyRef = useRef(false);

  const setLoadout = useCallback((newLoadout) => {
    loadoutRef.current = {
      potions: { ...EMPTY_LOADOUT.potions, ...(newLoadout?.potions || {}) },
      scrolls: { ...EMPTY_LOADOUT.scrolls, ...(newLoadout?.scrolls || {}) },
    };
    isLoadoutReadyRef.current = true;
  }, []);

  const clearLoadout = useCallback(() => {
    loadoutRef.current = freshLoadout();
    isLoadoutReadyRef.current = false;
  }, []);

  const getLoadout = useCallback(() => loadoutRef.current, []);

  const getTotalPotionLoadout = useCallback(() => {
    const p = loadoutRef.current.potions;
    return (p.hp_potion || 0) + (p.mega_hp_potion || 0) + (p.ultra_hp_potion || 0);
  }, []);

  const getTotalScrollLoadout = useCallback(() => {
    const s = loadoutRef.current.scrolls;
    return (s.auto_scroll || 0) + (s.auto_scroll_3m || 0) + (s.auto_scroll_6m || 0) + (s.auto_scroll_9m || 0) + (s.auto_scroll_12m || 0);
  }, []);

  const getPlayerPotionOwned = useCallback(() => {
    const inventory = Object.values(player?.inventory || {});
    return {
      hp_potion: player?.potions || 0,
      mega_hp_potion: inventory.filter(i => i?.id?.startsWith('mega_hp_potion')).length,
      ultra_hp_potion: inventory.filter(i => i?.id?.startsWith('ultra_hp_potion')).length,
    };
  }, [player]);

  const getPlayerScrollOwned = useCallback(() => {
    const inventory = Object.values(player?.inventory || {});
    return {
      auto_scroll: player?.autoScrolls || 0,
      auto_scroll_3m: inventory.filter(i => i?.id?.startsWith('auto_scroll_3m')).length,
      auto_scroll_6m: inventory.filter(i => i?.id?.startsWith('auto_scroll_6m')).length,
      auto_scroll_9m: inventory.filter(i => i?.id?.startsWith('auto_scroll_9m')).length,
      auto_scroll_12m: inventory.filter(i => i?.id?.startsWith('auto_scroll_12m')).length,
    };
  }, [player]);

  const startGvGRaid = useCallback((warId, opponentId, defenderData, syndicateName = "Unknown", syndicateTag = "???") => {
    if (!setGvgContext || !setView) {
        console.error("System V4: Battle Bridge Offline. Context missing.");
        return;
    }
    console.log(`🚀 [WAR_PROTOCOL_V4]: Transitioning to Combat Bridge | Target: ${opponentId}`);
    setGvgContext({ warId, opponentId });
    setView('naga_combat');
    addLog(`🚩 NAGA RAID: Targeting [${syndicateTag}] ${defenderData.name}!`);
  }, [setGvgContext, setView, addLog]);

  const handleHeal = useCallback(async () => {
    if (player.hp >= totalStats.maxHp) return;
    const inventory = Object.values(player.inventory || {});
    const selection = player.selectedPotionId || 'hp_potion';
    
    const potionSpecs = {
      'hp_potion': { mult: 0.1, label: '10%' },
      'mega_hp_potion': { mult: 0.5, label: '50%' },
      'ultra_hp_potion': { mult: 1.0, label: '100%' }
    };

    const spec = potionSpecs[selection] || potionSpecs['hp_potion'];
    const targetItem = inventory.find(i => i && i.id?.startsWith(selection));
    const hasCounter = (player.potions || 0) > 0;

    // ── LOADOUT GUARD ──
    const loadoutPotionCount = loadoutRef.current.potions[selection] || 0;
    if (loadoutPotionCount <= 0) {
      return addLog(`No ${selection.replace(/_/g, ' ')} packed for this run!`);
    }

    let useCounter = false;
    let usedItemId = null;

    if (targetItem) {
      usedItemId = targetItem.id;
    } else if (selection === 'hp_potion' && hasCounter) {
      useCounter = true;
    } else {
      return addLog(`Wait! No ${selection.replace(/_/g, ' ')}'s found in bag.`);
    }

    // Decrement loadout before optimistic update
    loadoutRef.current.potions[selection] = loadoutPotionCount - 1;

    const healAmt = Math.floor(totalStats.maxHp * spec.mult);
    playSFX(SOUNDS.useHeal);

    // 1. Optimistic Local State Update (keeps UI responsive during intense combat)
    setPlayer(prev => {
      if (!prev) return prev;
      const nextHp = Math.min(totalStats.maxHp, prev.hp + healAmt);
      const nextInv = { ...prev.inventory };
      let nextPotions = prev.potions || 0;

      if (useCounter) {
        nextPotions = Math.max(0, nextPotions - 1);
      } else if (usedItemId && nextInv[usedItemId]) {
        delete nextInv[usedItemId];
      }

      return {
        ...prev,
        hp: nextHp,
        potions: nextPotions,
        inventory: nextInv
      };
    });

    addLog(`Healed for ${spec.label} Max HP (+${healAmt} HP).`);

    // 2. Secure Backend Commitment
    try {
      const callAction = httpsCallable(functions, 'secureGameAction');
      const result = await callAction({
        action: 'USE_POTION',
        payload: { selection, maxHp: totalStats.maxHp }
      });
      const data = result.data || {};
      if (!data.success) {
        console.warn("Backend failed to confirm potion usage:", data.message);
      }
    } catch (e) {
      console.error("Failed to commit potion usage securely:", e);
      addLog("🚨 UPLINK ERROR: Potion consumption could not be verified.");
    }
  }, [player, totalStats.maxHp, setPlayer, addLog, playSFX, SOUNDS, functions]);

  const cyclePotion = () => {
    const allPotions = ['hp_potion', 'mega_hp_potion', 'ultra_hp_potion'];
    const loadout = loadoutRef.current.potions;
    const available = allPotions.filter(p => (loadout[p] || 0) > 0);
    if (available.length === 0) return;
    const currentIdx = available.indexOf(player.selectedPotionId || 'hp_potion');
    const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % available.length;
    syncPlayer({ selectedPotionId: available[nextIdx] });
    addLog(`Tactical Swap: Selected ${available[nextIdx].replace(/_/g, ' ')}.`);
  };

  const cycleScroll = () => {
    const allScrolls = ['auto_scroll', 'auto_scroll_3m', 'auto_scroll_6m', 'auto_scroll_9m', 'auto_scroll_12m'];
    const loadout = loadoutRef.current.scrolls;
    const available = allScrolls.filter(s => (loadout[s] || 0) > 0);
    if (available.length === 0) return;
    const currentIdx = available.indexOf(player.selectedScrollId || 'auto_scroll');
    const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % available.length;
    syncPlayer({ selectedScrollId: available[nextIdx] });
    addLog(`Tactical Swap: Selected ${available[nextIdx].replace(/_/g, ' ')}.`);
  };

  const hireMate = async (mate) => {
    if (player.tokens < mate.cost) return addLog("Out of GX!");
    
    if (player.hiredMate) {
       const old = TAVERN_MATES.find(m => m.id === player.hiredMate);
       addLog(`Replacing ${old?.name || 'Party Member'} with ${mate.name}...`);
    }

    setPlayer(prev => ({ ...prev, tokens: prev.tokens - mate.cost, hiredMate: mate.id, buffUntil: 0 }));
    
    try {
      const callAction = httpsCallable(functions, 'secureGameAction');
      await callAction({ 
        action: 'HIRE_MATE', 
        payload: { mateId: mate.id, cost: mate.cost } 
      });
      addLog(`Contract signed: ${mate.name} joined!`);
    } catch (e) {
      console.error(e);
      addLog("🚨 UPLINK ERROR: Contract failed.");
    }
  };

  const dismissMate = () => {
    if (!player.hiredMate) return;
    const mate = TAVERN_MATES.find(m => m.id === player.hiredMate);
    syncPlayer({ hiredMate: null, buffUntil: 0 });
    addLog(`Contract terminated. ${mate?.name || 'Party member'} has left the team.`);
  };

  const summonDragon = async () => {
    if (!player.dragon || player.dragon.level <= 0) return addLog("No dragon to summon!");
    const cost = 1000 * player.dragon.level;
    if (player.tokens < cost) return addLog(`Insufficient GX! Need ${cost.toLocaleString()} GX.`);
    
    const summonUntil = Date.now() + 86400000;
    setPlayer(prev => ({
      ...prev,
      tokens: prev.tokens - cost,
      dragon: { ...prev.dragon, summonUntil }
    }));

    try {
      const callAction = httpsCallable(functions, 'secureGameAction');
      await callAction({ 
        action: 'SUMMON_DRAGON', 
        payload: { cost, summonUntil } 
      });
      addLog(`✨ Dragon Power Summoned! (+${player.dragon.level * 5} ALL STATS)`);
      playSFX(SOUNDS.obtainLoot);
    } catch (e) {
      console.error(e);
      addLog("🚨 UPLINK ERROR: Summon failed.");
    }
  };

  const sellItem = useCallback(async (itemId, qty = 1) => {
    if (!player.inventory || !player.inventory[itemId]) return;
    const item = player.inventory[itemId];
    
    // Robust base ID extractor matching the backend's implementation
    const extractBaseId = (id) => {
      if (!id) return '';
      const tsStripped = id.replace(/_\d{10,}.*$/, '');
      if (tsStripped !== id) return tsStripped;
      return id.replace(/_[a-z0-9]{4}$/i, '').replace(/_\d+$/, '');
    };

    const itemBaseId = extractBaseId(item.id || itemId);
    const master = ITEMS.find(i => i.id === itemBaseId) || item;
    
    let value = 0;
    if (master.cost) {
      value = Math.floor(master.cost * 0.4);
    } else {
      value = master.sellValue || item.sellValue || 0;
    }

    const totalValue = value * qty;
    playSFX(SOUNDS.sellItem);
    
    if (addOptimisticUpdate) {
      addOptimisticUpdate({
        tokens: (player.tokens || 0) + totalValue,
        [`inventory.${itemId}`]: { _methodName: 'deleteField' }
      });
    }

    try {
      const callAction = httpsCallable(functions, 'secureGameAction');
      const result = await callAction({ 
        action: 'SELL_ITEM', 
        payload: { itemId, value: totalValue, qty } 
      });
      if (result.data?.success) {
         addLog(`💰 Sold ${qty}x ${master.name || item.name} for ${totalValue} GX`);
         return totalValue;
      }
      return false;
    } catch (e) {
      console.error(e);
      addLog("🚨 UPLINK ERROR: Sale failed.");
      return false;
    }
  }, [player, ITEMS, syncPlayer, playSFX, SOUNDS, functions, addOptimisticUpdate]);

  const equipItem = useCallback(async (itemOrId) => {
    const itemId = typeof itemOrId === 'object' ? itemOrId.id : itemOrId;
    if (!player.inventory || !player.inventory[itemId]) return;
    const item = player.inventory[itemId];
    const slot = item.type;
    
    if (!['Headgear', 'Weapon', 'Armor', 'Footwear', 'Relic'].includes(slot)) {
        return addLog("This item cannot be equipped.");
    }

    playSFX(SOUNDS.equipItem);
    
    if (addOptimisticUpdate) {
      const equipUpdates = {
        [`inventory.${itemId}`]: { _methodName: 'deleteField' },
        [`equipped.${slot}`]: item
      };
      if (player.equipped?.[slot]) {
        const oldEquipped = player.equipped[slot];
        equipUpdates[`inventory.${oldEquipped.id}`] = oldEquipped;
      }
      addOptimisticUpdate(equipUpdates);
    }

    try {
      const callAction = httpsCallable(functions, 'secureGameAction');
      await callAction({ 
        action: 'EQUIP_ITEM', 
        payload: { itemId, slot } 
      });
      addLog(`Installed Tech: ${item.name}`);
    } catch (e) {
      console.error(e);
      addLog("🚨 UPLINK ERROR: Install failed.");
    }
  }, [player, syncPlayer, playSFX, SOUNDS, functions, addOptimisticUpdate]);

  const unequipItem = useCallback(async (slot) => {
    if (!player.equipped?.[slot]) return;
    const item = player.equipped[slot];
    
    playSFX(SOUNDS.unequipItem);
    
    if (addOptimisticUpdate) {
      addOptimisticUpdate({
        [`equipped.${slot}`]: { _methodName: 'deleteField' },
        [`inventory.${item.id}`]: item
      });
    }

    try {
      const callAction = httpsCallable(functions, 'secureGameAction');
      await callAction({ 
        action: 'UNEQUIP_ITEM', 
        payload: { slot } 
      });
      addLog(`Uninstalled Tech: ${item.name}`);
    } catch (e) {
      console.error(e);
      addLog("🚨 UPLINK ERROR: Uninstall failed.");
    }
  }, [player, syncPlayer, playSFX, SOUNDS, functions, addOptimisticUpdate]);

  const allocateStat = async (statName) => {
    // Guard: synchronous ref prevents rapid-click over-spending before React re-renders
    if (remainingApRef.current <= 0) return;
    remainingApRef.current -= 1;

    // OPTIMISTIC UI: Update locally first for responsiveness
    const newStat = (player?.baseStats?.[statName] ?? 0) + 1;
    const newAP   = Math.max(0, (player?.abilityPoints ?? 0) - 1);
    
    // We update local state, but Firestore update will happen securely via Cloud Function
    setPlayer(prev => ({
      ...prev,
      baseStats: { ...(prev.baseStats || {}), [statName]: newStat },
      abilityPoints: newAP
    }));

    try {
      const callAction = httpsCallable(functions, 'secureGameAction');
      await callAction({ 
        action: 'ALLOCATE_STAT', 
        payload: { statName } 
      });
      addLog(`Upgraded ${statName.toUpperCase()} via Secure Uplink.`);
    } catch (e) {
      console.error("Secure Stat Allocation Failed:", e);
      addLog("🚨 UPLINK ERROR: Stat synchronization failed. Please refresh.");
    }
  };

  const buyItem = async (item, qty = 1) => {
    if (player.level < (item.reqLvl || 1)) {
      addLog(`Requires Level ${item.reqLvl}!`);
      return false;
    }
    if (qty < 1 || !Number.isInteger(qty)) {
      addLog('🚨 ERROR: Invalid quantity.');
      return false;
    }
    
    const totalCost = item.cost * qty;
    if ((player.tokens || 0) < totalCost) {
      addLog("🚨 ERROR: Insufficient GX for this transaction.");
      return false;
    }

    // FRONTEND GUARD: Check inventory capacity before even calling the backend
    const isCounterItem = (item.id === 'hp_potion' || item.id === 'auto_scroll');
    if (!isCounterItem) {
      const currentSlots = Object.keys(player.inventory || {}).length;
      const maxSlots = player.maxInventorySlots || 50;
      if (currentSlots + qty > maxSlots) {
        addLog(`🎒 BAG FULL! ${currentSlots}/${maxSlots} slots used. Sell items or upgrade your storage first.`);
        return false;
      }
    }

    // --- OPTIMISTIC LOCAL STATE UPDATE ---
    // Apply instantly so UI reflects purchase without waiting for Firestore sync.
    // Cloud function validates & commits the canonical transaction.
    setPlayer(prev => {
      const next = { ...prev, tokens: (prev.tokens || 0) - totalCost };
      if (item.id === 'hp_potion') {
        next.potions = (prev.potions || 0) + qty;
      } else if (item.id === 'auto_scroll') {
        next.autoScrolls = (prev.autoScrolls || 0) + qty;
      } else if (item.id?.includes('auto_scroll')) {
        const newInv = { ...prev.inventory };
        for (let i = 0; i < qty; i++) {
          const suffix = Math.random().toString(36).slice(2, 6);
          newInv[`${item.id}_${Date.now()}_${suffix}`] = { ...item, id: `${item.id}_${Date.now()}_${suffix}` };
        }
        next.inventory = newInv;
      } else {
        const newInv = { ...prev.inventory };
        for (let i = 0; i < qty; i++) {
          const suffix = Math.random().toString(36).slice(2, 6);
          newInv[`${item.id}_${Date.now()}_${suffix}`] = { ...item, id: `${item.id}_${Date.now()}_${suffix}` };
        }
        next.inventory = newInv;
      }
      return next;
    });

    // --- SECURE UPLINK ---
    // Cloud function validates cost from server catalog and commits the canonical transaction.
    try {
      const callAction = httpsCallable(functions, 'secureGameAction');
      const result = await callAction({ 
        action: 'BUY_ITEM', 
        payload: { item, qty } 
      });
      
      const data = result.data || {};
      if (data.success) {
        addLog(`Acquired ${qty > 1 ? qty + 'x ' : ''}${item.name}! Check your Storage Bag.`);
        playSFX(SOUNDS.obtainLoot);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      addLog("🚨 UPLINK ERROR: Trade failed during neural handshake. Please check your connection.");
      return false;
    }
  };

  const activateAutoScroll = async (view) => {
    const inventory = Object.entries(player.inventory || {});
    const selection = player.selectedScrollId || 'auto_scroll';

    const scrollSpecs = {
      'auto_scroll': { ms: 60000, val: 1, label: '1m' },
      'auto_scroll_3m': { ms: 180000, val: 3, label: '3m' },
      'auto_scroll_6m': { ms: 360000, val: 6, label: '6m' },
      'auto_scroll_9m': { ms: 540000, val: 9, label: '9m' },
      'auto_scroll_12m': { ms: 720000, val: 12, label: '12m' }
    };

    const spec = scrollSpecs[selection] || scrollSpecs['auto_scroll'];
    
    // 1. Check Inventory for Physical Item (Priority)
    const possibleScrollIds = ['auto_scroll_12m', 'auto_scroll_9m', 'auto_scroll_6m', 'auto_scroll_3m', 'auto_scroll'];
    const targetItemEntry = inventory.find(([key, item]) => {
      if (!item || !item.id) return false;
      const itemBaseId = possibleScrollIds.find(baseId => item.id.startsWith(baseId));
      return itemBaseId === selection;
    });
    
    // 2. Fallback: Check Legacy Numeric Pool
    const hasPoolValue = (player.autoScrolls || 0) >= spec.val;

    if (!targetItemEntry && !hasPoolValue) {
      return addLog(`Wait! No ${selection.replace(/_/g, ' ')}'s found in bag or pool.`);
    }

    // ── LOADOUT GUARD ──
    const loadoutScrollCount = loadoutRef.current.scrolls[selection] || 0;
    if (loadoutScrollCount <= 0) {
      return addLog(`No ${selection.replace(/_/g, ' ')} packed for this run!`);
    }
    // Decrement loadout before optimistic update
    loadoutRef.current.scrolls[selection] = loadoutScrollCount - 1;

    // --- OPTIMISTIC LOCAL STATE UPDATE ---
    // Apply instantly so UI reflects activation without waiting for Firestore sync.
    // Cloud function validates & commits the canonical transaction.
    setPlayer(prev => {
      const next = { ...prev, autoUntil: Date.now() + spec.ms, autoTimeLeftSaved: 0 };
      if (targetItemEntry) {
        const newInv = { ...prev.inventory };
        delete newInv[targetItemEntry[0]];
        next.inventory = newInv;
      } else {
        next.autoScrolls = (prev.autoScrolls || 0) - spec.val;
      }
      return next;
    });

    // The backend Cloud Function will handle the transaction securely.

    try {
      const callAction = httpsCallable(functions, 'secureGameAction');
      await callAction({
        action: 'ACTIVATE_SCROLL',
        payload: { selection, ms: spec.ms, val: spec.val, view }
      });
      addLog(`LOCK-ON ACTIVATED! (Resonance Synchronized)`);
    } catch (e) {
      console.error(e);
      addLog("🚨 UPLINK ERROR: Activation failed.");
    }
  };

  const mixLaboratoryItem = async (recipe) => {
    const masterData = ITEMS.find(i => i.id === recipe.id);
    if (!masterData) return addLog("❌ MIX ERROR: Unknown formula.");
    
    if ((player.tokens || 0) < (recipe.cost || 0)) {
      return addLog(`🚨 LAB ERROR: Insufficient GX for fusion.`);
    }

    try {
      addLog(`🧪 MIXING: Initiating molecular fusion for ${masterData.name || recipe.id}...`);

      const inventory = Object.entries(player.inventory || {});
      const itemsToConsume = [];
      let missingMat = null;

      recipe.materials.forEach(mat => {
        let found = 0;
        inventory.forEach(([key, invItem]) => {
          if (!invItem) return;
          const nameToIdMatch = ITEMS.find(item => item.name && invItem.name && item.name.toLowerCase() === invItem.name.toLowerCase())?.id;
          const cleanId = nameToIdMatch || invItem.id?.replace(/_([a-z0-9]+)+$/, '') || invItem.name;
          const itMaster = ITEMS.find(item => item.id === cleanId || item.id === invItem.id);
          const targetId = itMaster?.id || cleanId;
          const matchResult = (targetId === mat.id) || (invItem.id === mat.id);
          if (matchResult && found < mat.count) {
             if (!itemsToConsume.find(c => c.key === key)) {
               itemsToConsume.push({ key, ...invItem });
               found++;
             }
          }
        });
        if (found < mat.count) missingMat = mat.id;
      });

      if (missingMat) {
        return addLog(`🚨 LAB ERROR: Experimental materials shifted. Missing ${missingMat}.`);
      }

      // 🛡️ Atomic Execution Context Setup
      const updates = { tokens: (player.tokens || 0) - (recipe.cost || 0) };
      itemsToConsume.forEach(loot => {
        updates[`inventory.${loot.key}`] = deleteField();
      });

      const suffix = Math.random().toString(36).slice(2, 6);
      const mixedItem = { ...masterData, id: `${recipe.id}_${Date.now()}_${suffix}` };
      
      // We no longer push this to syncPlayer because it would delete the materials
      // from Firestore *before* the Cloud Function can validate them, resulting in a 404!
      // The secure Cloud Function will handle the atomic database transaction.

      try {
        const callAction = httpsCallable(functions, 'secureGameAction');
        const result = await callAction({ 
          action: 'MIX_ITEM', 
          payload: { recipe: { ...masterData, ...recipe }, itemsToConsumeKeys: itemsToConsume.map(c => c.key) } 
        });

        if (result.data?.success) {
          if (setForgeResult) {
            setForgeResult({ success: true, item: masterData });
          }
          addLog(`✅ SUCCESS: Created ${masterData.name}!`);
          playSFX(SOUNDS.obtainLoot);
        } else {
          throw new Error(result.data?.message || "Fusion failed.");
        }
      } catch (e) {
        console.error(e);
        if (setForgeResult) {
          setForgeResult({ success: false, error: "Molecular fusion destabilized." });
        }
        addLog(`🚨 UPLINK ERROR: Mixing failed during neural handshake.`);
      }
    } catch (e) {
      console.error(e);
      addLog("🚨 LAB ERROR: Formula calculation error.");
    }
  };


  
  const handlePurify = async (monster, tamingItemId) => {
    if (!monster || !tamingItemId) return;
    
    // Check if player has the tool
    const inventory = Object.values(player.inventory || {});
    const targetTool = inventory.find(i => i && i.id?.startsWith(tamingItemId));
    if (!targetTool) return addLog(`❌ PURIFY FAILED: Missing ${tamingItemId.replace(/taming_/g, '').toUpperCase()} Prism!`);

    // --- SMART ELEMENT DETECTION ---
    const element = getMonsterElement(monster);

    // Verify Prism Element Match
    if (!tamingItemId.includes(element.toLowerCase())) {
        return addLog(`❌ RESONANCE ERROR: This ${tamingItemId.replace(/taming_/g, '').toUpperCase()} Prism cannot purify ${element} corruption!`);
    }

    // --- DYNAMIC SUCCESS RATE (Addressing One-Hit Defeat issue) ---
    // Success scales from ~30% at 100% HP up to ~90% at 1 HP
    const hpFactor = (monster.hp / monster.maxHp);
    const successChance = 0.9 - (hpFactor * 0.6); 
    
    playSFX(SOUNDS.useHeal);
    addLog(`💠 ACTIVATING ${element.toUpperCase()} PRISM: Signal resonance at ${Math.floor(successChance * 100)}%...`);
    
    const success = Math.random() < successChance;
    
    const updates = {
        [`inventory.${targetTool.id}`]: deleteField()
    };

    if (success) {
        // Find all pets of this element
        const elementPets = PETS_METADATA.filter(p => p.element === element);
        if (elementPets.length === 0) {
          addLog(`❌ VOID SIGNAL: No compatible pet spirits found for ${element}.`);
          if (setEnemy) setEnemy(null);
          if (setView) setView('menu');
          return;
        }
        
        // ROLL FOR RARITY: Weighted Distribution
        const roll = Math.random() * 100;
        let selectedRarity = 'Common';
        if (roll < 5) selectedRarity = 'Epic';
        else if (roll < 15) selectedRarity = 'Rare';
        else if (roll < 40) selectedRarity = 'Uncommon';
        
        const rarityPool = elementPets.filter(p => p.rarity === selectedRarity);
        const poolToUse = rarityPool.length > 0 ? rarityPool : elementPets;
        const newPet = poolToUse[Math.floor(Math.random() * poolToUse.length)];
        
        if (newPet) {
          updates.petId = newPet.id;
          updates.petLevel = 1;
          updates.unlockedPets = arrayUnion(newPet.id);
          
          addLog(`✨ SUCCESS: ${monster.name}'s spirit manifested as ${newPet.name}! (${newPet.rarity})`);
          playSFX(SOUNDS.obtainLevel);
          if (setForgeResult) setForgeResult({ success: true, item: { ...newPet, icon: '✨' } });
        }
        
        // Victory! End combat will be handled by UI after animation
    } else {
        addLog(`🌫️ DISSIPATED: The purification beam failed to stabilize. The monster vanished!`);
        playSFX(SOUNDS.monsterAttack);
        
        // Vanish! End combat will be handled by UI after animation
    }
    
    syncPlayer(updates);
  };

  const forgeCrystle = async (recipe) => {
    const masterData = ITEMS.find(i => i.id === recipe.id);
    const itemName = masterData?.name || recipe.name || "Unknown Tech";
    
    if ((player.tokens || 0) < (recipe.cost || 0)) {
      return addLog(`🚨 FORGE ERROR: Insufficient GX for assembly.`);
    }

    try {
      addLog(`⚒️ FORGING: Initiating atomic assembly for ${itemName}...`);
      
      const inventory = Object.entries(player.inventory || {});
      const itemsToConsume = [];
      let missingMat = null;
      
      recipe.materials.forEach(mat => {
        let found = 0;
        inventory.forEach(([key, invItem]) => {
          if (!invItem) return;
          const parts = (invItem.id || "").split('_');
          const cleanId = parts.filter(p => !/^\d+$/.test(p) && !/^[a-z0-9]{4}$/.test(p)).join('_');
          const itMaster = ITEMS.find(item => item.id === cleanId || item.id === invItem.id || item.name?.toLowerCase() === invItem.name?.toLowerCase());
          const matchResult = (cleanId === mat.id) || (invItem.id === mat.id) || (itMaster?.id === mat.id);
          if (matchResult && found < mat.count) {
             if (!itemsToConsume.find(c => c.key === key)) {
               itemsToConsume.push({ key, ...invItem });
               found++;
             }
          }
        });
        if (found < mat.count) missingMat = mat.id;
      });

      if (missingMat) {
        return addLog(`🚨 FORGE ERROR: Materials have shifted. Assembly aborted.`);
      }

      // 🛡️ Logic Check: All materials found and GX sufficient.
      const currentDex = (player.baseStats?.dex || 10); // Simplified stat check
      const successRate = Math.min(95, 50 + Math.floor(currentDex / 2));
      const roll = Math.random() * 100;
      const isSuccess = roll < successRate;

      const updates = { tokens: (player.tokens || 0) - (recipe.cost || 0) };
      itemsToConsume.forEach(loot => {
        updates[`inventory.${loot.key}`] = deleteField();
      });

      if (isSuccess) {
        const suffix = Math.random().toString(36).slice(2, 6);
        const forgedItem = { ...masterData, ...recipe, id: `${recipe.id}_${Date.now()}_${suffix}` };
        updates[`inventory.${forgedItem.id}`] = forgedItem;
        syncPlayer(updates, true);
        setForgeResult({ success: true, item: forgedItem });
      } else {
        syncPlayer(updates, true);
        setForgeResult({ success: false, item: null });
      }
    } catch (e) {
      console.error(e);
      addLog(`🚨 UPLINK ERROR: Forging failed during neural handshake.`);
    }
  };

  const learnRecipe = (item) => {
    const master = ITEMS.find(i => i.id === item.id?.replace(/(_\d+)+$/, '')) || item;
    if (master.type !== 'Schematic' || !master.recipeId) return addLog("❌ DECIPHER FAILED: Object integrity compromised.");
    
    const currentRecipes = Array.isArray(player.recipes) ? [...player.recipes] : [];
    const alreadyKnown = currentRecipes.includes(master.recipeId);

    // BUG-03 FIX: Check by key (O(1)) and use dot-notation delete — never overwrite full inventory
    if (!player.inventory?.[item.id]) return addLog("❌ ERROR: Schematic no longer in bag.");

    const updates = { [`inventory.${item.id}`]: deleteField() }; // dot-notation remove

    if (alreadyKnown) {
      syncPlayer(updates);
      return addLog(`📜 DUPLICATE: Pattern memory preserved.`);
    }

    updates.recipes = [...currentRecipes, master.recipeId];
    syncPlayer(updates);
    addLog(`✨ DECRYPTED: ${master.name}!`);
    playSFX(SOUNDS.obtainLoot);
  };

  // --- GUILD PROTOCOLS (V2) ---
  const createSyndicate = async (name, tag) => {
    if ((player.tokens || 0) < 50000) return addLog("🚨 INSUFFICIENT GX: Need 50,000 GX!");
    if (player.guildId) return addLog("🚨 ERROR: Active uplink detected.");
    if (!name || name.length < 3) return addLog("🚨 INVALID NAME: Minimum 3 characters.");
    
    const guildId = `guild_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    
    try {
      const guildRef = doc(db, 'guilds', guildId);
      await setDoc(guildRef, {
        id: guildId,
        name,
        tag: tag?.toUpperCase() || 'GX',
        leaderId: player.uid,
        leaderName: player.name,
        members: [player.uid],
        memberNames: { [player.uid]: player.name },
        gxVault: 0,
        level: 1,
        xp: 0,
        createdAt: serverTimestamp(),
        settings: { open: true, minLevel: 1 }
      });
      
      syncPlayer({ tokens: player.tokens - 50000, guildId: guildId, guildRole: 'LEADER' });
      addLog(`🏮 SYNDICATE FORMED: Welcome, Leader of ${name}!`);
      playSFX(SOUNDS.obtainLoot);
    } catch (e) {
      console.error("Guild Creation Error:", e);
      addLog("🚨 ERROR: Faction build failed.");
    }
  };

  const joinSyndicate = async (guildId) => {
    if (player.guildId) return addLog("🚨 ERROR: Disconnect existing link first.");
    try {
      const guildRef = doc(db, 'guilds', guildId); // V2: Root Path
      const guildSnap = await getDoc(guildRef);
      if (!guildSnap.exists()) return addLog("🚨 ERROR: Syndicate non-existent.");
      
      const data = guildSnap.data();
      if (data.members?.length >= 30) return addLog("🚨 ERROR: Faction at capacity.");
      
      await updateDoc(guildRef, { 
         members: arrayUnion(player.uid),
         [`memberNames.${player.uid}`]: player.name
      });
      syncPlayer({ guildId: guildId, guildRole: 'MEMBER' });
      addLog(`🏮 UPLINK SECURED: Joined ${data.name}!`);
      playSFX(SOUNDS.obtainLevel);
    } catch (e) {
      console.error("Guild Join Error:", e);
      addLog("🚨 ERROR: Uplink failed.");
    }
  };

  const leaveSyndicate = async () => {
    if (!player.guildId || player.guildRole === 'LEADER') return;
    try {
      const guildRef = doc(db, 'guilds', player.guildId);
      await updateDoc(guildRef, { 
         members: arrayRemove(player.uid),
         [`memberNames.${player.uid}`]: deleteField()
      });
      syncPlayer({ guildId: null, guildRole: null });
      addLog(`🏮 UPLINK TERMINATED: Syndicate link detached.`);
    } catch (e) {
      console.error("Guild Leave Error:", e);
      addLog("🚨 ERROR: Detachment failed.");
    }
  };

  const dissolveSyndicate = async () => {
    if (!player.guildId || player.guildRole !== 'LEADER') return;
    if (!window.confirm("🚨 NUCLEAR OPTION: Dissolve your Faction forever?")) return;
    try {
      const guildRef = doc(db, 'guilds', player.guildId);
      const guildSnap = await getDoc(guildRef);
      if (guildSnap.exists() && guildSnap.data().activeWarId) {
          const warId = guildSnap.data().activeWarId;
          const warSnap = await getDoc(doc(db, 'guild_wars', warId));
          if (warSnap.exists()) {
             const wData = warSnap.data();
             const otherGuildId = wData.guildA === player.guildId ? wData.guildB : wData.guildA;
             await updateDoc(doc(db, 'guilds', otherGuildId), { activeWarId: null });
          }
          await deleteDoc(doc(db, 'guild_wars', warId));
      }
      await deleteDoc(guildRef);
      syncPlayer({ guildId: null, guildRole: null });
      addLog(`💥 PROTOCOL 66: Syndicate erased from the grid.`);
    } catch (e) {
      console.error("Guild Dissolve Error:", e);
      addLog("🚨 ERROR: Dissolution failed.");
    }
  };

  const sendSyndicateMessage = async (text) => {
    if (!player.guildId || !text) return;
    try {
      const chatRef = collection(db, 'guilds', player.guildId, 'messages'); // V2: Root Path
      await addDoc(chatRef, { senderId: player.uid, senderName: player.name, text, timestamp: serverTimestamp() });
    } catch (e) { console.error("Chat Error:", e); }
  };

  const donateToSyndicateLab = async () => {
    if (!player.guildId) return;
    if ((player.tokens || 0) < 10000) return addLog("🚨 INSUFFICIENT GX: Lab Upgrade costs 10,000 GX.");
    
    try {
      const guildRef = doc(db, 'guilds', player.guildId);
      await updateDoc(guildRef, { labLevel: increment(1), gxVault: increment(10000) });
      syncPlayer({ tokens: player.tokens - 10000 });
      addLog("🧪 LAB UPGRADE SUCCESS: Syndicate global combat power increased by 5%.");
      playSFX(SOUNDS.obtainLevel);
    } catch (e) {
      console.error("Lab Error:", e);
    }
  };

  // --- NAGA WAR PROTOCOLS (V2) ---
  const initiateSyndicateWar = async (targetGuildId, warSize = 2) => {
    if (!player.guildId || player.guildRole !== 'LEADER') return;
    if (player.guildId === targetGuildId) return addLog("🚨 Cannot declare war on your own faction.");
    try {
      const warId = `war_${Date.now()}`;
      const warRef = doc(db, 'guild_wars', warId);
      await setDoc(warRef, {
        id: warId,
        guildA: player.guildId,
        guildB: targetGuildId,
        status: 'PENDING',
        guildA_Stars: 0,
        guildB_Stars: 0,
        guildA_Attacks: {},
        guildB_Attacks: {},
        defendersA: {}, 
        defendersB: {}, 
        warSize: warSize,
        declaredAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'guilds', player.guildId), { activeWarId: warId });
      await updateDoc(doc(db, 'guilds', targetGuildId), { activeWarId: warId });
      addLog(`⚔️ NAGA WAR DECLARED: Request sent to rival Syndicate!`);
    } catch (e) { console.error("War Init Error:", e); }
  };

  const respondToSyndicateWar = async (warId, accepted) => {
    if (!player.guildId || player.guildRole !== 'LEADER') return;
    try {
      const warRef = doc(db, 'guild_wars', warId);
      if (accepted) {
        await updateDoc(warRef, { status: 'ENROLLMENT', acceptedAt: serverTimestamp() });
        addLog(`⚔️ NAGA WAR ACCEPTED! Guild members must now enroll their Nagas.`);
      } else {
        const warSnap = await getDoc(warRef);
        const data = warSnap.data();
        await deleteDoc(warRef);
        await updateDoc(doc(db, 'guilds', data.guildA), { activeWarId: null });
        await updateDoc(doc(db, 'guilds', data.guildB), { activeWarId: null });
        addLog(`🛡️ CHALLENGE REJECTED.`);
      }
    } catch (e) { console.error("War Response Error:", e); }
  };

  const abortSyndicateWar = async (warId) => {
    if (!player.guildId || player.guildRole !== 'LEADER') return;
    try {
      const warRef = doc(db, 'guild_wars', warId);
      const warSnap = await getDoc(warRef);
      if (!warSnap.exists()) return;
      const data = warSnap.data();
      if (data.status === 'BATTLE' || data.status === 'COMPLETED') return;
      
      await deleteDoc(warRef);
      await updateDoc(doc(db, 'guilds', data.guildA), { activeWarId: null });
      await updateDoc(doc(db, 'guilds', data.guildB), { activeWarId: null });
      addLog(`🛑 NAGA WAR ABORTED: The preparation phase was manually terminated.`);
    } catch (e) { console.error("War Abort Error:", e); }
  };

  const enrollNagaInWar = async (warId) => {
    if (!player.guildId) return addLog("🚨 No Active Guild.");
    try {
      const warRef = doc(db, 'guild_wars', warId);
      const warSnap = await getDoc(warRef);
      if (!warSnap.exists()) return addLog("🚨 War not found.");
      
      const data = warSnap.data();
      if (data.status !== 'ENROLLMENT') return addLog("🚨 War is not in the enrollment phase.");

      const side = data.guildA === player.guildId ? 'defendersA' : 'defendersB';
      const sideDefenders = data[side] || {};

      if (Object.keys(sideDefenders).length >= data.warSize) {
         return addLog("🚨 Your guild's roster is already full!");
      }
      if (sideDefenders[player.uid]) {
         return addLog("🚨 You have already enrolled your Naga.");
      }

      const guildRef = doc(db, 'guilds', player.guildId);
      const guildSnap = await getDoc(guildRef);
      const labLevel = guildSnap.exists() ? (guildSnap.data().labLevel || 0) : 0;
      
      const nagaStats = calculateNagaStats(player, labLevel);
      
      const enrollmentData = {
         uid: player.uid,
         name: player.name || 'Unknown Rider',
         level: player.level || 1,
         gemxAvatar: player.gemxAvatar || 'Cosmic gemx (1).gif',
         dragonAvatar: '/assets/dragonsground/dragons/DragonAvatar (1).jpg',
         element: nagaStats.element || 'Cosmic',
         stats: nagaStats,
         currentHp: nagaStats.totalMaxHp,
         isDead: false
      };

      await updateDoc(warRef, {
         [`${side}.${player.uid}`]: enrollmentData
      });

      // Check if BOTH sides are now fully enrolled to push state
      const updatedSnap = await getDoc(warRef);
      const updatedData = updatedSnap.data();
      const countA = Object.keys(updatedData.defendersA || {}).length;
      const countB = Object.keys(updatedData.defendersB || {}).length;

      if (countA >= updatedData.warSize && countB >= updatedData.warSize) {
         await updateDoc(warRef, { status: 'BATTLE', battleStartedAt: serverTimestamp() });
         addLog(`⚔️ BOARDS ARE SET: The Naga War has begun!`);
      } else {
         addLog(`🛡️ NAGA ENROLLED: Roster is filling up (${Object.keys(updatedData[side] || {}).length}/${updatedData.warSize}).`);
      }
    } catch (e) { console.error("Enrollment error:", e); }
  };

  const recordWarResult = async (warId, stars, opponentId, damagePercent) => {
    if (!player.guildId || !warId) return;
    let earnedStars = damagePercent >= 75 ? 3 : (damagePercent >= 50 ? 2 : (damagePercent >= 25 ? 1 : 0));
    try {
      const warRef = doc(db, 'guild_wars', warId);
      const warSnap = await getDoc(warRef);
      if (!warSnap.exists()) return;
      const data = warSnap.data();
      const side = data.guildA === player.guildId ? 'A' : 'B';
      const oppIdClean = opponentId.replace(/\./g, '_');
      const starField = `defenderStars${side === 'A' ? 'B' : 'A'}.${oppIdClean}`;
      
      await updateDoc(warRef, {
        [`guild${side}_Stars`]: increment(earnedStars),
        [starField]: earnedStars,
        [`guild${side}_Attacks.${player.uid}`]: arrayUnion({ stars: earnedStars, opponentId, damagePercent, timestamp: Date.now() })
      });
      addLog(`🎖️ RAID STATUS: Secured ${earnedStars} Stars!`);
    } catch (e) { console.error("War Result Error:", e); }
  };

  const concludeNagaWar = async (warId) => {
    if (!player.guildId || player.guildRole !== 'LEADER') return;
    try {
      const warRef = doc(db, 'guild_wars', warId);
      const warSnap = await getDoc(warRef);
      if (!warSnap.exists()) return;
      const d = warSnap.data();
      
      let deadB = 0;
      Object.values(d.defendersB || {}).forEach(naga => { if (naga.currentHp <= 0) deadB++; });
      let starsA = deadB === d.warSize ? 3 : (deadB >= d.warSize / 2 ? 2 : (deadB > 0 ? 1 : 0));
      
      let deadA = 0;
      Object.values(d.defendersA || {}).forEach(naga => { if (naga.currentHp <= 0) deadA++; });
      let starsB = deadA === d.warSize ? 3 : (deadA >= d.warSize / 2 ? 2 : (deadA > 0 ? 1 : 0));
      
      let winnerGuildId = (starsA > starsB) ? d.guildA : ((starsB > starsA) ? d.guildB : 'TIE');

      await updateDoc(warRef, { 
         status: 'COMPLETED', 
         finalizedAt: Date.now(),
         starsA,
         starsB,
         deadA,
         deadB,
         winnerGuildId
      });
      
      await updateDoc(doc(db, 'guilds', d.guildA), { activeWarId: null });
      await updateDoc(doc(db, 'guilds', d.guildB), { activeWarId: null });
      
      addLog(`🏆 NAGA WAR TALLY COMPLETE: Scoring finalization successful.`);
    } catch (e) { console.error("War Conclude Error:", e); }
  };

  const claimNagaWarRewards = async (warId) => {
    if (!player.guildId) return;
    try {
      const warRef = doc(db, 'guild_wars', warId);
      const warSnap = await getDoc(warRef);
      if (!warSnap.exists()) return;
      const d = warSnap.data();

      if (d.status !== 'COMPLETED') return;
      
      const side = d.guildA === player.guildId ? 'defendersA' : 'defendersB';
      if (!d[side] || !d[side][player.uid]) {
         addLog(`❌ DENIED: You did not enroll a Naga into this specific war.`);
         return;
      }
      
      if (d.claimed && d.claimed[player.uid]) {
         addLog(`⚠️ ALREADY CLAIMED: You have secured your bounty.`);
         return;
      }
      
      const isWinner = d.winnerGuildId === player.guildId;
      const isTie = d.winnerGuildId === 'TIE';
      
      let gxReward = isWinner ? 10000 : (isTie ? 7500 : 5000);
      let scrollCount = isWinner ? 10 : (isTie ? 7 : 5);
      
      const updates = { tokens: (player.tokens || 0) + gxReward };
      
      // Auto-Scrolls 12m Generation - Now discrete items
      const scrollBase = ITEMS.find(i => i.id === 'auto_scroll_12m');
      for (let i = 0; i < scrollCount; i++) {
        const uniqueId = `auto_scroll_12m_WAR_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${i}`;
        updates[`inventory.${uniqueId}`] = { ...scrollBase, id: uniqueId };
      }
      
      await updateDoc(warRef, { [`claimed.${player.uid}`]: true });
      syncPlayer(updates);
      
      addLog(`🎁 WAR BOUNTY SECURED: +${gxReward} GX and +${scrollCount}x Auto Scrolls(12m)!`);
    } catch (e) { console.error("Claim Reward Error:", e); }
  };

  const salvageItems = useCallback((itemIds) => {
    if (!itemIds || itemIds.length === 0) return;
    const inventory = player.inventory || {};
    const targets = itemIds.map(id => inventory[id]).filter(Boolean);
    if (targets.length === 0) return;

    const rarity = targets[0].rarity;
    if (!targets.every(t => t.rarity === rarity)) {
      return addLog("❌ SALVAGE ERROR: Materials must share the same rarity.");
    }

    let required = 0;
    let nextRarity = "";
    if (rarity === "Common") { required = 10; nextRarity = "Uncommon"; }
    else if (rarity === "Uncommon") { required = 5; nextRarity = "Rare"; }
    else { return addLog("❌ SALVAGE ERROR: Only Common and Uncommon items can be salvaged."); }

    if (targets.length < required) {
      return addLog(`❌ SALVAGE ERROR: Need ${required} ${rarity} items (have ${targets.length}).`);
    }

    // Pick top 'required' items
    const toConsume = itemIds.slice(0, required);
    const updates = {};
    toConsume.forEach(id => {
      updates[`inventory.${id}`] = deleteField();
    });

    // Pick random reward from same tier
    const pool = ITEMS.filter(i => i.rarity === nextRarity && (i.category === "Loot" || i.category === "Equipment"));
    const rewardBase = pool[Math.floor(Math.random() * pool.length)];
    const reward = { ...rewardBase, id: `${rewardBase.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
    
    updates[`inventory.${reward.id}`] = reward;
    syncPlayer(updates);
    
    addLog(`♻️ SALVAGE SUCCESS: Recycled ${required} ${rarity} items into ${reward.name}!`);
    playSFX(SOUNDS.obtainLoot);
    if (setForgeResult) setForgeResult({ success: true, item: reward });
  }, [player, ITEMS, syncPlayer, addLog, playSFX, SOUNDS, setForgeResult]);

  const claimGuildBounty = useCallback(async (guildData) => {
    if (!player.guildId || !guildData) return addLog("❌ BOUNTY ERROR: No active Syndicate link.");
    
    const now = Date.now();
    const lastClaim = player.lastBountyClaimed || 0;
    const cooldown = 24 * 60 * 60 * 1000; // 24 Hours

    if (now - lastClaim < cooldown) {
      const wait = Math.ceil((cooldown - (now - lastClaim)) / (60 * 60 * 1000));
      return addLog(`❌ BOUNTY ERROR: Recharge in progress. Wait ${wait}h.`);
    }

    const reward = 5000 + ((guildData.labLevel || 0) * 1000);
    const updates = {
      tokens: (player?.tokens || 0) + reward,
      lastBountyClaimed: now
    };

    try {
      await syncPlayer(updates);
      addLog(`💎 BOUNTY SECURED: +${reward} GX Syndicate Subsidy claimed!`);
      playSFX(SOUNDS.success);
    } catch (e) {
      console.error("Bounty Claim Error:", e);
      addLog("❌ BOUNTY ERROR: Transmission failed.");
    }
  }, [player, syncPlayer, addLog, playSFX, SOUNDS]);

  const eatFood = useCallback((foodItem) => {
    if (!foodItem || !foodItem.effect) return addLog('❌ Invalid food item.');
    const now = Date.now();
    const alreadyActive = (player?.activeFoodUntil || 0) > now;
    if (alreadyActive) return addLog('❌ A food buff is already active. Wait for it to expire.');

    const effect = foodItem.effect;
    const expiry = now + effect.duration;
    const updates = {
      activeFoodUntil: expiry,
      activeFoodEffect: {
        stat: effect.stat,
        amount: effect.amount,
        stat2: effect.stat2 || null,
        amount2: effect.amount2 || null,
        name: foodItem.name,
        icon: foodItem.icon
      }
    };

    // Remove one instance of this food from inventory
    const inventoryMatch = Object.entries(player.inventory || {}).find(
      ([, v]) => v?.id?.startsWith(foodItem.id)
    );
    if (inventoryMatch) {
      updates[`inventory.${inventoryMatch[0]}`] = deleteField();
    }

    syncPlayer(updates);
    addLog(`🍽️ ATE: ${foodItem.name} — ${foodItem.effectLabel || ''}`);
    playSFX(SOUNDS.obtainLoot);
  }, [player, syncPlayer, addLog, playSFX, SOUNDS]);

  const completeTownQuest = useCallback(async (quest, FOODS) => {
    if (!quest || !player) return;
    const inventory = player.inventory || {};

    // Verify all required items are present
    for (const req of quest.requires) {
      const ownedCount = Object.values(inventory).filter(i => i?.id?.startsWith(req.itemId)).length;
      if (ownedCount < req.qty) {
        return addLog(`❌ QUEST: Missing ${req.qty - ownedCount}x ${req.itemId}`);
      }
    }

    const food = FOODS.find(f => f.id === quest.reward.foodId);

    // Resolve bonus reward item data for cloud function
    const rewardScroll = quest.reward?.scrollId ? ITEMS?.find(i => i.id === quest.reward.scrollId) : null;
    const rewardPotion = quest.reward?.potionId ? ITEMS?.find(i => i.id === quest.reward.potionId) : null;

    if (!functions) {
      addLog("❌ QUEST ERROR: Backend connection unavailable.");
      return;
    }

    try {
      const secureGameAction = httpsCallable(functions, 'secureGameAction');
      const result = await secureGameAction({
        action: 'COMPLETE_TOWN_QUEST',
        payload: {
          quest,
          rewardFood: food,
          rewardScroll: rewardScroll ? { ...rewardScroll, qty: quest.reward.scrollQty || 1 } : null,
          rewardPotion: rewardPotion ? { ...rewardPotion, qty: quest.reward.potionQty || 1 } : null
        }
      });
      
      const data = result.data;
      if (data.success) {
        if (data.leveledUp) {
          playSFX(SOUNDS.lvlUp);
          addLog(`🌟 TOWN RENOWN INCREASED! You are now Level ${data.nextLvl} in Crystle Town!`);
        } else {
          playSFX(SOUNDS.obtainLoot);
        }
        
        addLog(`🏙️ QUEST COMPLETE: Handed over items to ${quest.npcName}! (+5 Town Influence XP)`);
      }
    } catch (e) {
      addLog("❌ QUEST FAILED: " + e.message);
      return;
    }

    // --- Faucet Protocol: Automated Reward Trigger ---
    if (functions && player.walletAddress) {
       console.log("🏙️ FAUCET: Attempting reward transmission sequence...");
       const claimFaucet = httpsCallable(functions, 'claimFaucetReward');
       try {
         const result = await claimFaucet({ targetWalletAddress: player.walletAddress });
         const data = result.data;
         if (data.success) {
            addLog(`🎁 CRYSTLE FAUCET: ${data.message}`);
            playSFX(SOUNDS.obtainLoot);
            if (setFaucetResult) {
               setFaucetResult({ success: true, txHash: data.txHash, message: data.message });
            }

            // --- Update Daily Faucet Tracking ---
            const today = new Date().toISOString().split('T')[0];
            const lastDate = player.lastFaucetClaimDate || "";
            let claims = (lastDate === today) ? (player.dailyFaucetClaims || 0) : 0;
            syncPlayer({
               dailyFaucetClaims: claims + 1,
               lastFaucetClaimDate: today
            });
         } else {
            // Silently log level or rate limit issues unless critical
            console.log(`🏙️ FAUCET_SIGNAL: ${data.message}`);
         }
       } catch (e) {
          console.warn("🏙️ FAUCET_ERROR:", e.message);
          if (e.message.includes("depleted")) {
             addLog("🏙️ FAUCET: The town treasury is temporarily dry.");
          }
       }
    }
    
    return { xp: 5, item: food ? { ...food, qty: 1 } : null };
  }, [player, syncPlayer, addLog, playSFX, SOUNDS, functions]);

  const abandonTownQuest = useCallback((questId) => {
    if (!player) return;
    const currentSlots = [...(player.townQuestSlots || [])].filter(id => id !== questId);
    
    // 30-minute cooldown
    const cooldownId = `COOLDOWN_${Date.now() + 1800000}`;
    currentSlots.push(cooldownId);
    
    syncPlayer({ townQuestSlots: currentSlots });
    addLog("🗑️ REQUEST SKIPPED: Slot locked for 30 minutes.");
  }, [player, syncPlayer, addLog]);

  const rushTownQuestCooldown = useCallback((cooldownId) => {
    if (!player) return;
    const fee = 2000;
    if ((player.tokens || 0) < fee) {
       return addLog(`🚨 INSUFFICIENT GX: Need ${fee} GX to bypass cooldown.`);
    }
    
    const currentSlots = [...(player.townQuestSlots || [])].filter(id => id !== cooldownId);
    syncPlayer({ 
       townQuestSlots: currentSlots,
       tokens: player.tokens - fee
    }, true);
    
    addLog("⚡ FAST TRACK: Dispatched new prospect instantly!");
    playSFX(SOUNDS.obtainLoot);
  }, [player, syncPlayer, addLog, playSFX, SOUNDS]);

  const completeQuiz = useCallback(async (quiz, isCorrect, ITEMS, FOODS, CRYSTLE_RECIPES) => {
    if (!quiz || !player) return;
    
    if (!isCorrect) {
      addLog(`🎒 O QUIZ: Incorrect answer. Transmission severed.`);
      playSFX(SOUNDS.hurt);
      return;
    }

    let nextXp = (player.xp || 0) + quiz.xpReward, 
        nextLvl = player.level || 1, 
        nextMaxHp = player.maxHp || 1000,
        apGained = 0;

    const MAX_LEVEL = 100;
    const GX_PER_XP = 0.5;
    let overflowGx = 0;

    while (nextXp >= getXpRequired(nextLvl) && nextLvl < MAX_LEVEL) {
      nextXp -= getXpRequired(nextLvl);
      nextLvl++;
      nextMaxHp += 50;
      apGained += AP_PER_LEVEL;
      addLog(`🛡️ LVL UP! +5 AP gained through knowledge syncing.`);
    }

    if (nextLvl >= MAX_LEVEL) {
      overflowGx = nextXp * GX_PER_XP;
      nextXp = 0;
      if (overflowGx > 0) {
        addLog(`✨ LEVEL CAP: ${quiz.xpReward} XP converted to ${Math.floor(overflowGx)} GX!`);
      }
    }

    const updates = {
      xp: nextXp,
      level: nextLvl,
      maxHp: nextMaxHp,
      hp: Math.min(nextMaxHp, (player.hp || 0) + (apGained > 0 ? 50 : 0)),
      tokens: (player.tokens || 0) + overflowGx,
      [`completedQuizzes.${quiz.id}`]: Date.now()
    };
    
    // --- Randomized iLearn Reward Engine ---
    const roll = Math.random();
    let rId = null;
    let rQty = 1;

    // 70% Total Reward Probability
    if (roll < 0.70) {
       const typeRoll = Math.random();
       
       // 50% Chance for Tactical Potions
       if (typeRoll < 0.50) {
          const rarityRoll = Math.random();
          if (rarityRoll < 0.85) { rId = 'mega_hp_potion'; rQty = 1; } // 85% Mega
          else { rId = 'ultra_hp_potion'; rQty = 1; }                  // 15% Ultra
       } 
       // 50% Chance for Augmented Auto-Scrolls (Weighted)
       else {
          const scrollRoll = Math.random() * 100;
          if (scrollRoll < 3) { rId = 'auto_scroll_12m'; rQty = 1; }      // 3% Epic
          else if (scrollRoll < 15) { rId = 'auto_scroll_9m'; rQty = 1; } // 12% Rare
          else if (scrollRoll < 40) { rId = 'auto_scroll_6m'; rQty = 1; } // 25% Uncommon
          else { rId = 'auto_scroll_3m'; rQty = 1; }                      // 60% Common
       }
    } 
    // Fallback to static quiz-defined reward if random roll failed but static exists. 
    else if (quiz.itemRewardId && quiz.itemRewardId !== 'hp_potion') {
       rId = quiz.itemRewardId;
       rQty = quiz.itemRewardQty || 1;
    }

    let dropData = null;
    const loots = [];
    if (rId) {
      const masterDrop = ITEMS?.find(i => i.id === rId) || 
                         FOODS?.find(i => i.id === rId) ||
                         CRYSTLE_RECIPES?.find(i => i.id === rId);
      
      if (masterDrop) {
        dropData = { ...masterDrop, qty: rQty };
        
        // Standardize: Route to numeric counters for stackable essentials
        if (masterDrop.id === 'hp_potion') {
           updates.potions = (player.potions || 0) + rQty;
           for (let i = 0; i < rQty; i++) {
             loots.push({ ...masterDrop, id: `hp_potion_pool_${Date.now()}_${i}` });
           }
        } else {
           for (let i = 0; i < rQty; i++) {
              const dropKey = `${masterDrop.id}_ILEARN_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${i}`;
              const newLootItem = { ...masterDrop, id: dropKey };
              updates[`inventory.${dropKey}`] = newLootItem;
              loots.push(newLootItem);
           }
        }
        addLog(`🎁 KNOWLEDGE REWARD: Acquired ${rQty}x ${masterDrop.name}!`);
      }
    }

    // Filter out the completed quiz from active slots
    if (player.quizSlots) {
       updates.quizSlots = player.quizSlots.filter(id => id !== quiz.id);
    }
    
    // Apply optimistic updates locally first
    if (addOptimisticUpdate) {
      addOptimisticUpdate(updates);
    }
    
    console.log("🎒 iLEARN: Initiating secure completeQuiz action...");
    try {
      const callAction = httpsCallable(functions, 'secureGameAction');
      const result = await callAction({
        action: 'COMPLETE_QUIZ',
        payload: {
          quizId: quiz.id,
          earnedLoot: Math.floor(overflowGx),
          earnedXp: quiz.xpReward,
          nextXp,
          nextLvl,
          nextMaxHp,
          apGained,
          loots
        }
      });
      const data = result.data || {};
      if (!data.success) {
        console.warn("Backend failed to confirm quiz completion:", data.message);
      }
    } catch (e) {
      console.error("Failed to commit quiz completion securely:", e);
      addLog("🚨 UPLINK ERROR: Quiz completion could not be verified securely.");
    }
    
    addLog(`🎒 QUIZ SURGE: +${quiz.xpReward} XP gained from ${quiz.topic} training!`);
    playSFX(SOUNDS.lvlUp);

    // --- Neural Faucet Protocol: Automated Reward Trigger ---
    if (functions && player.walletAddress) {
      console.log("🎒 iLEARN_FAUCET: Attempting reward transmission sequence...");
      const claimFaucet = httpsCallable(functions, 'claimFaucetReward');
      try {
        const result = await claimFaucet({ targetWalletAddress: player.walletAddress });
        const data = result.data;
        if (data.success) {
          addLog(`💎 iLEARN REWARD: ETH subsidy transmitted!`);
          playSFX(SOUNDS.obtainLoot);
          if (setFaucetResult) {
            setFaucetResult({ success: true, txHash: data.txHash, message: "Neural Link Subsidy Authorized" });
          }

          // --- Update Daily Faucet Tracking ---
          const today = new Date().toISOString().split('T')[0];
          const lastDate = player.lastFaucetClaimDate || "";
          let claims = (lastDate === today) ? (player.dailyFaucetClaims || 0) : 0;
          syncPlayer({
             dailyFaucetClaims: claims + 1,
             lastFaucetClaimDate: today
          });
        }
      } catch (e) {
        console.warn("🎒 iLEARN_FAUCET_ERR:", e.message);
        if (e.message.includes("depleted")) {
          addLog("🏙️ FAUCET: The neural treasury is temporarily dry.");
        }
      }
    }

    return { xp: quiz.xpReward, item: dropData };
  }, [player, syncPlayer, addLog, playSFX, SOUNDS, functions, setFaucetResult, addOptimisticUpdate]);

  const exchangeAetherSparks = useCallback(async () => {
    if (!player || !functions) return;
    
    const inventory = player.inventory || {};
    const sparks = Object.entries(inventory)
      .filter(([id, item]) => item && item.id && item.id.startsWith('aether_spark'));
    
    if (sparks.length < 4) {
      addLog(`🚨 INSUFFICIENT SPARKS: You need 4 Aether Sparks. You have ${sparks.length}.`);
      return;
    }
    
    // Deduct 4 sparks
    const updates = {};
    sparks.slice(0, 4).forEach(([uniqueId]) => {
      updates[`inventory.${uniqueId}`] = deleteField();
    });
    
    addLog("✨ AETHER EXCHANGE: Harmonizing sparks... Initiating Treasury Signal.");
    
    try {
      // Use blocking sync to ensure inventory is updated before payout
      await syncPlayer(updates, true); 
      
      const claimFaucet = httpsCallable(functions, 'claimFaucetReward');
      const result = await claimFaucet({ targetWalletAddress: player.walletAddress });
      const data = result.data;
      
      if (data.success) {
        addLog(`🎁 AETHER REWARD: ${data.message}`);
        playSFX(SOUNDS.obtainLoot);
        if (setFaucetResult) {
          setFaucetResult({ success: true, txHash: data.txHash, message: "Aether Exchange Authorized" });
        }
      } else {
        addLog(`🏙️ EXCHANGE SIGNAL: ${data.message}`);
      }
    } catch (e) {
      console.warn("✨ EXCHANGE_ERROR:", e.message);
      addLog("🏙️ EXCHANGE: The signal failed. Try again later.");
    }
  }, [player, functions, syncPlayer, addLog, playSFX, SOUNDS, setFaucetResult]);

  const exchangeHuntSparks = useCallback(async (tokenChoice = 'DWGX') => {
    if (!player || !functions) return;
    
    const inventory = player.inventory || {};
    const sparks = Object.entries(inventory)
      .filter(([id, item]) => item && item.id && item.id.startsWith('hunt_spark'));
    
    if (sparks.length < 4) {
      addLog(`🚨 INSUFFICIENT SPARKS: You need 4 Hunt Sparks. You have ${sparks.length}.`);
      return;
    }
    
    // Deduct 4 sparks
    const updates = {};
    sparks.slice(0, 4).forEach(([uniqueId]) => {
      updates[`inventory.${uniqueId}`] = deleteField();
    });
    
    addLog(`⚡ HUNT EXCHANGE: Consuming sparks for ${tokenChoice} transmission...`);
    
    try {
      // Use blocking sync to ensure inventory is updated before payout
      await syncPlayer(updates, true); 
      
      const claimFaucet = httpsCallable(functions, 'claimFaucetReward');
      const result = await claimFaucet({ 
        targetWalletAddress: player.walletAddress,
        rewardType: tokenChoice, // 'HUNT' or 'DWGX'
        sparksType: 'HUNT'
      });
      const data = result.data;
      
      if (data.success) {
        addLog(`🎁 HUNT REWARD: ${data.message}`);
        playSFX(SOUNDS.obtainLoot);
        if (setFaucetResult) {
          setFaucetResult({ 
            success: true, 
            txHash: data.txHash, 
            message: `${tokenChoice} Transmission Authorized` 
          });
        }
      } else {
        addLog(`🏙️ EXCHANGE SIGNAL: ${data.message}`);
      }
    } catch (e) {
      console.warn("⚡ HUNT_EXCHANGE_ERROR:", e.message);
      addLog("🏙️ EXCHANGE: The signal failed. Treasury may be dry.");
    }
  }, [player, functions, syncPlayer, addLog, playSFX, SOUNDS, setFaucetResult]);

  return {
    handleHeal, hireMate, dismissMate, summonDragon, sellItem, equipItem, unequipItem, allocateStat, buyItem, activateAutoScroll,
    mixLaboratoryItem, forgeCrystle, learnRecipe, cyclePotion, cycleScroll, handlePurify, salvageItems, claimGuildBounty,
    createSyndicate, joinSyndicate, leaveSyndicate, dissolveSyndicate, sendSyndicateMessage, donateToSyndicateLab,
    initiateSyndicateWar, respondToSyndicateWar, recordWarResult, enrollNagaInWar, concludeNagaWar, claimNagaWarRewards, startGvGRaid, abortSyndicateWar,
    eatFood, completeTownQuest, abandonTownQuest, rushTownQuestCooldown, completeQuiz, exchangeAetherSparks, exchangeHuntSparks,
    setLoadout, clearLoadout, getLoadout, getTotalPotionLoadout, getTotalScrollLoadout, getPlayerPotionOwned, getPlayerScrollOwned
  };
};
