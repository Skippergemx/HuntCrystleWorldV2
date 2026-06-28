import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";

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

let cachedProvider: any = null;
let cachedWallet: any = null;

const getEthersConnection = (privateKey: string) => {
  const { ethers } = require("ethers");
  if (!cachedProvider) {
    cachedProvider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  }
  if (!cachedWallet) {
    cachedWallet = new ethers.Wallet(privateKey, cachedProvider);
  }
  return { provider: cachedProvider, wallet: cachedWallet, ethers };
};

export const claimFaucetReward = onCall(
  { secrets: [faucetPrivateKeySecret], enforceAppCheck: true },
  async (request) => {
    // 2. Authenticate user
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to claim.');
    }

    const { targetWalletAddress, rewardType, sparksType } = request.data;
    if (!targetWalletAddress) {
      throw new HttpsError('invalid-argument', 'Missing target wallet address');
    }

    const uid = request.auth.uid;
    const db = getDb();
    const userRef = db.collection('players').doc(uid);
    const isSparkExchange = sparksType === 'HUNT';
    const today = new Date().toISOString().split('T')[0];

    let targetSparksKeys: string[] = [];
    let userData: any = null;

    // Phase 1: Transactional Reservation & Verification
    // We deduct the sparks and increment the daily count in Firestore *before* the slow blockchain transfer.
    // This atomically blocks concurrent race condition attacks!
    try {
      await db.runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) {
          throw new HttpsError('not-found', 'Player data not found.');
        }

        userData = userSnap.data() || {};
        const profileWallet = userData.walletAddress;

        // SECURITY CHECK: Enforce target address matches registered user profile wallet
        if (!profileWallet || profileWallet.toLowerCase() !== targetWalletAddress.toLowerCase()) {
          throw new HttpsError('failed-precondition', 'Target wallet address must match your linked profile wallet.');
        }

        // DAILY LIMIT CHECK
        const lastDate = userData.lastFaucetDate || "";
        const dailyWins = lastDate === today ? (userData.dailyFaucetWins || 0) : 0;
        if (dailyWins >= 30) {
          throw new HttpsError('failed-precondition', 'Daily claim limit reached (30/30).');
        }

        // SERVER-SIDE SPARK VERIFICATION
        if (isSparkExchange) {
          const inventory = userData.inventory || {};
          const sparks = Object.entries(inventory)
            .filter(([_, item]: any) => item && item.id && item.id.startsWith('hunt_spark'));

          if (sparks.length < 4) {
            throw new HttpsError('failed-precondition', `Insufficient Hunt Sparks. Required: 4, Owned: ${sparks.length}`);
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
        } else {
          // Regular faucet claim logic probability check
          const townInfluenceLevel = userData.crystleTownLevel || 1;
          let dropChance = 0;
          if (townInfluenceLevel >= 1 && townInfluenceLevel <= 10) dropChance = 10; 
          else if (townInfluenceLevel >= 11 && townInfluenceLevel <= 20) dropChance = 12;
          else if (townInfluenceLevel >= 21 && townInfluenceLevel <= 30) dropChance = 15;
          else if (townInfluenceLevel >= 31 && townInfluenceLevel <= 40) dropChance = 20;
          else if (townInfluenceLevel >= 41 && townInfluenceLevel <= 50) dropChance = 25;

          if (dropChance === 0) throw new HttpsError('failed-precondition', 'Level too low.');

          const roll = Math.floor(Math.random() * 100) + 1;
          if (roll > dropChance) {
            throw new HttpsError('unavailable', 'No luck this time! The Faucet remains elusive.');
          }

          transaction.update(userRef, {
            lastFaucetDate: today,
            dailyFaucetWins: admin.firestore.FieldValue.increment(1)
          });
        }
      });
    } catch (e: any) {
      if (e instanceof HttpsError) throw e;
      throw new HttpsError('internal', e.message || 'Verification and reservation failed.');
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

    // Phase 2: On-Chain Execution
    try {
      const { provider, wallet, ethers } = getEthersConnection(privateKey);
      if (!ethers.isAddress(targetWalletAddress)) {
        throw new HttpsError('invalid-argument', 'Invalid target wallet address');
      }

      let tx;
      let finalRewardMsg = "";

      if (isSparkExchange && (rewardType === 'HUNT' || rewardType === 'DWGX')) {
        // --- ERC20 TOKEN EXCHANGE PATH ---
        const tokenAddress = TOKENS[rewardType as keyof typeof TOKENS];
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
        
        // Rates: 0.01 HUNT or 0.1 DWGX
        const amount = rewardType === 'HUNT' ? "0.01" : "0.1";
        const decimals = 18;
        const parsedAmount = ethers.parseUnits(amount, decimals);

        // Balance pre-flight check
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

    } catch (error: any) {
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
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }

      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', `Transmission failed: ${error.message || "Network Error"}`);
    }
  }
);

export const claimWelcomeNft = onCall(
  { secrets: [faucetPrivateKeySecret], enforceAppCheck: true },
  async (request) => {
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to claim.');
    }

    const { targetWalletAddress } = request.data;
    if (!targetWalletAddress) {
      throw new HttpsError('invalid-argument', 'Missing target wallet address');
    }

    const uid = request.auth.uid;
    const db = getDb();
    const userRef = db.collection('players').doc(uid);
    const configRef = db.collection('config').doc('welcomeNft');

    // Phase 0: Resolve private key and check on-chain supply FIRST
    let privateKey: string;
    try {
      privateKey = faucetPrivateKeySecret.value();
    } catch (e) {
      throw new HttpsError('internal', "Welcome NFT configuration error.");
    }
    if (!privateKey) throw new HttpsError("internal", "Offline");
    if (!privateKey.startsWith("0x")) privateKey = "0x" + privateKey;

    const { provider: _provider, wallet, ethers } = getEthersConnection(privateKey);
    if (!ethers.isAddress(targetWalletAddress)) {
      throw new HttpsError('invalid-argument', 'Invalid target wallet address');
    }

    const nftContractAddress = "0x182D92921c49ca5cf9bc53c013dE735446507dE1";
    const tokenId = 0;
    const amount = 1n;

    const ERC1155_ABI = [
      "function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes data)",
      "function balanceOf(address account, uint256 id) view returns (uint256)"
    ];

    const nftContract = new ethers.Contract(nftContractAddress, ERC1155_ABI, wallet);

    // Check on-chain balance BEFORE reserving in Firestore.
    // The faucet's on-chain balance is the true supply cap;
    // the Firestore counter is just an admin dashboard convenience.
    // This prevents desync where Firestore shows slots remaining but the
    // faucet is actually empty (e.g. after a tx.wait() timeout that
    // rolled back the reservation but the token already left).
    const backendBalance = await nftContract.balanceOf(wallet.address, tokenId);
    if (backendBalance < amount) {
      throw new HttpsError('resource-exhausted', 'Insufficient Trilith Sapphire Gemx tokens in treasury.');
    }

    // Phase 1: Atomic Reservation in Firestore (double-claim prevention only)
    try {
      await db.runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) {
          throw new HttpsError('not-found', 'Player data not found.');
        }
        const userData = userSnap.data() || {};
        if (userData.welcomeNftClaimed === true) {
          throw new HttpsError('already-exists', 'You have already claimed your welcome NFT.');
        }

        const profileWallet = userData.walletAddress;
        if (!profileWallet || profileWallet.toLowerCase() !== targetWalletAddress.toLowerCase()) {
          throw new HttpsError('failed-precondition', 'Target wallet must match your linked profile wallet.');
        }

        transaction.update(userRef, {
          welcomeNftClaimed: true,
          welcomeNftClaimedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        transaction.set(configRef, { nftCount: admin.firestore.FieldValue.increment(1) }, { merge: true });
      });
    } catch (e: any) {
      if (e instanceof HttpsError) throw e;
      throw new HttpsError('internal', e.message || 'Reservation failed.');
    }

    // Phase 2: On-Chain ERC-1155 Transfer
    try {
      const tx = await nftContract.safeTransferFrom(wallet.address, targetWalletAddress, tokenId, amount, "0x");
      await tx.wait();

      await userRef.update({
        welcomeNftTxHash: tx.hash
      });

      return {
        success: true,
        message: 'Trilith Sapphire Gemx welcome gift transmitted!',
        txHash: tx.hash
      };

    } catch (error: any) {
      console.error("Welcome NFT Transfer Failure, initiating rollback...", error);

      // SAFE ROLLBACK: Direct writes — more reliable for undoing our own reservation
      try {
        await userRef.update({
          welcomeNftClaimed: false,
          welcomeNftClaimedAt: admin.firestore.FieldValue.delete()
        });
        await configRef.set({ nftCount: admin.firestore.FieldValue.increment(-1) }, { merge: true });
        console.log("Rollback successful — slot returned to pool.");
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }

      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', `NFT transfer failed: ${error.message || "Network Error"}`);
    }
  }
);

/**
 * claimLevel10Nft — distributes 1 Trilith Emerald Gemx to the first 20 players
 * to reach Level 10. Supports two-phase flow:
 *   - Phase 1 (no wallet yet): call without targetWalletAddress → reserves slot only
 *   - Phase 2 (wallet linked): call with targetWalletAddress → reserves (if needed) + transfers
 */
export const claimLevel10Nft = onCall(
  { secrets: [faucetPrivateKeySecret], enforceAppCheck: true },
  async (request) => {
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to claim.');
    }

    const { targetWalletAddress } = request.data;
    const uid = request.auth.uid;
    const db = getDb();
    const userRef = db.collection('players').doc(uid);
    const configRef = db.collection('config').doc('level10Nft');
    const SUPPLY_CAP = 20;
    const EMERALD_CONTRACT = "0xE6961d4b515D018d5b1C4c91790ef8B5573a0615";

    // Check if already fully claimed (on-chain transfer already done)
    const userSnapPre = await userRef.get();
    if (!userSnapPre.exists) {
      throw new HttpsError('not-found', 'Player data not found.');
    }
    const userDataPre = userSnapPre.data() || {};
    if (userDataPre.level10NftClaimed === true) {
      throw new HttpsError('already-exists', 'You have already claimed your Level 10 Emerald Gemx.');
    }

    // Phase 0: If a wallet is provided, check on-chain supply BEFORE any Firestore changes.
    // This prevents the same desync bug as the welcome NFT — the faucet's on-chain balance
    // is the true supply cap; the Firestore counter is just for the admin dashboard.
    let privateKey: string | null = null;
    let wallet: any = null;
    let ethers: any = null;
    let nftContract: any = null;
    const tokenId = 0;
    const amount = 1n;

    if (targetWalletAddress) {
      try {
        privateKey = faucetPrivateKeySecret.value();
      } catch (e) {
        throw new HttpsError('internal', "Level 10 NFT configuration error.");
      }
      if (!privateKey) throw new HttpsError("internal", "Offline");
      if (!privateKey.startsWith("0x")) privateKey = "0x" + privateKey;

      const conn = getEthersConnection(privateKey);
      wallet = conn.wallet;
      ethers = conn.ethers;

      if (!ethers.isAddress(targetWalletAddress)) {
        throw new HttpsError('invalid-argument', 'Invalid target wallet address');
      }

      const ERC1155_ABI = [
        "function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes data)",
        "function balanceOf(address account, uint256 id) view returns (uint256)"
      ];

      nftContract = new ethers.Contract(EMERALD_CONTRACT, ERC1155_ABI, wallet);

      const backendBalance = await nftContract.balanceOf(wallet.address, tokenId);
      if (backendBalance < amount) {
        throw new HttpsError('resource-exhausted', 'Insufficient Trilith Emerald Gemx tokens in treasury.');
      }

      // Validate wallet
      if (!userDataPre.walletAddress || userDataPre.walletAddress.toLowerCase() !== targetWalletAddress.toLowerCase()) {
        throw new HttpsError('failed-precondition', 'Target wallet must match your linked profile wallet.');
      }
    }

    // Phase 1: Atomic reservation (skip if already reserved)
    if (userDataPre.level10NftReserved !== true) {
      try {
        await db.runTransaction(async (transaction) => {
          // When a wallet is present, on-chain balance is the supply gate.
          // When no wallet, we still use the Firestore counter for the reservation-only path.
          if (!targetWalletAddress) {
            const configSnap = await transaction.get(configRef);
            const nftCount = configSnap.exists ? (configSnap.data()?.nftCount || 0) : 0;
            if (nftCount >= SUPPLY_CAP) {
              throw new HttpsError('resource-exhausted', `All ${SUPPLY_CAP} Level 10 Emerald Gemx have already been reserved.`);
            }
          }

          const userSnap = await transaction.get(userRef);
          if (!userSnap.exists) {
            throw new HttpsError('not-found', 'Player data not found.');
          }
          const userData = userSnap.data() || {};
          if (userData.level10NftReserved === true || userData.level10NftClaimed === true) {
            throw new HttpsError('already-exists', 'Already reserved or claimed.');
          }
          if (userData.level === undefined || userData.level < 10) {
            throw new HttpsError('failed-precondition', 'You must reach Level 10 to claim this reward.');
          }

          transaction.update(userRef, {
            level10NftReserved: true,
            level10NftReservedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          transaction.set(configRef, { nftCount: admin.firestore.FieldValue.increment(1) }, { merge: true });
        });
      } catch (e: any) {
        if (e instanceof HttpsError) throw e;
        throw new HttpsError('internal', e.message || 'Level 10 reservation failed.');
      }
    }

    // If no wallet provided, this is a reservation-only call
    if (!targetWalletAddress) {
      return {
        success: true,
        reserved: true,
        message: 'Level 10 Emerald Gemx reserved. Link your wallet to claim.'
      };
    }

    // Phase 2: On-Chain ERC-1155 Transfer
    try {
      const tx = await nftContract.safeTransferFrom(wallet.address, targetWalletAddress, tokenId, amount, "0x");
      await tx.wait();

      await userRef.update({
        level10NftClaimed: true,
        level10NftClaimedAt: admin.firestore.FieldValue.serverTimestamp(),
        level10NftTxHash: tx.hash
      });

      return {
        success: true,
        message: 'Trilith Emerald Gemx transmitted — Level 10 milestone rewarded!',
        txHash: tx.hash
      };

    } catch (error: any) {
      console.error("Level 10 NFT Transfer Failure, initiating rollback...", error);

      // SAFE ROLLBACK: Direct writes — more reliable for undoing our own reservation
      try {
        await userRef.update({
          level10NftReserved: false,
          level10NftReservedAt: admin.firestore.FieldValue.delete()
        });
        await configRef.set({ nftCount: admin.firestore.FieldValue.increment(-1) }, { merge: true });
        console.log("Level 10 rollback successful — slot returned to pool.");
      } catch (rollbackErr) {
        console.error("Level 10 rollback failed:", rollbackErr);
      }

      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', `Level 10 transfer failed: ${error.message || "Network Error"}`);
    }
  }
);

// ===== LEVEL REWARDS (10-100) =====
const LEVEL_REWARDS: Record<number, { contract: string; name: string; tokenSymbol: string }> = {
  10: { contract: "0xE6961d4b515D018d5b1C4c91790ef8B5573a0615", name: "Trilith Emerald Gemx", tokenSymbol: "TRIEM" },
  20: { contract: "0x02450E8aa329Db0A06EA0f8C852Ae00Cd1Dd5959", name: "Trilith Ruby Gemx", tokenSymbol: "TRIRUBGEMX" },
  30: { contract: "0x137d6Df9522286e6B3d596D7c5f8584A07bf2987", name: "Trilith Quartz Gemx", tokenSymbol: "TRIQUGEMX" },
  40: { contract: "0x182D92921c49ca5cf9bc53c013dE735446507dE1", name: "Trilith Sapphire Gemx", tokenSymbol: "TRISAPG" },
  50: { contract: "0xE6961d4b515D018d5b1C4c91790ef8B5573a0615", name: "Trilith Emerald Gemx", tokenSymbol: "TRIEM" },
  60: { contract: "0x02450E8aa329Db0A06EA0f8C852Ae00Cd1Dd5959", name: "Trilith Ruby Gemx", tokenSymbol: "TRIRUBGEMX" },
  70: { contract: "0x02450E8aa329Db0A06EA0f8C852Ae00Cd1Dd5959", name: "Trilith Ruby Gemx", tokenSymbol: "TRIRUBGEMX" },
  80: { contract: "0x137d6Df9522286e6B3d596D7c5f8584A07bf2987", name: "Trilith Quartz Gemx", tokenSymbol: "TRIQUGEMX" },
  90: { contract: "0x182D92921c49ca5cf9bc53c013dE735446507dE1", name: "Trilith Sapphire Gemx", tokenSymbol: "TRISAPG" },
  100: { contract: "0xE6961d4b515D018d5b1C4c91790ef8B5573a0615", name: "Trilith Emerald Gemx", tokenSymbol: "TRIEM" },
};

/**
 * claimLevelReward — distributes the correct Tri Gemx token for each 10-level milestone.
 * Supports two-phase flow:
 *   - No wallet: reservation only (slot held until wallet linked)
 *   - Wallet present: reservation + on-chain transfer
 */
export const claimLevelReward = onCall(
  { secrets: [faucetPrivateKeySecret], enforceAppCheck: true },
  async (request) => {
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to claim.');
    }

    const { targetWalletAddress, rewardLevel } = request.data;
    if (rewardLevel === undefined || rewardLevel === null) {
      throw new HttpsError('invalid-argument', 'Missing rewardLevel parameter.');
    }

    const levelConfig = LEVEL_REWARDS[rewardLevel as number];
    if (!levelConfig) {
      throw new HttpsError('invalid-argument', `Invalid reward level: ${rewardLevel}. Must be a 10-level milestone.`);
    }

    const uid = request.auth.uid;
    const db = getDb();
    const userRef = db.collection('players').doc(uid);
    const tokenId = 0;
    const amount = 1n;

    // Check player data (non-transactional read first)
    const userSnapPre = await userRef.get();
    if (!userSnapPre.exists) {
      throw new HttpsError('not-found', 'Player data not found.');
    }
    const userDataPre = userSnapPre.data() || {};

    // Check player level requirement
    if (!userDataPre.level || userDataPre.level < rewardLevel) {
      throw new HttpsError('failed-precondition', `You must reach Level ${rewardLevel} to claim this reward.`);
    }

    // Check if already claimed (new system)
    const levelRewardData = userDataPre.levelRewards?.[String(rewardLevel)];
    if (levelRewardData?.claimed === true) {
      throw new HttpsError('already-exists', `You have already claimed your Level ${rewardLevel} ${levelConfig.tokenSymbol} Gemx.`);
    }
    // Special backward compat for level 10
    if (rewardLevel === 10 && userDataPre.level10NftClaimed === true) {
      throw new HttpsError('already-exists', 'You have already claimed your Level 10 Emerald Gemx.');
    }

    // Phase 0: If wallet provided, check on-chain supply BEFORE Firestore
    let wallet: any = null;
    let ethers: any = null;
    let nftContract: any = null;

    if (targetWalletAddress) {
      let privateKey: string;
      try {
        privateKey = faucetPrivateKeySecret.value();
      } catch (e) {
        throw new HttpsError('internal', `Level ${rewardLevel} NFT configuration error.`);
      }
      if (!privateKey) throw new HttpsError("internal", "Offline");
      if (!privateKey.startsWith("0x")) privateKey = "0x" + privateKey;

      const conn = getEthersConnection(privateKey);
      wallet = conn.wallet;
      ethers = conn.ethers;

      if (!ethers.isAddress(targetWalletAddress)) {
        throw new HttpsError('invalid-argument', 'Invalid target wallet address');
      }

      const ERC1155_ABI = [
        "function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes data)",
        "function balanceOf(address account, uint256 id) view returns (uint256)"
      ];

      nftContract = new ethers.Contract(levelConfig.contract, ERC1155_ABI, wallet);

      const backendBalance = await nftContract.balanceOf(wallet.address, tokenId);
      if (backendBalance < amount) {
        throw new HttpsError('resource-exhausted', `Insufficient ${levelConfig.name} tokens in treasury.`);
      }

      // Validate wallet matches profile
      if (!userDataPre.walletAddress || userDataPre.walletAddress.toLowerCase() !== targetWalletAddress.toLowerCase()) {
        throw new HttpsError('failed-precondition', 'Target wallet must match your linked profile wallet.');
      }
    }

    // Phase 1: Atomic reservation in Firestore
    const rewardPath = `levelRewards.${rewardLevel}`;

    try {
      await db.runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) {
          throw new HttpsError('not-found', 'Player data not found.');
        }
        const userData = userSnap.data() || {};

        // Double-check no concurrent claim
        const existingReward = userData.levelRewards?.[String(rewardLevel)];
        if (existingReward?.claimed === true || existingReward?.reserved === true) {
          throw new HttpsError('already-exists', `Level ${rewardLevel} reward already processed.`);
        }
        if (rewardLevel === 10 && (userData.level10NftClaimed === true || userData.level10NftReserved === true)) {
          throw new HttpsError('already-exists', 'Level 10 reward already processed via legacy system.');
        }

        if (targetWalletAddress) {
          // Full claim with wallet
          transaction.update(userRef, {
            [`${rewardPath}.claimed`]: true,
            [`${rewardPath}.claimedAt`]: admin.firestore.FieldValue.serverTimestamp(),
            [`${rewardPath}.token`]: levelConfig.tokenSymbol,
            // Legacy backward compat for level 10
            ...(rewardLevel === 10 ? {
              level10NftClaimed: true,
              level10NftClaimedAt: admin.firestore.FieldValue.serverTimestamp()
            } : {})
          });
        } else {
          // Reservation only (no wallet yet)
          transaction.update(userRef, {
            [`${rewardPath}.reserved`]: true,
            [`${rewardPath}.reservedAt`]: admin.firestore.FieldValue.serverTimestamp(),
            [`${rewardPath}.token`]: levelConfig.tokenSymbol,
            // Legacy backward compat for level 10
            ...(rewardLevel === 10 ? {
              level10NftReserved: true,
              level10NftReservedAt: admin.firestore.FieldValue.serverTimestamp()
            } : {})
          });
        }
      });
    } catch (e: any) {
      if (e instanceof HttpsError) throw e;
      throw new HttpsError('internal', e.message || `Level ${rewardLevel} reservation failed.`);
    }

    // If no wallet, return early (reservation only)
    if (!targetWalletAddress) {
      return {
        success: true,
        reserved: true,
        message: `Level ${rewardLevel} ${levelConfig.tokenSymbol} Gemx reserved. Link a wallet to receive your reward.`,
        token: levelConfig.tokenSymbol,
        level: rewardLevel
      };
    }

    // Phase 2: On-Chain ERC-1155 Transfer
    try {
      const tx = await nftContract.safeTransferFrom(wallet.address, targetWalletAddress, tokenId, amount, "0x");
      await tx.wait();

      await userRef.update({
        [`${rewardPath}.txHash`]: tx.hash,
        [`${rewardPath}.claimedAt`]: admin.firestore.FieldValue.serverTimestamp(),
        // Legacy backward compat for level 10
        ...(rewardLevel === 10 ? { level10NftTxHash: tx.hash } : {})
      });

      return {
        success: true,
        message: `${levelConfig.name} transmitted — Level ${rewardLevel} milestone rewarded!`,
        txHash: tx.hash,
        token: levelConfig.tokenSymbol,
        level: rewardLevel
      };

    } catch (error: any) {
      console.error(`Level ${rewardLevel} NFT Transfer Failure, initiating rollback...`, error);

      // SAFE ROLLBACK
      try {
        await userRef.update({
          [`${rewardPath}.claimed`]: false,
          [`${rewardPath}.claimedAt`]: admin.firestore.FieldValue.delete(),
          ...(rewardLevel === 10 ? {
            level10NftClaimed: false,
            level10NftClaimedAt: admin.firestore.FieldValue.delete()
          } : {})
        });
        console.log(`Level ${rewardLevel} rollback successful.`);
      } catch (rollbackErr) {
        console.error(`Level ${rewardLevel} rollback failed:`, rollbackErr);
      }

      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', `Level ${rewardLevel} transfer failed: ${error.message || "Network Error"}`);
    }
  }
);

export const secureGameAction = onCall(
  { enforceAppCheck: true }, 
  async (request) => {
    const { handleSecureGameAction } = require("./gameActions");
    return handleSecureGameAction(request, getDb());
  }
);
