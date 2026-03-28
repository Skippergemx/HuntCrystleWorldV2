import React from 'react';
import {
  Sword, Shield, Coins, Star, Trophy, ShoppingBag,
  Map as MapIcon, ChevronRight, Heart, Zap, Target,
  Wind, Lock, User, RefreshCw, AlertCircle, Sparkles,
  Hammer, Gem, Package, X, TrendingUp, Skull, Flame, Clock,
  PlusCircle, Activity, Coffee, MousePointer, Beer, Users,
  Book, Globe, Database, HardHat, Footprints,
  Volume2, VolumeX, Music, Music2, SkipForward,
  Calendar
} from 'lucide-react';

import { BOSS, BOSS_MEDIA_FILES, getXpRequired, DEFEAT_WINDOW_DURATION } from '../utils/gameLogic';
import { Header, NavBtn, StatTile, AttributeRow, AvatarMedia, SquadHUD, GuideModal } from './GameUI';
import { ImpactSplash, BossImpactSplash } from './CombatEffects';
import { MenuView } from './MenuView';
import { CombatView } from './CombatView';
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
import { DragonsGroundView } from './DragonsGroundView';
import { PvpRoomView } from './PvpRoomView';
import { LaboratoryView } from './LaboratoryView';
import { SyndicateView } from './SyndicateView';
import { PetsView } from './PetsView';
import { ManualView } from './ManualView';
import { AnimatedBackground } from './AnimatedBackground';
import { GUIDE_CONTENT } from '../data/guideContent';
import { LoadingScreen } from './LoadingScreen';
import { useGame } from '../contexts/GameContext';

export const GameLayout = ({ onLogout }) => {
  const engine = useGame();
  const {
    user, player, syncPlayer, logs, addLog,
    currentTime, showGuide, setShowGuide, guideType, setGuideType, bossAvatarIdx, setBossAvatarIdx, showBossVideo, setShowBossVideo, showSuccessWindow, setShowSuccessWindow,
    adventure, combat, actions, gameLoop, audio, market, leaderboard,
    db, appId, totalStats, handleLogout, openGuide,
    TAVERN_MATES, MONSTERS, LOOTS, EQUIPMENT, MAPS, FRUITS, CRYSTLE_RECIPES, SHOP_ITEMS
  } = engine;

  const { view, setView, depth, setDepth, enemy, spawnNewEnemy, selectedMap, setSelectedMap, enemyFlinch, isHurt, handleSkip } = adventure;
  const { stunTimeLeft, missTimeLeft, combatState, triggerHitEffects, impactSplash, playerImpactSplash, strikingSide, currentTaunt, playerTaunt, killsInFloor, lastLoot, sessionRewards, showDefeatedWindow, handleAttack } = combat;
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

  if (!player) return <LoadingScreen />;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden transition-colors relative`}>
      <AnimatedBackground MONSTERS={MONSTERS} performanceMode={player.performanceMode} />

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
                      <AvatarMedia num={player.avatar} animated={false} className="w-full h-full object-cover" />
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
              <div className="px-8 pb-8 w-full">
                <div className="bg-white text-black p-4 rounded-2xl border-[3px] border-black relative transform rotate-1 shadow-[6px_6px_0_rgba(0,0,0,0.3)]">
                  <div className="absolute -top-3 -left-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 border-2 border-black uppercase italic">
                    Log: Protocol Zero
                  </div>
                  <p className="text-xs font-black uppercase leading-tight tracking-tight italic">
                    "Your strength fails... The darkness closes in. Emergency extraction initiated."
                  </p>
                  <div className="absolute -bottom-2 -left-1 w-4 h-4 bg-white border-b-3 border-l-3 border-black transform rotate-[30deg]"></div>
                </div>

                <div className="mt-8 space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-red-500 uppercase italic">Recovery Progress</span>
                    <span className="text-[10px] font-black text-white opacity-50 uppercase tracking-tighter italic">Returning To Tavern</span>
                  </div>
                  <div className="w-full h-4 bg-black rounded-lg border-2 border-red-900/50 p-0.5 relative overflow-hidden">
                    <div className="h-full bg-red-600 rounded-sm animate-defeat-progress shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessWindow && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in zoom-in duration-300 p-4">
          <div className="relative max-w-sm w-full">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-0 bg-cyan-800 rounded-3xl transform translate-x-2 translate-y-2"></div>

            <div className="relative bg-slate-100 border-[4px] border-black rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-cyan-500 py-6 border-b-[4px] border-black transform rotate-1 relative z-10 shadow-lg">
                <h2 className="text-5xl font-black text-white text-center uppercase tracking-tighter italic drop-shadow-[4px_4px_0_rgba(0,0,0,1)] animate-bounce-short">
                  VICTORY!
                </h2>
                <div className="absolute -bottom-3 right-8 bg-black text-white px-3 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] transform -rotate-2 border-2 border-white">
                  Sector Node Secured
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
              <div className="px-8 pb-8 w-full space-y-4">
                <div className="bg-black text-white p-4 rounded-2xl border-[3px] border-white relative transform -rotate-1 shadow-[6px_6px_0_rgba(255,255,255,0.1)]">
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

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={12} className="text-black" />
                    <span className="text-[8px] font-black text-black uppercase tracking-widest">Loot Synchronized:</span>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[44px]">
                    {sessionRewards.loots.length > 0 ? (
                      sessionRewards.loots.map((item, i) => (
                        <div key={i} className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center text-xl shadow-[2px_2px_0_rgba(0,0,0,1)] animate-in slide-in-from-bottom duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                          {item.icon}
                        </div>
                      ))
                    ) : (
                      <span className="text-[8px] text-slate-400 font-bold uppercase italic tracking-widest">No Physical Drops Detected</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => { setShowSuccessWindow(false); setView('map'); }}
                  className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-tighter hover:bg-slate-800 transition-all border-[3px] border-black shadow-[6px_6px_0_rgba(0,0,0,0.3)] active:translate-x-1 active:translate-y-1 active:shadow-none italic text-lg"
                >
                  CONFIRM & RETURN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-slate-950 border-b-[4px] border-black sticky top-0 z-50 p-2 md:p-3 shadow-2xl relative overflow-hidden">
        {/* Halftone Overlay HUD */}

        {player.avatar && (
          <div className="absolute inset-0 pointer-events-none z-0">
            <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover opacity-40 blur-[2px] scale-110" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-slate-950"></div>
          </div>
        )}

        <div className="max-w-5xl mx-auto flex flex-row gap-2 md:gap-4 relative z-10 items-stretch">
          {/* PROFILE CARD - COMPACT CHARACTER CARD */}
          <div className="w-24 sm:w-28 md:w-32 aspect-[9/16] bg-slate-900 border-[2px] md:border-[3px] border-black rounded-lg md:rounded-xl overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] relative flex flex-col group shrink-0 ring-1 ring-cyan-500/20">
            <div className="absolute inset-0 z-0">
               <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 contrast-125 brightness-110" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-white/10 opacity-70" />
            </div>

            {/* Float Edit Button */}
            <button
               onClick={() => setView('avatars')}
               className="absolute top-1 right-1 z-20 p-1 md:p-2 bg-black/60 hover:bg-cyan-500 text-white hover:text-black rounded-md border border-black/50 backdrop-blur-md transition-all group/btn"
               title="Edit Avatar"
            >
               <MousePointer size={10} md:size={14} className="group-hover/btn:scale-125 transition-transform" />
            </button>

            {/* Bottom Shade Info */}
            <div className="absolute inset-x-0 bottom-0 p-1.5 md:p-2.5 bg-gradient-to-t from-black via-black/80 to-transparent z-10">
               <div className="bg-cyan-500 text-black text-[6px] md:text-[8px] font-black uppercase py-0.5 px-1.5 rounded-sm border-[1.5px] border-black inline-block shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] mb-0.5 md:mb-1">UNIT {player.level}</div>
               <div className="text-[5px] md:text-[7px] text-white/50 font-black uppercase tracking-widest truncate">{player.hiredMate ? TAVERN_MATES.find(m => m.id === player.hiredMate)?.name : 'SOLO AGENT'}</div>
            </div>
          </div>

          {/* SQUAD MINI HUD */}
          <SquadHUD player={player} dragonTimeLeft={dragonTimeLeft} TAVERN_MATES={TAVERN_MATES} />

          {/* MAIN HUD DATA CONTAINER */}
          <div className="flex-1 flex flex-col justify-between py-0.5 md:py-1 min-w-0">
            {/* Identity Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1 mb-1 md:mb-2">
              <div className="flex flex-row items-center gap-1.5 md:gap-3 shrink-0">
                <div className="bg-white text-black px-2 md:px-5 py-0.5 md:py-1.5 border-[2px] md:border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] transform -rotate-1 relative overflow-hidden min-w-0">
                  <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)' }}></div>
                  <h1 className="font-black text-[9px] md:text-xl uppercase tracking-tighter italic leading-none truncate relative z-10">{player.name}</h1>
                </div>

                <div className="flex flex-row items-center gap-1 bg-slate-900 border-[1.5px] border-black px-1.5 md:px-2.5 py-0.5 shadow-[2px_2px_0_rgba(0,0,0,1)] transform rotate-1 shrink-0">
                  <div className="flex items-center gap-1">
                     <Clock size={8} md:size={13} className="text-cyan-400" />
                     <span className="text-[8px] md:text-xs font-black text-white italic tracking-widest">{currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 ml-auto lg:ml-0">
                 {player.abilityPoints > 0 && (
                   <div className="bg-amber-400 text-black px-1.5 py-0.5 border-[1.5px] border-black shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] font-black text-[7px] md:text-[9px] uppercase italic animate-pulse flex items-center gap-1">
                      <Target size={9} /> {player.abilityPoints} PTS
                   </div>
                 )}
                  <button 
                    onClick={onLogoutWrapper} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 border-[1.5px] border-red-500/50 text-red-500 shadow-[2px_2px_0_rgba(0,0,0,1)] hover:bg-red-600 hover:text-white rounded-md group transition-all"
                  >
                     <Lock size={10} md:size={14} className="group-hover:rotate-12" />
                     <span className="text-[10px] md:text-xs font-black uppercase italic tracking-tighter">Logout</span>
                  </button>
              </div>
            </div>

            {/* Resources Hub - Compact Row */}
            <div className="flex items-center gap-1.5 md:gap-3 bg-black/40 border-[1.5px] border-white/10 p-1 md:p-2 rounded-lg mb-1.5 md:mb-2 overflow-x-auto no-scrollbar shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
               <div className="flex items-center gap-1.5 shrink-0 bg-slate-950/80 px-2 md:px-3 py-1 rounded-md border border-cyan-500/10">
                  <div className="bg-cyan-400 p-0.5 md:p-1 rounded-sm border-[1.5px] border-black rotate-6"><Coins size={10} md:size={14} className="text-black" /></div>
                  <span className="text-[10px] md:text-base font-black text-white italic tracking-tighter">{Math.floor(player.tokens).toLocaleString()} <span className="text-[7px] md:text-[9px] text-cyan-400 opacity-60">GX</span></span>
               </div>

               <div className="flex items-center gap-1.5 shrink-0 bg-slate-950/80 px-2 md:px-3 py-1 rounded-md border border-red-500/10">
                  <div className="bg-red-500 p-0.5 md:p-1 rounded-sm border-[1.5px] border-black -rotate-3"><Coffee size={10} md:size={14} className="text-black" /></div>
                  <span className="text-[10px] md:text-base font-black text-white italic tracking-tighter">{player.potions || 0} <span className="text-[7px] md:text-[9px] text-red-400 opacity-60">POT</span></span>
               </div>

               <div className="flex items-center gap-1.5 shrink-0 bg-slate-950/80 px-2 md:px-3 py-1 rounded-md border border-blue-500/10">
                  <div className="bg-blue-500 p-0.5 md:p-1 rounded-sm border-[1.5px] border-black rotate-12"><MousePointer size={10} md:size={14} className="text-black" /></div>
                  <span className="text-[10px] md:text-base font-black text-white italic tracking-tighter">{player.autoScrolls || 0} <span className="text-[7px] md:text-[9px] text-blue-400 opacity-60">AUT</span></span>
               </div>

               <div className="ml-auto flex items-center gap-1 shrink-0 bg-black/60 p-0.5 md:p-1 rounded-md border border-white/5">
                  <button onClick={() => setIsMusicOn(!isMusicOn)} className={`p-1 md:p-1.5 rounded transition-all ${isMusicOn ? 'text-cyan-400' : 'text-slate-600'}`}>
                    {isMusicOn ? <Music size={12} md:size={14} /> : <Music2 size={12} md:size={14} />}
                  </button>
                  <button onClick={skipTrack} className="p-1 md:p-1.5 rounded text-slate-400 hover:text-cyan-400 transition-all" title="Next Track">
                    <SkipForward size={12} md:size={14} />
                  </button>
                  <button onClick={() => setIsSfxOn(!isSfxOn)} className={`p-1 md:p-1.5 rounded transition-all ${isSfxOn ? 'text-amber-400' : 'text-slate-600'}`}>
                    {isSfxOn ? <Volume2 size={12} md:size={14} /> : <VolumeX size={12} md:size={14} />}
                  </button>
               </div>
            </div>

            {/* Vitals Progress */}
            <div className="space-y-1 md:space-y-1.5 mb-1.5 md:mb-2">
               <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-1.5 min-w-[55px] md:min-w-[80px] bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5">
                     <Heart size={10} md:size={14} className="text-red-500" fill="currentColor" />
                     <span className="text-[9px] md:text-sm font-black italic text-white leading-none">{Math.floor(player.hp)} / {totalStats.maxHp}</span>
                  </div>
                  <div className="flex-1 h-2 md:h-3 bg-black border-[1.5px] border-white/10 p-0.5 relative overflow-hidden rounded-sm">
                     <div className={`h-full transition-all duration-300 ${player.hp / totalStats.maxHp <= 0.25 ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.3)]'}`} style={{ width: `${(player.hp / totalStats.maxHp) * 100}%` }} />
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
                  </div>
               </div>
               <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-1.5 min-w-[55px] md:min-w-[120px] bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5">
                     <Star size={10} md:size={14} className="text-cyan-400" fill="currentColor" />
                     <span className="text-[9px] md:text-sm font-black italic text-white leading-none">
                        {Math.floor(player.xp)} / {getXpRequired(player.level)}
                     </span>
                  </div>
                  <div className="flex-1 h-2 md:h-3 bg-black border-[1.5px] border-white/10 p-0.5 relative overflow-hidden rounded-sm">
                     <div className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_5px_rgba(59,130,246,0.3)]" style={{ width: `${Math.min(100, (player.xp / getXpRequired(player.level)) * 100)}%` }} />
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
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
          <StatTile icon={<Sword size={14} />} label="STR" value={totalStats.str} color="text-red-400" desc="Attack Power" isBuffed={buffTimeLeft > 0 && currentMate?.type === 'STR'} />
          <StatTile icon={<Wind size={14} />} label="AGI" value={totalStats.agi} color="text-emerald-400" desc="Evasion/SPD" isBuffed={buffTimeLeft > 0 && currentMate?.type === 'AGI'} />
          <StatTile icon={<Target size={14} />} label="DEX" value={totalStats.dex} color="text-yellow-400" desc="Accuracy" isBuffed={buffTimeLeft > 0 && currentMate?.type === 'DEX'} />
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl min-h-[450px] md:min-h-[550px] flex flex-col overflow-hidden backdrop-blur-sm relative">

          {view === 'menu' && (
            <MenuView />
          )}

          {view === 'dungeon' && (
            <CombatView />
          )}

          {view === 'tavern' && (
            <TavernView />
          )}

          {view === 'boss' && (
            <BossView />
          )}

          {view === 'attributes' && (
            <AttributesView />
          )}

          {view === 'avatars' && (
            <IdentityView />
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

          {view === 'pvp' && (
            <PvpRoomView />
          )}

          {view === 'admin' && (
            <AdminPanelView />
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

      <footer className="w-full py-8 flex flex-col items-center gap-4 relative z-20">
        <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.5em] mb-1 opacity-40">METAVERSE.DUNGEONSWITHGEMS.QUEST // SYNCED_TO_GRID</p>
        
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 opacity-40 hover:opacity-100 transition-opacity duration-500 bg-black/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5 shadow-xl">
           <a href="https://github.com/skippergemx" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-slate-400 hover:text-white uppercase italic tracking-wider transition-colors">Github</a>
           <a href="https://x.com/skippergemx" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-slate-400 hover:text-cyan-400 uppercase italic tracking-wider transition-colors">Twitter</a>
           <a href="https://t.me/skippergemx" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-slate-400 hover:text-blue-400 uppercase italic tracking-wider transition-colors">Telegram</a>
           <div className="text-[10px] font-black text-slate-500 uppercase italic tracking-wider cursor-help" title="Discord: skippergemx">Discord: skippergemx</div>
           <div className="text-[10px] font-black text-white/40 uppercase italic tracking-widest border-l border-white/10 pl-4">Dev: Skipper Gemx</div>
        </div>
      </footer>

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
    </div>
  );
};