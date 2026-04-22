import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";

// Lazily initialize to prevent timeout during deployment parsing
const getDb = () => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
};

// 1. Define the Secret Key exactly as it will exist in Secret Manager
const faucetPrivateKeySecret = defineSecret("FAUCET_PRIVATE_KEY");

export const claimFaucetReward = onCall(
  { secrets: [faucetPrivateKeySecret] },
  async (request) => {
    // 2. Authenticate user (Ensure only logged in players can trigger this)
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to claim.');
    }

    const { targetWalletAddress } = request.data;
    if (!targetWalletAddress) {
      throw new HttpsError('invalid-argument', 'Missing target wallet address');
    }

    const uid = request.auth.uid;
    const db = getDb();

    // 3. Read User's Town Influence Level directly from database (Never trust frontend)
    const userRef = db.collection('playerData').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Player data not found.');
    }

    const userData = userSnap.data();
    // Default to level 1 for testing if not set
    const townInfluenceLevel = userData?.crystleTownLevel || 1;

    // 4. Faucet Drop Chance Logic
    let dropChance = 0;
    if (townInfluenceLevel >= 11 && townInfluenceLevel <= 20) dropChance = 5;
    else if (townInfluenceLevel >= 21 && townInfluenceLevel <= 30) dropChance = 10;
    else if (townInfluenceLevel >= 31 && townInfluenceLevel <= 40) dropChance = 15;
    else if (townInfluenceLevel >= 41 && townInfluenceLevel <= 50) dropChance = 20;

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
    const privateKey = faucetPrivateKeySecret.value() as `0x${string}`;
    
    if (!privateKey || !privateKey.startsWith('0x')) {
      console.error("Viem Error: FAUCET_PRIVATE_KEY secret is not set or invalid format.");
      throw new HttpsError('internal', "Faucet is currently offline.");
    }

    // 8. Process Viem Transaction
    try {
      // Dynamically load viem to bypass the 10s deployment parser
      const { createWalletClient, createPublicClient, http, parseEther } = await import('viem');
      const { privateKeyToAccount } = await import('viem/accounts');
      const { base } = await import('viem/chains');

      const account = privateKeyToAccount(privateKey);
      
      const publicClient = createPublicClient({
        chain: base,
        transport: http()
      });

      const walletClient = createWalletClient({
        account,
        chain: base, // Base network
        transport: http() 
      });

      const rewardAmount = "0.0000035"; // ~ $0.01 USD in ETH
      const rewardValue = parseEther(rewardAmount);

      // 8a. Pre-flight Balance Check (Prevent 'Dry Faucet' Generic Errors)
      const balance = await publicClient.getBalance({ address: account.address });
      if (balance < (rewardValue + parseEther("0.00001"))) { // Buffer for gas
         console.warn(`🚨 FAUCET DRY: Wallet ${account.address} only has ${balance.toString()} wei remaining.`);
         throw new HttpsError('resource-exhausted', "The town's treasury is currently depleted! Citizens are working to restock the faucet. Try again later.");
      }

      const hash = await walletClient.sendTransaction({
        to: targetWalletAddress as `0x${string}`,
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
          txHash: hash 
      };

    } catch (error: any) {
      console.error("Faucet Interaction Failed:", error);
      
      // Pass through our custom 'resource-exhausted' error
      if (error instanceof HttpsError) throw error;

      // Handle specific Viem InsufficientFunds error if the pre-flight missed it
      if (error.message?.includes('insufficient funds')) {
        throw new HttpsError('resource-exhausted', "The faucet well has run dry. Please notify the administrators.");
      }

      throw new HttpsError('internal', "Faucet network error. Try again later.");
    }
  }
);
