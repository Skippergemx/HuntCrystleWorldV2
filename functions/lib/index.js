"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimFaucetReward = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const params_1 = require("firebase-functions/params");
// Lazily initialize to prevent timeout during deployment parsing
const getDb = () => {
    if (!admin.apps.length) {
        admin.initializeApp();
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
    if (!targetWalletAddress) {
        throw new https_1.HttpsError('invalid-argument', 'Missing target wallet address');
    }
    const uid = request.auth.uid;
    const db = getDb();
    // 3. Read User's Town Influence Level directly from database (Never trust frontend)
    const userRef = db.collection('playerData').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Player data not found.');
    }
    const userData = userSnap.data();
    // Default to level 1 for testing if not set
    const townInfluenceLevel = userData?.crystleTownLevel || 1;
    // 4. Faucet Drop Chance Logic
    let dropChance = 0;
    if (townInfluenceLevel >= 11 && townInfluenceLevel <= 20)
        dropChance = 5;
    else if (townInfluenceLevel >= 21 && townInfluenceLevel <= 30)
        dropChance = 10;
    else if (townInfluenceLevel >= 31 && townInfluenceLevel <= 40)
        dropChance = 15;
    else if (townInfluenceLevel >= 41 && townInfluenceLevel <= 50)
        dropChance = 20;
    if (dropChance === 0) {
        return { success: false, message: "Level too low to attract the Faucet." };
    }
    // 5. Rate Limiting (Check if recently claimed to prevent spam)
    // For example, restrict to 1 claim every 24 hours
    const now = admin.firestore.Timestamp.now();
    const lastClaim = userData?.lastFaucetClaim;
    if (lastClaim && now.seconds - lastClaim.seconds < 86400) {
        return { success: false, message: "You can only claim Faucet once every 24 hours." };
    }
    // 6. The Roll
    const roll = Math.floor(Math.random() * 100) + 1;
    console.log(`User ${uid} Faucet Roll: ${roll} / ${dropChance}% chance`);
    if (roll > dropChance) {
        return { success: false, message: "No luck this time! Keep questing." };
    }
    // 7. Access Private Key securely from Google Cloud Secret Manager
    const privateKey = faucetPrivateKeySecret.value();
    if (!privateKey || !privateKey.startsWith('0x')) {
        console.error("Viem Error: FAUCET_PRIVATE_KEY secret is not set or invalid format.");
        throw new https_1.HttpsError('internal', "Faucet is currently offline.");
    }
    // 8. Process Viem Transaction
    try {
        // Dynamically load viem to bypass the 10s deployment parser
        const { createWalletClient, http, parseEther } = await Promise.resolve().then(() => require('viem'));
        const { privateKeyToAccount } = await Promise.resolve().then(() => require('viem/accounts'));
        const { base } = await Promise.resolve().then(() => require('viem/chains'));
        const account = privateKeyToAccount(privateKey);
        const walletClient = createWalletClient({
            account,
            chain: base, // Base network
            transport: http()
        });
        const rewardAmount = "0.0000035"; // ~ $0.01 USD in ETH
        const hash = await walletClient.sendTransaction({
            to: targetWalletAddress,
            value: parseEther(rewardAmount)
        });
        // 9. Update User's Firestore stats on success
        await userRef.update({
            lastFaucetClaim: admin.firestore.FieldValue.serverTimestamp(),
            lifetimeFaucetWins: admin.firestore.FieldValue.increment(1)
        });
        return {
            success: true,
            message: "You discovered ETH in Crystle Town!",
            txHash: hash
        };
    }
    catch (error) {
        console.error("Viem TX Failed:", error);
        throw new https_1.HttpsError('internal', "Faucet network error. Try again later.");
    }
});
//# sourceMappingURL=index.js.map