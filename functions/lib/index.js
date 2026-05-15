"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureGameAction = exports.claimFaucetReward = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const params_1 = require("firebase-functions/params");
// Move ethers import inside handler to prevent deployment timeouts
// import { ethers } from "ethers";
// Lazily initialize to prevent timeout during deployment parsing
const getDb = () => {
    try {
        admin.initializeApp();
    }
    catch (e) {
        // Ignore already initialized error
    }
    return admin.firestore();
};
// 1. Define the Secret Key exactly as it will exist in Secret Manager
const faucetPrivateKeySecret = (0, params_1.defineSecret)("FAUCET_PRIVATE_KEY");
exports.claimFaucetReward = (0, https_1.onCall)({ secrets: [faucetPrivateKeySecret], enforceAppCheck: true }, async (request) => {
    // 2. Authenticate user (Ensure only logged in players can trigger this)
    if (!request.auth || !request.auth.uid) {
        throw new https_1.HttpsError('unauthenticated', 'You must be logged in to claim.');
    }
    const { targetWalletAddress } = request.data;
    const { ethers } = require("ethers");
    if (!targetWalletAddress || !ethers.isAddress(targetWalletAddress)) {
        throw new https_1.HttpsError('invalid-argument', 'Missing or invalid target wallet address');
    }
    const uid = request.auth.uid;
    const db = getDb();
    // 3. Read User's Town Influence Level directly from database
    const userRef = db.collection('players').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Player data not found.');
    }
    const userData = userSnap.data();
    // Default to level 1 for testing if not set
    const townInfluenceLevel = userData?.crystleTownLevel || 1;
    // 4. Faucet Drop Chance Logic (Redesigned for Grinding)
    let dropChance = 0;
    if (townInfluenceLevel >= 1 && townInfluenceLevel <= 10)
        dropChance = 10;
    else if (townInfluenceLevel >= 11 && townInfluenceLevel <= 20)
        dropChance = 12;
    else if (townInfluenceLevel >= 21 && townInfluenceLevel <= 30)
        dropChance = 15;
    else if (townInfluenceLevel >= 31 && townInfluenceLevel <= 40)
        dropChance = 20;
    else if (townInfluenceLevel >= 41 && townInfluenceLevel <= 50)
        dropChance = 25;
    if (dropChance === 0) {
        return { success: false, message: "Level too low to attract the Faucet." };
    }
    // 5. Daily Capping Logic (Reset every UTC day)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastDate = userData?.lastFaucetDate || "";
    let dailyWins = lastDate === today ? (userData?.dailyFaucetWins || 0) : 0;
    if (dailyWins >= 30) {
        return { success: false, message: "The Faucet well is recharging! Daily limit reached (30/30)." };
    }
    // 6. The Roll
    const roll = Math.floor(Math.random() * 100) + 1;
    console.log(`User ${uid} Faucet Roll: ${roll} / ${dropChance}% chance | Daily: ${dailyWins}/30`);
    if (roll > dropChance) {
        return { success: false, message: "No luck this time! The Faucet remains elusive." };
    }
    // 7. Access Private Key securely from Google Cloud Secret Manager
    let privateKey;
    try {
        privateKey = faucetPrivateKeySecret.value();
    }
    catch (e) {
        console.error("Secret Manager Error: FAUCET_PRIVATE_KEY could not be read.");
        throw new https_1.HttpsError('internal', "Faucet configuration error.");
    }
    if (!privateKey) {
        throw new https_1.HttpsError("internal", "Offline");
    }
    if (!privateKey.startsWith("0x")) {
        privateKey = "0x" + privateKey;
    }
    // 8. Process Transaction with ethers.js
    try {
        // Connect to Base Network via public JSON-RPC provider
        const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
        const wallet = new ethers.Wallet(privateKey, provider);
        const rewardAmount = "0.0000035"; // ~ $0.01 USD in ETH
        const rewardValue = ethers.parseEther(rewardAmount);
        // 8a. Pre-flight Balance Check
        const balance = await provider.getBalance(wallet.address);
        if (balance < (rewardValue + ethers.parseEther("0.00001"))) {
            console.warn(`🚨 FAUCET DRY: Wallet ${wallet.address} only has ${balance.toString()} wei remaining.`);
            throw new https_1.HttpsError('resource-exhausted', "The town's treasury is currently depleted! Citizens are working to restock the faucet.");
        }
        // Send the transaction
        const tx = await wallet.sendTransaction({
            to: targetWalletAddress,
            value: rewardValue
        });
        // 9. Update User's Firestore stats on success
        await userRef.update({
            lastFaucetClaim: admin.firestore.FieldValue.serverTimestamp(),
            lastFaucetDate: today,
            dailyFaucetWins: admin.firestore.FieldValue.increment(1),
            lifetimeFaucetWins: admin.firestore.FieldValue.increment(1)
        });
        return {
            success: true,
            message: "ETH Discovery Successful!",
            txHash: tx.hash,
            dailyCount: dailyWins + 1
        };
    }
    catch (error) {
        console.error("Faucet Interaction Failed:", error);
        // Pass through our custom 'resource-exhausted' error
        if (error instanceof https_1.HttpsError)
            throw error;
        // Handle specific InsufficientFunds error if the pre-flight missed it
        if (error.message?.includes('insufficient funds')) {
            throw new https_1.HttpsError('resource-exhausted', "The faucet well has run dry. Please notify the administrators.");
        }
        throw new https_1.HttpsError('internal', "Faucet network error. Try again later.");
    }
});
// --- SECURE GAME ENGINE V1 ---
// This handles sensitive operations that are now blocked by Firestore Security Rules.
exports.secureGameAction = (0, https_1.onCall)({ enforceAppCheck: true }, // ENFORCEMENT: Rejects requests without valid App Check token
async (request) => {
    if (!request.auth || !request.auth.uid) {
        throw new https_1.HttpsError('unauthenticated', 'Security Clearance Denied.');
    }
    const { action, payload } = request.data;
    const uid = request.auth.uid;
    const db = getDb();
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
            const totalCost = item.cost * qty;
            const currentTokens = userData.tokens || 0;
            if (currentTokens < totalCost)
                throw new https_1.HttpsError('failed-precondition', 'Insufficient GX.');
            if (userData.level < (item.reqLvl || 1))
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
        if (action === 'PROCESS_KILL_REWARDS') {
            const { earnedLoot, earnedXp, nextXp, nextLvl, nextMaxHp, apGained, loots } = payload;
            // Basic Sanity Check: Prevent massive reward injections
            if (earnedLoot > 50000 || earnedXp > 100000) {
                throw new https_1.HttpsError('out-of-range', 'Payload Integrity Compromised.');
            }
            const updates = {
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
                loots.forEach((loot) => {
                    if (loot.id?.includes('_pool_'))
                        return; // handled by counters
                    inventory[loot.id] = loot;
                });
                updates.inventory = inventory;
                // Handle pooled items
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
            const { itemId, value } = payload;
            const inventory = userData.inventory || {};
            if (!inventory[itemId])
                throw new https_1.HttpsError('not-found', 'Item not in inventory.');
            delete inventory[itemId];
            transaction.update(userRef, {
                tokens: (userData.tokens || 0) + value,
                inventory: inventory,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, message: 'Item sold.' };
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
            if (currentTokens < cost)
                throw new https_1.HttpsError('failed-precondition', 'Insufficient GX.');
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
            const marketRef = db.collection('marketplace').doc(listingId);
            const marketSnap = await transaction.get(marketRef);
            if (!marketSnap.exists)
                throw new https_1.HttpsError('not-found', 'Item sold.');
            const listing = marketSnap.data();
            if (listing.quantity < qty)
                throw new https_1.HttpsError('failed-precondition', 'Insufficient quantity.');
            const totalCost = listing.price * qty;
            if ((userData.tokens || 0) < totalCost)
                throw new https_1.HttpsError('failed-precondition', 'Insufficient GX.');
            // Update Seller Payout
            const payoutRef = db.collection('payouts').doc();
            transaction.set(payoutRef, {
                recipientUid: listing.sellerUid,
                amount: Math.floor(totalCost * 0.95),
                itemName: `${qty}x ${listing.item.name}`,
                buyerName: userData.name,
                createdAt: Date.now()
            });
            // Update Listing
            if (listing.quantity === qty)
                transaction.delete(marketRef);
            else
                transaction.update(marketRef, { quantity: listing.quantity - qty });
            // Update Buyer
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
            // Find item in inventory
            const possibleScrollIds = ['auto_scroll_12m', 'auto_scroll_9m', 'auto_scroll_6m', 'auto_scroll_3m', 'auto_scroll'];
            const targetKey = Object.keys(inventory).find(key => {
                const item = inventory[key];
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
});
//# sourceMappingURL=index.js.map