"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureGameAction = exports.claimFaucetReward = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const params_1 = require("firebase-functions/params");
// Initialize admin SDK at top level (standard practice)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const getDb = () => admin.firestore();
// 1. Define the Secret Key exactly as it will exist in Secret Manager
const faucetPrivateKeySecret = (0, params_1.defineSecret)("FAUCET_PRIVATE_KEY");
// Token Contract Addresses
const TOKENS = {
    DWGX: "0x3038aFBd4Bde3898C3972A8E0F45de7CB7300A3A",
    HUNT: "0x37f0c2915CeCC7e977183B8543Fc0864d03E064C"
};
const ERC20_ABI = [
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function balanceOf(address owner) public view returns (uint256)",
    "function decimals() public view returns (uint8)"
];
let cachedProvider = null;
let cachedWallet = null;
const getEthersConnection = (privateKey) => {
    const { ethers } = require("ethers");
    if (!cachedProvider) {
        cachedProvider = new ethers.JsonRpcProvider("https://mainnet.base.org");
    }
    if (!cachedWallet) {
        cachedWallet = new ethers.Wallet(privateKey, cachedProvider);
    }
    return { provider: cachedProvider, wallet: cachedWallet, ethers };
};
exports.claimFaucetReward = (0, https_1.onCall)({ secrets: [faucetPrivateKeySecret], enforceAppCheck: true }, async (request) => {
    // 2. Authenticate user
    if (!request.auth || !request.auth.uid) {
        throw new https_1.HttpsError('unauthenticated', 'You must be logged in to claim.');
    }
    const { targetWalletAddress, rewardType, sparksType } = request.data;
    if (!targetWalletAddress) {
        throw new https_1.HttpsError('invalid-argument', 'Missing target wallet address');
    }
    const uid = request.auth.uid;
    const db = getDb();
    const userRef = db.collection('players').doc(uid);
    const isSparkExchange = sparksType === 'HUNT';
    const today = new Date().toISOString().split('T')[0];
    let targetSparksKeys = [];
    let userData = null;
    // Phase 1: Transactional Reservation & Verification
    // We deduct the sparks and increment the daily count in Firestore *before* the slow blockchain transfer.
    // This atomically blocks concurrent race condition attacks!
    try {
        await db.runTransaction(async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists) {
                throw new https_1.HttpsError('not-found', 'Player data not found.');
            }
            userData = userSnap.data() || {};
            const profileWallet = userData.walletAddress;
            // SECURITY CHECK: Enforce target address matches registered user profile wallet
            if (!profileWallet || profileWallet.toLowerCase() !== targetWalletAddress.toLowerCase()) {
                throw new https_1.HttpsError('failed-precondition', 'Target wallet address must match your linked profile wallet.');
            }
            // DAILY LIMIT CHECK
            const lastDate = userData.lastFaucetDate || "";
            const dailyWins = lastDate === today ? (userData.dailyFaucetWins || 0) : 0;
            if (dailyWins >= 30) {
                throw new https_1.HttpsError('failed-precondition', 'Daily claim limit reached (30/30).');
            }
            // SERVER-SIDE SPARK VERIFICATION
            if (isSparkExchange) {
                const inventory = userData.inventory || {};
                const sparks = Object.entries(inventory)
                    .filter(([_, item]) => item && item.id && item.id.startsWith('hunt_spark'));
                if (sparks.length < 4) {
                    throw new https_1.HttpsError('failed-precondition', `Insufficient Hunt Sparks. Required: 4, Owned: ${sparks.length}`);
                }
                // Securely record the unique keys of the sparks we are consuming
                targetSparksKeys = sparks.slice(0, 4).map(([uniqueId]) => uniqueId);
                // Delete spark keys from the inventory copy
                targetSparksKeys.forEach((key) => {
                    delete inventory[key];
                });
                transaction.update(userRef, {
                    inventory: inventory,
                    lastFaucetDate: today,
                    dailyFaucetWins: admin.firestore.FieldValue.increment(1)
                });
            }
            else {
                // Regular faucet claim logic probability check
                const townInfluenceLevel = userData.crystleTownLevel || 1;
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
                if (dropChance === 0)
                    throw new https_1.HttpsError('failed-precondition', 'Level too low.');
                const roll = Math.floor(Math.random() * 100) + 1;
                if (roll > dropChance) {
                    throw new https_1.HttpsError('unavailable', 'No luck this time! The Faucet remains elusive.');
                }
                transaction.update(userRef, {
                    lastFaucetDate: today,
                    dailyFaucetWins: admin.firestore.FieldValue.increment(1)
                });
            }
        });
    }
    catch (e) {
        if (e instanceof https_1.HttpsError)
            throw e;
        throw new https_1.HttpsError('internal', e.message || 'Verification and reservation failed.');
    }
    // 7. Access Private Key
    let privateKey;
    try {
        privateKey = faucetPrivateKeySecret.value();
    }
    catch (e) {
        throw new https_1.HttpsError('internal', "Faucet configuration error.");
    }
    if (!privateKey)
        throw new https_1.HttpsError("internal", "Offline");
    if (!privateKey.startsWith("0x"))
        privateKey = "0x" + privateKey;
    // Phase 2: On-Chain Execution
    try {
        const { provider, wallet, ethers } = getEthersConnection(privateKey);
        if (!ethers.isAddress(targetWalletAddress)) {
            throw new https_1.HttpsError('invalid-argument', 'Invalid target wallet address');
        }
        let tx;
        let finalRewardMsg = "";
        if (isSparkExchange && (rewardType === 'HUNT' || rewardType === 'DWGX')) {
            // --- ERC20 TOKEN EXCHANGE PATH ---
            const tokenAddress = TOKENS[rewardType];
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
            // Rates: 0.01 HUNT or 0.1 DWGX
            const amount = rewardType === 'HUNT' ? "0.01" : "0.1";
            const decimals = 18;
            const parsedAmount = ethers.parseUnits(amount, decimals);
            // Balance pre-flight check
            const tokenBalance = await tokenContract.balanceOf(wallet.address);
            if (tokenBalance < parsedAmount) {
                throw new https_1.HttpsError('resource-exhausted', `The treasury's ${rewardType} reserves are dry.`);
            }
            tx = await tokenContract.transfer(targetWalletAddress, parsedAmount);
            finalRewardMsg = `${amount} ${rewardType} Transmitted!`;
        }
        else {
            // --- NATIVE ETH FAUCET PATH ---
            const rewardAmount = "0.0000035"; // ~ $0.01 USD
            const rewardValue = ethers.parseEther(rewardAmount);
            const balance = await provider.getBalance(wallet.address);
            if (balance < (rewardValue + ethers.parseEther("0.00001"))) {
                throw new https_1.HttpsError('resource-exhausted', "The ETH treasury is currently dry.");
            }
            tx = await wallet.sendTransaction({
                to: targetWalletAddress,
                value: rewardValue
            });
            finalRewardMsg = "ETH Subsidy Transmitted!";
        }
        // Final Success Log Update
        await userRef.update({
            lastFaucetClaim: admin.firestore.FieldValue.serverTimestamp(),
            lifetimeFaucetWins: admin.firestore.FieldValue.increment(1)
        });
        const updatedWins = (userData?.dailyFaucetWins || 0) + 1;
        return {
            success: true,
            message: finalRewardMsg,
            txHash: tx.hash,
            dailyCount: updatedWins
        };
    }
    catch (error) {
        console.error("Faucet Transmission Failure, initiating rollback...", error);
        // SAFE ROLLBACK: Add the sparks back and decrement wins so player is not penalized
        try {
            await db.runTransaction(async (transaction) => {
                const userSnap = await transaction.get(userRef);
                if (userSnap.exists) {
                    const freshData = userSnap.data() || {};
                    const inventory = freshData.inventory || {};
                    if (isSparkExchange && targetSparksKeys.length > 0) {
                        targetSparksKeys.forEach((key) => {
                            inventory[key] = {
                                id: key,
                                name: "Hunt Spark",
                                icon: "⚡",
                                description: "A high-energy crystal shard from defeated Elite bosses."
                            };
                        });
                    }
                    transaction.update(userRef, {
                        inventory: inventory,
                        dailyFaucetWins: admin.firestore.FieldValue.increment(-1)
                    });
                }
            });
        }
        catch (rollbackErr) {
            console.error("Rollback failed:", rollbackErr);
        }
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError('internal', `Transmission failed: ${error.message || "Network Error"}`);
    }
});
exports.secureGameAction = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    const { handleSecureGameAction } = require("./gameActions");
    return handleSecureGameAction(request, getDb());
});
//# sourceMappingURL=index.js.map