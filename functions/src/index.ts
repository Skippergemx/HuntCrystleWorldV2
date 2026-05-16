import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { handleSecureGameAction } from "./gameActions";

// Initialize admin SDK at top level (standard practice)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const getDb = () => admin.firestore();

// 1. Define the Secret Key exactly as it will exist in Secret Manager
const faucetPrivateKeySecret = defineSecret("FAUCET_PRIVATE_KEY");

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

export const claimFaucetReward = onCall(
  { secrets: [faucetPrivateKeySecret], enforceAppCheck: true },
  async (request) => {
    // 2. Authenticate user
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to claim.');
    }

    const { targetWalletAddress, rewardType, sparksType } = request.data;
    const { ethers } = require("ethers");
    if (!targetWalletAddress || !ethers.isAddress(targetWalletAddress)) {
      throw new HttpsError('invalid-argument', 'Missing or invalid target wallet address');
    }

    const uid = request.auth.uid;
    const db = getDb();
    const userRef = db.collection('players').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Player data not found.');
    }

    const userData = userSnap.data();
    const townInfluenceLevel = userData?.crystleTownLevel || 1;
    const isSparkExchange = sparksType === 'HUNT';

    // 5. Daily Capping Logic
    const today = new Date().toISOString().split('T')[0];
    const lastDate = userData?.lastFaucetDate || "";
    let dailyWins = lastDate === today ? (userData?.dailyFaucetWins || 0) : 0;

    if (dailyWins >= 30) {
      return { success: false, message: "Daily claim limit reached (30/30). Recharges at 00:00 UTC." };
    }

    // 6. Probability Check (Bypass for Guaranteed Spark Exchange)
    if (!isSparkExchange) {
      let dropChance = 0;
      if (townInfluenceLevel >= 1 && townInfluenceLevel <= 10) dropChance = 10; 
      else if (townInfluenceLevel >= 11 && townInfluenceLevel <= 20) dropChance = 12;
      else if (townInfluenceLevel >= 21 && townInfluenceLevel <= 30) dropChance = 15;
      else if (townInfluenceLevel >= 31 && townInfluenceLevel <= 40) dropChance = 20;
      else if (townInfluenceLevel >= 41 && townInfluenceLevel <= 50) dropChance = 25;

      if (dropChance === 0) return { success: false, message: "Level too low." };

      const roll = Math.floor(Math.random() * 100) + 1;
      if (roll > dropChance) {
        return { success: false, message: "No luck this time! The Faucet remains elusive." };
      }
    }

    // 7. Access Private Key
    let privateKey: string;
    try {
      privateKey = faucetPrivateKeySecret.value();
    } catch (e) {
      throw new HttpsError('internal', "Faucet configuration error.");
    }
    if (!privateKey) throw new HttpsError("internal", "Offline");
    if (!privateKey.startsWith("0x")) privateKey = "0x" + privateKey;

    // 8. Process Transaction
    try {
      const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
      const wallet = new ethers.Wallet(privateKey, provider);

      let tx;
      let finalRewardMsg = "";

      if (isSparkExchange && (rewardType === 'HUNT' || rewardType === 'DWGX')) {
        // --- ERC20 TOKEN EXCHANGE PATH ---
        const tokenAddress = TOKENS[rewardType as keyof typeof TOKENS];
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
        
        // Rates: 0.01 HUNT or 0.1 DWGX
        const amount = rewardType === 'HUNT' ? "0.01" : "0.1";
        const decimals = 18; // Standard for these tokens
        const parsedAmount = ethers.parseUnits(amount, decimals);

        // Pre-flight check
        const tokenBalance = await tokenContract.balanceOf(wallet.address);
        if (tokenBalance < parsedAmount) {
          throw new HttpsError('resource-exhausted', `The treasury's ${rewardType} reserves are dry.`);
        }

        tx = await tokenContract.transfer(targetWalletAddress, parsedAmount);
        finalRewardMsg = `${amount} ${rewardType} Transmitted!`;
      } else {
        // --- NATIVE ETH FAUCET PATH ---
        const rewardAmount = "0.0000035"; // ~ $0.01 USD
        const rewardValue = ethers.parseEther(rewardAmount);

        const balance = await provider.getBalance(wallet.address);
        if (balance < (rewardValue + ethers.parseEther("0.00001"))) { 
          throw new HttpsError('resource-exhausted', "The ETH treasury is currently dry.");
        }

        tx = await wallet.sendTransaction({
          to: targetWalletAddress,
          value: rewardValue
        });
        finalRewardMsg = "ETH Subsidy Transmitted!";
      }

      // 9. Update Firestore
      await userRef.update({
        lastFaucetClaim: admin.firestore.FieldValue.serverTimestamp(),
        lastFaucetDate: today,
        dailyFaucetWins: admin.firestore.FieldValue.increment(1),
        lifetimeFaucetWins: admin.firestore.FieldValue.increment(1)
      });

      return { 
          success: true, 
          message: finalRewardMsg, 
          txHash: tx.hash,
          dailyCount: dailyWins + 1
      };

    } catch (error: any) {
      console.error("Faucet Error:", error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', error.message || "Faucet network error.");
    }
  }
);

export const secureGameAction = onCall(
  { enforceAppCheck: true }, 
  async (request) => {
    return handleSecureGameAction(request, getDb());
  }
);
