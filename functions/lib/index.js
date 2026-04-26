"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimFaucetReward = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const params_1 = require("firebase-functions/params");
const ethers_1 = require("ethers");
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
    if (!targetWalletAddress || !ethers_1.ethers.isAddress(targetWalletAddress)) {
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
    // 4. Faucet Drop Chance Logic
    let dropChance = 0;
    if (townInfluenceLevel >= 1 && townInfluenceLevel <= 10)
        dropChance = 80; // TEST_MODE: 80% (Production: 4%)
    else if (townInfluenceLevel >= 11 && townInfluenceLevel <= 20)
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
        const provider = new ethers_1.ethers.JsonRpcProvider("https://mainnet.base.org");
        const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
        const rewardAmount = "0.0000035"; // ~ $0.01 USD in ETH
        const rewardValue = ethers_1.ethers.parseEther(rewardAmount);
        // 8a. Pre-flight Balance Check (Prevent 'Dry Faucet' Generic Errors)
        const balance = await provider.getBalance(wallet.address);
        if (balance < (rewardValue + ethers_1.ethers.parseEther("0.00001"))) { // Buffer for gas
            console.warn(`🚨 FAUCET DRY: Wallet ${wallet.address} only has ${balance.toString()} wei remaining.`);
            throw new https_1.HttpsError('resource-exhausted', "The town's treasury is currently depleted! Citizens are working to restock the faucet. Try again later.");
        }
        // Send the transaction
        const tx = await wallet.sendTransaction({
            to: targetWalletAddress,
            value: rewardValue
        });
        // 9. Update User's Firestore stats on success
        await userRef.update({
            lastFaucetClaim: admin.firestore.FieldValue.serverTimestamp(),
            lifetimeFaucetWins: admin.firestore.FieldValue.increment(1)
        });
        return {
            success: true,
            message: "You discovered ETH in Crystle Town!",
            txHash: tx.hash
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