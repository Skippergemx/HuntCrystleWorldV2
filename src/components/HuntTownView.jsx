import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { deleteField } from 'firebase/firestore';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { Building, Sparkles, X, Zap, Lock, Users, Check, Package, CalendarDays, Twitter } from 'lucide-react';
import { Header, CitizenMedia } from './GameUI';
import { NPCCard } from './NPCCard';
import SocialShare from './SocialShare';
import { useGame } from '../contexts/GameContext';

/* ──────────────── Hunt Building NFT Contracts ──────────────── */
const HUNT_BUILDING_CONTRACTS = [
  { address: '0x0c9bb1fff512a5b4f01aca6ad964ec6d7fc60c96', tokenId: 0n },
  { address: '0x475f8e3ee5457f7b4aaca7e989d35418657adf2a', tokenId: 0n },
  { address: '0x1A7154D518C28B09B311217Bf5514C9223ec0a23', tokenId: 0n },
];

const ERC1155_ABI = [{
  inputs: [
    { name: 'account', type: 'address' },
    { name: 'id', type: 'uint256' }
  ],
  name: 'balanceOf',
  outputs: [{ type: 'uint256' }],
  stateMutability: 'view',
  type: 'function'
}];

/* ─── Batched NFT access check (single RPC client, avoids 429 rate limits) ─── */
const useHuntTownAccess = (walletAddress) => {
  const [hasAccess, setHasAccess] = useState(null); // null = loading

  useEffect(() => {
    if (!walletAddress) {
      setHasAccess(null);
      return;
    }

    let cancelled = false;
    const client = createPublicClient({ chain: base, transport: http() });

    const checkAll = async () => {
      for (const contract of HUNT_BUILDING_CONTRACTS) {
        if (cancelled) return;
        try {
          const balance = await client.readContract({
            address: contract.address,
            abi: ERC1155_ABI,
            functionName: 'balanceOf',
            args: [walletAddress, contract.tokenId],
          });
          if (Number(balance) > 0) {
            if (!cancelled) setHasAccess(true);
            return;
          }
        } catch {
          // Individual contract check failed — continue to next
        }
        // Small stagger between calls to avoid bursting the RPC
        if (!cancelled) await new Promise(r => setTimeout(r, 200));
      }
      if (!cancelled) setHasAccess(false);
    };

    checkAll();
    return () => { cancelled = true; };
  }, [walletAddress]);

  return hasAccess;
};

const CITIZEN_COUNT = 30; // total citizen assets available
const MAX_CITIZENS_PER_LEVEL = 5; // citizens per building level
const SPARKS_TO_LEVEL = 50;      // hunt sparks needed to level up
const MAX_BUILDING_LEVEL = 4;

/* ──────────────── Launch Event Config ──────────────── */
const LAUNCH_EVENT_END = new Date('2026-06-30T23:59:59Z');
const EVENT_MULTIPLIER = 5;
const isLaunchEventActive = () => Date.now() < LAUNCH_EVENT_END.getTime();

// Base drop rates per citizen per tick (1 second)
const BASE_SPARK_RATE = 0.02;   // 2% — sparks are the rarer level-up currency
const BASE_GX_RATE = 0.08;      // 8% — GX is the common income stream, drops more often
const MAX_GROUND_ITEMS = 20;    // cap for persistent spark + GX ground items
const DEBUG_LOG = false;        // set true to enable tick-by-tick console diagnostics

/* ──────────────── Citizen Roaming + Drop Engine ──────────────── */
const TUTORIAL_STEPS = [
  {
    title: "Welcome to Hunt Town",
    npc: 18,
    text: "This is Hunt Town — a lively settlement where Crystle Citizens roam freely. As the Hunt Building levels up, more citizens are attracted to the town. They occasionally drop Hunt Sparks and GX tokens as they go about their day!",
    hint: "Tip: Keep this screen open to collect passive drops."
  },
  {
    title: "Hunt Sparks & Leveling",
    npc: 22,
    text: `Citizens have a small chance to drop Hunt Sparks — the key resource for upgrading your Hunt Building. Collect ${SPARKS_TO_LEVEL} Hunt Sparks to level up your building. Each level attracts more citizens and changes the town's appearance!`,
    hint: `Strategy: 50 sparks per level. Level 4 is the max.`
  },
  {
    title: "NFT Access Gate",
    npc: 5,
    text: "Only Hunt Building or DWGXFB NFT holders can access Hunt Town. If you hold any of these NFTs in your connected wallet, you maintain permanent access. If the NFT leaves your wallet, the town is frozen until you reacquire one.",
    hint: "Requirement: Hold Hunt Building or DWGXFB NFT to enter."
  }
];

const HuntTownGround = React.memo(({ buildingLevel, onCollectSpark, onCollectGx, eventActive }) => {
  const sparkRate = eventActive ? BASE_SPARK_RATE * EVENT_MULTIPLIER : BASE_SPARK_RATE;
  const gxRate = eventActive ? BASE_GX_RATE * EVENT_MULTIPLIER : BASE_GX_RATE;
  const [citizens, setCitizens] = useState([]);
  const [groundSparks, setGroundSparks] = useState([]);
  const [groundGx, setGroundGx] = useState([]); // Persisent GX drops — clickable, like sparks
  const maxCitizens = buildingLevel * MAX_CITIZENS_PER_LEVEL;

  // Ref-based: all game logic runs in interval callback (safe from render-phase warnings)
  const citizensRef = useRef(citizens);
  citizensRef.current = citizens;
  const tickRef = useRef(0);
  // Store callbacks in refs so interval doesn't restart when parent re-renders
  const onCollectSparkRef = useRef(onCollectSpark);
  onCollectSparkRef.current = onCollectSpark;
  const onCollectGxRef = useRef(onCollectGx);
  onCollectGxRef.current = onCollectGx;

  // ── DEBUG: Log component lifecycle ──
  useEffect(() => {
    if (!DEBUG_LOG) return;
    console.log('🏘️ [HuntTownGround] MOUNTED — buildingLevel:', buildingLevel, 'maxCitizens:', maxCitizens, 'sparkRate:', sparkRate.toFixed(3), 'gxRate:', gxRate.toFixed(5), 'eventActive:', eventActive);
    return () => console.log('🏘️ [HuntTownGround] UNMOUNTED');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (DEBUG_LOG) console.log('🔄 [HuntTownGround] useEffect (re)initialized — maxCitizens:', maxCitizens, 'sparkRate:', sparkRate.toFixed(3), 'gxRate:', gxRate.toFixed(5));

    const timer = setInterval(() => {
      tickRef.current++;
      const tick = tickRef.current;
      const current = citizensRef.current;
      const newSparks = [];
      const newGx = [];

      // ── Tick header ──
      if (DEBUG_LOG && (tick % 10 === 0 || current.length > 0)) {
        console.log(`⏱️ [TICK ${tick}] citizens=${current.length}/${maxCitizens}`);
      }

      // 1. Spawn citizens if below cap
      let updated = current;
      if (current.length < maxCitizens && Math.random() < 0.35) {
        const spawnSide = Math.floor(Math.random() * 4);
        let x, y, sideName;
        if (spawnSide === 0) { x = -10; y = Math.random() * 100; sideName = 'LEFT'; }
        else if (spawnSide === 1) { x = 110; y = Math.random() * 100; sideName = 'RIGHT'; }
        else if (spawnSide === 2) { x = Math.random() * 100; y = -10; sideName = 'TOP'; }
        else { x = Math.random() * 100; y = 110; sideName = 'BOTTOM'; }

        const citizenNum = 1 + Math.floor(Math.random() * CITIZEN_COUNT);
        const newCitizen = {
          id: 'citizen_' + Date.now() + Math.random(),
          citizenNum,
          x, y,
          targetX: 5 + Math.random() * 90,
          targetY: 5 + Math.random() * 90,
          speed: 0.8 + Math.random() * 0.7,
        };
        updated = [...updated, newCitizen];
        if (DEBUG_LOG) console.log(`👤 [TICK ${tick}] SPAWNED citizen #${newCitizen.citizenNum} from ${sideName} (${newCitizen.x.toFixed(0)},${newCitizen.y.toFixed(0)}) → target (${newCitizen.targetX.toFixed(0)},${newCitizen.targetY.toFixed(0)}) speed=${newCitizen.speed.toFixed(2)} | total=${updated.length}/${maxCitizens}`);
      }

      // 2. Move citizens & handle drops
      let arrivalCount = 0;
      let sparkDrops = 0;
      let gxDrops = 0;
      let minDist = Infinity;
      let maxDist = 0;

      updated = updated.map(c => {
        const dx = c.targetX - c.x;
        const dy = c.targetY - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist) minDist = dist;
        if (dist > maxDist) maxDist = dist;

        if (dist < 1.5) {
          arrivalCount++;
          const sparkRoll = Math.random();
          const gxRoll = Math.random();
          if (sparkRoll < sparkRate) {
            sparkDrops++;
            if (DEBUG_LOG) console.log(`⚡ [TICK ${tick}] SPARK DROP! citizen arrived at (${c.targetX.toFixed(1)},${c.targetY.toFixed(1)}) | roll=${sparkRoll.toFixed(4)} < rate=${sparkRate.toFixed(3)}`);
            newSparks.push({ x: c.targetX, y: c.targetY });
          }
          if (gxRoll < gxRate) {
            gxDrops++;
            if (DEBUG_LOG) console.log(`💎 [TICK ${tick}] GX DROP! citizen arrived at (${c.targetX.toFixed(1)},${c.targetY.toFixed(1)}) | roll=${gxRoll.toFixed(5)} < rate=${gxRate.toFixed(5)}`);
            newGx.push({ x: c.targetX, y: c.targetY });
          }
          if (sparkRoll >= sparkRate && gxRoll >= gxRate) {
            if (DEBUG_LOG && (arrivalCount <= 2 || tick % 30 === 0)) {
              console.log(`🚶 [TICK ${tick}] citizen ARRIVED at (${c.targetX.toFixed(1)},${c.targetY.toFixed(1)}) — no drop (sparkRoll=${sparkRoll.toFixed(2)}, gxRoll=${gxRoll.toFixed(4)})`);
            }
          }
          return { ...c, targetX: 5 + Math.random() * 90, targetY: 5 + Math.random() * 90 };
        }

        return { ...c, x: c.x + (dx / dist) * c.speed, y: c.y + (dy / dist) * c.speed };
      });

      // ── Tick summary ──
      if (DEBUG_LOG && updated.length > 0) {
        console.log(`📊 [TICK ${tick}] SUMMARY: ${updated.length} citizens | ${arrivalCount} arrivals | ⚡${sparkDrops} sparks 💎${gxDrops} GX | dist range [${minDist.toFixed(1)}, ${maxDist.toFixed(1)}]`);
      }

      setCitizens(updated);
      if (newSparks.length > 0) {
        if (DEBUG_LOG) console.log(`✨ [TICK ${tick}] Pushing ${newSparks.length} new ground sparks`);
        setGroundSparks(prev => {
          if (prev.length >= MAX_GROUND_ITEMS) {
            if (DEBUG_LOG) console.log(`⚠️ [TICK ${tick}] Ground sparks at cap (${prev.length}), dropping new ones`);
            return prev;
          }
          const available = MAX_GROUND_ITEMS - prev.length;
          const added = newSparks.slice(0, available).map(s => ({
            ...s,
            id: `spark_ground_${Date.now()}_${Math.random().toString(36).slice(2)}`
          }));
          if (DEBUG_LOG) console.log(`✅ [TICK ${tick}] Ground sparks: ${prev.length} → ${prev.length + added.length}`);
          return [...prev, ...added];
        });
      }
      if (newGx.length > 0) {
        if (DEBUG_LOG) console.log(`💎✨ [TICK ${tick}] Pushing ${newGx.length} new ground GX tokens`);
        setGroundGx(prev => {
          if (prev.length >= MAX_GROUND_ITEMS) {
            if (DEBUG_LOG) console.log(`⚠️ [TICK ${tick}] Ground GX at cap (${prev.length}), dropping new ones`);
            return prev;
          }
          const available = MAX_GROUND_ITEMS - prev.length;
          const added = newGx.slice(0, available).map(g => ({
            ...g,
            id: `gx_ground_${Date.now()}_${Math.random().toString(36).slice(2)}`
          }));
          if (DEBUG_LOG) console.log(`✅ [TICK ${tick}] Ground GX: ${prev.length} → ${prev.length + added.length}`);
          return [...prev, ...added];
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [maxCitizens, sparkRate, gxRate]); // Only restart when rates/caps change — callbacks via refs

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Citizens */}
      {citizens.map(c => (
        <div
          key={c.id}
          className="absolute transition-all duration-1000 z-10 w-8 h-8 md:w-10 md:h-10"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
        >
          <div className="animate-pulse w-full h-full relative">
            <div className="w-full h-full rounded-full border-[2px] md:border-[3px] border-black bg-amber-900 shadow-[3px_3px_0_rgba(0,0,0,1)] overflow-hidden">
              <img
                src={`/assets/CrystleTown/CrystleTownCitizen/CrystleTownCitizen (${c.citizenNum}).jpg`}
                alt={`Citizen ${c.citizenNum}`}
                className="w-full h-full object-cover rounded-full opacity-90"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=citizen' + c.citizenNum; }}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Ground sparks — persistent, clickable (same pattern as Dragons Ground fruits) */}
      {groundSparks.map(s => (
        <button
          key={s.id}
          onClick={() => {
            if (onCollectSparkRef.current(s) !== false) {
              setGroundSparks(prev => prev.filter(sp => sp.id !== s.id));
            }
          }}
          className="absolute z-20 text-3xl p-4 -m-4 hover:scale-125 transition-transform active:scale-95 animate-in fade-in zoom-in duration-300 pointer-events-auto"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-purple-400 blur-md opacity-0 group-hover:opacity-40 rounded-full"></div>
            <span className="drop-shadow-[0_0_8px_rgba(168,85,247,0.9)] filter">⚡</span>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 px-1 py-0.5 rounded border border-purple-500/30 text-[6px] text-purple-300 opacity-0 group-hover:opacity-100 whitespace-nowrap font-black">
              Hunt Spark
            </div>
          </div>
        </button>
      ))}

      {/* Ground GX tokens — persistent, clickable (same pattern: collect to add to player GX) */}
      {groundGx.map(g => (
        <button
          key={g.id}
          onClick={() => {
            onCollectGxRef.current(g);
            setGroundGx(prev => prev.filter(gx => gx.id !== g.id));
          }}
          className="absolute z-20 text-3xl p-4 -m-4 hover:scale-125 transition-transform active:scale-95 animate-in fade-in zoom-in duration-300 pointer-events-auto"
          style={{ left: `${g.x}%`, top: `${g.y}%` }}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-amber-400 blur-md opacity-0 group-hover:opacity-40 rounded-full"></div>
            <span className="drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] filter">💎</span>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 px-1 py-0.5 rounded border border-amber-500/30 text-[6px] text-amber-300 opacity-0 group-hover:opacity-100 whitespace-nowrap font-black">
              +10 GX
            </div>
          </div>
        </button>
      ))}
    </div>
  );
});

/* ──────────────── Main Hunt Town View ──────────────── */
export const HuntTownView = React.memo(() => {
  const { player, syncPlayer, adventure, wallet, addLog, inventoryCounts } = useGame();
  const { setView } = adventure;

  // ── NFT balance check — use live wallet, fall back to stored profile address (mobile reconnect) ──
  const checkAddress = wallet.address || player.walletAddress;
  const hasNft = useHuntTownAccess(checkAddress);

  // ── Hunt Building state (level + spark-fed progress, like dragon's fruitsFed) ──
  const huntBuilding = player.huntBuilding || { level: 1, sparksFed: 0 };
  const buildingLevel = Math.min(MAX_BUILDING_LEVEL, Math.max(1, huntBuilding.level || 1));
  const sparksFed = huntBuilding.sparksFed || 0;

  // ── Spark inventory counts (same hunt_spark as dungeon drops) ──
  const huntSparkCount = inventoryCounts['hunt_spark'] || 0;
  const maxSlots = player?.maxInventorySlots || 50;
  const usedSlots = Object.keys(player?.inventory || {}).length;
  const satchelFull = usedSlots >= maxSlots;

  // ── Launch event state ──
  const eventActive = isLaunchEventActive();

  const [message, setMessage] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [levelUpModal, setLevelUpModal] = useState(null); // { newLevel, citizens }

  // Auto-tutorial trigger
  useEffect(() => {
    const isHidden = localStorage.getItem('hide_hunt_town_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_hunt_town_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  }, [tutorialStep, dontShowAgain]);

  // ── Collect handler: spark on ground → click → add to inventory (like fruit click) ──
  const handleCollectSpark = useCallback((sparkGroundItem) => {
    if (satchelFull) {
      setMessage({ type: 'error', text: '🎒 SATCHEL FULL: Free up space to collect!' });
      addLog('🎒 SATCHEL FULL: Hunt Spark left on ground — free up slots!');
      return false;
    }
    const hId = `hunt_spark_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
    syncPlayer({ [`inventory.${hId}`]: { id: 'hunt_spark', name: 'Hunt Spark', rarity: 'Rare', icon: '⚡', description: 'A beginner\'s catalyst for wealth. 4 sparks can be exchanged for $HUNT or $DWGX in Crystle Town.', type: 'Artifact', category: 'Loot', sellValue: 250 } });
    setMessage({ type: 'spark', text: '✨ Hunt Spark collected!' });
    addLog('⚡ HUNT TOWN: Collected a Hunt Spark!');
    return true;
  }, [satchelFull, syncPlayer, addLog]);

  // ── GX handler: click ground GX → add to player balance ──
  const handleCollectGx = useCallback((gxGroundItem) => {
    const currentTokens = player.tokens || 0;
    syncPlayer({ tokens: currentTokens + 10 });
    setMessage({ type: 'spark', text: '💎 +10 GX collected!' });
    addLog('💎 HUNT TOWN: Collected 10 GX from a citizen drop!');
  }, [player.tokens, syncPlayer, addLog]);

  // ── Feed Building: click building → consume 1 spark → add XP → level up when full ──
  const feedBuilding = () => {
    if (buildingLevel >= MAX_BUILDING_LEVEL) {
      setMessage({ type: 'info', text: 'Hunt Building is at maximum level!' });
      return;
    }
    if (huntSparkCount <= 0) {
      setMessage({ type: 'error', text: 'No Hunt Sparks in inventory! Click sparks on the ground to collect them first.' });
      return;
    }

    // Consume ONE spark from inventory
    let foundKey = null;
    for (const [uniqueId, item] of Object.entries(player.inventory || {})) {
      if (!item || item.id !== 'hunt_spark') continue;
      foundKey = uniqueId;
      break;
    }
    if (!foundKey) {
      setMessage({ type: 'error', text: 'No Hunt Sparks in inventory! Collect sparks from citizens first.' });
      return;
    }

    const newXp = sparksFed + 1;
    const sparkDeletes = {};
    sparkDeletes[`inventory.${foundKey}`] = deleteField();
    sparkDeletes['huntBuilding.sparksFed'] = newXp;

    if (newXp >= SPARKS_TO_LEVEL) {
      const newLevel = buildingLevel + 1;
      sparkDeletes['huntBuilding.level'] = newLevel;
      sparkDeletes['huntBuilding.sparksFed'] = 0;
      syncPlayer(sparkDeletes);
      const citizens = newLevel * MAX_CITIZENS_PER_LEVEL;
      setLevelUpModal({ newLevel, citizens });
      addLog(`🏗️ HUNT TOWN: Building reached Level ${newLevel}!`);
    } else {
      syncPlayer(sparkDeletes);
      setMessage({ type: 'spark', text: `⚡ Building XP: ${newXp}/${SPARKS_TO_LEVEL}` });
    }
  };

  // ── Auto-hide messages ──
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const huntDialogues = useMemo(() => [
    "Hunt Town thrives on the energy of its citizens. The more, the merrier!",
    "Hunt Sparks are the lifeblood of the Hunt Building. Collect them diligently.",
    "Each building level attracts 5 more citizens to the town square.",
    "GX tokens drop from grateful citizens — a steady trickle of income.",
    "The Hunt Building is your anchor here. Level it up to expand the town.",
    "Keep your Hunt Building NFT safe — it's your key to this settlement.",
    "Level 4 buildings attract 20 citizens — that's the peak of Hunt Town prosperity!"
  ], []);

  /* ──────────────── Loading State ──────────────── */
  if (hasNft === null) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-950 relative">
        <Header
          title="Hunt Town"
          onClose={adventure.goBack}
          npcNum={18}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <div className="w-12 h-12 border-[4px] border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-black uppercase italic tracking-wider">Verifying access...</p>
        </div>
      </div>
    );
  }

  /* ──────────────── Locked / Frozen State ──────────────── */
  if (hasNft === false) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-950 relative">
        <Header
          title="Hunt Town"
          onClose={adventure.goBack}
          npcNum={18}
          onHelp={() => {
            setTutorialStep(2);
            setShowTutorial(true);
          }}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6">
          {/* Lock icon area */}
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-[4px] border-slate-700 bg-slate-900 flex items-center justify-center shadow-[0_0_40px_rgba(100,100,100,0.2)]">
              <Lock size={48} className="text-slate-600" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] font-black px-3 py-0.5 border-2 border-black uppercase tracking-widest rounded">
              ACCESS DENIED
            </div>
          </div>

          <div className="max-w-md space-y-3">
            <h2 className="text-xl md:text-2xl font-[1000] text-white uppercase italic tracking-tighter">
              Hunt Building NFT Required
            </h2>
            <p className="text-slate-400 text-sm font-bold uppercase leading-relaxed">
              Hunt Town is exclusive to Hunt Building & DWGXFB NFT holders. Connect a wallet that holds one of these NFTs to gain access and start building your settlement.
            </p>
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-left">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Verified Contracts</p>
              <p className="text-[9px] font-mono text-slate-600 break-all">0x0c9b...c60c96</p>
              <p className="text-[9px] font-mono text-slate-600 break-all">0x475f...57adf2a</p>
              <p className="text-[9px] font-mono text-slate-600 break-all">0x1A71...c0a23</p>
            </div>
            {!wallet.address && !player.walletAddress && (
              <p className="text-amber-400 text-[10px] font-black uppercase italic">
                ⚠️ No wallet connected. Connect your wallet first.
              </p>
            )}
            {!wallet.address && player.walletAddress && (
              <p className="text-amber-400 text-[10px] font-black uppercase italic">
                🔗 Your linked wallet doesn't hold a Hunt Building NFT.
              </p>
            )}
          </div>
        </div>

        {showTutorial && createPortal(
          <TutorialModal
            step={tutorialStep}
            steps={TUTORIAL_STEPS}
            onNext={nextStep}
            onClose={() => setShowTutorial(false)}
            dontShowAgain={dontShowAgain}
            setDontShowAgain={setDontShowAgain}
          />,
          document.body
        )}
      </div>
    );
  }

  /* ──────────────── Active Hunt Town ──────────────── */
  return (
    <div className="flex-1 flex flex-col h-full bg-amber-950/30 relative">
      {message && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-2 fade-in duration-300 pointer-events-none w-max">
          <div className={`px-4 py-1.5 rounded-lg border-2 font-black uppercase italic text-[10px] shadow-2xl backdrop-blur-md ${
            message.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-400' :
            message.type === 'error' ? 'bg-red-950/90 border-red-500 text-red-100' :
            message.type === 'spark' ? 'bg-purple-950/90 border-purple-500 text-purple-300' :
            'bg-blue-950/90 border-blue-500 text-blue-100'
          }`}>
            {message.type === 'success' && '🌟 '}
            {message.type === 'spark' && '✨ '}
            {message.text}
          </div>
        </div>
      )}

      {/* ── Launch Event Banner ── */}
      {eventActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[190] animate-in slide-in-from-top-2 fade-in duration-500 pointer-events-none">
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-600/90 via-orange-500/90 to-amber-600/90 px-5 py-2 rounded-full border-2 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.4)] backdrop-blur-md">
            <Sparkles size={14} className="text-yellow-200 animate-pulse" />
            <span className="text-[10px] md:text-xs font-black text-yellow-100 uppercase tracking-[0.15em] italic">
              5× Launch Event Active
            </span>
            <span className="text-[8px] md:text-[9px] font-bold text-amber-200/80 flex items-center gap-1">
              <CalendarDays size={10} />
              Ends Jun 30
            </span>
          </div>
        </div>
      )}

      <div className="p-4 z-30 space-y-3">
        <Header
          title="Hunt Town"
          onClose={adventure.goBack}
          npcNum={18}
          onHelp={() => {
            setTutorialStep(0);
            setShowTutorial(true);
          }}
        />

        {/* Stats bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-black/80 border-2 border-purple-500/50 px-4 py-1.5 rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md">
            <Sparkles size={16} className="text-purple-400 animate-pulse" />
            <div>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Inventory Sparks</p>
              <p className="text-sm font-black text-white italic">{huntSparkCount}</p>
            </div>
          </div>
          <div className="bg-black/80 border-2 border-amber-500/50 px-4 py-1.5 rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md">
            <Zap size={16} className="text-amber-400" />
            <div>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Building XP</p>
              <p className="text-sm font-black text-white italic">{sparksFed} / {SPARKS_TO_LEVEL}</p>
            </div>
          </div>
          <div className="bg-black/80 border-2 border-cyan-500/50 px-4 py-1.5 rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md">
            <Users size={16} className="text-cyan-400" />
            <div>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Citizens</p>
              <p className="text-sm font-black text-white italic">{buildingLevel * MAX_CITIZENS_PER_LEVEL}</p>
            </div>
          </div>
          {/* Satchel status */}
          <div className={`bg-black/80 border-2 px-4 py-1.5 rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md ${satchelFull ? 'border-red-500/80 animate-pulse' : 'border-emerald-500/50'}`}>
            <Package size={16} className={satchelFull ? 'text-red-400' : 'text-emerald-400'} />
            <div>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Satchel</p>
              <p className={`text-sm font-black italic ${satchelFull ? 'text-red-400' : 'text-white'}`}>{usedSlots} / {maxSlots}</p>
            </div>
          </div>
        </div>

        <NPCCard
          citizenNum={18}
          name="TOWN ELDER"
          accentColor="bg-amber-600"
          textColor="text-amber-600"
          glowColor="bg-amber-600"
          statusTag="HUNT_TOWN_ACTIVE"
          statusTag2={`BUILDING_LV${buildingLevel}_LIVE`}
          prefix="◢ELDER: "
          dialogues={huntDialogues}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Level-up bar */}
        <div className="flex-none p-2 md:p-3 bg-amber-950/40 border-b-2 border-black z-20">
          <div className="flex items-center gap-3 bg-black/40 border-2 border-purple-500/30 rounded-xl p-3">
            {/* Building image — click to feed sparks (like clicking dragon to feed fruits) */}
            <button
              onClick={feedBuilding}
              disabled={buildingLevel >= MAX_BUILDING_LEVEL || huntSparkCount <= 0}
              className="relative shrink-0 group cursor-pointer disabled:cursor-not-allowed"
              title={buildingLevel >= MAX_BUILDING_LEVEL ? 'Max Level' : huntSparkCount <= 0 ? 'Collect sparks first' : 'Click to feed a Hunt Spark'}
            >
              <div className={`absolute inset-0 bg-purple-400 blur-xl opacity-30 ${huntSparkCount > 0 && buildingLevel < MAX_BUILDING_LEVEL ? 'animate-pulse group-hover:opacity-60' : 'opacity-10'}`}></div>
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg border-2 border-black overflow-hidden relative shadow-lg bg-slate-900 group-hover:border-purple-400 transition-colors">
                <img
                  src={`/assets/huntbuildings/Level ${buildingLevel} Hunt Building.png`}
                  alt={`Hunt Building Level ${buildingLevel}`}
                  className={`w-full h-full object-cover ${huntSparkCount > 0 && buildingLevel < MAX_BUILDING_LEVEL ? 'group-hover:scale-110' : ''} transition-transform`}
                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                />
                {huntSparkCount > 0 && buildingLevel < MAX_BUILDING_LEVEL && (
                  <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Zap size={20} className="text-purple-300" />
                  </div>
                )}
              </div>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-end mb-1.5">
                <h3 className="text-[11px] font-black text-purple-400 italic uppercase">Hunt Building</h3>
                <span className="text-[8px] font-black text-white bg-purple-600 px-2 py-0.5 rounded">LVL {buildingLevel}</span>
              </div>
              {/* Progress bar — fills as sparks are fed */}
              <div className="h-2 bg-black rounded-full border border-white/10 overflow-hidden mb-2">
                <div
                  className="h-full bg-purple-500 transition-all duration-500"
                  style={{ width: buildingLevel >= MAX_BUILDING_LEVEL ? '100%' : `${(sparksFed / SPARKS_TO_LEVEL) * 100}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[8px] font-black text-slate-400 uppercase">
                  {buildingLevel >= MAX_BUILDING_LEVEL
                    ? 'MAX LEVEL'
                    : huntSparkCount <= 0
                      ? 'Click ⚡ on ground to collect'
                      : `Click building → feed (${huntSparkCount} in bag)`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Town Grounds (background + roaming citizens) */}
        <div className="flex-[8] relative border-t-4 border-black shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] overflow-x-hidden overflow-y-auto custom-scrollbar bg-amber-950 flex flex-col items-center">
          <div className="relative w-full max-w-[540px] aspect-[9/16] flex-shrink-0 overflow-hidden shadow-2xl border-x-4 border-black bg-amber-900 mx-auto">
            {/* Background image — swaps per level */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url('/assets/huntbuildings/Level ${buildingLevel} Hunt Building.png')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center bottom',
                  backgroundRepeat: 'no-repeat',
                }}
              ></div>
              {/* Ground overlay for depth */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-amber-950/80 to-transparent"></div>
            </div>

            {/* Label overlay */}
            <div className="absolute top-4 left-6 z-10 bg-black/60 px-4 py-2 rounded-lg border border-amber-500/30 backdrop-blur-sm shadow-md">
              <p className="text-xs font-black text-amber-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Building size={14} /> Hunt Town Settlement
              </p>
            </div>

            {/* Roaming citizens + clickable spark drops */}
            <HuntTownGround
              buildingLevel={buildingLevel}
              onCollectSpark={handleCollectSpark}
              onCollectGx={handleCollectGx}
              eventActive={eventActive}
            />
          </div>
        </div>
      </div>

      {/* Bottom legend */}
      <div className="p-2 md:p-4 bg-slate-950 border-t border-white/10 flex justify-center gap-4 md:gap-8 z-30">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-purple-600/20 border border-purple-500 flex items-center justify-center text-purple-400 font-black text-xs md:text-base">1</div>
          <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider">Click Sparks</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-amber-600/20 border border-amber-500 flex items-center justify-center text-amber-400 font-black text-xs md:text-base">2</div>
          <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider">Feed Building</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-cyan-600/20 border border-cyan-500 flex items-center justify-center text-cyan-400 font-black text-xs md:text-base">3</div>
          <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider">Grow Town</p>
        </div>
      </div>

      {levelUpModal && createPortal(
        <LevelUpModal
          newLevel={levelUpModal.newLevel}
          citizens={levelUpModal.citizens}
          buildingLevel={buildingLevel}
          onClose={() => setLevelUpModal(null)}
        />,
        document.body
      )}

      {showTutorial && createPortal(
        <TutorialModal
          step={tutorialStep}
          steps={TUTORIAL_STEPS}
          onNext={nextStep}
          onClose={() => setShowTutorial(false)}
          dontShowAgain={dontShowAgain}
          setDontShowAgain={setDontShowAgain}
        />,
        document.body
      )}
    </div>
  );
});

/* ──────────────── Level-Up Celebration Modal ──────────────── */
const LevelUpModal = ({ newLevel, citizens, onClose, buildingLevel }) => {
  const shareText = `🏗️ Just upgraded my Hunt Building to Level ${newLevel} in Dungeons With Gems! My settlement now attracts ${citizens} citizens. \n\nThe 5× Launch Event is live — come build your town! 🔥\n\nmetaverse.dungeonswithgems.quest`;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300" onClick={onClose}>
      <div className="relative w-full max-w-sm flex flex-col justify-center" onClick={e => e.stopPropagation()}>
        {/* Background shadow block */}
        <div className="absolute inset-x-0 top-0 bottom-0 bg-purple-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>

        <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #a855f7 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

          {/* Celebration Header */}
          <div className="w-full bg-gradient-to-r from-purple-600 via-amber-500 to-purple-600 py-3 md:py-4 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={20} className="text-yellow-200 animate-pulse" />
              <h2 className="text-xl md:text-2xl font-black text-white text-center uppercase tracking-tighter italic drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                Building Upgraded!
              </h2>
              <Sparkles size={20} className="text-yellow-200 animate-pulse" />
            </div>
          </div>

          {/* Building Preview */}
          <div className="py-4 md:py-5 relative flex flex-col items-center gap-3 w-full z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-400 blur-2xl opacity-30 animate-pulse rounded-full"></div>
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-[4px] border-black overflow-hidden relative shadow-[6px_6px_0_rgba(0,0,0,1)] bg-slate-800">
                <img
                  src={`/assets/huntbuildings/Level ${newLevel} Hunt Building.png`}
                  alt={`Hunt Building Level ${newLevel}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                />
              </div>
              {/* Level badge */}
              <div className="absolute -bottom-2 -right-2 bg-amber-400 text-black text-lg md:text-xl font-black px-3 py-1 rounded-xl border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] rotate-6">
                LVL {newLevel}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3">
              <div className="bg-black/60 border border-purple-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <Users size={14} className="text-purple-400" />
                <span className="text-xs font-black text-white uppercase italic">{citizens} Citizens</span>
              </div>
              <div className="bg-black/60 border border-amber-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                <span className="text-xs font-black text-white uppercase italic">More Drops</span>
              </div>
            </div>

            {/* Congratulatory text */}
            <p className="text-[10px] md:text-xs font-bold text-purple-300 uppercase italic text-center leading-relaxed px-4">
              "The settlement grows stronger! More citizens roam the town, bringing with them greater wealth and opportunity."
            </p>
          </div>

          {/* Share Section */}
          <div className="px-4 pb-4 w-full relative z-10">
            <SocialShare
              shareText={shareText}
              variant="vertical"
              dividerText="Share Your Achievement"
            />
          </div>

          {/* Continue Button */}
          <div className="px-4 pb-4 w-full relative z-10">
            <button
              onClick={onClose}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-black uppercase tracking-widest italic text-sm border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              Continue Building
            </button>
          </div>
        </div>

        {/* Close button */}
        <button onClick={onClose} className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 border-2 border-black rounded-full flex items-center justify-center z-20 shadow-[3px_3px_0_rgba(0,0,0,1)] hover:bg-red-500 transition-colors">
          <X size={14} className="text-white" />
        </button>
      </div>
    </div>
  );
};

/* ──────────────── Shared Tutorial Modal ──────────────── */
const TutorialModal = ({ step, steps, onNext, onClose, dontShowAgain, setDontShowAgain }) => {
  const s = steps[step];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
      <div className="relative w-full max-w-sm flex flex-col justify-center">
        <div className="absolute inset-x-0 top-0 bottom-0 bg-amber-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>

        <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #d97706 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

          <div className="w-full bg-amber-600 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
            <h2 className="text-xl md:text-2xl font-black text-white text-center uppercase tracking-tighter italic drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
              {s.title}
            </h2>
            <div className="absolute -bottom-1.5 right-2 bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] transform rotate-3 border-2 border-white leading-none">
              Step {step + 1} / {steps.length}
            </div>
          </div>

          <div className="py-3 md:py-4 relative flex justify-center items-center gap-3 w-full z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800 shrink-0 flex items-center justify-center">
              <CitizenMedia num={s.npc} className="w-full h-full object-cover object-top" />
              <div className="absolute inset-x-0 bottom-0 bg-amber-600 text-[6px] font-black text-white text-center py-0.5 uppercase italic">ELDER</div>
            </div>
          </div>

          <div className="px-4 pb-3 w-full relative z-10 flex flex-col min-h-0">
            <div className="bg-white text-black p-3 md:p-3.5 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)] shrink-0">
              <div className="absolute -top-3 -left-1 bg-amber-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic shadow-sm">
                Town Elder
              </div>
              <p className="text-[10px] md:text-sm font-bold text-slate-800 uppercase leading-[1.3] md:leading-[1.4] tracking-tight italic">
                "{s.text}"
              </p>
              <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
            </div>

            <div className="bg-black/60 p-1.5 rounded-lg border border-amber-500/30 mb-3 shrink-0">
              <p className="text-[8px] font-black text-amber-400 uppercase italic tracking-widest text-center">
                ⚡ {s.hint}
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
              <button
                onClick={() => setDontShowAgain(!dontShowAgain)}
                className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-amber-500' : 'bg-slate-800'}`}
              >
                {dontShowAgain && <Check size={10} className="text-white" />}
              </button>
              <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-tighter cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>
                Don't show this briefing again
              </span>
            </div>

            <div className="flex gap-2 shrink-0 pb-1">

              <button
                onClick={onNext}
                className="flex-[2] bg-amber-600 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-amber-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
              >
                {step === steps.length - 1 ? 'ENTER HUNT TOWN' : 'CONTINUE'}
                <Sparkles size={12} />
              </button>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 border-2 border-black rounded-full flex items-center justify-center z-20 shadow-[3px_3px_0_rgba(0,0,0,1)]">
          <X size={14} className="text-white" />
        </button>
      </div>
    </div>
  );
};
