"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimFaucetReward = void 0;
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
exports.claimFaucetReward = (0, https_1.onCall)({ secrets: [faucetPrivateKeySecret] }, async (request) => {
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
//# sourceMappingURL=index.js.map