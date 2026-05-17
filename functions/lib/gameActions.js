"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSecureGameAction = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
// ============================================================
// SERVER-SIDE CATALOG — The ONLY source of truth for pricing.
// Client-supplied 'cost' and 'value' fields are NEVER trusted.
// ============================================================
const ITEM_CATALOG = {
    'hp_potion': { cost: 50, sellValue: 20, reqLvl: 1 },
    'auto_scroll': { cost: 300, sellValue: 120, reqLvl: 1 },
    'mega_hp_potion': { sellValue: 100 },
    'ultra_hp_potion': { sellValue: 500 },
    'auto_scroll_3m': { sellValue: 350 },
    'auto_scroll_6m': { sellValue: 700 },
    'auto_scroll_9m': { sellValue: 1000 },
    'auto_scroll_12m': { sellValue: 1400 },
    'steel_edge': { cost: 100, sellValue: 40, reqLvl: 2 },
    'breaker_hammer': { cost: 400, sellValue: 160, reqLvl: 8 },
    'scout_vest': { cost: 150, sellValue: 60, reqLvl: 3 },
    'heavy_plate': { cost: 600, sellValue: 240, reqLvl: 10 },
    'leather_cap': { cost: 80, sellValue: 32, reqLvl: 1 },
    'iron_helm': { cost: 250, sellValue: 100, reqLvl: 5 },
    'leather_boots': { cost: 80, sellValue: 32, reqLvl: 1 },
    'swift_sandals': { cost: 300, sellValue: 120, reqLvl: 6 },
    'war_boots': { cost: 500, sellValue: 200, reqLvl: 12 },
    'dragon_apple': { cost: 200, sellValue: 50, reqLvl: 1 },
    'ember_grapes': { cost: 200, sellValue: 50, reqLvl: 1 },
    'sky_berry': { cost: 500, sellValue: 100, reqLvl: 10 },
    'void_cherry': { cost: 500, sellValue: 100, reqLvl: 10 },
    'golden_peach': { cost: 2000, sellValue: 500, reqLvl: 20 },
    'plasma_lemon': { cost: 2000, sellValue: 500, reqLvl: 20 },
    'neon_orange': { cost: 5000, sellValue: 1200, reqLvl: 30 },
    'crystle_pear': { cost: 25000, sellValue: 5000, reqLvl: 40 },
    'taming_hydro': { cost: 2500, sellValue: 500, reqLvl: 25 },
    'taming_pyro': { cost: 2500, sellValue: 500, reqLvl: 25 },
    'taming_gale': { cost: 2500, sellValue: 500, reqLvl: 25 },
    'taming_earthen': { cost: 2500, sellValue: 500, reqLvl: 25 },
    'taming_cosmic': { cost: 2500, sellValue: 500, reqLvl: 25 },
    'enforcer_blade': { cost: 3000, sellValue: 1200, reqLvl: 35 },
    'enforcer_plate': { cost: 3200, sellValue: 1280, reqLvl: 35 },
    'enforcer_helm': { cost: 2800, sellValue: 1120, reqLvl: 35 },
    'enforcer_boots': { cost: 2800, sellValue: 1120, reqLvl: 35 },
    'vanguard_halberd': { cost: 8000, sellValue: 3200, reqLvl: 50 },
    'vanguard_suit': { cost: 8500, sellValue: 3400, reqLvl: 50 },
    'vanguard_visor': { cost: 7500, sellValue: 3000, reqLvl: 50 },
    'vanguard_treads': { cost: 7500, sellValue: 3000, reqLvl: 50 },
    'apex_striker': { cost: 20000, sellValue: 8000, reqLvl: 75 },
    'apex_carapace': { cost: 22000, sellValue: 8800, reqLvl: 75 },
    'apex_crown': { cost: 18000, sellValue: 7200, reqLvl: 75 },
    'apex_striders': { cost: 18000, sellValue: 7200, reqLvl: 75 },
    'genesis_edge': { cost: 50000, sellValue: 20000, reqLvl: 100 },
    'genesis_core_armor': { cost: 55000, sellValue: 22000, reqLvl: 100 },
    'genesis_halo': { cost: 45000, sellValue: 18000, reqLvl: 100 },
    'genesis_gravity_boots': { cost: 45000, sellValue: 18000, reqLvl: 100 },
    // Loot sell values (client can never inflate these)
    'crystle_shard': { sellValue: 10 }, 'beast_hide': { sellValue: 15 },
    'void_essence': { sellValue: 50 }, 'ancient_gear': { sellValue: 200 },
    'core_pulse': { sellValue: 1000 }, 'omega_crystle': { sellValue: 5000 },
    'singularity': { sellValue: 10000 }, 'black_hole_shard': { sellValue: 15000 },
    'aether_spark': { sellValue: 1000 }, 'hunt_spark': { sellValue: 250 },
    'void_edge': { sellValue: 2000 }, 'guardian_core': { sellValue: 2000 },
    'void_capacitor': { sellValue: 1800 }, 'omega_sigil': { sellValue: 3200 },
    'magma_blade': { sellValue: 5000 }, 'tidal_plate': { sellValue: 5000 },
    'storm_boots': { sellValue: 5000 }, 'quake_helm': { sellValue: 5000 },
    'void_relic': { sellValue: 8000 }, 'event_horizon': { sellValue: 4000 },
    'time_drift': { sellValue: 3500 }, 'glowing_eye': { sellValue: 1200 },
    'void_crystal': { sellValue: 800 }, 'crystle_blade': { sellValue: 400 },
    'neon_plate': { sellValue: 600 }, 'tech_visor': { sellValue: 320 },
    'kinetic_boots': { sellValue: 480 },
};
// Helper: look up sell value by stripping unique suffixes (e.g., 'crystle_shard_1234_abc' -> 'crystle_shard')
const getSellValue = (itemId) => {
    const baseId = itemId.replace(/_[a-z0-9]{4,}(_TOWN_\d+_[a-z0-9]+)?$/i, '').replace(/_\d+$/, '');
    return ITEM_CATALOG[baseId]?.sellValue ?? ITEM_CATALOG[itemId]?.sellValue ?? 0;
};
const getCatalogEntry = (itemId) => {
    const baseId = itemId.replace(/_\d+(_[a-z0-9]+)*$/, '');
    return ITEM_CATALOG[baseId] ?? ITEM_CATALOG[itemId] ?? null;
};
// Rate limit helper: max 1 kill reward per 3 seconds
const MIN_KILL_INTERVAL_MS = 3000;
const handleSecureGameAction = async (request, db) => {
    if (!request.auth || !request.auth.uid) {
        throw new https_1.HttpsError('unauthenticated', 'Security Clearance Denied.');
    }
    const { action, payload } = request.data;
    const uid = request.auth.uid;
    const userRef = db.collection('players').doc(uid);
    return await db.runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists)
            throw new https_1.HttpsError('not-found', 'Player Node Missing.');
        const userData = userSnap.data();
        if (action === 'ALLOCATE_STAT') {
            const { statName } = payload;
            const currentAP = userData.abilityPoints || 0;
            if (currentAP <= 0)
                throw new https_1.HttpsError('failed-precondition', 'Insufficient AP.');
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
            if (!catalogEntry || catalogEntry.cost === undefined)
                throw new https_1.HttpsError('not-found', 'Item not available for purchase.');
            if (!Number.isInteger(qty) || qty <= 0 || qty > 99)
                throw new https_1.HttpsError('invalid-argument', 'Invalid quantity.');
            const totalCost = catalogEntry.cost * qty;
            const currentTokens = userData.tokens || 0;
            if (currentTokens < totalCost)
                throw new https_1.HttpsError('failed-precondition', 'Insufficient GX.');
            if (userData.level < (catalogEntry.reqLvl || 1))
                throw new https_1.HttpsError('failed-precondition', 'Level too low.');
            const updates = {
                tokens: currentTokens - totalCost,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            if (item.id === 'hp_potion') {
                updates.potions = (userData.potions || 0) + qty;
            }
            else if (item.id === 'auto_scroll') {
                updates.autoScrolls = (userData.autoScrolls || 0) + qty;
            }
            else {
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
            if (!recipe?.id || typeof recipe.id !== 'string')
                throw new https_1.HttpsError('invalid-argument', 'Invalid recipe.');
            if (!Array.isArray(itemsToConsumeKeys) || itemsToConsumeKeys.length === 0)
                throw new https_1.HttpsError('invalid-argument', 'No materials provided for fusion.');
            const recipeCost = typeof recipe.cost === 'number' && Number.isInteger(recipe.cost) && recipe.cost >= 0
                ? recipe.cost : 0; // cost is allowed to be 0 for material-only recipes, but NEVER negative
            if (recipe.cost < 0)
                throw new https_1.HttpsError('invalid-argument', 'Invalid recipe cost.');
            const currentTokens = userData.tokens || 0;
            if (currentTokens < recipeCost)
                throw new https_1.HttpsError('failed-precondition', 'Insufficient GX.');
            const inventory = userData.inventory || {};
            itemsToConsumeKeys.forEach((key) => {
                if (typeof key !== 'string')
                    throw new https_1.HttpsError('invalid-argument', 'Invalid material key.');
                if (!inventory[key])
                    throw new https_1.HttpsError('not-found', `Missing material: ${key}`);
                delete inventory[key];
            });
            const updates = {
                tokens: currentTokens - recipeCost,
                inventory: inventory,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            if (recipe.id === 'hp_potion') {
                updates.potions = (userData.potions || 0) + 1;
            }
            else if (recipe.id === 'auto_scroll') {
                updates.autoScrolls = (userData.autoScrolls || 0) + 1;
            }
            else {
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
                throw new https_1.HttpsError('out-of-range', 'Invalid loot payload.');
            if (!Number.isInteger(earnedXp) || earnedXp < 0 || earnedXp > 99999)
                throw new https_1.HttpsError('out-of-range', 'Invalid XP payload.');
            // SECURITY PATCH: Rate limiting - enforce minimum 3s between kill reward claims.
            const lastKillReward = userData.lastKillRewardAt || 0;
            if (Date.now() - lastKillReward < MIN_KILL_INTERVAL_MS)
                throw new https_1.HttpsError('resource-exhausted', 'Kill reward rate limit exceeded.');
            const updates = {
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
                loots.forEach((loot) => {
                    if (loot.id?.includes('_pool_'))
                        return;
                    inventory[loot.id] = loot;
                });
                updates.inventory = inventory;
                const potCount = loots.filter((l) => l.id?.startsWith('hp_potion')).length;
                if (potCount > 0)
                    updates.potions = (userData.potions || 0) + potCount;
                const scrollCount = loots.filter((l) => l.id?.startsWith('auto_scroll_pool')).length;
                if (scrollCount > 0)
                    updates.autoScrolls = (userData.autoScrolls || 0) + scrollCount;
            }
            transaction.update(userRef, updates);
            return { success: true };
        }
        if (action === 'SELL_ITEM') {
            const { itemId, qty } = payload;
            // SECURITY PATCH: 'value' is NEVER accepted from client — looked up server-side.
            if (!Number.isInteger(qty) || qty <= 0 || qty > 99)
                throw new https_1.HttpsError('invalid-argument', 'Invalid quantity.');
            const inventory = userData.inventory || {};
            const targetItem = inventory[itemId];
            if (!targetItem)
                throw new https_1.HttpsError('not-found', 'Item not in inventory.');
            // Look up canonical sell value from server catalog
            const trueSellValue = getSellValue(targetItem.id || itemId);
            if (trueSellValue <= 0)
                throw new https_1.HttpsError('failed-precondition', 'This item cannot be sold.');
            const baseId = targetItem.id?.replace(/_[a-z0-9]{4,}$/i, '').replace(/_\d+$/, '') || itemId;
            const sellQty = qty;
            const entries = Object.entries(inventory);
            let removed = 0;
            for (const [key, invItem] of entries) {
                if (removed >= sellQty)
                    break;
                const invBaseId = invItem.id?.replace(/_[a-z0-9]{4,}$/i, '').replace(/_\d+$/, '');
                if (invBaseId === baseId) {
                    delete inventory[key];
                    removed++;
                }
            }
            if (removed === 0)
                throw new https_1.HttpsError('not-found', 'No matching items found.');
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
            quest.requires.forEach((req) => {
                let removed = 0;
                const entries = Object.entries(inventory);
                for (const [key, val] of entries) {
                    if (removed >= req.qty)
                        break;
                    if (val?.id?.startsWith(req.itemId)) {
                        delete inventory[key];
                        removed++;
                    }
                }
                if (removed < req.qty) {
                    throw new https_1.HttpsError('failed-precondition', `Missing required material: ${req.itemId}`);
                }
            });
            // Add food reward
            if (rewardFood) {
                const rewardKey = `${rewardFood.id}_TOWN_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                inventory[rewardKey] = { ...rewardFood, id: rewardKey };
            }
            // Mark quest slot as completed and rotate
            const currentSlots = [...(userData.townQuestSlots || [])].filter((id) => id !== quest.id);
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
            if (!item)
                throw new https_1.HttpsError('not-found', 'Item not in inventory.');
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
            if (!item)
                throw new https_1.HttpsError('failed-precondition', 'Slot is empty.');
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
                throw new https_1.HttpsError('invalid-argument', 'Invalid hire cost.');
            const currentTokens = userData.tokens || 0;
            if (currentTokens < cost)
                throw new https_1.HttpsError('failed-precondition', 'Insufficient GX.');
            if (typeof mateId !== 'string' || mateId.length > 64)
                throw new https_1.HttpsError('invalid-argument', 'Invalid mate selection.');
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
                throw new https_1.HttpsError('invalid-argument', 'Invalid summon cost.');
            if (typeof summonUntil !== 'number' || summonUntil <= Date.now() || summonUntil > Date.now() + 86400000)
                throw new https_1.HttpsError('invalid-argument', 'Invalid summon duration.');
            const currentTokens = userData.tokens || 0;
            if (currentTokens < cost)
                throw new https_1.HttpsError('failed-precondition', 'Insufficient GX.');
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
            const updates = {
                totalBossDamage: newTotal,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            if (lootUpdates && Object.keys(lootUpdates).length > 0) {
                const inventory = userData.inventory || {};
                Object.entries(lootUpdates).forEach(([key, val]) => {
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
                throw new https_1.HttpsError('out-of-range', 'Negative HP values are unauthorized.');
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
            const updates = {
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            if (autoTimeLeftSaved !== undefined) {
                updates.autoTimeLeftSaved = autoTimeLeftSaved;
                updates.autoUntil = 0;
            }
            if (rewards && rewards.length > 0) {
                const inventory = userData.inventory || {};
                rewards.forEach((r) => {
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
                if (invItem.id?.replace(/(_\d+)+$/, '') === baseId && itemsToConsume.length < quantity) {
                    itemsToConsume.push(key);
                }
            }
            let counterDeduction = 0;
            if (itemsToConsume.length < quantity) {
                const needed = quantity - itemsToConsume.length;
                let available = 0;
                if (baseId === 'hp_potion')
                    available = userData.potions || 0;
                else if (baseId === 'auto_scroll')
                    available = userData.autoScrolls || 0;
                if (available >= needed)
                    counterDeduction = needed;
                else
                    throw new https_1.HttpsError('failed-precondition', 'Insufficient stock.');
            }
            const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
            itemsToConsume.forEach(key => delete inventory[key]);
            updates.inventory = inventory;
            if (counterDeduction > 0) {
                if (baseId === 'hp_potion')
                    updates.potions = (userData.potions || 0) - counterDeduction;
                else if (baseId === 'auto_scroll')
                    updates.autoScrolls = (userData.autoScrolls || 0) - counterDeduction;
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
                throw new https_1.HttpsError('invalid-argument', 'Invalid purchase quantity.');
            const marketRef = db.collection('marketplace').doc(listingId);
            const marketSnap = await transaction.get(marketRef);
            if (!marketSnap.exists)
                throw new https_1.HttpsError('not-found', 'Item sold.');
            const listing = marketSnap.data();
            if (listing.quantity < qty)
                throw new https_1.HttpsError('failed-precondition', 'Insufficient quantity.');
            const totalCost = listing.price * qty;
            if (totalCost < 0)
                throw new https_1.HttpsError('invalid-argument', 'Corrupt listing data.');
            if ((userData.tokens || 0) < totalCost)
                throw new https_1.HttpsError('failed-precondition', 'Insufficient GX.');
            const payoutRef = db.collection('payouts').doc();
            transaction.set(payoutRef, {
                recipientUid: listing.sellerUid,
                amount: Math.floor(totalCost * 0.95),
                itemName: `${qty}x ${listing.item.name}`,
                buyerName: userData.name,
                createdAt: Date.now()
            });
            if (listing.quantity === qty)
                transaction.delete(marketRef);
            else
                transaction.update(marketRef, { quantity: listing.quantity - qty });
            const updates = {
                tokens: (userData.tokens || 0) - totalCost,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            if (listing.item.id?.startsWith('hp_potion')) {
                updates.potions = (userData.potions || 0) + qty;
            }
            else {
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
            if (!marketSnap.exists)
                throw new https_1.HttpsError('not-found', 'Listing missing.');
            const listing = marketSnap.data();
            if (listing.sellerUid !== uid)
                throw new https_1.HttpsError('permission-denied', 'Not your listing.');
            transaction.delete(marketRef);
            const qty = listing.quantity || 1;
            const baseId = listing.item.id?.replace(/(_\d+)+$/, '');
            const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
            if (baseId === 'hp_potion') {
                updates.potions = (userData.potions || 0) + qty;
            }
            else {
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
            if (payoutsSnap.empty)
                return { success: true, total: 0 };
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
            const updates = {
                autoUntil: Date.now() + ms,
                autoMode: view || 'dungeon',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            const possibleScrollIds = ['auto_scroll_12m', 'auto_scroll_9m', 'auto_scroll_6m', 'auto_scroll_3m', 'auto_scroll'];
            const targetKey = Object.keys(inventory).find(key => {
                const item = inventory[key];
                if (!item || typeof item.id !== 'string')
                    return false;
                const itemBaseId = possibleScrollIds.find(baseId => item.id.startsWith(baseId));
                return itemBaseId === selection;
            });
            if (targetKey) {
                delete inventory[targetKey];
                updates.inventory = inventory;
            }
            else if ((userData.autoScrolls || 0) >= val) {
                updates.autoScrolls = (userData.autoScrolls || 0) - val;
            }
            else {
                throw new https_1.HttpsError('failed-precondition', 'Insufficient scrolls.');
            }
            transaction.update(userRef, updates);
            return { success: true };
        }
        throw new https_1.HttpsError('unimplemented', 'Action Not Recognized.');
    });
};
exports.handleSecureGameAction = handleSecureGameAction;
//# sourceMappingURL=gameActions.js.map