import { useCallback } from 'react';

export const usePlayerActions = (
  player,
  setPlayer,
  syncPlayer,
  addLog,
  playSFX,
  SOUNDS,
  TAVERN_MATES
) => {
  const handleHeal = useCallback(() => {
    if ((player.potions || 0) <= 0) return addLog("Out of Potions!");
    const healAmt = Math.floor(player.maxHp * 0.5);
    playSFX(SOUNDS.useHeal);
    syncPlayer({ hp: Math.min(player.maxHp, player.hp + healAmt), potions: player.potions - 1 });
    addLog(`Healed ${healAmt} HP.`);
  }, [player, addLog, syncPlayer, playSFX, SOUNDS]);

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
      const remainingItems = [];
      let tokensGained = 0;
      let foundCount = 0;
      let itemName = "";

      newInventory.forEach(item => {
        if (item.id === itemId && foundCount < amount) {
          const value = item.sellValue !== undefined ? item.sellValue : Math.floor((item.cost || 0) / 2);
          tokensGained += value;
          foundCount++;
          itemName = item.name;
        } else {
          remainingItems.push(item);
        }
      });

      if (foundCount > 0) {
        syncPlayer({ tokens: prev.tokens + tokensGained, inventory: remainingItems });
        addLog(`💰 Sold ${foundCount}x ${itemName} for ${tokensGained} GX`);
        playSFX(SOUNDS.obtainLoot);
      }
      return { ...prev, tokens: prev.tokens + tokensGained, inventory: remainingItems };
    });
  }, [syncPlayer, addLog, playSFX, SOUNDS]);

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
      const oldItem = player.equipped?.[item.type];
      const newInventory = oldItem ? [...(player.inventory || []), oldItem] : (player.inventory || []);
      syncPlayer({
        tokens: player.tokens - item.cost,
        equipped: { ...player.equipped, [item.type]: item },
        inventory: newInventory
      });
      addLog(`Equipped ${item.name}! Old gear moved to Storage.`);
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
      const hasInCounter = (player.autoScrolls || 0) > 0;
      const inventory = player.inventory || [];
      const scrollIndex = inventory.findIndex(i => i && i.id === 'auto_scroll');
      
      if (!hasInCounter && scrollIndex === -1) return addLog("Out of Auto Scrolls!");

      playSFX(SOUNDS.useHeal);
      
      const updates = { 
        autoUntil: Date.now() + 60000,
        autoMode: view || 'dungeon'
      };

      if (hasInCounter) {
        updates.autoScrolls = player.autoScrolls - 1;
      } else {
        const newInventory = [...inventory];
        newInventory.splice(scrollIndex, 1);
        updates.inventory = newInventory;
      }

      syncPlayer(updates);
      addLog("LOCK-ON ACTIVATED! (60s)");
    },
    forgeCrystle: (recipe) => {
      if (player.tokens < (recipe.cost || 0)) return addLog("Out of GX!");

      // Check if player has all materials
      const inventory = [...(player.inventory || [])];
      const hasMaterials = recipe.materials.every(mat => {
        const count = inventory.filter(i => i.id === mat.id).length;
        return count >= mat.count;
      });

      if (!hasMaterials) return addLog("Insufficient Materials!");

      // Consume materials
      let newInventory = [...inventory];
      recipe.materials.forEach(mat => {
        for (let i = 0; i < mat.count; i++) {
          const idx = newInventory.findIndex(item => item.id === mat.id);
          if (idx !== -1) newInventory.splice(idx, 1);
        }
      });

      // Add forged item
      const forgedItem = { ...recipe, id: `${recipe.id}_${Date.now()}` };
      newInventory.push(forgedItem);
      syncPlayer({ tokens: player.tokens - (recipe.cost || 0), inventory: newInventory });
      addLog(`Forged: ${recipe.name}!`);
      playSFX(SOUNDS.obtainLoot);
    }

  };
};
