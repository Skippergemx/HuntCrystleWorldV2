import { useCallback } from 'react';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp, collection, addDoc, increment, deleteDoc, deleteField } from 'firebase/firestore';

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
  gvgActions = {}
) => {
  const { setBattleMode, setGvgContext, setEnemy, setView } = gvgActions;

  const startGvGRaid = useCallback((warId, opponentId, defenderData, syndicateName = "Unknown", syndicateTag = "???") => {
    if (!setBattleMode || !setGvgContext) return;
    setBattleMode('GVG');
    setGvgContext({ warId, opponentId });
    setEnemy({
       ...defenderData,
       id: opponentId,
       hp: defenderData.maxHp || 1000,
       maxHp: defenderData.maxHp || 1000,
       isPlayer: true,
       syndicateName,
       syndicateTag
    });
    setView('dungeon');
    addLog(`🚩 BREACHING DEFENSES: Combat contact with ${defenderData.name}!`);
  }, [setBattleMode, setGvgContext, setEnemy, setView, addLog]);

  const handleHeal = useCallback(async () => {
    if (player.hp >= player.maxHp) return;
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

    let useCounter = false;
    let usedItemId = null;

    if (targetItem) {
      usedItemId = targetItem.id;
    } else if (selection === 'hp_potion' && hasCounter) {
      useCounter = true;
    } else {
      return addLog(`Wait! No ${selection.replace(/_/g, ' ')}'s found in bag.`);
    }

    const healAmt = Math.floor(player.maxHp * spec.mult);
    playSFX(SOUNDS.useHeal);
    
    const updates = { hp: Math.min(player.maxHp, player.hp + healAmt) };
    if (useCounter) {
      updates.potions = (player.potions || 0) - 1;
    } else {
      // Correct Dot-Notation Deletion for Keyed Maps
      updates[`inventory.${usedItemId}`] = deleteField();
    }

    syncPlayer(updates);
    addLog(`Healed for ${spec.label} Max HP (+${healAmt} HP).`);
  }, [player, addLog, syncPlayer, playSFX, SOUNDS]);

  const cyclePotion = () => {
    const potions = ['hp_potion', 'mega_hp_potion', 'ultra_hp_potion'];
    const currentIdx = potions.indexOf(player.selectedPotionId || 'hp_potion');
    const nextIdx = (currentIdx + 1) % potions.length;
    syncPlayer({ selectedPotionId: potions[nextIdx] });
    addLog(`Tactical Swap: Selected ${potions[nextIdx].replace(/_/g, ' ')}.`);
  };

  const cycleScroll = () => {
    const scrolls = ['auto_scroll', 'auto_scroll_3m', 'auto_scroll_6m', 'auto_scroll_9m', 'auto_scroll_12m'];
    const currentIdx = scrolls.indexOf(player.selectedScrollId || 'auto_scroll');
    const nextIdx = (currentIdx + 1) % scrolls.length;
    syncPlayer({ selectedScrollId: scrolls[nextIdx] });
    addLog(`Tactical Swap: Selected ${scrolls[nextIdx].replace(/_/g, ' ')}.`);
  };

  const hireMate = (mate) => {
    if (player.tokens < mate.cost) return addLog("Out of GX!");
    
    if (player.hiredMate) {
       const old = TAVERN_MATES.find(m => m.id === player.hiredMate);
       addLog(`Replacing ${old?.name || 'Party Member'} with ${mate.name}...`);
    }

    syncPlayer({ tokens: player.tokens - mate.cost, hiredMate: mate.id, buffUntil: 0 });
    addLog(`Contract signed: ${mate.name} joined!`);
  };

  const dismissMate = () => {
    if (!player.hiredMate) return;
    const mate = TAVERN_MATES.find(m => m.id === player.hiredMate);
    syncPlayer({ hiredMate: null, buffUntil: 0 });
    addLog(`Contract terminated. ${mate?.name || 'Party member'} has left the team.`);
  };

  const summonDragon = () => {
    if (!player.dragon || player.dragon.level <= 0) return addLog("No dragon to summon!");
    const cost = 1000 * player.dragon.level;
    if (player.tokens < cost) return addLog(`Insufficient GX! Need ${cost.toLocaleString()} GX.`);
    
    syncPlayer({ 
      tokens: player.tokens - cost, 
      dragon: { ...player.dragon, summonUntil: Date.now() + 86400000 } 
    });
    addLog(`✨ Dragon Power Summoned! (+${player.dragon.level * 5} ALL STATS)`);
    playSFX(SOUNDS.obtainLoot);
  };

  const sellItem = useCallback(async (itemId) => {
    if (!player.inventory || !player.inventory[itemId]) return;
    const item = player.inventory[itemId];
    const itemBaseId = item.id?.replace(/(_\d+)+$/, '');
    const master = ITEMS.find(i => i.id === itemBaseId) || item;
    
    let value = 0;
    if (master.cost) {
      value = Math.floor(master.cost * 0.4);
    } else {
      value = master.sellValue || item.sellValue || 0;
    }

    playSFX(SOUNDS.sellItem);
    addLog(`💰 Sold ${master.name || item.name} for ${value} GX`);
    
    syncPlayer({ 
      tokens: (player.tokens || 0) + value,
      [`inventory.${itemId}`]: deleteField()
    });
  }, [player, ITEMS, syncPlayer, playSFX, SOUNDS]);

  const equipItem = useCallback(async (itemId) => {
    if (!player.inventory || !player.inventory[itemId]) return;
    const item = player.inventory[itemId];
    const slot = item.type;
    
    if (!['Headgear', 'Weapon', 'Armor', 'Footwear', 'Relic'].includes(slot)) {
        return addLog("This item cannot be equipped.");
    }

    const updates = {};
    if (player.equipped?.[slot]) {
        const oldItem = player.equipped[slot];
        updates[`inventory.${oldItem.id || `OLD_${slot}`}`] = oldItem;
    }

    updates.equipped = { ...player.equipped, [slot]: item };
    updates[`inventory.${itemId}`] = deleteField();

    syncPlayer(updates);
    playSFX(SOUNDS.equipItem);
    addLog(`Installed Tech: ${item.name}`);
  }, [player, syncPlayer, playSFX, SOUNDS]);

  const unequipItem = useCallback(async (slot) => {
    if (!player.equipped?.[slot]) return;
    const item = player.equipped[slot];
    
    syncPlayer({
        [`inventory.${item.id || `RET_${slot}`}`]: item,
        equipped: { ...player.equipped, [slot]: null }
    });
    
    playSFX(SOUNDS.unequipItem);
    addLog(`Uninstalled Tech: ${item.name}`);
  }, [player, syncPlayer, playSFX, SOUNDS]);

  const allocateStat = (statName) => {
    if ((player.abilityPoints || 0) <= 0) return;
    const newBase = { ...player.baseStats };
    newBase[statName] = (newBase[statName] || 0) + 1;
    syncPlayer({ baseStats: newBase, abilityPoints: player.abilityPoints - 1 });
  };

  const buyItem = (item) => {
    if (player.tokens < item.cost) return addLog("Out of GX!");
    if (player.level < (item.reqLvl || 1)) return addLog(`Requires Level ${item.reqLvl}!`);

    if (item.id === 'hp_potion') {
      syncPlayer({ tokens: player.tokens - item.cost, potions: (player.potions || 0) + 1 });
    } else if (item.id === 'auto_scroll') {
      syncPlayer({ tokens: player.tokens - item.cost, autoScrolls: (player.autoScrolls || 0) + 1 });
    } else {
      const purchaseItem = { ...item, id: `${item.id}_${Date.now()}` };
      syncPlayer({
        tokens: player.tokens - item.cost,
        inventory: [...(player.inventory || []), purchaseItem]
      });
      addLog(`Acquired ${item.name}! Check your Storage Bag.`);
    }
  };

  const activateAutoScroll = (view) => {
    const inventory = player.inventory || [];
    const selection = player.selectedScrollId || 'auto_scroll';

    const scrollSpecs = {
      'auto_scroll': { ms: 60000, label: '1m' },
      'auto_scroll_3m': { ms: 180000, label: '3m' },
      'auto_scroll_6m': { ms: 360000, label: '6m' },
      'auto_scroll_9m': { ms: 540000, label: '9m' },
      'auto_scroll_12m': { ms: 720000, label: '12m' }
    };

    const spec = scrollSpecs[selection] || scrollSpecs['auto_scroll'];
    const idx = inventory.findIndex(i => i && i.id?.startsWith(selection));
    const hasCounter = (player.autoScrolls || 0) > 0;

    let usedIdx = -1;
    let useCounter = false;

    if (idx !== -1) {
      usedIdx = idx;
    } else if (selection === 'auto_scroll' && hasCounter) {
      useCounter = true;
    } else {
      return addLog(`Wait! No ${selection.replace(/_/g, ' ')}'s found in bag.`);
    }

    playSFX(SOUNDS.useHeal);
    const updates = { 
      autoUntil: Date.now() + spec.ms,
      autoMode: view || 'dungeon'
    };

    if (useCounter) {
      updates.autoScrolls = player.autoScrolls - 1;
    } else {
      const newInv = [...inventory];
      newInv.splice(usedIdx, 1);
      updates.inventory = newInv;
    }

    syncPlayer(updates);
    addLog(`LOCK-ON ACTIVATED! (${spec.label})`);
  };

  const mixLaboratoryItem = (recipe) => {
    const masterData = ITEMS.find(i => i.id === recipe.id);
    if (!masterData) return addLog("❌ MIX ERROR: Unknown formula.");
    if (player.tokens < (recipe.cost || 0)) return addLog("Out of GX!");

    const inventory = [...(player.inventory || [])];
    const hasMaterials = recipe.materials.every(mat => {
      const count = inventory.filter(i => {
         const cleanId = i.id?.replace(/(_\d+)+$/, '');
         const master = ITEMS.find(item => item.id === cleanId || item.name?.toLowerCase() === i.name?.toLowerCase());
         return (cleanId === mat.id) || (master?.id === mat.id);
      }).length;
      return count >= mat.count;
    });

    if (!hasMaterials) return addLog("Insufficient experimental materials!");

    recipe.materials.forEach(mat => {
      for (let i = 0; i < mat.count; i++) {
        const idx = inventory.findIndex(i => {
           const cleanId = i.id?.replace(/(_\d+)+$/, '');
           const master = ITEMS.find(item => item.id === cleanId || item.name?.toLowerCase() === i.name?.toLowerCase());
           return (cleanId === mat.id) || (master?.id === mat.id);
        });
        if (idx !== -1) inventory.splice(idx, 1);
      }
    });

    const mixedItem = { ...masterData, id: `${recipe.id}_${Date.now()}` };
    inventory.push(mixedItem);

    syncPlayer({ tokens: player.tokens - (recipe.cost || 0), inventory: inventory });
    addLog(`🧪 SUCCESS: Synthesized ${masterData.name}!`);
    playSFX(SOUNDS.obtainLoot);
    setForgeResult({ success: true, item: mixedItem });
  };

  const forgeCrystle = (recipe) => {
    const masterData = ITEMS.find(i => i.id === recipe.id);
    const itemName = masterData?.name || recipe.name || "Unknown Tech";
    if (player.tokens < (recipe.cost || 0)) return addLog("Out of GX!");

    const currentInventory = Array.isArray(player.inventory) ? player.inventory : [];
    let inventory = [...currentInventory];
    
    const hasMaterials = recipe.materials.every(mat => {
      const count = inventory.filter(i => {
         const cleanId = i.id?.replace(/(_\d+)+$/, '');
         const master = ITEMS.find(item => item.id === cleanId || item.name?.toLowerCase() === i.name?.toLowerCase());
         return (cleanId === mat.id) || (master?.id === mat.id);
      }).length;
      return count >= mat.count;
    });

    if (!hasMaterials) return addLog("Insufficient Materials!");

    const currentDex = totalStats?.dex || 10;
    const successRate = Math.min(95, 50 + Math.floor(currentDex / 2));
    const roll = Math.random() * 100;
    const isSuccess = roll < successRate;

    recipe.materials.forEach(mat => {
      for (let i = 0; i < mat.count; i++) {
        const idx = inventory.findIndex(item => {
           const cleanId = item.id?.replace(/(_\d+)+$/, '');
           const master = ITEMS.find(it => it.id === cleanId || it.name?.toLowerCase() === item.name?.toLowerCase());
           return (cleanId === mat.id) || (master?.id === mat.id);
        });
        if (idx !== -1) inventory.splice(idx, 1);
      }
    });

    if (isSuccess) {
      const forgedItem = { ...masterData, ...recipe, id: `${recipe.id}_${Date.now()}` };
      inventory.push(forgedItem);
      syncPlayer({ tokens: player.tokens - (recipe.cost || 0), inventory: inventory });
      addLog(`✅ SUCCESS: Forged ${itemName}!`);
      playSFX(SOUNDS.obtainLoot);
      setForgeResult({ success: true, item: forgedItem });
    } else {
      syncPlayer({ tokens: player.tokens - (recipe.cost || 0), inventory: inventory });
      addLog(`❌ FAILURE: The forging of ${itemName} failed!`);
      playSFX(SOUNDS.monsterAttack);
      setForgeResult({ success: false, item: masterData || recipe });
    }
  };

  const learnRecipe = (item) => {
    const master = ITEMS.find(i => i.id === item.id?.replace(/(_\d+)+$/, '')) || item;
    if (master.type !== 'Schematic' || !master.recipeId) return addLog("❌ DECIPHER FAILED: Object integrity compromised.");
    
    const currentRecipes = Array.isArray(player.recipes) ? [...player.recipes] : [];
    const alreadyKnown = currentRecipes.includes(master.recipeId);
    const currentInventory = [...(player.inventory || [])];
    const targetIdx = currentInventory.findIndex(i => i.id === item.id);
    
    if (targetIdx === -1) return addLog("❌ ERROR: Schematic no longer in bag.");
    currentInventory.splice(targetIdx, 1);

    if (alreadyKnown) {
      syncPlayer({ inventory: currentInventory });
      return addLog(`📜 DUPLICATE: Pattern memory preserved.`);
    }

    const newRecipes = [...currentRecipes, master.recipeId];
    syncPlayer({ recipes: newRecipes, inventory: currentInventory });
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
      const guildRef = doc(db, 'guilds', guildId); // V2: Root Path
      await setDoc(guildRef, {
        id: guildId,
        name,
        tag: tag?.toUpperCase() || 'GX',
        leaderId: player.uid, // V2: UID Primary
        members: [player.uid],
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
      
      await updateDoc(guildRef, { members: arrayUnion(player.uid) }); // V2: UID Primary
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
      const guildRef = doc(db, 'guilds', player.guildId); // V2: Root Path
      await updateDoc(guildRef, { members: arrayRemove(player.uid) }); // V2: UID Primary
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
      const guildRef = doc(db, 'guilds', player.guildId); // V2: Root Path
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

  const donateToSyndicateLab = async (item) => {
    if (!player.guildId) return;
    const inventory = [...(player.inventory || [])];
    const targetIdx = inventory.findIndex(i => i.id === item.id);
    if (targetIdx === -1) return;
    
    try {
      const guildRef = doc(db, 'guilds', player.guildId); // V2: Root Path
      const xpMap = { 'Common': 10, 'Uncommon': 25, 'Rare': 75, 'Epic': 200, 'Legendary': 1000 };
      const gainedXp = xpMap[item.rarity] || 10;
      await updateDoc(guildRef, { xp: increment(gainedXp), gxVault: increment(item.sellValue || 100) });
      inventory.splice(targetIdx, 1);
      syncPlayer({ inventory });
      addLog(`🧪 DONATION: Contributed ${item.name} (+${gainedXp} XP)`);
      playSFX(SOUNDS.obtainLoot);
    } catch (e) { console.error("Lab Error:", e); }
  };

  // --- WAR PROTOCOLS (V2) ---
  const initiateSyndicateWar = async (targetGuildId, warSize = 1) => {
    if (!player.guildId || player.guildRole !== 'LEADER') return;
    try {
      const warId = `war_${Date.now()}`;
      const warRef = doc(db, 'guild_wars', warId); // V2: Root Path
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
        warSize: warSize || 1,
        declaredAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'guilds', player.guildId), { activeWarId: warId });
      await updateDoc(doc(db, 'guilds', targetGuildId), { activeWarId: warId });
      addLog(`⚔️ WAR DECLARED: Request sent to rival Syndicate!`);
    } catch (e) { console.error("War Init Error:", e); }
  };

  const respondToSyndicateWar = async (warId, accepted) => {
    if (!player.guildId || player.guildRole !== 'LEADER') return;
    try {
      const warRef = doc(db, 'guild_wars', warId);
      if (accepted) {
        await updateDoc(warRef, { status: 'PREPARATION' });
        addLog(`⚔️ WAR ACCEPTED! Line up your Defenders.`);
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

  const assignWarDefenders = async (warId, defenderIds = []) => {
    if (!player.guildId || player.guildRole !== 'LEADER') return;
    try {
      const snapshots = {};
      for (const uid of defenderIds) {
         const pSnap = await getDoc(doc(db, 'players', uid)); // V2 Path
         if (pSnap.exists()) snapshots[uid] = pSnap.data();
      }
      const warRef = doc(db, 'guild_wars', warId);
      const warSnap = await getDoc(warRef);
      const data = warSnap.data();
      const sideField = data.guildA === player.guildId ? 'defendersA' : 'defendersB';
      await updateDoc(warRef, { [sideField]: snapshots });
      
      const updated = await getDoc(warRef);
      const u = updated.data();
      if (Object.keys(u.defendersA || {}).length >= u.warSize && Object.keys(u.defendersB || {}).length >= u.warSize) {
         await updateDoc(warRef, { status: 'BATTLE', battleStartedAt: serverTimestamp(), expiresAt: Date.now() + 180000 });
      }
      addLog(`🛡️ DEFENSE SET: Champions deployed.`);
    } catch (e) { console.error("Def assignment error:", e); }
  };

  const finalizeSyndicateWar = async (warId) => {
    if (!player.guildId || player.guildRole !== 'LEADER') return;
    try {
      const warRef = doc(db, 'guild_wars', warId);
      const warSnap = await getDoc(warRef);
      if (!warSnap.exists()) return;
      const d = warSnap.data();
      const isWinner = d.guildA === player.guildId ? d.guildA_Stars > d.guildB_Stars : d.guildB_Stars > d.guildA_Stars;
      const xpReward = isWinner ? 500 : 50;
      const gxReward = isWinner ? 10000 : 0;
      
      await updateDoc(doc(db, 'guilds', player.guildId), { activeWarId: null, xp: increment(xpReward), gxVault: increment(gxReward) });
      await updateDoc(warRef, { status: 'COMPLETED', finalizedAt: Date.now() });
      addLog(`🏆 WAR COMPLETED: Received rewards.`);
    } catch (e) { console.error("War Finalizing Error:", e); }
  };

  return {
    handleHeal, hireMate, dismissMate, summonDragon, sellItem, equipItem, unequipItem, allocateStat, buyItem, activateAutoScroll,
    mixLaboratoryItem, forgeCrystle, learnRecipe, cyclePotion, cycleScroll,
    createSyndicate, joinSyndicate, leaveSyndicate, dissolveSyndicate, sendSyndicateMessage, donateToSyndicateLab,
    initiateSyndicateWar, respondToSyndicateWar, recordWarResult, assignWarDefenders, finalizeSyndicateWar, startGvGRaid
  };
};
