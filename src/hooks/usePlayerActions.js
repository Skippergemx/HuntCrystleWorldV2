import { useCallback } from 'react';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp, collection, addDoc, increment } from 'firebase/firestore';

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
  appId
) => {
  const handleHeal = useCallback(() => {
    if (player.hp >= player.maxHp) return;
    const inventory = player.inventory || [];
    const selection = player.selectedPotionId || 'hp_potion';
    
    // Potions data
    const potionSpecs = {
      'hp_potion': { mult: 0.1, label: '10%' },
      'mega_hp_potion': { mult: 0.5, label: '50%' },
      'ultra_hp_potion': { mult: 1.0, label: '100%' }
    };

    const spec = potionSpecs[selection] || potionSpecs['hp_potion'];
    const idx = inventory.findIndex(i => i && i.id?.startsWith(selection));
    const hasCounter = (player.potions || 0) > 0;

    let useCounter = false;
    let usedIdx = -1;

    if (idx !== -1) {
      usedIdx = idx;
    } else if (selection === 'hp_potion' && hasCounter) {
      useCounter = true;
    } else {
      return addLog(`Wait! No ${selection.replace(/_/g, ' ')}'s found in bag.`);
    }

    const healAmt = Math.floor(player.maxHp * spec.mult);
    playSFX(SOUNDS.useHeal);
    
    const updates = { hp: Math.min(player.maxHp, player.hp + healAmt) };
    if (useCounter) {
      updates.potions = player.potions - 1;
    } else {
      const newInv = [...inventory];
      newInv.splice(usedIdx, 1);
      updates.inventory = newInv;
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

  const sellItem = useCallback((itemId, amount = 1) => {
    setPlayer(prev => {
      if (!prev) return prev;
      const newInventory = [...(prev.inventory || [])];
      
      // Separate item being sold from those staying
      const itemsToSell = [];
      const remainingItems = [];
      let foundCount = 0;
      let itemName = "";
      let totalGained = 0;

      newInventory.forEach(item => {
        const itemBaseId = item.id?.replace(/(_\d+)+$/, '');
        const targetBaseId = itemId?.replace(/(_\d+)+$/, '');

        if (itemBaseId === targetBaseId && foundCount < amount) {
          const master = ITEMS.find(i => i.id === itemBaseId) || item;
          
          // Economic Standard: 40% of Master Cost
          let value = 0;
          if (master.cost) {
            value = Math.floor(master.cost * 0.4);
          } else {
            value = master.sellValue || item.sellValue || 0;
          }

          totalGained += value;
          foundCount++;
          itemName = master.name || item.name;
        } else {
          remainingItems.push(item);
        }
      });

      if (foundCount > 0) {
        syncPlayer({ tokens: prev.tokens + totalGained, inventory: remainingItems });
        addLog(`💰 Sold ${foundCount}x ${itemName} for ${totalGained} GX`);
        playSFX(SOUNDS.obtainLoot);
      }
      return { ...prev, tokens: prev.tokens + totalGained, inventory: remainingItems };
    });
  }, [syncPlayer, addLog, playSFX, SOUNDS, ITEMS]);

  const equipItem = (item) => {
    const oldItem = player.equipped?.[item.type];
    let newInventory = player.inventory.filter((_, i) => i !== player.inventory.findIndex(inv => inv.id === item.id));
    if (oldItem) newInventory.push(oldItem);

    syncPlayer({
      equipped: { ...player.equipped, [item.type]: item },
      inventory: newInventory
    });
    addLog(`Installed Tech: ${item.name}`);
  };

  const unequipItem = (slot) => {
    const item = player.equipped?.[slot];
    if (!item) return;

    syncPlayer({
      equipped: { ...player.equipped, [slot]: null },
      inventory: [...(player.inventory || []), item]
    });
    addLog(`Uninstalled Tech: ${item.name}`);
  };

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

  return {
    handleHeal,
    hireMate,
    dismissMate,
    summonDragon,
    sellItem,
    equipItem,
    unequipItem,
    allocateStat,
    buyItem,
    activateAutoScroll: (view) => {
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
    },
    cyclePotion,
    cycleScroll,
    mixLaboratoryItem: (recipe) => {
      const masterData = ITEMS.find(i => i.id === recipe.id);
      if (!masterData) return addLog("❌ MIX ERROR: Unknown formula.");
      if (player.tokens < (recipe.cost || 0)) return addLog("Out of GX!");

      const inventory = [...(player.inventory || [])];
      
      // Material check with robust matching
      const hasMaterials = recipe.materials.every(mat => {
        const count = inventory.filter(i => {
           const cleanId = i.id?.replace(/(_\d+)+$/, '');
           const master = ITEMS.find(item => item.id === cleanId || item.name?.toLowerCase() === i.name?.toLowerCase());
           return (cleanId === mat.id) || (master?.id === mat.id);
        }).length;
        return count >= mat.count;
      });

      if (!hasMaterials) return addLog("Insufficient experimental materials!");

      // Mix success is guaranteed in the Controlled Lab Environment
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
    },
    forgeCrystle: (recipe) => {
      const masterData = ITEMS.find(i => i.id === recipe.id);
      const itemName = masterData?.name || recipe.name || "Unknown Tech";
      
      console.log("🛠️ FORGE START:", itemName);
      if (player.tokens < (recipe.cost || 0)) return addLog("Out of GX!");

      // Safety check: ensure inventory is an array
      const currentInventory = Array.isArray(player.inventory) ? player.inventory : [];
      let inventory = [...currentInventory];
      
      // Check if player has all materials with robust matching
      const hasMaterials = recipe.materials.every(mat => {
        const count = inventory.filter(i => {
           const cleanId = i.id?.replace(/(_\d+)+$/, '');
           const master = ITEMS.find(item => item.id === cleanId || item.name?.toLowerCase() === i.name?.toLowerCase());
           return (cleanId === mat.id) || (master?.id === mat.id);
        }).length;
        return count >= mat.count;
      });

      if (!hasMaterials) {
        console.warn("🚫 FORGE FAILED: Insufficient Materials");
        return addLog("Insufficient Materials!");
      }

      // --- Success Rate Logic (Phase 1) ---
      // Base 50% + DEX/2, capped at 95%
      const currentDex = totalStats?.dex || 10;
      const successRate = Math.min(95, 50 + Math.floor(currentDex / 2));
      const roll = Math.random() * 100;
      const isSuccess = roll < successRate;

      // Consumption Phase (Always consumes GX and materials)
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
        // Add forged item with master data merged
        const forgedItem = { 
          ...masterData, 
          ...recipe, 
          id: `${recipe.id}_${Date.now()}` 
        };
        inventory.push(forgedItem);
        
        console.log("📦 FORGE SUCCESS:", itemName);
        syncPlayer({ tokens: player.tokens - (recipe.cost || 0), inventory: inventory });
        addLog(`✅ SUCCESS: Forged ${itemName}!`);
        playSFX(SOUNDS.obtainLoot);
        setForgeResult({ success: true, item: forgedItem });
      } else {
        console.log("💥 FORGE FAILED:", itemName);
        syncPlayer({ tokens: player.tokens - (recipe.cost || 0), inventory: inventory });
        addLog(`❌ FAILURE: The forging of ${itemName} failed!`);
        playSFX(SOUNDS.monsterAttack); // Failure sound
        setForgeResult({ success: false, item: masterData || recipe });
      }
    },

    learnRecipe: (item) => {
      // Robust lookup: ensure we have full master data
      const master = ITEMS.find(i => i.id === item.id?.replace(/(_\d+)+$/, '')) || item;
      
      if (master.type !== 'Schematic' || !master.recipeId) {
        return addLog("❌ DECIPHER FAILED: Object integrity compromised.");
      }
      
      const currentRecipes = Array.isArray(player.recipes) ? [...player.recipes] : [];
      const alreadyKnown = currentRecipes.includes(master.recipeId);

      // CONSUMPTION FIRST: Always remove the blueprint from the inventory
      const currentInventory = [...(player.inventory || [])];
      const targetIdx = currentInventory.findIndex(i => i.id === item.id);
      
      if (targetIdx === -1) return addLog("❌ ERROR: Schematic no longer in bag.");
      currentInventory.splice(targetIdx, 1);

      if (alreadyKnown) {
        // Just sync inventory removal
        syncPlayer({ inventory: currentInventory });
        return addLog(`📜 DUPLICATE: Pattern for "${master.name.replace('Schematic: ', '')}" was already in memory. Extra data purged.`);
      }

      // Unlock new recipe + Consume
      const newRecipes = [...currentRecipes, master.recipeId];
      syncPlayer({ 
        recipes: newRecipes,
        inventory: currentInventory
      });
      
      addLog(`✨ DECRYPTED: ${master.name}! New schematic synchronized with Identity Lab.`);
      playSFX(SOUNDS.obtainLoot);
    },

    createSyndicate: async (name, tag) => {
      if ((player.tokens || 0) < 50000) return addLog("🚨 INSUFFICIENT GX: Need 50,000 GX!");
      if (player.guildId) return addLog("🚨 ERROR: You already belong to a Syndicate.");
      if (!name || name.length < 3) return addLog("🚨 INVALID NAME: Syndicate name must be at least 3 characters.");
      
      const guildId = `guild_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      
      try {
        const guildRef = doc(db, 'artifacts', appId, 'guilds', guildId);
        await setDoc(guildRef, {
          id: guildId,
          name,
          tag: tag?.toUpperCase() || 'GX',
          leaderId: player.email || player.uid,
          members: [player.email || player.uid],
          gxVault: 0,
          level: 1,
          xp: 0,
          createdAt: serverTimestamp(),
          settings: {
            open: true,
            minLevel: 1
          }
        });
        
        syncPlayer({ 
          tokens: player.tokens - 50000,
          guildId: guildId,
          guildRole: 'LEADER'
        });
        
        addLog(`🏮 SYNDICATE FORMED: Welcome, Leader of ${name}!`);
        playSFX(SOUNDS.obtainLoot);
      } catch (e) {
        console.error("Guild Creation Error:", e);
        addLog("🚨 SYSTEM FAILURE: Could not establish Syndicate uplink.");
      }
    },

    joinSyndicate: async (guildId) => {
      if (player.guildId) return addLog("🚨 ERROR: Terminate current uplink before re-linking.");
      
      try {
        const guildRef = doc(db, 'artifacts', appId, 'guilds', guildId);
        const guildSnap = await getDoc(guildRef);
        
        if (!guildSnap.exists()) return addLog("🚨 ERROR: Syndicate signal lost. Target non-existent.");
        const data = guildSnap.data();
        
        if (data.members?.length >= 30) return addLog("🚨 ERROR: Syndicate capacity exceeded (30/30).");
        
        const identifier = player.email || player.uid;
        await updateDoc(guildRef, {
          members: arrayUnion(identifier)
        });
        
        syncPlayer({ 
          guildId: guildId,
          guildRole: 'MEMBER'
        });
        
        addLog(`🏮 UPLINK SECURED: Joined ${data.name}!`);
        playSFX(SOUNDS.obtainLevel);
      } catch (e) {
        console.error("Guild Join Error:", e);
        addLog("🚨 SYSTEM FAILURE: Could not join Syndicate.");
      }
    },

    leaveSyndicate: async () => {
      if (!player.guildId) return;
      if (player.guildRole === 'LEADER') return addLog("🚨 ERROR: Use 'Dissolve' protocol for Leaders.");
      
      try {
        const guildRef = doc(db, 'artifacts', appId, 'guilds', player.guildId);
        const identifier = player.email || player.uid;
        
        await updateDoc(guildRef, {
          members: arrayRemove(identifier)
        });
        
        syncPlayer({ 
          guildId: null,
          guildRole: null
        });
        
        addLog(`🏮 UPLINK TERMINATED: You have left the Syndicate.`);
      } catch (e) {
        console.error("Guild Leave Error:", e);
        addLog("🚨 ERROR: Failed to detach Syndicate link.");
      }
    },

    sendSyndicateMessage: async (text) => {
      if (!player.guildId || !text) return;
      
      try {
        const chatRef = collection(db, 'artifacts', appId, 'guilds', player.guildId, 'messages');
        await addDoc(chatRef, {
          senderId: player.email || player.uid,
          senderName: player.name,
          text,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.error("Chat Error:", e);
      }
    },

    donateToSyndicateLab: async (item) => {
      if (!player.guildId) return;
      
      // Materials logic
      const inventory = [...(player.inventory || [])];
      const targetIdx = inventory.findIndex(i => i.id === item.id);
      if (targetIdx === -1) return addLog("❌ ERROR: Material no longer in bag.");
      
      try {
        const guildRef = doc(db, 'artifacts', appId, 'guilds', player.guildId);
        
        // XP Multiplier: Higher rarity = more XP
        const xpMap = { 'Common': 10, 'Uncommon': 25, 'Rare': 75, 'Epic': 200, 'Legendary': 1000 };
        const gainedXp = xpMap[item.rarity] || 10;

        await updateDoc(guildRef, {
          xp: increment(gainedXp),
          gxVault: increment(item.sellValue || 100)
        });

        inventory.splice(targetIdx, 1);
        syncPlayer({ inventory });
        addLog(`🧪 DONATION: Contributed ${item.name} to Syndicate Lab! (+${gainedXp} Syndicate XP)`);
        playSFX(SOUNDS.obtainLoot);
      } catch (e) {
        console.error("Lab Donation Error:", e);
        addLog("🚨 ERROR: Failed to process Lab donation.");
      }
    },

    initiateSyndicateWar: async (targetGuildId, defenderIds = []) => {
      if (!player.guildId || player.guildRole !== 'LEADER') return addLog("🚨 UNAUTHORIZED: Only Leaders can start a War.");
      
      try {
        // Fetch defender snapshots to anchor stats
        const defenderSnapshots = {};
        for (const email of defenderIds) {
           const pSnap = await getDoc(doc(db, 'artifacts', appId, 'users', email, 'profile', 'data'));
           if (pSnap.exists()) defenderSnapshots[email.replace(/\./g, '_')] = pSnap.data();
        }

        const warRef = doc(db, 'artifacts', appId, 'guild_wars', `war_${Date.now()}`);
        await setDoc(warRef, {
          guildA: player.guildId,
          guildB: targetGuildId,
          status: 'BATTLE',
          guildA_Stars: 0,
          guildB_Stars: 0,
          guildA_Attacks: {}, // {playerId: [results]}
          guildB_Attacks: {},
          defendersA: defenderSnapshots, // Leaders must assign these in next phase
          defendersB: {}, 
          warSize: defenderIds.length,
          startedAt: serverTimestamp(),
          expiresAt: Date.now() + 86400000 // 24 hour duration
        });

        // Track active war on both guilds
        await updateDoc(doc(db, 'artifacts', appId, 'guilds', player.guildId), { activeWarId: warRef.id });
        await updateDoc(doc(db, 'artifacts', appId, 'guilds', targetGuildId), { activeWarId: warRef.id });
        
        addLog(`⚔️ WAR DECLARED: Mobilizing for Syndicate War!`);
        playSFX(SOUNDS.summonDragon);
      } catch (e) {
        console.error("War Initiation Error:", e);
      }
    },

    recordWarResult: async (warId, stars, opponentId, damageDealtPercent) => {
      if (!player.guildId || !warId) return;
      
      // Calculate Stars based on HP reduction
      let earnedStars = 0;
      if (damageDealtPercent >= 25) earnedStars = 1; // 75% HP remaining
      if (damageDealtPercent >= 50) earnedStars = 2; // 50% HP remaining
      if (damageDealtPercent >= 75) earnedStars = 3; // 25-0% HP remaining

      try {
        const warRef = doc(db, 'artifacts', appId, 'guild_wars', warId);
        const identifier = player.email || player.uid;
        
        await updateDoc(warRef, {
          [`guildA_Stars`]: increment(earnedStars),
          [`guildA_Attacks.${identifier.replace(/\./g, '_')}`]: arrayUnion({
            stars: earnedStars,
            opponentId,
            damageDealtPercent,
            timestamp: Date.now()
          })
        });

        addLog(`🎖️ WAR CONTRIBUTION: +${earnedStars} STARS secured for the Syndicate!`);
      } catch (e) {
        console.error("War Update Error:", e);
      }
    },

    assignWarDefenders: async (warId, defenderIds = []) => {
      if (!player.guildId || player.guildRole !== 'LEADER') return addLog("🚨 UNAUTHORIZED: Only Leaders can assign defense.");
      
      try {
        const defenderSnapshots = {};
        for (const email of defenderIds) {
           const pSnap = await getDoc(doc(db, 'artifacts', appId, 'users', email, 'profile', 'data'));
           if (pSnap.exists()) defenderSnapshots[email.replace(/\./g, '_')] = pSnap.data();
        }

        const warRef = doc(db, 'artifacts', appId, 'guild_wars', warId);
        const warSnap = await getDoc(warRef);
        const data = warSnap.data();
        
        // Match the side (A or B)
        const sideField = data.guildA === player.guildId ? 'defendersA' : 'defendersB';
        
        await updateDoc(warRef, { [sideField]: defenderSnapshots });
        addLog(`🛡️ DEFENSE PROTOCOL: ${defenderIds.length} Champions assigned to the Frontline!`);
      } catch (e) {
        console.error("Defender Assignment Error:", e);
      }
    }

  };
};
