# Code Implementation Guide: Dungeons With Gems 💻

This document outlines the specific syntax patterns and logical implementations used in the codebase. It is designed to demonstrate technical proficiency in React 19, functional programming, and mathematical game balancing.

## 1. The Scaling Algorithm (Mathematics in Syntax)
The game's progression is governed by a power-law distribution. Instead of hard-coding values for 100+ floors, we use a recursive-style calculation in our state selectors.

### Floor Multiplier Implementation
```javascript
// Pure function for deterministic scaling
const calculateFloorStat = (baseValue, floor, rate = 1.15) => {
  return Math.floor(baseValue * Math.pow(rate, floor - 1));
};

// Usage in combat engine
const monsterHP = calculateFloorStat(100, currentFloor);
const gxReward = calculateFloorStat(10, currentFloor);
```
**Interview Talking Point:** "I used `Math.pow` to implement exponential scaling. By keeping this function pure, I ensure the combat engine remains deterministic—meaning the same floor always yields the same difficulty relative to player stats."

---

## 2. Deterministic Combat Logic
Combat is not handled by real-time physics but by a **Ticking State Machine**. This reduces CPU overhead and ensures compatibility with social feed environments (Frames v2).

### The Combat Tick Pattern
```javascript
useEffect(() => {
  if (!isHunting) return;

  const combatTick = setInterval(() => {
    // 1. Calculate Player Strike (STR based)
    // 2. Calculate Monster Retaliation (AGI check for dodge)
    // 3. Update local state
    resolveCombatTurn();
  }, 1000); // 1 tick per second

  return () => clearInterval(combatTick);
}, [isHunting, playerStats]);
```
**Optimization Note:** I used `setInterval` wrapped in a `useEffect` with a cleanup function. This prevents memory leaks and ensures that combat stops immediately when the player leaves the sector or the component unmounts.

---

## 3. The Forge: Probability & DEX Integration
The Forge uses a "Calculated Success" syntax. This is a critical bridge between RPG stats and the game's economy.

### Success Rate Logic
```javascript
const attemptForge = (itemTier, playerDex) => {
  const baseSuccess = 0.50; // 50%
  const dexBonus = playerDex / 200; // DEX as a decimal bonus
  const totalProbability = Math.min(0.95, baseSuccess + dexBonus);
  
  const roll = Math.random();
  return roll <= totalProbability; // Returns Boolean
};
```
**Interview Talking Point:** "I designed the Forge success rate to cap at 95%. This prevents the game from becoming 'too safe,' maintaining the high-stakes 'risk/reward' feeling essential for a Web3 economy while still giving DEX-heavy builds a significant mathematical advantage."

---

## 4. State Management with React 19
To prevent the "Prop Drilling" problem in a complex UI with many sub-menus (Forge, Lab, Tavern), I utilized a centralized state pattern.

### Memoized Attribute Calculation
```javascript
const totalStats = useMemo(() => {
  return {
    str: baseStats.str + equipmentBuffs.str + (dragonLevel * 2),
    agi: baseStats.agi + equipmentBuffs.agi + (dragonLevel * 2),
    dex: baseStats.dex + equipmentBuffs.dex + (dragonLevel * 2)
  };
}, [baseStats, equipmentBuffs, dragonLevel]);
```
**Why `useMemo`?** Calculating stats involves summing values from the base profile, active equipment, and the Dragon system. By memoizing this, the app only re-calculates when a piece of gear or a level actually changes, saving hundreds of unnecessary render cycles during idle combat.

---

## 5. Web3 Identity (Base L2 Integration)
The game checks for the **Genesis NFT** to unlock premium features. This is implemented via a lightweight provider check.

### NFT Verification Syntax
```javascript
const checkGenesisAccess = async (userAddress) => {
  // Logic to interface with Base Mainnet provider
  // Verification of Contract Address: 0x... (Genesis NFT)
  const hasNFT = await contract.balanceOf(userAddress);
  return hasNFT > 0;
};
```
**Junior Developer Insight:** "I focused on keeping the Web3 calls asynchronous. By fetching NFT ownership on login and storing a boolean flag in the session state, the UI remains snappy without waiting for the blockchain on every action."

---

## 6. Firebase Real-Time Sync
Inventory and GX are persisted in Firestore to allow cross-device play.

### Batched Writes Pattern
```javascript
const saveProgress = async (updates) => {
  const userRef = doc(db, "players", userId);
  await updateDoc(userRef, {
    ...updates,
    lastSeen: serverTimestamp()
  });
};
```
**Security Tip:** In a real-world scenario, I would move critical logic (like GX gains) to Firebase Cloud Functions to prevent client-side manipulation of the currency.

---
*GUIDE_VERSION: 1.0.0 // TECH_STACK: REACT_ES6_FIREBASE_BASE_L2*