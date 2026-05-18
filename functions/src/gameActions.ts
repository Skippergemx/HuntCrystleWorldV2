import { HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const ITEM_CATALOG: Record<string, any> = {
  'hp_potion': { sellValue: 20 },
  'auto_scroll': { sellValue: 120 },
  'mega_hp_potion': { sellValue: 100 },
  'ultra_hp_potion': { sellValue: 500 },
  'auto_scroll_3m': { sellValue: 350 },
  'auto_scroll_6m': { sellValue: 700 },
  'auto_scroll_9m': { sellValue: 1000 },
  'auto_scroll_12m': { sellValue: 1400 },
  'steel_edge': { sellValue: 40 },
  'breaker_hammer': { sellValue: 160 },
  'scout_vest': { sellValue: 60 },
  'heavy_plate': { sellValue: 240 },
  'leather_cap': { sellValue: 32 },
  'iron_helm': { sellValue: 100 },
  'leather_boots': { sellValue: 32 },
  'swift_sandals': { sellValue: 120 },
  'war_boots': { sellValue: 200 },
  'crystle_blade': { sellValue: 400 },
  'neon_plate': { sellValue: 600 },
  'tech_visor': { sellValue: 320 },
  'kinetic_boots': { sellValue: 480 },
  'void_edge': { sellValue: 2000 },
  'guardian_core': { sellValue: 2000 },
  'void_capacitor': { sellValue: 1800 },
  'omega_sigil': { sellValue: 3200 },
  'crystle_shard': { sellValue: 10 },
  'beast_hide': { sellValue: 15 },
  'void_essence': { sellValue: 50 },
  'ancient_gear': { sellValue: 200 },
  'core_pulse': { sellValue: 1000 },
  'omega_crystle': { sellValue: 5000 },
  'slum_scrap': { sellValue: 5 },
  'toxic_sludge': { sellValue: 8 },
  'rusty_wire': { sellValue: 6 },
  'mutant_tooth': { sellValue: 12 },
  'neon_dust': { sellValue: 15 },
  'broken_sensor': { sellValue: 45 },
  'slum_medals': { sellValue: 60 },
  'cypher_chip': { sellValue: 250 },
  'glowing_eye': { sellValue: 1200 },
  'slum_rat_tail': { sellValue: 4 },
  'copper_piping': { sellValue: 14 },
  'broken_glasses': { sellValue: 2 },
  'dirty_rag': { sellValue: 1 },
  'moldy_bread': { sellValue: 1 },
  'faded_poster': { sellValue: 5 },
  'cracked_tile': { sellValue: 3 },
  'plastic_bottle': { sellValue: 2 },
  'old_coin': { sellValue: 35 },
  'bio_vial': { sellValue: 75 },
  'hazard_tape': { sellValue: 10 },
  'rusted_key': { sellValue: 40 },
  'empty_can': { sellValue: 3 },
  'cracked_screen': { sellValue: 55 },
  'neon_filament': { sellValue: 180 },
  'canyon_iron': { sellValue: 25 },
  'oil_drum': { sellValue: 30 },
  'cracked_piston': { sellValue: 20 },
  'sand_glass': { sellValue: 18 },
  'engine_bolt': { sellValue: 15 },
  'power_cell': { sellValue: 80 },
  'vintage_armor': { sellValue: 95 },
  'titanium_link': { sellValue: 350 },
  'turbo_charger': { sellValue: 1500 },
  'exhaust_pipe': { sellValue: 40 },
  'steel_spring': { sellValue: 35 },
  'rubber_hose': { sellValue: 25 },
  'spark_plug': { sellValue: 65 },
  'fan_blade': { sellValue: 75 },
  'rusty_cog': { sellValue: 45 },
  'metal_shard': { sellValue: 20 },
  'fuel_filter': { sellValue: 85 },
  'brake_pad': { sellValue: 90 },
  'clutch_plate': { sellValue: 250 },
  'valve_stem': { sellValue: 70 },
  'radiator_fin': { sellValue: 55 },
  'chrome_trim': { sellValue: 200 },
  'carbon_filter': { sellValue: 320 },
  'hydraulics': { sellValue: 1200 },
  'ignition_coil': { sellValue: 400 },
  'void_shard': { sellValue: 100 },
  'dark_matter': { sellValue: 120 },
  'gravity_well': { sellValue: 150 },
  'neural_net': { sellValue: 110 },
  'plasma_core': { sellValue: 450 },
  'void_crystal': { sellValue: 800 },
  'singularity': { sellValue: 10000 },
  'event_horizon': { sellValue: 4000 },
  'quantum_bit': { sellValue: 900 },
  'nanite_cloud': { sellValue: 600 },
  'warp_drive_part': { sellValue: 2500 },
  'cyber_heart': { sellValue: 2000 },
  'stardust': { sellValue: 400 },
  'obsidian_glass': { sellValue: 200 },
  'void_tear': { sellValue: 350 },
  'shadow_pulse': { sellValue: 280 },
  'entropy_coil': { sellValue: 750 },
  'null_point': { sellValue: 950 },
  'void_membrane': { sellValue: 180 },
  'black_hole_shard': { sellValue: 15000 },
  'time_drift': { sellValue: 3500 },
  'phase_module': { sellValue: 820 },
  'void_beacon': { sellValue: 680 },
  'dark_energy_cell': { sellValue: 520 },
  'void_fang': { sellValue: 220 },
  'magma_core': { sellValue: 1500 },
  'fire_essence': { sellValue: 500 },
  'scorched_bone': { sellValue: 150 },
  'ember_shard': { sellValue: 50 },
  'quake_stone': { sellValue: 1500 },
  'earth_essence': { sellValue: 500 },
  'petrified_wood': { sellValue: 150 },
  'granite_fragment': { sellValue: 50 },
  'ocean_pearl': { sellValue: 1500 },
  'water_essence': { sellValue: 500 },
  'coral_spine': { sellValue: 150 },
  'sea_salt': { sellValue: 50 },
  'gale_feather': { sellValue: 1500 },
  'storm_essence': { sellValue: 500 },
  'cloud_silk': { sellValue: 150 },
  'mist_vial': { sellValue: 50 },
  'dragon_apple': { sellValue: 50 },
  'ember_grapes': { sellValue: 50 },
  'sky_berry': { sellValue: 100 },
  'void_cherry': { sellValue: 100 },
  'golden_peach': { sellValue: 500 },
  'plasma_lemon': { sellValue: 500 },
  'neon_orange': { sellValue: 1200 },
  'crystle_pear': { sellValue: 5000 },
  'taming_hydro': { sellValue: 500 },
  'taming_pyro': { sellValue: 500 },
  'taming_gale': { sellValue: 500 },
  'taming_earthen': { sellValue: 500 },
  'taming_cosmic': { sellValue: 500 },
  'magma_blade': { sellValue: 5000 },
  'tidal_plate': { sellValue: 5000 },
  'storm_boots': { sellValue: 5000 },
  'quake_helm': { sellValue: 5000 },
  'void_relic': { sellValue: 8000 },
  'schema_neon_plate': { sellValue: 500 },
  'schema_tech_visor': { sellValue: 300 },
  'schema_kinetic_boots': { sellValue: 450 },
  'schema_void_edge': { sellValue: 2500 },
  'scrap_saber': { sellValue: 150 },
  'riveted_plate': { sellValue: 200 },
  'welder_mask': { sellValue: 120 },
  'heavy_clogs': { sellValue: 120 },
  'sludge_slicer': { sellValue: 350 },
  'hazmat_vest': { sellValue: 400 },
  'filter_helm': { sellValue: 280 },
  'rubber_treaders': { sellValue: 280 },
  'pulse_blade': { sellValue: 800 },
  'data_mesh': { sellValue: 900 },
  'hud_goggles': { sellValue: 650 },
  'static_runners': { sellValue: 650 },
  'scrap_spear': { sellValue: 180 },
  'sand_cloak': { sellValue: 220 },
  'dust_hood': { sellValue: 150 },
  'dune_wraps': { sellValue: 150 },
  'flux_core_r': { sellValue: 1200 },
  'signal_jammer': { sellValue: 1250 },
  'capacitor_cuff': { sellValue: 1100 },
  'neural_link': { sellValue: 1500 },
  'titan_impact': { sellValue: 1800 },
  'void_plating': { sellValue: 2000 },
  'chrono_helm': { sellValue: 1600 },
  'warp_boots': { sellValue: 1600 },
  'bio_saber': { sellValue: 900 },
  'recycled_core': { sellValue: 2500 },
  'scrap_cannon': { sellValue: 1400 },
  'neon_shield': { sellValue: 1200 },
  'hazmat_claws': { sellValue: 1300 },
  'void_wraps': { sellValue: 1350 },
  'enforcer_blade': { sellValue: 1200 },
  'enforcer_plate': { sellValue: 1280 },
  'enforcer_helm': { sellValue: 1120 },
  'enforcer_boots': { sellValue: 1120 },
  'vanguard_halberd': { sellValue: 3200 },
  'vanguard_suit': { sellValue: 3400 },
  'vanguard_visor': { sellValue: 3000 },
  'vanguard_treads': { sellValue: 3000 },
  'apex_striker': { sellValue: 8000 },
  'apex_carapace': { sellValue: 8800 },
  'apex_crown': { sellValue: 7200 },
  'apex_striders': { sellValue: 7200 },
  'genesis_edge': { sellValue: 20000 },
  'genesis_core_armor': { sellValue: 22000 },
  'genesis_halo': { sellValue: 18000 },
  'genesis_gravity_boots': { sellValue: 18000 },
  'magnetic_coil': { sellValue: 85 },
  'aether_spark': { sellValue: 1000 },
  'hunt_spark': { sellValue: 250 },
};

// Robust base ID extractor: strips `_<timestamp>_<any_suffix>` or `_<timestamp>` patterns.
// Handles short suffixes (1–3 chars) that the old {4,} regex missed.
const extractBaseId = (itemId: string): string => {
  // Strip everything from the first underscore followed by 10+ digits (a 13-digit ms timestamp)
  const tsStripped = itemId.replace(/_\d{10,}.*$/, '');
  if (tsStripped !== itemId) return tsStripped; // found a timestamp, return cleaned base
  // Fallback: strip trailing short alphanumeric suffix (for IDs without timestamps)
  return itemId.replace(/_[a-z0-9]{1,8}$/i, '').replace(/_\d+$/, '');
};

// Helper: look up sell value by extracting the canonical base ID
const getSellValue = (itemId: string): number => {
  const baseId = extractBaseId(itemId);
  return ITEM_CATALOG[baseId]?.sellValue ?? ITEM_CATALOG[itemId]?.sellValue ?? 0;
};

const getCatalogEntry = (itemId: string) => {
  const baseId = extractBaseId(itemId);
  return ITEM_CATALOG[baseId] ?? ITEM_CATALOG[itemId] ?? null;
};

// Rate limit helper: max 1 kill reward per 3 seconds
const MIN_KILL_INTERVAL_MS = 3000;

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
      // SECURITY PATCH: Never trust client-supplied 'cost'. Look up from server catalog.
      const catalogEntry = getCatalogEntry(item.id);
      if (!catalogEntry || catalogEntry.cost === undefined) throw new HttpsError('not-found', 'Item not available for purchase.');
      if (!Number.isInteger(qty) || qty <= 0 || qty > 99) throw new HttpsError('invalid-argument', 'Invalid quantity.');
      const totalCost = catalogEntry.cost * qty;
      const currentTokens = userData.tokens || 0;
      if (currentTokens < totalCost) throw new HttpsError('failed-precondition', 'Insufficient GX.');
      if (userData.level < (catalogEntry.reqLvl || 1)) throw new HttpsError('failed-precondition', 'Level too low.');

      // SECURITY: Enforce inventory slot capacity before allowing purchase
      const maxSlots = userData.maxInventorySlots || 50;
      const currentSlots = Object.keys(userData.inventory || {}).length;
      const isCounterItem = (item.id === 'hp_potion' || item.id === 'auto_scroll');
      if (!isCounterItem && (currentSlots + qty) > maxSlots) {
        throw new HttpsError('failed-precondition', `Bag full! You have ${currentSlots}/${maxSlots} slots used. Sell items or upgrade your storage.`);
      }

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
      // SECURITY PATCH: Validate recipe cost from server; reject empty material arrays (Free Forge exploit).
      if (!recipe?.id || typeof recipe.id !== 'string') throw new HttpsError('invalid-argument', 'Invalid recipe.');
      if (!Array.isArray(itemsToConsumeKeys) || itemsToConsumeKeys.length === 0)
        throw new HttpsError('invalid-argument', 'No materials provided for fusion.');
      const recipeCost = typeof recipe.cost === 'number' && Number.isInteger(recipe.cost) && recipe.cost >= 0
        ? recipe.cost : 0; // cost is allowed to be 0 for material-only recipes, but NEVER negative
      if (recipe.cost < 0) throw new HttpsError('invalid-argument', 'Invalid recipe cost.');

      const currentTokens = userData.tokens || 0;
      if (currentTokens < recipeCost) throw new HttpsError('failed-precondition', 'Insufficient GX.');

      const inventory = userData.inventory || {};
      itemsToConsumeKeys.forEach((key: string) => {
        if (typeof key !== 'string') throw new HttpsError('invalid-argument', 'Invalid material key.');
        if (!inventory[key]) throw new HttpsError('not-found', `Missing material: ${key}`);
        delete inventory[key];
      });

      const updates: any = {
        tokens: currentTokens - recipeCost,
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
      
      // SECURITY PATCH: Validate all numeric inputs are positive integers within bounds.
      if (!Number.isInteger(earnedLoot) || earnedLoot < 0 || earnedLoot > 49999)
        throw new HttpsError('out-of-range', 'Invalid loot payload.');
      if (!Number.isInteger(earnedXp) || earnedXp < 0 || earnedXp > 99999)
        throw new HttpsError('out-of-range', 'Invalid XP payload.');
      
      // SECURITY PATCH: Rate limiting - enforce minimum 3s between kill reward claims.
      const lastKillReward = userData.lastKillRewardAt || 0;
      if (Date.now() - lastKillReward < MIN_KILL_INTERVAL_MS)
        throw new HttpsError('resource-exhausted', 'Kill reward rate limit exceeded.');

      const updates: any = {
        tokens: (userData.tokens || 0) + earnedLoot,
        xp: nextXp,
        level: nextLvl,
        maxHp: nextMaxHp,
        hp: Math.min(nextMaxHp, (userData.hp || 0) + 25),
        lastKillRewardAt: Date.now(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (apGained > 0) {
        updates.abilityPoints = (userData.abilityPoints || 0) + apGained;
      }

      if (loots && loots.length > 0) {
        const inventory = userData.inventory || {};
        const maxSlots = userData.maxInventorySlots || 50;
        loots.forEach((loot: any) => {
          if (loot.id?.includes('_pool_')) return;
          // SERVER CAPACITY LOCK: Skip adding items if capacity is exceeded
          if (Object.keys(inventory).length >= maxSlots) return;
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
      const { itemId, qty } = payload;
      // SECURITY PATCH: 'value' is NEVER accepted from client — looked up server-side.
      if (!Number.isInteger(qty) || qty <= 0 || qty > 99) throw new HttpsError('invalid-argument', 'Invalid quantity.');
      const inventory = userData.inventory || {};
      const targetItem = inventory[itemId];
      if (!targetItem) throw new HttpsError('not-found', 'Item not in inventory.');

      // Look up canonical sell value from server catalog
      const trueSellValue = getSellValue((targetItem as any).id || itemId);
      if (trueSellValue <= 0) throw new HttpsError('failed-precondition', 'This item cannot be sold.');

      const baseId = extractBaseId((targetItem as any).id || itemId);
      const sellQty = qty;

      const entries = Object.entries(inventory);
      let removed = 0;
      for (const [key, invItem] of entries) {
        if (removed >= sellQty) break;
        if (!invItem) continue;
        const invBaseId = extractBaseId((invItem as any).id || key);
        if (invBaseId === baseId) {
          delete inventory[key];
          removed++;
        }
      }
      if (removed === 0) throw new HttpsError('not-found', 'No matching items found.');

      transaction.update(userRef, {
        tokens: (userData.tokens || 0) + (trueSellValue * removed),
        inventory: inventory,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, message: `Sold ${removed} item(s) for ${trueSellValue * removed} GX.` };
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

      // SECURITY PATCH: Always generate a guaranteed-unique key to prevent key collision
      // duplication (the 'RET_slot' fallback could be overwritten on rapid concurrent calls).
      const returnKey = `${(item.id || slot).replace(/(_[a-z0-9]{4,})+$/i, '')}_RET_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      inventory[returnKey] = { ...item, id: returnKey };
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
      // SECURITY PATCH: Validate cost is a positive integer; cap at a sane maximum.
      if (!Number.isInteger(cost) || cost <= 0 || cost > 999999)
        throw new HttpsError('invalid-argument', 'Invalid hire cost.');
      const currentTokens = userData.tokens || 0;
      if (currentTokens < cost) throw new HttpsError('failed-precondition', 'Insufficient GX.');
      if (typeof mateId !== 'string' || mateId.length > 64)
        throw new HttpsError('invalid-argument', 'Invalid mate selection.');

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
      // SECURITY PATCH: Validate inputs; prevent client from passing cost: 0 or negative.
      if (!Number.isInteger(cost) || cost <= 0 || cost > 999999)
        throw new HttpsError('invalid-argument', 'Invalid summon cost.');
      if (typeof summonUntil !== 'number' || summonUntil <= Date.now() || summonUntil > Date.now() + 86400000)
        throw new HttpsError('invalid-argument', 'Invalid summon duration.');
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
      // SECURITY PATCH: Ensure qty is a positive integer. Negative qty = infinite GX exploit.
      if (!Number.isInteger(qty) || qty <= 0 || qty > 9999)
        throw new HttpsError('invalid-argument', 'Invalid purchase quantity.');
      const marketRef = db.collection('marketplace').doc(listingId);
      const marketSnap = await transaction.get(marketRef);
      if (!marketSnap.exists) throw new HttpsError('not-found', 'Item sold.');

      const listing = marketSnap.data() as any;
      if (listing.quantity < qty) throw new HttpsError('failed-precondition', 'Insufficient quantity.');

      const totalCost = listing.price * qty;
      if (totalCost < 0) throw new HttpsError('invalid-argument', 'Corrupt listing data.');
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

    if (action === 'UPGRADE_INVENTORY_SLOTS') {
      const { method, txHash } = payload;
      const currentMax = userData.maxInventorySlots || 50;

      if (currentMax >= 120) {
        throw new HttpsError('failed-precondition', 'Maximum storage capacity of 120 slots has already been reached.');
      }

      const updates: any = {};
      const inventory = userData.inventory || {};

      // --- 1. THE F2P GRIND PATH (GX Gold) ---
      if (method === 'GX') {
        let cost = 5000;
        if (currentMax >= 100) cost = 30000;
        else if (currentMax >= 70) cost = 15000;

        if ((userData.tokens || 0) < cost) {
          throw new HttpsError('failed-precondition', 'Insufficient GX Gold. Keep grinding!');
        }
        updates.tokens = userData.tokens - cost;
      }

      // --- 2. THE WEB3 FAST-TRACK (On-Chain Tokens) ---
      else if (method === 'DWGX' || method === 'HUNT') {
        if (!txHash) {
          throw new HttpsError('invalid-argument', 'Missing blockchain transaction hash.');
        }

        const txRef = db.collection('usedTransactions').doc(txHash);
        const txSnap = await transaction.get(txRef);
        if (txSnap.exists) {
          throw new HttpsError('already-exists', 'This transaction has already been claimed.');
        }

        const isDevEnv = process.env.FUNCTIONS_EMULATOR === 'true';

        if (!isDevEnv) {
          const { ethers } = require("ethers");
          const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
          const txReceipt = await provider.getTransactionReceipt(txHash);

          if (!txReceipt || txReceipt.status !== 1) {
            throw new HttpsError('failed-precondition', 'Transaction failed or is not yet mined on Base.');
          }

          const txData = await provider.getTransaction(txHash);
          const playerAddress = userData.walletAddress?.toLowerCase();

          if (txData.from.toLowerCase() !== playerAddress) {
            throw new HttpsError('permission-denied', 'Transaction was not initiated by your connected wallet.');
          }

          const faucetAddress = "0x8dca8d7B35004630F460B85F70d1189795CDe6Fc".toLowerCase();
          
          // Verify contract matches the method token
          const expectedContract = method === 'DWGX' 
            ? "0x3038aFBd4Bde3898C3972A8E0F45de7CB7300A3A".toLowerCase() 
            : "0x37f0c2915CeCC7e977183B8543Fc0864d03E064C".toLowerCase();
          
          if (txData.to?.toLowerCase() !== expectedContract) {
            throw new HttpsError('failed-precondition', `Invalid target contract address. Expected token contract: ${expectedContract}`);
          }

          // Parse ERC20 Transfer Input Data
          try {
            const erc20Interface = new ethers.Interface([
              "function transfer(address to, uint256 amount) public returns (bool)"
            ]);
            const parsedTx = erc20Interface.parseTransaction({ data: txData.data });
            if (!parsedTx) throw new Error("Invalid transaction input data.");
            
            const toAddress = parsedTx.args[0].toLowerCase();
            const rawAmount = parsedTx.args[1];

            // Verify receiver is the Faucet
            if (toAddress !== faucetAddress) {
              throw new HttpsError('failed-precondition', `Incorrect payment recipient. Expected faucet address: ${faucetAddress}`);
            }

            // Verify minimum required amount is transferred
            // DWGX required = 25.0, HUNT required = 10.0
            const requiredDecimals = 18; // Both use 18 decimals
            const requiredAmount = method === 'DWGX' 
              ? ethers.parseUnits("25.0", requiredDecimals) 
              : ethers.parseUnits("10.0", requiredDecimals);

            if (rawAmount < requiredAmount) {
              const formattedSent = ethers.formatUnits(rawAmount, requiredDecimals);
              const formattedReq = ethers.formatUnits(requiredAmount, requiredDecimals);
              throw new HttpsError('failed-precondition', `Insufficient payment. Sent ${formattedSent} ${method}, but requires at least ${formattedReq} ${method}.`);
            }
          } catch (err: any) {
            throw new HttpsError('failed-precondition', err.message || 'Failed to decode ERC20 transfer payload.');
          }
        }

        // T3 check (requires burning 2 Hunt Sparks if paying with HUNT)
        if (method === 'HUNT' && currentMax >= 100) {
          const sparkKeys = Object.keys(inventory).filter(k => {
            const item = inventory[k];
            return item && typeof item.id === 'string' && item.id.startsWith('hunt_spark');
          });
          if (sparkKeys.length < 2) {
            throw new HttpsError('failed-precondition', 'Requires at least 2 Hunt Sparks in your bag.');
          }
          delete inventory[sparkKeys[0]];
          delete inventory[sparkKeys[1]];
          updates.inventory = inventory;
        }

        // Mark the transaction hash as claimed
        transaction.set(txRef, { claimedBy: uid, timestamp: admin.firestore.FieldValue.serverTimestamp() });
      } else {
        throw new HttpsError('invalid-argument', 'Invalid upgrade currency method.');
      }

      updates.maxInventorySlots = currentMax + 10;
      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      transaction.update(userRef, updates);
      return { success: true, newMax: currentMax + 10 };
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
        if (!item || typeof item.id !== 'string') return false;
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
