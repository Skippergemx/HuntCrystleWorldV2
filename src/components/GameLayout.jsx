import React, { useState, useEffect } from 'react';
import {
  Sword, Shield, Coins, Star, Trophy, ShoppingBag,
  Map as MapIcon, ChevronRight, Heart, Zap, Target,
  Wind, Lock, User, RefreshCw, AlertCircle, Sparkles,
  Hammer, Gem, Package, X, TrendingUp, Skull, Flame, Clock,
  PlusCircle, Activity, Coffee, MousePointer, Beer, Users, HelpCircle,
  Book, Globe, Database, HardHat, Footprints,
  Volume2, VolumeX, Music, Music2, SkipForward,
  Calendar, Wallet, ShieldAlert,
  Share2, Twitter, MessageSquare,
  Bug, ShieldAlert as AlertShield, Terminal, Sparkles as SparkleIcon, AlertTriangle,
  Rocket, ExternalLink, FlaskConical
} from 'lucide-react';

import { BOSS, BOSS_MEDIA_FILES, getXpRequired, DEFEAT_WINDOW_DURATION } from '../utils/gameLogic';
import { Header, NavBtn, StatTile, AttributeRow, AvatarMedia, SquadHUD, GuideModal } from './GameUI';
import { ImpactSplash, BossImpactSplash } from './CombatEffects';
import { MenuView } from './MenuView';
import { CombatView } from './CombatView';
import { NagaCombatView } from './NagaCombatView';
import { DungeonMenuView } from './DungeonMenuView';
import { BossView } from './BossView';
import { TavernView } from './TavernView';
import { AttributesView } from './AttributesView';
import { IdentityView } from './IdentityView';
import { ShopView } from './ShopView';
import { ForgeView } from './ForgeView';
import { LeaderboardView } from './LeaderboardView';
import { GearView } from './GearView';
import { MarketplaceView } from './MarketplaceView';
import { InventoryView } from './InventoryView';
import { DatabaseView } from './DatabaseView';
import { MapView } from './MapView';
import { AdminPanelView } from './AdminPanelView';
import { VioAuditView } from './VioAuditView';
import { StorageUpgradeView } from './StorageUpgradeView';
import { DragonsGroundView } from './DragonsGroundView';
import { PvpRoomView } from './PvpRoomView';
import { LaboratoryView } from './LaboratoryView';
import { SyndicateView } from './SyndicateView';
import { PetsView } from './PetsView';
import { ILearnView } from './ILearnView';
import { ManualView } from './ManualView';
import { DevlogView } from './DevlogView';
import { ArticlesView } from './ArticlesView';
import { TokenomicsView } from './TokenomicsView';
import { CrystleTownView } from './CrystleTownView';
import { CrystleBazaarView } from './CrystleBazaarView';
import { BiometricCoreView } from './BiometricCoreView';
import { HunterRegistryView } from './HunterRegistryView';
import { PartyCompanionDock } from './PartyCompanionDock';
import { CompanionChatModal } from './CompanionChatModal';
import { DungeonPrepModal } from './DungeonPrepModal';
// import { EffectsPlayground } from './EffectsPlayground';
import { AnimatedBackground } from './AnimatedBackground';
import { GUIDE_CONTENT } from '../data/guideContent';
import { LoadingScreen } from './LoadingScreen';
import { useGame } from '../contexts/GameContext';

const GlobalErrorOverlay = ({ error, onReport }) => {
  const [reported, setReported] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReport = async () => {
    setIsSubmitting(true);
    const res = await onReport(error);
    setIsSubmitting(false);
    if (res?.success) setReported(true);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
       <div className="max-w-xl w-full relative">
          {/* Comic Shadow */}
          <div className="absolute inset-0 bg-red-900 rounded-[2rem] transform translate-x-3 translate-y-3 opacity-30"></div>
          
          <div className="relative bg-slate-950 border-[4px] md:border-[6px] border-black rounded-[2rem] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-red-600 p-4 md:p-6 border-b-[4px] md:border-[6px] border-black transform -rotate-1 relative overflow-hidden">
               <div className="absolute inset-0 opacity-20 comic-halftone text-black"></div>
               <div className="flex items-center gap-4 relative z-10">
                  <div className="p-2 md:p-3 bg-black border-4 border-white rounded-2xl animate-pulse">
                    <AlertShield size={24} md:size={32} className="text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-[1000] text-white uppercase italic tracking-tighter drop-shadow-lg">LINK_FAILURE</h2>
                    <p className="text-[8px] md:text-xs font-black text-black uppercase opacity-80 italic">Neural Integrity: CRITICAL_ERR</p>
                  </div>
               </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 space-y-4 md:space-y-6">
               <div className="bg-red-950/30 border-2 border-red-500/30 p-4 rounded-xl md:rounded-2xl relative">
                  <div className="absolute -top-3 left-4 bg-red-600 text-white text-[8px] md:text-[10px] font-black px-2 md:px-3 py-0.5 border-2 border-black uppercase rotate-1">Diagnostic Log</div>
                  <p className="text-red-400 font-mono text-[10px] md:text-xs leading-tight break-words">{error.message}</p>
               </div>

               <div className="bg-black/60 border-2 border-slate-800 p-3 md:p-4 rounded-xl md:rounded-2xl font-mono text-[7px] md:text-[9px] text-slate-500 max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar">
                  <p className="uppercase font-black text-slate-400 mb-2 border-b border-slate-800 pb-1">Trace Dump:</p>
                  <p className="whitespace-pre-nowrap leading-none opacity-40">{error.stack}</p>
               </div>

               <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2">
                  <button 
                    onClick={handleReport}
                    disabled={reported || isSubmitting}
                    className={`py-3 md:py-4 rounded-xl md:rounded-2xl border-[3px] md:border-[4px] border-black font-black uppercase italic transition-all flex items-center justify-center gap-2 text-[10px] md:text-sm ${reported ? 'bg-emerald-600 text-white' : 'bg-amber-400 hover:bg-amber-300 text-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none'}`}
                  >
                    {isSubmitting ? <RefreshCw className="animate-spin w-3 h-3 md:w-4 md:h-4" /> : reported ? <SparkleIcon className="w-3 h-3 md:w-4 md:h-4" /> : <Bug className="w-3 h-3 md:w-4 md:h-4" />}
                    {reported ? 'TRANSMITTED' : 'REPORT DISASTER'}
                  </button>
                  
                  <button 
                    onClick={() => window.location.reload()}
                    className="py-3 md:py-4 bg-white hover:bg-slate-100 text-black rounded-xl md:rounded-2xl border-[3px] md:border-[4px] border-black font-black uppercase italic shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 text-[10px] md:text-sm"
                  >
                    <RefreshCw className="w-3 h-3 md:w-4 md:h-4" /> RELOAD GRID
                  </button>
               </div>

               {reported && (
                 <div className="bg-emerald-500/10 border-2 border-emerald-500/30 p-2 md:p-3 rounded-lg md:rounded-xl flex items-center gap-2 md:gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-ping"></div>
                    <span className="text-[7px] md:text-[9px] text-emerald-400 font-black uppercase italic">Report uplink established. Admins notified.</span>
                 </div>
               )}
            </div>

            {/* Footer Tag */}
            <div className="bg-black p-2 md:p-3 text-center border-t-[4px] border-slate-900">
               <span className="text-[7px] md:text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] md:tracking-[0.4em]">RECOVERY_PROT_ALPHA // ERROR_EJECTION_NODE</span>
            </div>
          </div>
       </div>
    </div>
  );
};

export const GameLayout = ({ onLogout }) => {
  const engine = useGame();
  
  if (!engine) {
    console.warn("🚀 [SYSTEM_DIAGNOSTIC] GameLayout rendered without context. Postponing hydration...");
    return <LoadingScreen />;
  }

  const { 
    user, player, setPlayer, syncPlayer, logs, addLog,
    currentTime, showGuide, setShowGuide, guideType, setGuideType, bossAvatarIdx, setBossAvatarIdx, showBossVideo, setShowBossVideo, showSuccessWindow, setShowSuccessWindow,
    showBlockadeModal, setShowBlockadeModal, blockadeError, collisionProfile,
    sessionConflict,
    adventure, combat, actions, gameLoop, audio, market, leaderboard, wallet, linkWallet, migrateProfile,
    db, appId, totalStats, handleLogout, openGuide,
    globalError, submitErrorReport,
    lowPerfMode, setLowPerfMode,
    TAVERN_MATES, MONSTERS, LOOTS, EQUIPMENT, MAPS, FRUITS, CRYSTLE_RECIPES, SHOP_ITEMS
  } = engine;

  const [isMigrating, setIsMigrating] = useState(false);
  const [chatCompanion, setChatCompanion] = useState(null);
  const [displayedTip, setDisplayedTip] = useState("");
  const [showRepackModal, setShowRepackModal] = useState(false);
  const fullTipText = "STUTTERING? TOGGLE LOW-FX MODE TO STABILIZE UPLINK.";

  useEffect(() => {
    let timeout;
    if (displayedTip.length < fullTipText.length) {
      timeout = setTimeout(() => {
        setDisplayedTip(fullTipText.slice(0, displayedTip.length + 1));
      }, 40);
    } else {
      // Loop after 10 seconds of staying complete
      timeout = setTimeout(() => {
        setDisplayedTip("");
      }, 10000);
    }
    return () => clearTimeout(timeout);
  }, [displayedTip]);


  const { view, setView, depth, setDepth, enemy, spawnNewEnemy, selectedMap, setSelectedMap, enemyFlinch, isHurt, handleSkip } = adventure;
  const { stunTimeLeft, missTimeLeft, combatState, triggerHitEffects, impactSplash, playerImpactSplash, strikingSide, currentTaunt, playerTaunt, killsInFloor, lastLoot, sessionRewards, showDefeatedWindow, showVictoryWindow, setShowVictoryWindow, handleAttack, handleDismissDefeat } = combat;
  const { handleHeal, activateAutoScroll, hireMate, dismissMate, summonDragon, sellItem, equipItem, unequipItem, allocateStat, buyItem, forgeCrystle, mixLaboratoryItem } = actions;
  const { autoTimeLeft, buffTimeLeft, dragonTimeLeft, penaltyRemaining } = gameLoop;
  const { isMusicOn, setIsMusicOn, isSfxOn, setIsSfxOn, playSFX, skipTrack } = audio;
  const { marketplace, purchaseMarketItem, listMarketItem, cancelMarketListing } = market;

  const isPenalized = penaltyRemaining > 0;
  const isStunned = stunTimeLeft > 0;
  const isMissed = missTimeLeft > 0;
  const isAutoActive = autoTimeLeft > 0;
  const currentMate = player ? TAVERN_MATES.find(m => m.id === player.hiredMate) : null;

  const onLogoutWrapper = () => handleLogout(onLogout);

  const handleMigrate = async () => {
    if (!collisionProfile?.id) return;
    if (!window.confirm(`⚠️ FINAL WARNING: This will IMPORT all progress from ${collisionProfile.name} (LVL ${collisionProfile.level}) and OVERWRITE your current temporary profile. Continue?`)) return;
    
    setIsMigrating(true);
    const result = await migrateProfile(collisionProfile.id);
    setIsMigrating(false);
    
    if (result.success) {
      setShowBlockadeModal(false);
      window.location.reload();
    } else {
      alert(`Migration Failed: ${result.error}`);
    }
  };

  const currentSlots = player?.inventory ? Object.keys(player.inventory).length : 0;
  const maxSlots = player?.maxInventorySlots || 50;
  const isOverburdened = currentSlots >= maxSlots;

  if (!player) return <LoadingScreen />;

  return (
    <div className={`min-h-screen bg-[#0f051d] text-white font-sans selection:bg-[#ff00ff]/30 overflow-x-hidden transition-colors relative`}>
      <AnimatedBackground MONSTERS={MONSTERS} performanceMode={lowPerfMode} />
      
      {/* ANIME POP Overlay: Grid & Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-[999] opacity-10 bg-scanline"></div>
      <div className="fixed inset-0 pointer-events-none z-[998] opacity-5 bg-cyber-grid"></div>

      {showDefeatedWindow && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in zoom-in duration-300 p-4">
          <div className="relative max-w-sm w-full">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-0 bg-red-800 rounded-3xl transform translate-x-2 translate-y-2"></div>

            <div className="relative bg-slate-950 border-[4px] border-black rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f87171 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-red-600 py-6 border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg">
                <h2 className="text-5xl font-black text-white text-center uppercase tracking-tighter italic drop-shadow-[4px_4px_0_rgba(0,0,0,1)] animate-bounce-short">
                  CRUSHED!
                </h2>
                <div className="absolute -bottom-3 right-8 bg-black text-white px-3 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] transform rotate-3 border-2 border-white">
                  Fatal Impact Detected
                </div>
              </div>

              {/* Defeated Avatar */}
              <div className="py-8 relative">
                <div className="w-40 h-40 rounded-full border-[8px] border-black overflow-hidden relative shadow-inner group">
                  <div className="absolute inset-0 bg-red-900/40 mix-blend-multiply z-10"></div>
                  {player.avatar && (
                    <div className="grayscale contrast-125 opacity-70 scale-110">
                      <AvatarMedia num={player.avatar} animated={false} className="w-full h-full object-cover object-top" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <Skull size={80} className="text-white drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] opacity-90" />
                  </div>
                </div>
                {/* Impact Spokes */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="absolute top-1/2 left-1/2 w-1 h-32 bg-red-600/20 origin-top transform" style={{ rotate: `${i * 45}deg` }}></div>
                  ))}
                </div>
              </div>

              {/* Message Box */}
              <div className="px-8 pb-6 w-full">
                <div className="bg-white text-black p-4 rounded-2xl border-[3px] border-black relative transform rotate-1 shadow-[6px_6px_0_rgba(0,0,0,0.3)]">
                  <div className="absolute -top-3 -left-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 border-2 border-black uppercase italic">
                    Log: Protocol Zero
                  </div>
                  <p className="text-xs font-black uppercase leading-tight tracking-tight italic">
                    "Your strength fails... The darkness closes in. Emergency extraction initiated."
                  </p>
                  <div className="absolute -bottom-2 -left-1 w-4 h-4 bg-white border-b-3 border-l-3 border-black transform rotate-[30deg]"></div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { actions.clearLoadout?.(); handleDismissDefeat(false); }}
                    className="py-3 bg-slate-800 text-white font-black uppercase italic text-[10px] rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-slate-700 active:translate-y-1 active:shadow-none transition-all"
                  >🏠 Menu</button>
                  <button
                    onClick={() => setShowRepackModal(true)}
                    className="py-3 bg-amber-500 text-black font-black uppercase italic text-[10px] rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-amber-400 active:translate-y-1 active:shadow-none transition-all"
                  >🎒 Repack</button>
                  <button
                    onClick={() => handleDismissDefeat(true)}
                    className="py-3 bg-cyan-600 text-white font-black uppercase italic text-[10px] rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-cyan-500 active:translate-y-1 active:shadow-none transition-all"
                  >🔁 Re-Enter</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repack Loadout Modal (post-defeat) */}
      {showRepackModal && (
        <DungeonPrepModal
          player={player}
          playerPotions={actions.getPlayerPotionOwned ? actions.getPlayerPotionOwned() : { hp_potion: 0, mega_hp_potion: 0, ultra_hp_potion: 0 }}
          playerScrolls={actions.getPlayerScrollOwned ? actions.getPlayerScrollOwned() : { auto_scroll: 0, auto_scroll_3m: 0, auto_scroll_6m: 0, auto_scroll_9m: 0, auto_scroll_12m: 0 }}
          initialLoadout={actions.getLoadout ? actions.getLoadout() : undefined}
          onConfirm={(loadout) => {
            if (actions.setLoadout) actions.setLoadout(loadout);
            setShowRepackModal(false);
            handleDismissDefeat(true);
          }}
          onCancel={() => setShowRepackModal(false)}
        />
      )}

      {showSuccessWindow && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in zoom-in duration-300 p-4">
          <div className="relative max-w-sm md:max-w-lg w-full max-h-[95vh] flex flex-col">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-0 bg-cyan-800 rounded-3xl transform translate-x-2 translate-y-2"></div>

            <div className="relative bg-slate-100 border-[4px] border-black rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-cyan-500 py-6 border-b-[4px] border-black transform rotate-1 relative z-10 shadow-lg">
                <h2 className="text-5xl font-black text-white text-center uppercase tracking-tighter italic drop-shadow-[4px_4px_0_rgba(0,0,0,1)] animate-bounce-short">
                  TREASURY REACHED!
                </h2>
                <div className="absolute -bottom-3 right-8 bg-black text-white px-3 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] transform -rotate-2 border-2 border-white">
                  Mission Complete
                </div>
              </div>

              {/* Victory Avatar / Trophy */}
              <div className="py-8 relative">
                <div className="w-32 h-32 bg-white rounded-2xl border-[4px] border-black flex items-center justify-center relative shadow-[6px_6px_0_rgba(0,0,0,1)] transform -rotate-3 overflow-hidden">
                  <Trophy size={64} className="text-amber-500 animate-pulse relative z-10" />
                  <Sparkles size={100} className="absolute text-cyan-200/50 animate-spin-slow" />
                </div>
              </div>

              {/* Rewards Summary */}
              {(() => {
                 const autoScrolls = sessionRewards.loots.filter(i => i?.id?.startsWith('auto_scroll'));
                 const physicalDrops = sessionRewards.loots.filter(i => i?.id && !i.id.startsWith('auto_scroll'));
                 return (
                   <div className="px-5 md:px-8 pb-5 md:pb-8 w-full space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                     <div className="bg-black text-white p-4 rounded-2xl border-[3px] border-white relative transform -rotate-1 shadow-[6px_6px_0_rgba(255,255,255,0.1)] shrink-0">
                       <p className="text-[10px] font-black uppercase text-cyan-400 mb-2 italic tracking-widest">Raid Outcome Log</p>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="flex flex-col">
                           <span className="text-[8px] font-black uppercase text-slate-500">Total GX</span>
                           <span className="text-xl font-black text-amber-400 italic">+{sessionRewards.tokens}</span>
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[8px] font-black uppercase text-slate-500">Exp Won</span>
                           <span className="text-xl font-black text-white italic">+{sessionRewards.xp}</span>
                         </div>
                       </div>
                     </div>

                     {autoScrolls.length > 0 && (
                       <div className="space-y-2 shrink-0">
                         <div className="flex items-center gap-2">
                            <Zap size={14} className="text-cyan-600 animate-pulse" />
                            <span className="text-[10px] font-black text-cyan-700 uppercase tracking-widest">Temporal Assets:</span>
                         </div>
                         <div className="flex flex-col gap-2">
                           {autoScrolls.map((item, i) => (
                             <div key={i} className="bg-slate-900 border-2 border-cyan-400 p-2 rounded-lg flex items-center gap-3 shadow-[0_0_15px_rgba(6,182,212,0.4)] relative overflow-hidden group">
                                <div className="absolute inset-0 bg-cyan-400/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                <div className="absolute inset-0 opacity-20 bg-cyan-400 animate-pulse pointer-events-none"></div>
                                <div className="w-10 h-10 shrink-0 bg-black border-2 border-black rounded flex justify-center items-center text-xl shadow-[2px_2px_0_rgba(0,0,0,1)] z-10">{item.icon}</div>
                                <div className="flex flex-col z-10 min-w-0">
                                   <span className="text-xs md:text-sm font-black text-cyan-400 uppercase italic leading-none truncate">{item.name}</span>
                                   <span className="text-[8px] md:text-[9px] font-bold text-white/70 uppercase truncate mt-0.5">{item.description || "Autonomous hunting time"}</span>
                                </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     <div className="space-y-2 shrink-0">
                       <div className="flex items-center gap-2">
                         <ShoppingBag size={14} className="text-black" />
                         <span className="text-[10px] font-black text-black uppercase tracking-widest">Physical Loot Manifest:</span>
                       </div>
                       <div className="flex flex-col gap-2 min-h-[44px] max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                         {physicalDrops.length > 0 ? (
                           physicalDrops.map((item, i) => (
                             <div key={i} className="flex items-center gap-3 bg-white border-2 border-black p-1.5 shadow-[2px_2px_0_rgba(0,0,0,1)] animate-in slide-in-from-bottom duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                               <div className={`w-8 h-8 flex-shrink-0 border-2 border-black flex justify-center items-center text-lg ${item.rarity === 'Legendary' ? 'bg-amber-100' : item.rarity === 'Epic' ? 'bg-purple-100' : 'bg-slate-100'}`}>{item.icon}</div>
                               <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-xs font-black text-black uppercase italic truncate leading-tight">{item.name}</span>
                                  <span className={`text-[8px] font-black uppercase tracking-widest ${item.rarity === 'Legendary' ? 'text-amber-500' : item.rarity === 'Epic' ? 'text-purple-500' : 'text-slate-500'}`}>{item.rarity || 'Common'} {item.type}</span>
                               </div>
                             </div>
                           ))
                         ) : (
                           <div className="bg-white border-2 border-dashed border-slate-300 p-4 flex items-center justify-center">
                              <span className="text-[10px] text-slate-400 font-bold uppercase italic tracking-widest">No Physical Drops Detected</span>
                           </div>
                         )}
                       </div>
                     </div>

                     <button
                       onClick={() => { setShowSuccessWindow(false); combat.handleCloseVictoryWindow(); }}
                       className="w-full shrink-0 bg-black text-white py-4 mt-2 rounded-xl font-black uppercase tracking-tighter hover:bg-slate-800 transition-all border-[3px] border-black shadow-[6px_6px_0_rgba(0,0,0,0.3)] active:translate-x-1 active:translate-y-1 active:shadow-none italic text-lg"
                     >
                       CONFIRM & RETURN
                     </button>
                   </div>
                 );
              })()}
            </div>
          </div>
        </div>
      )}

      <nav className="bg-slate-950 border-b-[4px] border-black sticky top-0 z-50 p-2 md:p-3 shadow-2xl overflow-hidden">
        {/* Halftone Overlay HUD */}

        {player.avatar && (
          <div className="absolute inset-0 pointer-events-none z-0">
            <AvatarMedia num={player.avatar} animated={!lowPerfMode} className="w-full h-full object-cover object-top opacity-40 blur-[2px] scale-110" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-slate-950"></div>
          </div>
        )}

        <div className="max-w-5xl mx-auto flex flex-row gap-2 md:gap-4 relative z-10 items-stretch">
          {/* PROFILE CARD - COMPACT CHARACTER CARD */}
          <div 
            onClick={() => setView('avatars')}
            className={`w-24 sm:w-28 md:w-32 aspect-[9/16] bg-slate-900 border-[2px] md:border-[3px] rounded-lg md:rounded-xl overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] relative flex flex-col group shrink-0 ring-1 ring-cyan-500/20 transition-all duration-500 cursor-pointer active:scale-95 ${view === 'menu' ? 'border-cyan-500/40 hover:border-cyan-400' : 'border-black hover:border-cyan-500'}`}
          >
            <div className="absolute inset-0 z-0">
              <AvatarMedia num={player.avatar} animated={!lowPerfMode} className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-1000 contrast-125 brightness-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-white/10 opacity-70" />
            </div>

            {/* Float Edit Button - ONLY ACTIVE ON MAIN MENU */}
            {view === 'menu' && (
              <button
                onClick={(e) => { e.stopPropagation(); setView('avatars'); }}
                className="absolute top-1 right-1 z-20 p-1 md:p-2 bg-black/60 hover:bg-cyan-500 text-white hover:text-black rounded-md border border-black/50 backdrop-blur-md transition-all group/btn shadow-lg"
                title="Edit Identity"
              >
                <RefreshCw size={10} md:size={14} className="group-hover/btn:rotate-180 transition-transform duration-500" />
              </button>
            )}

            {/* Bottom Shade Info */}
            <div className="absolute inset-x-0 bottom-0 p-1.5 md:p-2.5 bg-gradient-to-t from-black via-black/90 to-transparent z-10">
              {(player.walletAddress || wallet.address) && (
                <div className="flex items-center gap-1 mb-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                  <span className="text-[5px] md:text-[7px] font-mono text-emerald-400 font-black tracking-widest uppercase opacity-80 italic">UPLINK_SYNCED</span>
                </div>
              )}
              <div className="bg-cyan-400 text-black text-[7px] md:text-[11px] font-[1000] uppercase py-1 px-2 rounded-sm border-[2px] border-black inline-block shadow-[3px_3px_0_rgba(0,0,0,1)] mb-1 md:mb-1.5 animate-in slide-in-from-left-4 duration-500 group-hover:bg-white transition-colors">UNIT {player.level}</div>
              <div className="text-[5px] md:text-[7px] text-white/50 font-black uppercase tracking-widest truncate group-hover:text-cyan-400 transition-colors">{player.hiredMate ? TAVERN_MATES.find(m => m.id === player.hiredMate)?.name : 'SOLO AGENT'}</div>
            </div>
          </div>

          {/* SQUAD MINI HUD */}
          <SquadHUD player={player} dragonTimeLeft={dragonTimeLeft} TAVERN_MATES={TAVERN_MATES} />

          {/* MAIN HUD DATA CONTAINER */}
          <div className="flex-1 flex flex-col justify-between py-0.5 md:py-1 min-w-0">
            {/* Identity Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1 mb-1 md:mb-2">
              <div className="flex flex-row items-center gap-1.5 md:gap-3 shrink-0">
                <div className="bg-black text-white px-2 md:px-5 py-0.5 md:py-1.5 border-[3px] border-white shadow-[6px_6px_0px_0px_var(--neon-pink)] transform -rotate-1 relative overflow-hidden min-w-0">
                  <div className="halftone-overlay absolute inset-0 pointer-events-none"></div>
                  <h1 className="font-black text-[9px] md:text-xl uppercase tracking-tighter italic leading-none truncate relative z-10 flex items-center bungee">
                    <span className="text-[8px] md:text-sm font-black text-[#00ffff] mr-2 md:mr-3 border-[2px] border-[#00ffff]/30 px-1 md:px-2 py-0.5 rounded-sm bg-black shadow-[2px_2px_0px_0px_var(--neon-cyan)]">LVL {player.level}</span>
                    {player.name}
                  </h1>
                </div>

                {(() => {
                  const isConflict = !!player.walletConflict;
                  const linkedAddress = player.walletAddress;

                  if (isConflict) {
                    return (
                      <button
                        onClick={() => setView('avatars')}
                        className="bg-red-600 text-white px-2 md:px-5 py-0.5 md:py-1.5 border-[2px] md:border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] transform rotate-1 relative overflow-hidden shrink-0 animate-pulse flex items-center gap-2"
                      >
                        <AlertCircle size={10} />
                        <span className="font-black text-[7px] md:text-xs uppercase tracking-tighter italic leading-none">Uplink Blockade</span>
                      </button>
                    );
                  }

                  if (linkedAddress) {
                    return (
                      <div 
                        onClick={() => setView('avatars')}
                        className="flex items-center gap-1 shrink-0 cursor-pointer group"
                      >
                        <div className="bg-black text-white px-2 md:px-4 py-0.5 md:py-1.5 border-[3px] border-white shadow-[6px_6px_0px_0px_var(--neon-cyan)] transform rotate-1 relative overflow-hidden">
                          <div className="halftone-overlay absolute inset-0 pointer-events-none"></div>
                          <div className="flex items-center gap-2 relative z-10">
                            <div className="w-1.5 h-1.5 bg-[#00ffff] shadow-[0_0_10px_var(--neon-cyan)] rounded-full animate-pulse"></div>
                            <span className="font-black text-[7px] md:text-xs uppercase tracking-tighter italic leading-none bungee text-[var(--neon-cyan)]">
                              {linkedAddress.slice(0, 6)}...{linkedAddress.slice(-4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      onClick={() => setView('avatars')}
                      className="bg-slate-800/40 text-slate-500 px-2 md:px-5 py-0.5 md:py-1.5 border-[2px] md:border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] transform rotate-1 relative overflow-hidden shrink-0 group hover:text-cyan-400 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
                    >
                      <Wallet size={10} className="group-hover:rotate-12" />
                      <span className="font-black text-[7px] md:text-xs uppercase tracking-tighter italic leading-none">Offline</span>
                    </button>
                  );
                })()}

                <div className="flex flex-row items-center gap-1 bg-slate-900 border-[1.5px] border-black px-1.5 md:px-2.5 py-0.5 shadow-[2px_2px_0_rgba(0,0,0,1)] transform rotate-1 shrink-0">
                  <div className="flex items-center gap-1">
                    <Clock size={8} md:size={13} className="text-cyan-400" />
                    <span className="text-[8px] md:text-xs font-black text-white italic tracking-widest">{currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                  </div>
                </div>
              </div>

                <div className="flex items-center gap-1.5 ml-auto lg:ml-0">
                  {/* HERO SHARE BUTTON */}
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 shrink-0">
                    <button 
                      onClick={() => {
                        const gear = `${player.equipped?.Weapon?.name || 'Fists'} | ${player.equipped?.Armor?.name || 'Tunic'}`;
                        const text = `🚨 HERO STATUS SYNC: ${player.name}\n💎 Level: ${player.level}\n⚔️ Gear: ${gear}\n\nConquering the Grid @DungeonsWithGems on #Base! 🛡️⚔️\n\n📡 Play: https://metaverse.dungeonswithgems.quest\n #Web3Gaming #BaseNetwork`;
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      className="p-1 px-1.5 bg-slate-800 border border-black hover:bg-white hover:text-black text-white rounded-md transition-all active:scale-90 flex items-center gap-1 group/x"
                      title="Tweet Hero Progress"
                    >
                      <Twitter size={10} className="group-hover/x:scale-110" />
                      <span className="text-[7px] md:text-[9px] font-black uppercase">X</span>
                    </button>
                  </div>

                  {player.abilityPoints > 0 && (
                    <div className="bg-amber-400 text-black px-1.5 py-0.5 border-[1.5px] border-black shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] font-black text-[7px] md:text-[9px] uppercase italic animate-pulse flex items-center gap-1">
                      <Target size={9} /> {player.abilityPoints} PTS
                    </div>
                  )}
                </div>
            </div>

            {/* Resources Hub - Premium Tactical Display */}
            <div className="flex items-center gap-1.5 md:gap-3 bg-slate-950/60 border-[1.5px] border-white/5 p-1.5 md:p-2 rounded-xl mb-1.5 md:mb-2 overflow-x-auto no-scrollbar shadow-inner relative group/hub">
              <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover/hub:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="flex items-center gap-2 shrink-0 bg-black/40 px-2.5 md:px-4 py-1.5 rounded-lg border border-white/5 hover:border-amber-500/30 transition-all group/stat">
                <div className="w-5 h-5 md:w-7 md:h-7 bg-amber-400 flex items-center justify-center rounded-md border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] group-hover/stat:scale-110 transition-transform">
                  <Coins size={12} md:size={16} className="text-black" />
                </div>
                <div className="flex flex-col -gap-1">
                  <span className="text-[10px] md:text-sm font-black text-white italic tracking-tighter tabular-nums">{Math.floor(player.tokens).toLocaleString()}</span>
                  <span className="text-[6px] md:text-[8px] text-amber-500 font-black uppercase tracking-[0.2em] leading-none">Credits</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 bg-black/40 px-2.5 md:px-4 py-1.5 rounded-lg border border-white/5 hover:border-red-500/30 transition-all group/stat">
                <div className="w-5 h-5 md:w-7 md:h-7 bg-red-500 flex items-center justify-center rounded-md border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] group-hover/stat:rotate-12 transition-transform">
                  <Coffee size={12} md:size={16} className="text-black" />
                </div>
                <div className="flex flex-col -gap-1">
                  <span className="text-[10px] md:text-sm font-black text-white italic tracking-tighter tabular-nums">{player.potions || 0}</span>
                  <span className="text-[6px] md:text-[8px] text-red-500 font-black uppercase tracking-[0.2em] leading-none">Supplies</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 bg-black/40 px-2.5 md:px-4 py-1.5 rounded-lg border border-white/5 hover:border-blue-500/30 transition-all group/stat">
                <div className="w-5 h-5 md:w-7 md:h-7 bg-blue-500 flex items-center justify-center rounded-md border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] group-hover/stat:-translate-y-0.5 transition-transform">
                  <MousePointer size={12} md:size={16} className="text-black" />
                </div>
                <div className="flex flex-col -gap-1">
                  <span className="text-[10px] md:text-sm font-black text-white italic tracking-tighter tabular-nums">{player.autoScrolls || 0}</span>
                  <span className="text-[6px] md:text-[8px] text-blue-400 font-black uppercase tracking-[0.2em] leading-none">Automata</span>
                </div>
              </div>

              {/* THE SATCHEL CAPACITY HUD WIDGET */}
              <button 
                onClick={() => setView('bag_upgrade')}
                className={`flex items-center gap-2 shrink-0 bg-black/40 px-2.5 md:px-4 py-1.5 rounded-lg border transition-all group/satchel ${
                  isOverburdened 
                    ? 'border-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)] hover:bg-red-950/20' 
                    : 'border-white/5 hover:border-[var(--neon-lime)] hover:bg-emerald-950/10'
                }`}
                title={isOverburdened ? "SATCHEL LOCK: Satchel is full! Click to upgrade." : "View Asset Storage Core"}
              >
                <div className={`w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-md border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] transition-transform group-hover/satchel:scale-110 ${
                  isOverburdened ? 'bg-red-500 text-black' : 'bg-[var(--neon-cyan)] text-black'
                }`}>
                  <span className="text-[10px] md:text-sm">🎒</span>
                </div>
                <div className="flex flex-col items-start -gap-1">
                  <span className={`text-[10px] md:text-sm font-black italic tracking-tighter tabular-nums ${
                    isOverburdened ? 'text-red-500' : 'text-white'
                  }`}>
                    {currentSlots} / {maxSlots}
                  </span>
                  <span className={`text-[6px] md:text-[8px] font-black uppercase tracking-[0.2em] leading-none ${
                    isOverburdened ? 'text-red-400 animate-pulse' : 'text-[var(--neon-lime)]'
                  }`}>
                    {isOverburdened ? 'FULL!' : 'Satchel'}
                  </span>
                </div>
              </button>

              <div className="ml-auto flex items-center gap-1.5 shrink-0">
                {/* IN-LINE NPC GUIDE (NOW MOBILE-READY) */}
                <div className="flex items-center gap-1.5 md:gap-2 bg-black/20 px-1.5 md:px-2 py-1 rounded-lg border border-white/5 max-w-[120px] md:max-w-[180px] animate-in fade-in duration-1000">
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded border border-cyan-500/30 overflow-hidden shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                    <AvatarMedia num={player.avatar || 1} animated={true} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[4px] md:text-[5px] font-black text-cyan-500 uppercase leading-none mb-0.5">Guide</span>
                    <p className="text-[6px] md:text-[7px] font-bold text-white/70 uppercase italic leading-none tracking-tighter truncate md:whitespace-normal">
                      {displayedTip}<span className="animate-pulse text-cyan-400">_</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-white/5">
                  <button 
                    onClick={() => setLowPerfMode(!lowPerfMode)} 
                  className={`flex flex-col items-center gap-0.5 p-1 px-1.5 md:p-2 rounded-md transition-all hover:bg-white/5 ${lowPerfMode ? 'text-amber-500 animate-pulse' : 'text-cyan-400'}`}
                  title={lowPerfMode ? "Switch to High Graphics" : "Switch to Battery Saver"}
                >
                  {lowPerfMode ? <Zap size={12} md:size={14} /> : <Activity size={12} md:size={14} />}
                  <span className="text-[5px] md:text-[6px] font-black uppercase tracking-tighter leading-none">{lowPerfMode ? 'LOW-FX' : 'HI-FI'}</span>
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
                <button onClick={() => setIsMusicOn(!isMusicOn)} className={`p-1.5 md:p-2 rounded-md transition-all hover:bg-white/5 ${isMusicOn ? 'text-cyan-400' : 'text-slate-600'}`}>
                  {isMusicOn ? <Music size={14} md:size={16} /> : <Music2 size={14} md:size={16} />}
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
                <button onClick={skipTrack} className="p-1.5 md:p-2 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-all" title="Next Track">
                  <SkipForward size={14} md:size={16} />
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
                <button onClick={() => setIsSfxOn(!isSfxOn)} className={`p-1.5 md:p-2 rounded-md transition-all hover:bg-white/5 ${isSfxOn ? 'text-amber-400' : 'text-slate-600'}`}>
                  {isSfxOn ? <Volume2 size={14} md:size={16} /> : <VolumeX size={14} md:size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Vitals Progress */}
          <div className="space-y-2 md:space-y-3 mb-1.5 md:mb-2">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex items-center gap-1.5 min-w-[55px] md:min-w-[80px] bg-black border-2 border-white rounded px-1.5 py-1 shadow-[4px_4px_0px_0px_var(--neon-pink)]">
                  <Heart size={10} md:size={14} className="text-[var(--neon-pink)]" fill="currentColor" />
                  <span className="text-[9px] md:text-sm font-black italic text-white leading-none bungee">{Math.floor(player.hp)}</span>
                </div>
                <div className="flex-1 h-3 md:h-4 bg-black border-2 border-white p-0.5 relative overflow-hidden rounded-sm">
                  <div className={`h-full transition-all duration-300 ${player.hp / totalStats.maxHp <= 0.25 ? 'bg-[var(--neon-pink)] animate-pulse shadow-[0_0_15px_var(--neon-pink)]' : 'bg-[var(--neon-pink)] shadow-[0_0_10px_var(--neon-pink)]'}`} style={{ width: `${(player.hp / totalStats.maxHp) * 100}%` }} />
                  <div className="absolute inset-0 halftone-overlay opacity-30"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex items-center gap-1.5 min-w-[55px] md:min-w-[80px] bg-black border-2 border-white rounded px-1.5 py-1 shadow-[4px_4px_0px_0px_var(--neon-cyan)]">
                  <Star size={10} md:size={14} className="text-[var(--neon-cyan)]" fill="currentColor" />
                  <span className="text-[9px] md:text-sm font-black italic text-white leading-none bungee">
                    {Math.floor(player.xp)}
                  </span>
                </div>
                <div className="flex-1 h-3 md:h-4 bg-black border-2 border-white p-0.5 relative overflow-hidden rounded-sm">
                  <div className="h-full bg-[var(--neon-cyan)] transition-all duration-300 shadow-[0_0_10px_var(--neon-cyan)]" style={{ width: `${Math.min(100, (player.xp / getXpRequired(player.level)) * 100)}%` }} />
                  <div className="absolute inset-0 halftone-overlay opacity-30"></div>
                </div>
              </div>
            </div>

            {/* Gear Row */}
            <div className="grid grid-cols-5 gap-1 md:gap-1.5">
              {[
                { label: 'HEAD', key: 'Headgear', color: 'text-blue-400' },
                { label: 'WEAPON', key: 'Weapon', color: 'text-amber-400' },
                { label: 'ARMOR', key: 'Armor', color: 'text-cyan-400' },
                { label: 'FEET', key: 'Footwear', color: 'text-emerald-400' },
                { label: 'RELIC', key: 'Relic', color: 'text-purple-400' }
              ].map(slot => (
                <div key={slot.key} className="bg-slate-900 border-[1.5px] border-black p-1 flex flex-col items-center justify-center shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] group hover:bg-slate-800 transition-all min-w-0">
                  <span className="text-[5px] text-slate-500 font-black uppercase tracking-widest leading-none mb-0.5">{slot.label}</span>
                  <span className={`text-[6px] font-black leading-none truncate w-full text-center uppercase italic ${player.equipped?.[slot.key] ? slot.color : 'text-slate-600'}`}>
                    {player.equipped?.[slot.key] ? player.equipped[slot.key].name : 'EMPTY'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-3 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <StatTile 
            icon={<Sword size={14} />} 
            label="STR" 
            value={totalStats.str} 
            color="text-red-400" 
            desc="Attack Power" 
            isBuffed={buffTimeLeft > 0 && currentMate?.type === 'STR'} 
            activeFoodEffect={player.activeFoodEffect}
            isFoodActive={(player.activeFoodUntil || 0) > Date.now()}
          />
          <StatTile 
            icon={<Wind size={14} />} 
            label="AGI" 
            value={totalStats.agi} 
            color="text-emerald-400" 
            desc="Evasion/SPD" 
            isBuffed={buffTimeLeft > 0 && currentMate?.type === 'AGI'} 
            activeFoodEffect={player.activeFoodEffect}
            isFoodActive={(player.activeFoodUntil || 0) > Date.now()}
          />
          <StatTile 
            icon={<Target size={14} />} 
            label="DEX" 
            value={totalStats.dex} 
            color="text-yellow-400" 
            desc="Accuracy" 
            isBuffed={buffTimeLeft > 0 && currentMate?.type === 'DEX'} 
            activeFoodEffect={player.activeFoodEffect}
            isFoodActive={(player.activeFoodUntil || 0) > Date.now()}
          />
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl min-h-[450px] md:min-h-[550px] flex flex-col overflow-hidden backdrop-blur-sm relative">

          {view === 'menu' && (
            <MenuView />
          )}

          {view === 'dungeon' && (
            <CombatView />
          )}

          {view === 'dungeon_menu' && (
            <DungeonMenuView />
          )}

          {view === 'naga_combat' && (
            <NagaCombatView />
          )}

          {view === 'tavern' && (
            <TavernView />
          )}

          {/* 🔒 DISABLED — Boss Room under maintenance */}
          {view === 'boss' && null}

          {view === 'attributes' && (
            <AttributesView />
          )}

          {view === 'avatars' && (
            <IdentityView onLogout={onLogoutWrapper} />
          )}

          {view === 'shop' && (
            <ShopView />
          )}

          {view === 'forge' && (
            <ForgeView />
          )}

          {view === 'leaderboard' && (
            <LeaderboardView />
          )}

          {view === 'inventory' && (
            <InventoryView />
          )}

          {view === 'gear' && (
            <GearView />
          )}

          {view === 'market' && (
            <MarketplaceView />
          )}

          {view === 'database' && (
            <DatabaseView />
          )}

          {view === 'map' && (
            <MapView />
          )}

          {/* 🔒 DISABLED — PvP Arena under maintenance */}
          {view === 'pvp' && null}

          {view === 'admin' && (
            <AdminPanelView />
          )}

          {view === 'vio8_audit' && (
            <VioAuditView />
          )}

          {view === 'bag_upgrade' && (
            <StorageUpgradeView />
          )}

          {view === 'dragons_ground' && (
            <DragonsGroundView />
          )}

          {view === 'laboratory' && (
            <LaboratoryView />
          )}

          {view === 'syndicate' && (
            <SyndicateView />
          )}

          {view === 'pets' && (
            <PetsView />
          )}

          {view === 'manual' && (
            <ManualView />
          )}

          {view === 'devlog' && (
            <DevlogView />
          )}

          {view === 'articles' && (
            <ArticlesView />
          )}

          {view === 'tokenomics' && (
            <TokenomicsView />
          )}

          {view === 'crystle_town' && (
            <CrystleTownView />
          )}
          
          {view === 'ilearn' && (
            <ILearnView />
          )}

          {view === 'crystle_bazaar' && (
            <CrystleBazaarView />
          )}

          {view === 'biometric_core' && (
            <BiometricCoreView />
          )}

          {view === 'hunter_registry' && (
            <HunterRegistryView />
          )}

          {/* {view === 'playground' && (
            <EffectsPlayground />
          )} */}

        </div>

        <div className="bg-amber-400 border-[4px] border-black rounded-lg p-3 h-28 overflow-y-auto relative shadow-[4px_4px_0_rgba(0,0,0,1)] custom-scrollbar">
          <div className="absolute top-2 right-4 text-[8px] font-black text-black opacity-30 uppercase tracking-[0.4em]">Battle Bulletin</div>
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div key={i} className={`text-xs font-black uppercase leading-tight italic ${i === 0 ? 'text-black' : 'text-black/40'}`}>
                {i === 0 ? <span className="mr-2">▶</span> : <span className="mr-2 opacity-50">•</span>}
                {log}
              </div>
            ))}
          </div>
        </div>

      </main>

      <PartyCompanionDock onOpenChat={setChatCompanion} />

      <footer className="w-full py-8 flex flex-col items-center gap-4 relative z-20">
        <a href="https://metaverse.dungeonswithgems.quest" className="text-[9px] text-slate-700 font-black uppercase tracking-[0.5em] mb-1 opacity-40 hover:opacity-100 transition-opacity">METAVERSE.DUNGEONSWITHGEMS.QUEST // SYNCED_TO_GRID</a>

        <div className="flex flex-wrap justify-center gap-4 md:gap-8 opacity-40 hover:opacity-100 transition-opacity duration-500 bg-black/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5 shadow-xl">
          <a href="https://github.com/skippergemx" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-slate-400 hover:text-white uppercase italic tracking-wider transition-colors">Github</a>
          <a href="https://x.com/skippergemx" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-slate-400 hover:text-cyan-400 uppercase italic tracking-wider transition-colors">Twitter</a>
          <a href="https://warpcast.com/skippergemx" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-slate-400 hover:text-purple-400 uppercase italic tracking-wider transition-colors">Farcaster</a>
          <a href="https://t.me/skippergemx" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-slate-400 hover:text-blue-400 uppercase italic tracking-wider transition-colors">Telegram</a>
          <div className="text-[10px] font-black text-slate-500 uppercase italic tracking-wider cursor-help" title="Discord: skippergemx">Discord: skippergemx</div>
          <div className="text-[10px] font-black text-white/40 uppercase italic tracking-widest border-l border-white/10 pl-4">Dev: Skipper Gemx</div>
          
          {/* Secret Developer Uplink - Effects Lab */}
          {/* <button 
            onClick={() => setView('playground')}
            className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 rounded-lg hover:bg-cyan-500/20 transition-all group flex items-center gap-2"
            title="Access Effects Lab"
          >
            <FlaskConical size={12} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[8px] font-black uppercase italic tracking-widest">Neural Research</span>
          </button> */}
        </div>
      </footer>

      {/* ─── Companion Chat Modal (Phase 3) ─── */}
      {chatCompanion && (
        <CompanionChatModal
          companion={chatCompanion}
          player={player}
          context={penaltyRemaining > 0 ? 'penalized' : (player?.hp < (player?.maxHp * 0.4) ? 'lowHp' : 'idle')}
          onClose={() => setChatCompanion(null)}
        />
      )}

      <style>{`
        @keyframes defeat-progress { from { width: 0%; } to { width: 100%; } }
        .animate-defeat-progress { animation: defeat-progress ${DEFEAT_WINDOW_DURATION}ms linear forwards; }
        
        @keyframes flinch {
          0% { transform: scale(1); filter: brightness(1) contrast(1); }
          50% { transform: scale(0.92) rotate(3deg); filter: brightness(2) contrast(1.5) sepia(0.5); }
          100% { transform: scale(1); filter: brightness(1) contrast(1); }
        }
        @keyframes impact-pop {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          40% { transform: scale(1.4) rotate(15deg); opacity: 1; }
          70% { transform: scale(1) rotate(-5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-short { animation: bounce-short 0.4s ease-in-out infinite; }
        .animate-flinch { animation: flinch 0.15s ease-out; }
        .animate-impact { animation: impact-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
      <GuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        title={`${guideType.replace('_', ' ')} manual`}
        content={GUIDE_CONTENT[guideType] || []}
      />

      {showBlockadeModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm"></div>
          <div className="bg-slate-900 border-4 border-red-600 p-6 md:p-8 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.5)] max-w-md w-full relative z-10 transform -rotate-1">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full border-4 border-black text-xs font-black uppercase italic shadow-[4px_4px_0_rgba(0,0,0,1)]">
              Security Lockdown
            </div>

            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center border-4 border-red-600 animate-pulse">
                <ShieldAlert size={40} className="text-red-500" />
              </div>

              <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">
                Identity Collision Detect
              </h2>

              <p className="text-slate-400 text-[10px] leading-relaxed font-medium">
                This wallet belongs to <span className="text-red-500 font-extrabold italic uppercase underline">another Hero profile</span>.
                Uplink has been <span className="text-red-600 font-extrabold uppercase italic">forcefully ejected</span> to prevent profile contamination.
              </p>

              {collisionProfile && (
                <div className="bg-red-600/10 border-2 border-red-600/40 p-4 rounded-2xl w-full text-left space-y-2">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Legacy Hero Identified</span>
                      <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded font-black italic">{collisionProfile.platform}</span>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-black border-2 border-red-600 flex items-center justify-center font-black italic text-red-500 shadow-lg">#{collisionProfile.level}</div>
                      <div>
                        <p className="text-sm font-black text-white uppercase italic">{collisionProfile.name}</p>
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest">OWNED VIA {collisionProfile.platform}</p>
                      </div>
                   </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 w-full pt-4">
                <button
                  onClick={handleMigrate}
                  disabled={isMigrating}
                  className="group relative py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase italic rounded-2xl border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 overflow-hidden disabled:opacity-50 disabled:grayscale"
                >
                  {isMigrating ? "Syncing Grid..." : "CLAIM & MIGRATE PROGRESS"}
                  {!isMigrating && <Sparkles size={16} className="text-white group-hover:rotate-12 transition-transform" />}
                </button>

                <button
                  onClick={() => setShowBlockadeModal(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[9px] font-black uppercase italic rounded-xl border-2 border-black/40 transition-all"
                >
                  Dismiss Security Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {sessionConflict && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-md"></div>
          <div className="bg-slate-900 border-4 border-yellow-600 p-8 rounded-3xl shadow-[0_0_60px_rgba(202,138,4,0.3)] max-w-md w-full relative z-10 text-center space-y-6">
            <div className="w-20 h-20 bg-yellow-600/20 rounded-full flex items-center justify-center border-4 border-yellow-600 mx-auto animate-pulse">
              <RefreshCw size={48} className="text-yellow-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">System Overlap Detect</h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Logon detected from <span className="text-yellow-500 font-bold underline">another mobile or desktop node</span>. 
                Uplink on this device has been <span className="text-yellow-600 font-bold italic">suspended</span> to protect Hero integrity.
              </p>
            </div>

            <div className="bg-black/60 border-2 border-yellow-900/40 p-4 rounded-2xl">
               <p className="text-[10px] text-yellow-500/80 italic">"Multi-Dimensional sessions are prohibited by the Registry."</p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-extrabold uppercase italic rounded-2xl border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
            >
              Recover Uplink
            </button>
            
            <p className="text-[8px] text-slate-600 uppercase tracking-widest font-black">Session Overwrite Ref: AUTO_KICK_PROT_99</p>
          </div>
        </div>
      )}

      {globalError && <GlobalErrorOverlay error={globalError} onReport={submitErrorReport} />}
    </div>
  );
};