import React, { useState } from 'react';
import { 
  Newspaper, 
  Share2, 
  Zap, 
  Shield, 
  Terminal, 
  Clock, 
  ArrowLeft, 
  Info, 
  AlertCircle,
  ExternalLink,
  Cpu,
  Globe,
  Database,
  History,
  CheckCircle2,
  Twitter,
  MessageSquare,
  BookOpen,
  Sparkles,
  Flame,
  Award,
  Zap as ZapIcon,
  ChevronRight,
  User as UserIcon,
  Calendar
} from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { useGame } from '../contexts/GameContext';

const ARTICLES_DATA = [
  {
    id: 'dwg-hunt-spark-guide',
    date: '2026-05-29',
    author: 'Commander Gemx',
    authorAvatar: 24,
    title: 'Hunt Spark Field Manual: How to Earn and Exchange',
    subtitle: 'Everything you need to know about farming Hunt Sparks — drop rates, target priorities, and turning sparks into on-chain $HUNT or $DWGX.',
    category: 'GUIDE & REWARDS',
    type: 'article',
    tag: 'NEW',
    color: 'amber',
    readingTime: '4 min',
    content: [
      {
        type: 'paragraph',
        text: 'Hunt Sparks are the great equalizer. Unlike Aether Sparks — which only reveal themselves to Level 100 veterans — Hunt Sparks drop for every Hunter, at every level, in every sector of the grid. They are your gateway from in-game progression to on-chain value. This field manual covers everything: where they come from, how to maximize your yield, and exactly how to turn them into $HUNT or $DWGX.'
      },
      {
        type: 'heading',
        text: 'What Is a Hunt Spark?'
      },
      {
        type: 'paragraph',
        text: 'A Hunt Spark is a Rare-tier artifact — a condensed fragment of combat energy extracted from defeated monsters. Each spark occupies exactly one inventory slot and carries a base sell value of 250 GX if you choose to liquidate it at the shop. But its true power lies in accumulation: collect 4 sparks, and you unlock the ability to exchange them for real, on-chain tokens at the Crystle Town Exchange Terminal.'
      },
      {
        type: 'heading',
        text: 'Where Hunt Sparks Drop'
      },
      {
        type: 'paragraph',
        text: 'Hunt Sparks drop from dungeon combat — and importantly, they drop for hunters at any level. There is no level gate, no minimum floor requirement. If you can fight, you can earn. The source matters, though. Not all enemies carry the same spark density.'
      },
      {
        type: 'heading',
        text: 'Drop Rates by Enemy Type'
      },
      {
        type: 'paragraph',
        text: 'Boss Monsters carry a guaranteed Hunt Spark. Every single boss kill — from the Neon Slums to the Abyssal Trench — will yield one spark. This is the most reliable farming strategy: target boss-heavy sectors and stack your runs.'
      },
      {
        type: 'paragraph',
        text: 'Elite Champions have a 20% drop chance. One in five Champion kills will produce a spark. Since Champions appear more frequently than bosses and carry their own valuable loot tables, they are the most efficient mid-tier farming target.'
      },
      {
        type: 'paragraph',
        text: 'Normal monsters carry a 2% drop rate — a long shot, but not zero. In a deep dungeon run with dozens of kills, these low-probability drops add up. Every kill is a lottery ticket, and the grid pays out more often than you might expect.'
      },
      {
        type: 'image',
        src: '/assets/monsters/Neon Slums/Azure Glider.jpg',
        caption: 'Boss-tier enemies like the Azure Glider guarantee a Hunt Spark on every defeat.'
      },
      {
        type: 'heading',
        text: 'Auto-Hunt and Sparks'
      },
      {
        type: 'paragraph',
        text: 'Yes — Auto-Scrolls earn Hunt Sparks. When you activate an Auto-Scroll and your Hunter fights autonomously, every kill goes through the same combat reward pipeline. Sparks earned during auto-hunt are automatically deposited into your inventory. Activating a scroll before you step away is one of the most passive ways to accumulate sparks over time.'
      },
      {
        type: 'heading',
        text: 'Satchel Awareness'
      },
      {
        type: 'paragraph',
        text: 'Hunt Sparks take inventory slots — one slot per spark. If your satchel is full when a spark would drop, it is abandoned on the grid floor and lost permanently. Before heading into a spark-farming run, make sure you have at least a few open slots. Selling junk loot or upgrading your storage capacity at the Storage Core are both smart pre-run moves.'
      },
      {
        type: 'heading',
        text: 'The Exchange: 4 Sparks = On-Chain Rewards'
      },
      {
        type: 'paragraph',
        text: 'Once you have collected 4 Hunt Sparks, head to Crystle Town and locate the Exchange Terminal. You will be presented with a choice: burn your 4 sparks to receive either 0.01 $HUNT or 0.1 $DWGX, delivered directly to your linked Base wallet.'
      },
      {
        type: 'paragraph',
        text: 'The exchange is processed server-side via a secure Cloud Function. Your sparks are verified and deducted atomically — meaning you cannot lose sparks without receiving your tokens, and you cannot claim tokens without burning sparks. If the on-chain transfer fails for any reason, the transaction rolls back and your sparks are preserved.'
      },
      {
        type: 'image',
        src: '/assets/gamescreenshot/mainmenuscreenshot.png',
        caption: 'The Crystle Town Exchange Terminal — your bridge from dungeon loot to on-chain value.'
      },
      {
        type: 'heading',
        text: 'Farming Strategy: Target Priorities'
      },
      {
        type: 'paragraph',
        text: 'If your goal is maximum sparks per hour, your priority order is clear. First: boss-heavy maps. Every boss kill is a guaranteed spark, so sectors with high boss density — especially at deeper floors where bosses appear more frequently — are your best bet. Second: Elite Champions. With a 20% rate and higher spawn frequency than bosses, Champions are your steady income stream. Third: volume. The 2% rate on normal monsters means the more you kill, the more you earn. Stack Auto-Scrolls during downtime and let the grid work for you.'
      },
      {
        type: 'paragraph',
        text: 'One more tip: your Sync-Drive Elemental Skill accelerates kills, which accelerates spark drops. Level up your chosen element and use skills aggressively against Champions and Bosses to shorten fight duration and increase your kills-per-minute.'
      },
      {
        type: 'heading',
        text: 'Quick Summary'
      },
      {
        type: 'paragraph',
        text: 'Bosses: 100% drop. Elite Champions: 20% drop. Normal Monsters: 2% drop. Auto-Scrolls: yes, they earn sparks. Exchange: 4 sparks = 0.01 $HUNT or 0.1 $DWGX at Crystle Town. Inventory: 1 slot per spark — keep space open. The grid is full of sparks, Hunter. Go earn them.'
      }
    ],
    media: '/assets/monsters/Neon Slums/Azure Glider.jpg'
  },
  {
    id: 'dwg-nft-gift-guide',
    date: '2026-05-29',
    author: 'Commander Gemx',
    authorAvatar: 24,
    title: 'Quartermaster\u2019s Gift: Claiming Your Trilith Gemx NFTs',
    subtitle: 'A complete guide to the Welcome NFT and Level 10 Milestone rewards — how to claim, where to view, and the technology powering your on-chain treasures.',
    category: 'NFT REWARDS & ONBOARDING',
    type: 'article',
    tag: 'NEW',
    color: 'cyan',
    readingTime: '6 min',
    content: [
      {
        type: 'paragraph',
        text: 'The grid has a new tradition. Every Hunter who completes their Neural Link onboarding is now greeted by the Quartermaster with a rare, on-chain gift. Additionally, reaching the Level 10 milestone unlocks a second treasure from the vault. This guide covers everything you need to know about the Trilith Gemx NFT collection — what they are, how to claim them, and where to track them.'
      },
      {
        type: 'heading',
        text: 'The Trilith Gemx Collection'
      },
      {
        type: 'paragraph',
        text: 'The Gemx Collection consists of two limited-edition ERC-1155 tokens deployed on the Base blockchain. Each token is a soulbound-style marker of your journey through the Dungeons With Gems ecosystem — proof that you were here from the beginning.'
      },
      {
        type: 'paragraph',
        text: 'The Trilith Sapphire Gemx is the first prize: a welcome gift distributed by the Quartermaster to the first 20 Hunters who complete the onboarding sequence. The Trilith Emerald Gemx is unlocked at Level 10, marking your graduation from the beginner sectors into full-fledged Hunter status. Both tokens are visible in your Identity Core and verifiable on-chain via Basescan.'
      },
      {
        type: 'image',
        src: '/assets/gamescreenshot/mainmenuscreenshot.png',
        caption: 'Your Gemx NFTs are tracked in the Identity Core under the NFT Collection panel.'
      },
      {
        type: 'heading',
        text: 'How to Claim Your Welcome Gift (Trilith Sapphire Gemx)'
      },
      {
        type: 'paragraph',
        text: 'The Sapphire Gemx is presented automatically to every first-time Hunter who completes the onboarding sequence. Here is exactly what happens, step by step:'
      },
      {
        type: 'heading',
        text: 'Step 1: Complete the Welcome Screen'
      },
      {
        type: 'paragraph',
        text: 'When you first log in to Dungeons With Gems, you are greeted by the Welcome Screen — a brief narrative introduction to the grid. Read through the transmissions and select \"I Understand. Proceed\" at the bottom. This completes your neural link initialization and triggers the Quartermaster\u2019s gift protocol.'
      },
      {
        type: 'heading',
        text: 'Step 2: The Gift Reveal'
      },
      {
        type: 'paragraph',
        text: 'After completing the welcome screen, the Quartermaster (NPC 3) appears in a dramatic transmission overlay. You will see a pulsing cyan Sapphire icon with the message: \"The Quartermaster is sending a Trilith Sapphire Gemx to your wallet.\" A live counter below shows how many gifts remain in the treasury. This reveal lasts approximately 3 seconds before the claiming process begins automatically.'
      },
      {
        type: 'heading',
        text: 'Step 3: Connect Your Wallet (If Needed)'
      },
      {
        type: 'paragraph',
        text: 'If you have not yet linked a Base-compatible wallet, you will be shown the Wallet Prompt Overlay. This full-screen interface lets you connect via RainbowKit (MetaMask, WalletConnect, Coinbase Wallet, or any injected provider). A live on-chain counter displays how many NFTs remain. Two-step skip confirmation ensures you understand the scarcity — only 20 Sapphires exist, and skipping means you risk losing your claim permanently.'
      },
      {
        type: 'image',
        src: '/assets/gamescreenshot/mainmenuscreenshot.png',
        caption: 'The Wallet Prompt Overlay guides you through connecting your Base wallet with live remaining-supply tracking.'
      },
      {
        type: 'heading',
        text: 'Step 4: Automatic Claim & Confirmation'
      },
      {
        type: 'paragraph',
        text: 'Once your wallet is connected and synced to your player profile, the claim executes automatically. Behind the scenes, a secure Cloud Function performs an atomic two-phase operation: first, it reserves your slot in Firestore via a transaction (incrementing the nftCount to prevent oversubscription), then it calls the ERC-1155 safeTransferFrom on the NFT contract to send exactly 1 Sapphire Gemx from the Quartermaster\u2019s treasury wallet to your address. If the on-chain transfer fails for any reason, the reservation is rolled back and the slot is returned to the pool — ensuring no slot is ever wasted.'
      },
      {
        type: 'heading',
        text: 'Step 5: Success & Entry'
      },
      {
        type: 'paragraph',
        text: 'On success, you will see a green confirmation screen with a Basescan link to your transaction hash. Click \"ENTER THE GRID\" to begin your adventure. Your Sapphire Gemx is now permanently visible in the Identity Core under the NFT Collection section.'
      },
      {
        type: 'heading',
        text: 'Error Recovery'
      },
      {
        type: 'paragraph',
        text: 'If the transfer fails due to network congestion or gas issues, you will see an amber error screen with the specific failure reason. You can retry the claim or skip and continue into the game. Your wallet remains linked, and you can always retry later from the Identity Core. The Sapphire slot is preserved during the retry window.'
      },
      {
        type: 'heading',
        text: 'The Level 10 Milestone: Trilith Emerald Gemx'
      },
      {
        type: 'paragraph',
        text: 'The second Gemx in the collection is earned through gameplay, not onboarding. When your Hunter reaches Level 10, the system automatically detects the milestone and triggers the Emerald Gemx reward flow.'
      },
      {
        type: 'heading',
        text: 'Auto-Detection & Reservation'
      },
      {
        type: 'paragraph',
        text: 'The useLevel10Reward hook monitors your player level continuously. The moment you hit Level 10, it calls the claimLevel10Nft Cloud Function. If you already have a wallet linked, the Emerald is transferred on-chain immediately. If not, the system reserves your Emerald in Firestore and displays a notification: \"A Trilith Emerald Gemx has been reserved for you. Link your wallet to claim.\"'
      },
      {
        type: 'heading',
        text: 'The Celebration Modal'
      },
      {
        type: 'paragraph',
        text: 'When the Emerald claim triggers, a full-screen celebration modal appears. It cycles through states: a pulsing emerald with bouncing dots during the transaction, a success card with a Basescan link and \"Continue\" button on completion, or a warning with retry/skip options if something goes wrong. You can dismiss the modal with the Escape key once the claim is resolved.'
      },
      {
        type: 'heading',
        text: 'Supply Scarcity'
      },
      {
        type: 'paragraph',
        text: 'Both Gemx tokens are strictly limited. The Welcome Sapphire is capped at 20 NFTs. The Level 10 Emerald is also limited. If the treasury is exhausted when you reach the milestone, you will see a gentle notification in the game log rather than a blocking modal — because your achievement still matters, even if the physical token supply has run dry.'
      },
      {
        type: 'image',
        src: '/assets/gamescreenshot/mainmenuscreenshot.png',
        caption: 'The Level 10 Celebration modal marks your ascension with a cinematic Gemx transmission.'
      },
      {
        type: 'heading',
        text: 'Where to View Your NFTs'
      },
      {
        type: 'paragraph',
        text: 'Navigate to the Identity Core from the main Menu. If you have a wallet linked, scroll down to the \"NFT Collection\" divider. Here you will see both Gemx tokens displayed as individual cards with glowing gem icons, quantity badges, and direct Basescan transaction links. The Sapphire card uses a cyan gradient and the Emerald card uses an emerald gradient — each with its own pulsing glow animation. If a token is claimed but still awaiting on-chain confirmation, a subtle amber status banner appears instead.'
      },
      {
        type: 'heading',
        text: 'The Technology Powering Your Gifts'
      },
      {
        type: 'paragraph',
        text: 'The NFT distribution system is built on three layers. The frontend uses React hooks (useWelcomeNft, useRemainingNfts, useLevel10Reward) that manage claim state, auto-detect triggers, and poll the Base blockchain every 15 seconds for live supply counts via Viem public client. The backend uses Firebase Cloud Functions with atomic Firestore transactions for reservation, ethers.js v6 for on-chain ERC-1155 transfers, and automatic rollback logic that returns slots to the pool if transfers fail. The NFT contract is a standard ERC-1155 deployed on Base (0x182D92921c49ca5cf9bc53c013dE735446507dE1) with the Quartermaster\u2019s treasury wallet (0x8dca8d7B35004630F460B85F70d1189795CDe6Fc) as the distributor.'
      },
      {
        type: 'paragraph',
        text: 'This architecture ensures that every claim is atomic, verifiable, and fair. No slot can be double-claimed. No transfer can silently fail. And every Gemx is traceable from the moment it leaves the treasury to the moment it lands in your wallet.'
      },
      {
        type: 'paragraph',
        text: 'The Quartermaster\u2019s vault is open. Claim your Gemx, Hunter, and wear it as proof that you were here when the grid was young.'
      }
    ],
    media: '/assets/gamescreenshot/mainmenuscreenshot.png'
  },
  {
    id: 'dwg-secure-progression-uplink',
    date: '2026-05-22',
    author: 'Commander Gemx',
    authorAvatar: 24,
    title: 'Secure Progression: The Server-Side Level Up Sync',
    subtitle: 'Securing the iLearn quiz completion engine, stat level-ups, and ability point calculations with server-side transactions and local optimistic updates.',
    category: 'SECURITY & SYNC SYSTEM',
    type: 'article',
    tag: 'NEW',
    color: 'emerald',
    readingTime: '5 min',
    content: [
      {
        type: 'paragraph',
        text: 'Today\'s deployment addresses a core architectural boundary of the Hunt Crystle economy: player progression. Client-side state mutations are inherently vulnerable, prompting us to transition crucial progression updates directly to secure Cloud Functions.'
      },
      {
        type: 'heading',
        text: 'Securing iLearn Quiz completions'
      },
      {
        type: 'paragraph',
        text: 'Completing quizzes in the iLearn terminal previously attempted to directly write XP, Level, HP, and Ability Point gains to Firestore. Under our strict security rules, these direct client-side updates are blocked. We have migrated the entire completion logic into a secure, server-side Cloud Function transaction (the COMPLETE_QUIZ action). The server now handles calculations for stat boosts, inventory rewards, and level-ups internally.'
      },
      {
        type: 'heading',
        text: 'The AP Auto-Heal & Exploit Blockade'
      },
      {
        type: 'paragraph',
        text: 'To protect the grid from arbitrary Ability Point (AP) injection, the server now calculates available AP mathematically. The formula, Ability Points = Level * 5 - (spent stats), runs within the secure transaction and is enforced on player document load. If any discrepancy in AP is detected, the database automatically heals the player profile to its correct mathematical state.'
      },
      {
        type: 'image',
        src: '/assets/gamescreenshot/mainmenuscreenshot.png',
        caption: 'The iLearn terminal now safely processes progression and level-ups via secure server transactions.'
      },
      {
        type: 'heading',
        text: 'Flicker-Free Optimistic Syncing'
      },
      {
        type: 'paragraph',
        text: 'Relying purely on server-side updates can introduce network lag, causing screen flickering. To combat this, we engineered an optimistic updates tracker (addOptimisticUpdate) that predicts the state transition locally. Local changes are temporarily preserved and merged with incoming database snapshots, preventing outdated Firestore reads from overriding immediate player actions during transaction transit.'
      },
      {
        type: 'heading',
        text: 'Separated Inventory Disposals'
      },
      {
        type: 'paragraph',
        text: 'Additionally, we separated the Sell and Unequip flows on equipped inventory assets. Equipped items now show a dedicated "Unequip" button; users must explicitly unequip items before they can be sold. This prevents concurrent Cloud Function calls (unequip + sell) from triggering database document conflicts, securing real-time persistence.'
      }
    ],
    media: '/assets/gamescreenshot/mainmenuscreenshot.png'
  },
  {
    id: 'dwg-sell-system-hardening',
    date: '2026-05-18',
    author: 'Commander Gemx',
    authorAvatar: 24,
    title: 'Vault Mechanics: Selling, Storage & Secure Commerce',
    subtitle: 'Full-stack hardening of the inventory economy — from sell-side validation to bag-capacity enforcement and floating reward feedback.',
    category: 'ECONOMY & SECURITY',
    type: 'article',
    tag: 'NEW',
    color: 'cyan',
    readingTime: '4 min',
    content: [
      {
        type: 'paragraph',
        text: 'Today\'s deployment targets one of the most foundational layers of the Hunt Crystle economy: the inventory. From the moment a hunter picks up loot to the moment they convert it back into GX, every step in that loop has been hardened, validated, and polished.'
      },
      {
        type: 'heading',
        text: 'The Sell Validation Fix'
      },
      {
        type: 'paragraph',
        text: 'A subtle but critical bug was discovered in the backend SELL_ITEM handler. Items generated with short random suffixes (such as a single character like "i" or "9") were failing the server-side catalog lookup entirely, triggering a silent "This item cannot be sold" error. We have replaced the fragile regex with a robust extractBaseId() function that anchors on the 13-digit millisecond timestamp instead of suffix length — making every item in every inventory universally sellable.'
      },
      {
        type: 'heading',
        text: 'Floating GX Rewards'
      },
      {
        type: 'paragraph',
        text: 'Selling items now gives you instant visual confirmation. A glowing "+X GX" tooltip spawns directly at your cursor the moment the Cloud Function confirms the transaction. The floater rises, scales, and fades — delivering a satisfying economic loop that feels as rewarding as the combat drops that earned the loot in the first place.'
      },
      {
        type: 'image',
        src: '/assets/gamescreenshot/mainmenuscreenshot.png',
        caption: 'The floating GX tooltip appears at cursor position on every confirmed sell.'
      },
      {
        type: 'heading',
        text: 'Bag Capacity Enforcement'
      },
      {
        type: 'paragraph',
        text: 'The inventory capacity system now has teeth. Before this update, a player could bypass the slot cap entirely by purchasing from the Shop or Marketplace while overburdened. This has been sealed at both layers: the frontend now immediately blocks the call and displays a descriptive error message, while the backend Cloud Function applies a server-side slot count check as a secondary defense. Counter items like HP Potions and Auto Scrolls — stored as numeric counters, not slots — remain unaffected.'
      },
      {
        type: 'paragraph',
        text: 'The grid economy is only as strong as its enforcement. Every fix today brings us one step closer to an airtight, tamper-resistant ecosystem built for hunters, not exploits.'
      }
    ],
    media: '/assets/gamescreenshot/mainmenuscreenshot.png'
  },
  {
    id: 'dwg-hunt-spark-economy',
    date: '2026-05-16',
    author: 'Commander Gemx',
    authorAvatar: 24,
    title: 'The Spark Economy: Distributing the $HUNT',
    subtitle: 'Breaking the barrier: How Hunt Sparks are decentralizing rewards for every level of hunter.',
    category: 'TOKEN ECONOMY',
    type: 'article',
    tag: 'NEW',
    color: 'emerald',
    readingTime: '4 min',
    content: [
      {
        type: 'paragraph',
        text: 'Until now, the bridge between the grid and the decentralized treasury was reserved for the elite. But the grid is expanding. Today, we announce the Hunt Spark Protocol—a system designed to put $HUNT and $DWGX directly into the hands of every hunter, from the newest recruit to the seasoned veteran.'
      },
      {
        type: 'heading',
        text: 'Hunt Sparks: The Beginner\'s Gateway'
      },
      {
        type: 'paragraph',
        text: 'Unlike the elusive Aether Sparks, Hunt Sparks are obtainable by hunters of all levels. We’ve calibrated the dungeon resonators to drop these rare artifacts from every enemy type. Bosses now carry a 100% drop rate, while Elite Champions hold a 20% resonance. Even normal mobs have a small chance to yield a Spark for the lucky hunter.'
      },
      {
        type: 'heading',
        text: 'The Decision Terminal'
      },
      {
        type: 'paragraph',
        text: 'At the heart of Crystle Town, a new terminal has been activated. Here, you hold the power of choice. By burning 4 Hunt Sparks, you can initiate a transmission for either 0.01 $HUNT or 0.1 $DWGX. This direct-to-wallet transfer is processed via our secure Cloud infrastructure, ensuring that your rewards are as safe as they are earned.'
      },
      {
        type: 'image',
        src: '/assets/gamescreenshot/mainmenuscreenshot.png',
        caption: 'The Decision Terminal: Choose your path, claim your reward.'
      },
      {
        type: 'heading',
        text: 'Aggressive Distribution'
      },
      {
        type: 'paragraph',
        text: 'We are increasing Elite spawn rates by 50% to ensure the grid is saturated with opportunities. This isn\'t just an update; it\'s an economic shift. By rewarding tactical combat and dungeon mastery, we are building a more robust, active, and rewarding ecosystem for everyone.'
      },
      {
        type: 'paragraph',
        text: 'The treasury is open. The sparks are flying. Good hunting.'
      }
    ],
    media: '/assets/gamescreenshot/mainmenuscreenshot.png'
  },
  {
    id: 'dwg-neural-shield-deployment',
    date: '2026-05-15',
    author: 'Commander Gemx',
    authorAvatar: 24,
    title: 'Neural Shield Protocol: The ReCaptcha Revolution',
    subtitle: 'Enforcing a bot-free ecosystem with the new Neural Handshake and Secure Game Action architecture.',
    category: 'SECURITY ENFORCEMENT',
    type: 'article',
    tag: 'NEW',
    color: 'amber',
    readingTime: '5 min',
    content: [
      {
        type: 'paragraph',
        text: 'The grid is under constant siege. Automated script-bots and headless browsers have long attempted to infiltrate our resource pools. Today, we fight back with the deployment of the Neural Shield Protocol.'
      },
      {
        type: 'heading',
        text: 'The Neural Handshake'
      },
      {
        type: 'paragraph',
        text: 'We have integrated Google ReCaptcha Enterprise (Firebase App Check) directly into the game\'s neural link. This "Neural Handshake" verifies every single hunter in the background. If you’re human, you won’t even feel it. If you’re a bot, you hit a brick wall.'
      },
      {
        type: 'heading',
        text: 'Secure Game Actions (SGA)'
      },
      {
        type: 'paragraph',
        text: 'We’ve moved the game\'s brain. Critical actions—Buying items, claiming Market payouts, and processing Boss rewards—no longer happen solely on your device. They are now processed via Secure Game Action (SGA) Cloud Functions. This ensures that every transaction is validated on the server side, making it impossible to "spoof" wealth or levels.'
      },
      {
        type: 'image',
        src: '/assets/gamescreenshot/mainmenuscreenshot.png',
        caption: 'The Neural Shield is now active across all major command hubs.'
      },
      {
        type: 'heading',
        text: 'Bot-Free Economy'
      },
      {
        type: 'paragraph',
        text: 'By enforcing App Check, we ensure that every GX token and every piece of loot is earned by a real player. This protects the value of your inventory and keeps the leaderboard competitive for everyone.'
      },
      {
        type: 'paragraph',
        text: 'The grid is now safer, faster, and fairer. Keep hunting, and let the shield hold.'
      }
    ],
    media: '/assets/gamescreenshot/mainmenuscreenshot.png'
  },
  {
    id: 'dwg-totality-audit',
    date: '2026-05-07',
    author: 'Commander Gemx',
    authorAvatar: 24,
    title: 'The State of the Grid: The Totality of DWGX',
    subtitle: 'A comprehensive deep-dive into the systems, economy, and genre-defying nature of Dungeons With Gems.',
    category: 'SYSTEM AUDIT',
    type: 'article',
    tag: 'NEW',
    color: 'emerald',
    readingTime: '6 min',
    content: [
      {
        type: 'paragraph',
        text: 'DWGX is more than just an extraction protocol. It is a living terminal, a complete ecosystem where every mechanic carries weight. Today, we audit the totality of the system.'
      },
      {
        type: 'heading',
        text: 'The Identity: "Edu-Fi"'
      },
      {
        type: 'paragraph',
        text: 'The most innovative part of DWGX is the iLearn system. By bridging real-world knowledge (quizzes) with in-game progression and ETH subsidies, we’ve created a "Learn-to-Earn" loop that feels organic rather than forced. It’s a game that actually makes the player smarter while they play.'
      },
      {
        type: 'heading',
        text: 'The Genre Fusion'
      },
      {
        type: 'paragraph',
        text: 'DWGX defies a single label. It is an Idle/Incremental RPG that respects the player\'s time through Auto-Hunt scrolls and XP-to-GX overflow. It is a Tactical Dungeon Crawler where the Sync-Drive Elemental system and Champion mechanics ensure combat requires skill and timing. Finally, it is a Social Strategy hub where Syndicate Wars and Naga Wars transform solo play into community competition.'
      },
      {
        type: 'heading',
        text: 'The Economic Loop: The Golden Circle'
      },
      {
        type: 'paragraph',
        text: 'We have achieved a Closed-Loop Economy. GX is drained through Sinks like Potion/Scroll purchases, the Laboratory, and the Forge, while being replenished through Faucets like combat and iLearn. The "Endgame Valve"—the Level 100 cap for Hunters, Dragons, GEMX, and Pets—ensures the game transitions from "growth" to "harvesting" for elite players.'
      },
      {
        type: 'image',
        src: '/assets/gamescreenshot/mainmenuscreenshot.png',
        caption: 'The Command Center: A fusion of gaming, education, and finance.'
      },
      {
        type: 'heading',
        text: 'The Aesthetic Polish'
      },
      {
        type: 'paragraph',
        text: 'Beyond the code, the Premium Cyber-Comic aesthetic—with its heavy borders, vibrant HSL gradients, and cinematic "Sync-Drive" cut-ins—gives the game a high-production feel that stands out in the browser.'
      },
      {
        type: 'heading',
        text: 'Final Thoughts'
      },
      {
        type: 'paragraph',
        text: 'DWGX feels like a living terminal. It’s part game, part educational tool, and part crypto-economy. Every mechanic—from eating a food buff to burning an Aether Spark—feels heavy and meaningful. It is a complete, stable, and highly addictive ecosystem. Commander Gemx, the grid is officially yours.'
      }
    ],
    media: '/assets/gamescreenshot/mainmenuscreenshot.png'
  },
  {
    id: 'dwg-aether-exchange',
    date: '2026-05-07',
    author: 'Commander Gemx',
    authorAvatar: 24,
    title: 'Aether Sparks: Bridging Dungeon Mastery and Rewards',
    subtitle: 'The introduction of Aether Sparks and the premium exchange system for Level 100 hunters.',
    category: 'ENDGAME ECONOMY',
    type: 'article',
    tag: 'LATEST',
    color: 'cyan',
    readingTime: '4 min',
    content: [
      {
        type: 'paragraph',
        text: 'The endgame has evolved. As our first wave of hunters approaches the Level 100 milestone, we are deploying the Aether Spark protocol—a high-stakes reward system that translates combat excellence into tangible value.'
      },
      {
        type: 'heading',
        text: 'The Aether Spark Discovery'
      },
      {
        type: 'paragraph',
        text: 'Aether Sparks are rare, high-energy fragments discovered only within the bodies of Elite Champions. These sparks are invisible to lower-level hunters, but for those who have reached Level 100, they manifest as rare loot drops after successful hunts.'
      },
      {
        type: 'heading',
        text: 'Elite Champions Only'
      },
      {
        type: 'paragraph',
        text: 'To maintain the rarity and value of Aether, these sparks only drop from Champion-class monsters. Every time a Level 100 hunter defeats an Elite Champion, there is a calibrated 10% chance for an Aether Spark to be extracted. This encourages tactical targeting of higher-tier enemies in the deepest sectors of the grid.'
      },
      {
        type: 'image',
        src: '/assets/monsters/Neon Slums/Azure Glider.jpg',
        caption: 'Only the most powerful Elite Champions carry the volatile Aether Sparks.'
      },
      {
        type: 'heading',
        text: 'The Crystle Town Exchange'
      },
      {
        type: 'paragraph',
        text: 'Once a hunter has collected 4 Aether Sparks, they can head to the newly established Aether Exchange Terminal in Crystle Town. By harmonizing these sparks with the town\'s core energy, hunters can authorize a premium ETH subsidy. This system ensures that our most dedicated players have a sustainable and rewarding path forward beyond the level cap.'
      },
      {
        type: 'paragraph',
        text: 'The Aether Exchange represents the next step in our vision for a player-driven, rewarding economy. Good luck out there, hunters!'
      }
    ],
    media: '/assets/monsters/Neon Slums/Azure Glider.jpg'
  },
  {
    id: 'dwg-economy-overflow',
    date: '2026-05-06',
    author: 'Commander Gemx',
    authorAvatar: 24,
    title: 'Endgame Economy: Level 100 Cap & XP Overflow',
    subtitle: 'Breaking down the new Level 100 Hard Cap and how XP Overflow converts time into wealth.',
    category: 'ECONOMY & BALANCE',
    type: 'article',
    tag: 'LATEST',
    color: 'emerald',
    readingTime: '3 min',
    content: [
      {
        type: 'paragraph',
        text: 'The grid is getting more competitive, and with it, the necessity for a balanced economy. Today, we are introducing a hard Level 100 Cap for all Hunters.'
      },
      {
        type: 'heading',
        text: 'The Level 100 Cap'
      },
      {
        type: 'paragraph',
        text: 'We noticed that infinite scaling of base stats eventually trivializes the importance of equipment, tactical party combinations, and premium items. By capping the maximum level at 100, we\'ve shifted the endgame meta. At Level 100, your base stats are locked. The only way to push further into the hardest sectors (like Tectonic Ridge or the Abyssal Trench) is to upgrade your Arsenal through the Forge, rely on powerful Syndicate Labs, and engage with the marketplace.'
      },
      {
        type: 'heading',
        text: 'XP Overflow: Turning Time into Wealth'
      },
      {
        type: 'paragraph',
        text: 'We didn\'t want the XP earned by our elite max-level Hunters to go to waste. That\'s why we built the XP Overflow Protocol. Any XP you earn after reaching Level 100 is instantly intercepted and converted into GX at a 1:0.5 ratio. This means every dungeon run and every completed iLearn quiz now directly funds your economic empire.'
      },
      {
        type: 'image',
        src: '/assets/monsters/Abyssal Trench/Trench Terror.jpg',
        caption: 'With the XP Overflow Protocol, grinding in high-level zones yields massive GX returns.'
      },
      {
        type: 'heading',
        text: 'Quality of Life Upgrades'
      },
      {
        type: 'paragraph',
        text: 'We also refined the tactical UI. Defeat screens will now cleanly stack identical loot drops, complete with a quantity badge, so you can easily review your haul at a glance. Additionally, the Cyber Commerce shop now features direct typing for quantity inputs, making bulk item requisition seamless.'
      },
      {
        type: 'paragraph',
        text: 'Good hunting, and enjoy the new economic engine!'
      }
    ],
    media: '/assets/monsters/Abyssal Trench/Trench Terror.jpg'
  },
  {
    id: 'dwg-combat-effects-v2',
    date: '2026-05-03',
    author: 'Commander Gemx',
    authorAvatar: 24,
    title: 'Visceral Engagement: The Power Overflow Upgrade',
    subtitle: 'Redefining tactical feedback with high-fidelity cinematic effects.',
    category: 'DEVELOPMENT',
    type: 'article',
    tag: 'FEATURED',
    color: 'cyan',
    readingTime: '4 min',
    content: [
      {
        type: 'paragraph',
        text: 'A critical component of any extraction protocol is the visceral feedback you receive when pushing your Hunter to the limits. Up until now, leveling up during a high-stakes dungeon dive felt underwhelming—a mere sprinkle of upward arrows that failed to capture the sheer power of ascension.'
      },
      {
        type: 'heading',
        text: 'Enter: Power Overflow'
      },
      {
        type: 'paragraph',
        text: 'Today, we deployed a massive overhaul to the combat engine\'s visual feedback loops. The "Power Overflow" cinematic cut-in completely transforms the level-up experience. When your Hunter crosses that XP threshold, the grid responds: the arena flashes, the screen shakes violently, and a massive, skewed banner slams into view, flanked by glowing data cards detailing your stat increases.'
      },
      {
        type: 'image',
        src: '/assets/gamescreenshot/battlegamescreenshot.png',
        caption: 'The Power Overflow sequence brings a premium cinematic feel to your mid-combat ascensions.'
      },
      {
        type: 'paragraph',
        text: 'We didn\'t just stop at visual flair. The auditory experience has been synchronized, tying specific sound hooks directly to these moments of triumph, creating a truly multi-sensory feedback loop.'
      },
      {
        type: 'heading',
        text: 'Engine Hardening & UI Stabilization'
      },
      {
        type: 'paragraph',
        text: 'Along with the visual upgrades, we performed a deep-dive stabilization of the underlying combat engine (`useCombat.js`). We squashed a critical regression that was causing confirmation modals to fail during tactical retreats. By cleaning up redundant state variables and restoring lost telemetry references, the UI is now significantly more robust.'
      },
      {
        type: 'paragraph',
        text: 'Furthermore, we cleaned up the "Squad Strike" rendering pipeline. Hunters noticed a slight visual artifact where the tactical intervention banner was rendering twice. We have surgically removed the legacy duplicate, ensuring that your pet, mate, or dragon interventions look cleaner and more impactful than ever.'
      },
      {
        type: 'paragraph',
        text: 'The grid is getting more dangerous, but your feedback loops are getting sharper. Keep hunting, and let the power flow.'
      }
    ],
    media: '/assets/gamescreenshot/battlegamescreenshot.png'
  },
  {
    id: 'dwg-first-article',
    date: '2026-05-02',
    author: 'Commander Gemx',
    authorAvatar: 24,
    title: 'Dungeons With Gems: A New Era of Tactical Extraction',
    subtitle: 'Bridging the gap between idle progression and high-stakes tactical combat.',
    category: 'DEEP DIVE',
    type: 'article',
    tag: 'FEATURED',
    color: 'amber',
    readingTime: '5 min',
    content: [
      {
        type: 'paragraph',
        text: 'The grid is evolving. What started as a simple extraction protocol in the Neon Slums has transformed into a complex ecosystem of risk, reward, and tactical mastery. Today, we take a deep dive into the state of Dungeons With Gems and the massive strides we’ve taken to harden the core experience.'
      },
      {
        type: 'heading',
        text: 'The Soul of the Grid: Tactical Combat'
      },
      {
        type: 'paragraph',
        text: 'Combat in Dungeons With Gems was never meant to be just a numbers game. With the latest deployment of the "Sync-Drive" Elemental Skill system, we’ve moved closer to our vision of high-impact, tactical combat. Every strike now carries the weight of energy accumulation, leading up to cinematic "Elite" skill executions that can turn the tide of a battle in a split second.'
      },
      {
        type: 'image',
        src: '/assets/dungeonsground/GaleGroundBackdrop.jpg',
        caption: 'Gale Empire: One of the high-altitude sectors requiring advanced tactical maneuvering.'
      },
      {
        type: 'paragraph',
        text: 'Our progress today focused heavily on the refinement of these systems. We’ve finalized the skill activation logic, ensuring that energy accumulation is balanced through precision-based "Crit Bonuses". This adds a layer of depth—hunters must now weigh the benefit of a quick strike against the potential for a massive, skill-driven payoff.'
      },
      {
        type: 'heading',
        text: 'Enter the Champions: Elite Monster Protocols'
      },
      {
        type: 'paragraph',
        text: 'The dungeon floors are no longer just filled with cannon fodder. We’ve begun the deployment of "Elite" monsters—Champions that possess unique tactical abilities. These aren’t just stat-boosted versions of common foes; they are strategic hurdles. From "Ambush" strikes on Turn 1 to "Desperation" thresholds that trigger massive counter-attacks at low HP, these Champions demand respect.'
      },
      {
        type: 'paragraph',
        text: 'Defeating a Champion is a mark of a true Hunter. It requires not just gear, but a deep understanding of the elemental affinities and timing your skills to bypass their defensive protocols.'
      },
      {
        type: 'image',
        src: '/assets/monsters/Void Sector 7/Void Wraith.jpg',
        caption: 'Elite Void Wraith: Its neural-dampening aura makes it one of the most feared Champions in Sector 7.'
      },
      {
        type: 'heading',
        text: 'Visual Fidelity and Neural Feedback'
      },
      {
        type: 'paragraph',
        text: 'A hunter is only as good as their HUD. We’ve overhauled the visual feedback system to include Champion auras, skill cut-in banners, and reboot status indicators. This ensures that in the heat of combat, you have all the intelligence needed to make split-second decisions.'
      },
      {
        type: 'paragraph',
        text: 'The HUD now feels like a living part of your neural uplink. Every spark, every status effect, and every energy surge is communicated with high-fidelity visual cues that bring the "Plasma-Tech" aesthetic to life.'
      },
      {
        type: 'heading',
        text: 'Looking Ahead: The Path to Wealth'
      },
      {
        type: 'paragraph',
        text: 'While combat is the heart, the economy is the lifeblood. We continue to stabilize the GX-to-Material acquisition loops, ensuring that your time in the dungeons translates into real growth. With the ETH Faucet in Crystle Town and the knowledge rewards of iLearn, the path to wealth is clearer than ever.'
      },
      {
        type: 'paragraph',
        text: 'Stay vigilant, Hunters. The grid is full of gems, but it’s also full of danger. We’ll see you in the next floor.'
      }
    ],
    media: '/assets/dungeonsground/GaleGroundBackdrop.jpg'
  }
];

export const ArticlesView = () => {
  const { adventure } = useGame();
  const { setView } = adventure;
  const [selectedArticle, setSelectedArticle] = useState(null);

  const shareToX = (article) => {
    const text = `🚨 NEW ARTICLE: "${article.title}"\n\n${article.subtitle}\n\n📡 Read more: https://metaverse.dungeonswithgems.quest\n\n@DungeonsWithGems #Base #Web3Gaming #GameDev`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const colors = {
    amber: 'text-amber-700 border-amber-600 bg-amber-50',
    cyan: 'text-cyan-700 border-cyan-600 bg-cyan-50',
    emerald: 'text-emerald-700 border-emerald-600 bg-emerald-50',
    purple: 'text-purple-700 border-purple-600 bg-purple-50',
    red: 'text-red-700 border-red-600 bg-red-50',
  };

  if (selectedArticle) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-10 duration-500 p-4 md:p-6 bg-slate-100 relative">
        <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
           <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => setSelectedArticle(null)}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all font-black uppercase italic text-xs"
              >
                <ArrowLeft size={14} /> Back to Feed
              </button>
              <div className="flex items-center gap-2">
                 <button 
                    onClick={() => shareToX(selectedArticle)}
                    className="p-2 bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                 >
                    <Twitter size={18} className="text-black" />
                 </button>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
              <div className="bg-white border-[4px] border-black rounded-3xl overflow-hidden shadow-[12px_12px_0_rgba(0,0,0,1)] mb-8">
                 {/* Article Hero */}
                 <div className="relative aspect-[21/9] md:aspect-[24/9] border-b-[4px] border-black">
                    <img src={selectedArticle.media} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                       <div className="flex items-center gap-2 mb-2">
                          <span className="bg-amber-400 text-black px-3 py-0.5 rounded-full text-[10px] font-black uppercase italic border-2 border-black">
                             {selectedArticle.category}
                          </span>
                          <span className="text-white/80 text-[10px] font-black uppercase italic flex items-center gap-1">
                             <Clock size={10} /> {selectedArticle.readingTime} READ
                          </span>
                       </div>
                       <h1 className="text-2xl md:text-4xl font-[1000] text-white uppercase italic tracking-tighter leading-tight drop-shadow-xl">
                          {selectedArticle.title}
                       </h1>
                    </div>
                 </div>

                 {/* Article Body */}
                 <div className="p-6 md:p-10 space-y-8">
                    {/* Meta */}
                    <div className="flex items-center justify-between pb-6 border-b-2 border-black/5">
                       <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl border-[3px] border-black overflow-hidden bg-slate-900 shadow-[3px_3px_0_rgba(0,0,0,0.1)]">
                             <AvatarMedia num={selectedArticle.authorAvatar} animated={true} className="w-full h-full object-cover" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">AUTHOR_ID</p>
                             <p className="text-sm font-black text-black uppercase italic leading-none">{selectedArticle.author}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">RELEASE_DATE</p>
                          <p className="text-sm font-black text-black uppercase italic leading-none">{selectedArticle.date}</p>
                       </div>
                    </div>

                    {/* Content Loop */}
                    <div className="prose prose-slate max-w-none">
                       {selectedArticle.content.map((block, i) => {
                          if (block.type === 'paragraph') {
                             return <p key={i} className="text-base md:text-lg font-bold text-slate-800 leading-relaxed italic mb-6">"{block.text}"</p>;
                          }
                          if (block.type === 'heading') {
                             return <h2 key={i} className="text-xl md:text-2xl font-[1000] text-black uppercase italic tracking-tighter mb-4 mt-10 flex items-center gap-3">
                                <span className="w-8 h-1 bg-amber-500 rounded-full" /> {block.text}
                             </h2>;
                          }
                          if (block.type === 'image') {
                             return (
                                <div key={i} className="my-8 space-y-2">
                                   <div className="rounded-2xl border-[3px] border-black overflow-hidden shadow-[8px_8px_0_rgba(0,0,0,1)]">
                                      <img src={block.src} className="w-full aspect-video object-cover" alt="" />
                                   </div>
                                   {block.caption && <p className="text-[10px] text-center font-black text-slate-500 uppercase italic tracking-widest">{block.caption}</p>}
                                </div>
                             );
                          }
                          return null;
                       })}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-500 p-4 md:p-6 bg-[#faf6f0] relative">
      <div className="absolute inset-0 pointer-events-none z-0 opacity-5">
        <Newspaper size={400} className="absolute -bottom-20 -right-20 text-amber-500 -rotate-12" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent_70%)]" />
      </div>

      <Header title="ARCHIVES & ARTICLES" onClose={adventure.goBack} npcNum={10} />

      {/* Main Terminal Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 relative z-10 pr-2 pb-20">
        
        {/* Featured Section */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <Sparkles className="text-amber-500" size={18} />
              <h2 className="text-xs font-[1000] text-black uppercase italic tracking-[0.3em]">Latest Intel Drops</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ARTICLES_DATA.map((article) => (
                <div 
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="group cursor-pointer bg-white border-[3px] border-black rounded-3xl overflow-hidden shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex flex-col"
                >
                   <div className="aspect-[16/9] relative border-b-[3px] border-black overflow-hidden">
                      <img src={article.media} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                      <div className="absolute top-3 left-3 flex gap-2">
                         <span className="bg-amber-400 text-black px-2 py-0.5 rounded text-[8px] font-black uppercase italic border-2 border-black shadow-lg">
                            {article.tag}
                         </span>
                      </div>
                   </div>
                   <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">{article.category}</span>
                         <span className="w-1 h-1 rounded-full bg-slate-300" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{article.readingTime} READ</span>
                      </div>
                      <h3 className="text-lg font-[1000] text-black uppercase italic tracking-tighter leading-tight mb-2 group-hover:text-amber-600 transition-colors">
                         {article.title}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-tight italic leading-relaxed line-clamp-2 mb-4">
                         {article.subtitle}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-black/5">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg border-2 border-black overflow-hidden bg-slate-900 shadow-[2px_2px_0_rgba(0,0,0,0.1)]">
                               <AvatarMedia num={article.authorAvatar} animated={true} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[9px] font-black text-black uppercase italic">{article.author}</span>
                         </div>
                         <ChevronRight size={16} className="text-black group-hover:translate-x-1 transition-transform" />
                      </div>
                   </div>
                </div>
              ))}

              {/* Placeholder for future articles */}
              <div className="border-[3px] border-black border-dashed rounded-3xl flex flex-col items-center justify-center p-8 opacity-40 group">
                 <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:animate-spin">
                    <Clock size={24} className="text-slate-400" />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest text-center">Encryption in Progress...<br/>Next intel drop incoming</p>
              </div>
           </div>
        </div>
      </div>

      {/* System Footer */}
      <div className="mt-2 pt-3 border-t-2 border-black/5 flex justify-between items-center relative z-10 shrink-0">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
           <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.5em] italic">ARTICLE_RELAY_ACTIVE</span>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1">
              <Calendar size={10} className="text-slate-400" />
              <span className="text-[8px] font-black text-slate-400 uppercase italic tracking-widest">{new Date().toLocaleDateString()}</span>
           </div>
           <div className="text-[8px] font-black text-amber-600/50 uppercase italic tracking-widest underline decoration-2 decoration-amber-600/20">GRID_PRESS_UPLINK</div>
        </div>
      </div>
    </div>
  );
};
