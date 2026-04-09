import { useCallback, useRef, useEffect } from 'react';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp, collection, addDoc, increment, deleteDoc, deleteField } from 'firebase/firestore';
import { calculateNagaStats } from '../utils/gameLogic';

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
  gvgActions = {}
) => {
  const { setBattleMode, setGvgContext, setEnemy, setView } = gvgActions;

  // Track synchronous AP to prevent rapid-click negative balances
  const remainingApRef = useRef(0);
  useEffect(() => {
    remainingApRef.current = player?.abilityPoints || 0;
  }, [player?.abilityPoints]);

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

    let useCounter = false;
    let usedItemId = null;

    if (targetItem) {
      usedItemId = targetItem.id;
    } else if (selection === 'hp_potion' && hasCounter) {
      useCounter = true;
    } else {
      return addLog(`Wait! No ${selection.replace(/_/g, ' ')}'s found in bag.`);
    }

    const healAmt = Math.floor(totalStats.maxHp * spec.mult);
    playSFX(SOUNDS.useHeal);
    
    const updates = { hp: Math.min(totalStats.maxHp, player.hp + healAmt) };
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

  const equipItem = useCallback(async (itemOrId) => {
    const itemId = typeof itemOrId === 'object' ? itemOrId.id : itemOrId;
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

    // Use Dot-Notation for safety to prevent wiping other slots
    updates[`equipped.${slot}`] = item;
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
        [`equipped.${slot}`]: deleteField()
    });
    
    playSFX(SOUNDS.unequipItem);
    addLog(`Uninstalled Tech: ${item.name}`);
  }, [player, syncPlayer, playSFX, SOUNDS]);

  const allocateStat = (statName) => {
    if (remainingApRef.current <= 0) return;
    remainingApRef.current -= 1;
    // BUG-12 FIX: Use increment() to prevent race condition on rapid clicks
    syncPlayer({ [`baseStats.${statName}`]: increment(1), abilityPoints: increment(-1) });
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
      const updates = { tokens: player.tokens - item.cost };
      updates[`inventory.${purchaseItem.id}`] = purchaseItem;
      syncPlayer(updates);
      addLog(`Acquired ${item.name}! Check your Storage Bag.`);
    }
  };

  const activateAutoScroll = (view) => {
    const inventory = Object.values(player.inventory || {});
    const selection = player.selectedScrollId || 'auto_scroll';

    const scrollSpecs = {
      'auto_scroll': { ms: 60000, label: '1m' },
      'auto_scroll_3m': { ms: 180000, label: '3m' },
      'auto_scroll_6m': { ms: 360000, label: '6m' },
      'auto_scroll_9m': { ms: 540000, label: '9m' },
      'auto_scroll_12m': { ms: 720000, label: '12m' }
    };

    const spec = scrollSpecs[selection] || scrollSpecs['auto_scroll'];
    const targetItem = inventory.find(i => i && i.id?.startsWith(selection));
    const hasCounter = (player.autoScrolls || 0) > 0;

    let usedItemId = null;
    let useCounter = false;

    if (targetItem) {
      usedItemId = targetItem.id;
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
      updates[`inventory.${usedItemId}`] = deleteField();
    }

    syncPlayer(updates);
    addLog(`LOCK-ON ACTIVATED! (${spec.label})`);
  };

  const mixLaboratoryItem = (recipe) => {
    const masterData = ITEMS.find(i => i.id === recipe.id);
    if (!masterData) return addLog("❌ MIX ERROR: Unknown formula.");
    if (player.tokens < (recipe.cost || 0)) return addLog("Out of GX!");

    // BUG-01 FIX: Use Object.values() — inventory is a keyed map, not an array
    const inventoryArr = Object.values(player.inventory || {});
    const hasMaterials = recipe.materials.every(mat => {
      const count = inventoryArr.filter(i => {
         const cleanId = i.id?.replace(/(_\d+)+$/, '');
         const master = ITEMS.find(item => item.id === cleanId || item.name?.toLowerCase() === i.name?.toLowerCase());
         return (cleanId === mat.id) || (master?.id === mat.id);
      }).length;
      return count >= mat.count;
    });

    if (!hasMaterials) return addLog("Insufficient experimental materials!");

    // Build dot-notation updates — never overwrite full inventory
    const updates = { tokens: player.tokens - (recipe.cost || 0) };
    const remaining = [...inventoryArr];

    recipe.materials.forEach(mat => {
      for (let i = 0; i < mat.count; i++) {
        const idx = remaining.findIndex(item => {
           const cleanId = item.id?.replace(/(_\d+)+$/, '');
           const master = ITEMS.find(it => it.id === cleanId || it.name?.toLowerCase() === item.name?.toLowerCase());
           return (cleanId === mat.id) || (master?.id === mat.id);
        });
        if (idx !== -1) {
          updates[`inventory.${remaining[idx].id}`] = deleteField(); // dot-notation delete
          remaining.splice(idx, 1);
        }
      }
    });

    const mixedItem = { ...masterData, id: `${recipe.id}_${Date.now()}` };
    updates[`inventory.${mixedItem.id}`] = mixedItem; // dot-notation add

    syncPlayer(updates);
    addLog(`🧪 SUCCESS: Synthesized ${masterData.name}!`);
    playSFX(SOUNDS.obtainLoot);
    setForgeResult({ success: true, item: mixedItem });
  };
  
  const handlePurify = async (monster, tamingItemId) => {
    if (!monster || !tamingItemId) return;
    
    // Check if player has the tool
    const inventory = Object.values(player.inventory || {});
    const targetTool = inventory.find(i => i.id?.startsWith(tamingItemId));
    if (!targetTool) return addLog(`❌ PURIFY FAILED: Missing ${tamingItemId.replace(/taming_/g, '').toUpperCase()} Prism!`);

    // Element check
    const monsterElement = monster.id?.split('_')[0]?.charAt(0).toUpperCase() + monster.id?.split('_')[0]?.slice(1);
    const cosmicMonsters = ['null_stalker', 'void_wraith', 'abyssal_crawler', 'singularity_orb', 'quantum_shade', 'gravity_eater', 'dimensional_shifter', 'entropy_golem', 'rift_lurker', 'paradox_husk'];
    
    let element = monsterElement;
    if (cosmicMonsters.includes(monster.id)) element = 'Cosmic';

    if (!tamingItemId.includes(element.toLowerCase())) {
        return addLog(`❌ RESONANCE ERROR: Prism frequency doesn't match ${element} types.`);
    }

    playSFX(SOUNDS.useHeal);
    const success = Math.random() > 0.5;
    
    const updates = {
        [`inventory.${targetTool.id}`]: deleteField()
    };

    if (success) {
        // Find all pets of this element
        const elementPets = PETS_METADATA.filter(p => p.element === element);
        
        // ROLL FOR RARITY: Weighted Distribution
        // Common: 60%, Uncommon: 25%, Rare: 12%, Epic: 3%
        const roll = Math.random() * 100;
        let selectedRarity = 'Common';
        if (roll < 3) selectedRarity = 'Epic';
        else if (roll < 15) selectedRarity = 'Rare';
        else if (roll < 40) selectedRarity = 'Uncommon';
        
        const rarityPool = elementPets.filter(p => p.rarity === selectedRarity);
        // Fallback to any pet if pool is empty for some reason
        const poolToUse = rarityPool.length > 0 ? rarityPool : elementPets;
        const newPet = poolToUse[Math.floor(Math.random() * poolToUse.length)];
        
        updates.petId = newPet.id;
        updates.petLevel = 1;
        updates.unlockedPets = arrayUnion(newPet.id);
        
        addLog(`✨ CORE PURIFIED: ${monster.name}'s spirit manifested as ${newPet.name}! (${newPet.rarity})`);
        playSFX(SOUNDS.obtainLevel);
        setForgeResult({ success: true, item: { ...newPet, icon: '✨' } });
        
        // Victory! End combat
        if (setEnemy) setEnemy(null);
        if (setView) setView('menu');
    } else {
        addLog(`🌫️ DISSIPATED: Purification failed! The corrupted energy vanished into the void.`);
        playSFX(SOUNDS.monsterAttack);
        
        // Vanish! End combat
        if (setEnemy) setEnemy(null);
        if (setView) setView('menu');
    }
    
    syncPlayer(updates);
  };

  const forgeCrystle = (recipe) => {
    const masterData = ITEMS.find(i => i.id === recipe.id);
    const itemName = masterData?.name || recipe.name || "Unknown Tech";
    if (player.tokens < (recipe.cost || 0)) return addLog("Out of GX!");

    // BUG-02 FIX: Use Object.values() — inventory is a keyed map, not an array
    const inventoryArr = Object.values(player.inventory || {});
    
    const hasMaterials = recipe.materials.every(mat => {
      const count = inventoryArr.filter(i => {
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

    // Build dot-notation updates — never overwrite full inventory
    const updates = { tokens: player.tokens - (recipe.cost || 0) };
    const remaining = [...inventoryArr];

    recipe.materials.forEach(mat => {
      for (let i = 0; i < mat.count; i++) {
        const idx = remaining.findIndex(item => {
           const cleanId = item.id?.replace(/(_\d+)+$/, '');
           const master = ITEMS.find(it => it.id === cleanId || it.name?.toLowerCase() === item.name?.toLowerCase());
           return (cleanId === mat.id) || (master?.id === mat.id);
        });
        if (idx !== -1) {
          updates[`inventory.${remaining[idx].id}`] = deleteField(); // dot-notation delete
          remaining.splice(idx, 1);
        }
      }
    });

    if (isSuccess) {
      const forgedItem = { ...masterData, ...recipe, id: `${recipe.id}_${Date.now()}` };
      updates[`inventory.${forgedItem.id}`] = forgedItem; // dot-notation add
      syncPlayer(updates);
      addLog(`✅ SUCCESS: Forged ${itemName}!`);
      playSFX(SOUNDS.obtainLoot);
      setForgeResult({ success: true, item: forgedItem });
    } else {
      syncPlayer(updates); // Materials consumed even on failure
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
      
      let updates = { tokens: (player.tokens || 0) + gxReward };
      
      // Auto-Scrolls 12m Generation
      for (let i = 0; i < scrollCount; i++) {
         const id = `auto_scroll_12m_${Date.now()}_${i}`;
         updates[`inventory.${id}`] = {
           id,
           name: "Auto-Hunt (12m)",
           sellValue: 1400,
           type: "Consumable",
           category: "Consumable",
           duration: 720000,
           description: "12 minutes of autonomous hunting."
         };
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
    const reward = { ...rewardBase, id: `${rewardBase.id}_${Date.now()}` };
    
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
      tokens: increment(reward),
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

  return {
    handleHeal, hireMate, dismissMate, summonDragon, sellItem, equipItem, unequipItem, allocateStat, buyItem, activateAutoScroll,
    mixLaboratoryItem, forgeCrystle, learnRecipe, cyclePotion, cycleScroll, handlePurify, salvageItems, claimGuildBounty,
    createSyndicate, joinSyndicate, leaveSyndicate, dissolveSyndicate, sendSyndicateMessage, donateToSyndicateLab,
    initiateSyndicateWar, respondToSyndicateWar, recordWarResult, enrollNagaInWar, concludeNagaWar, claimNagaWarRewards, startGvGRaid, abortSyndicateWar
  };
};
