/**
 * PartyCompanionDock.jsx
 * 
 * A persistent floating widget that shows active companions across all game views.
 * 
 * Features:
 * - Avatar row with active-speaker glow indicators
 * - Collapsible speaker bubble with typewriter animation
 * - Auto-cycles companion banter every 12 seconds
 * - Auto-collapses after 20s of inactivity
 * - Hidden on MenuView (CharacterBadge handles it there)
 * - Mobile-responsive sizing and positioning
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown, MessageCircle } from 'lucide-react';
import { useCompanionBanter } from '../hooks/useCompanionBanter';
import { useGame } from '../contexts/GameContext';

const AUTO_CYCLE_MS = 12000;
const AUTO_COLLAPSE_MS = 20000;
const TYPEWRITER_SPEED_MS = 25;

/**
 * Render a miniature avatar/icon for a companion.
 */
const CompanionThumb = ({ comp, player }) => {
  const sizeClass = 'w-8 h-8 md:w-10 md:h-10';

  switch (comp.avatarType) {
    case 'pet':
      return (
        <div className={`${sizeClass} rounded-full border-2 border-black overflow-hidden bg-slate-950 shrink-0`}>
          <img
            src={`/assets/pets/genesis-pets/Genesis Pets (${comp.petId}).jpg`}
            className="w-full h-full object-cover contrast-125"
            alt={comp.displayName}
            loading="lazy"
          />
        </div>
      );
    case 'mate':
      return (
        <div className={`${sizeClass} rounded-full border-2 border-black bg-purple-700 flex items-center justify-center text-white text-sm md:text-lg shrink-0 overflow-hidden`}>
          {comp.icon ? (
            <span>{comp.icon}</span>
          ) : (
            <img
              src={`/assets/partymemberavatar/${comp.displayName}.jpg`}
              className="w-full h-full object-cover"
              alt={comp.displayName}
              loading="lazy"
              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
            />
          )}
        </div>
      );
    case 'gemx':
      return (
        <div className={`${sizeClass} rounded-full border-2 border-black bg-cyan-800 overflow-hidden shrink-0`}>
          <img
            src={`/assets/dragonsground/gemx/${player?.gemxAvatar || 'Cosmic gemx (1).gif'}`}
            className="w-full h-full object-cover"
            alt={comp.displayName}
            loading="lazy"
          />
        </div>
      );
    case 'dragon':
      return (
        <div className={`${sizeClass} rounded-full border-2 border-black bg-orange-700 flex items-center justify-center text-white text-sm md:text-lg shrink-0`}>
          <span>🐉</span>
        </div>
      );
    default:
      return (
        <div className={`${sizeClass} rounded-full border-2 border-black bg-slate-600 flex items-center justify-center text-white text-xs shrink-0`}>
          ?
        </div>
      );
  }
};

/**
 * PartyCompanionDock — floating companion widget.
 */
export const PartyCompanionDock = React.memo(({ onOpenChat }) => {
  const { player, adventure, PETS_METADATA, TAVERN_MATES } = useGame();
  const { view } = adventure || {};

  const [isExpanded, setIsExpanded] = useState(false);
  const [displayedMsg, setDisplayedMsg] = useState('');
  const [banterData, setBanterData] = useState(null);
  const [inactivityTimer, setInactivityTimer] = useState(null);

  const { activeCompanions, pickBanter } = useCompanionBanter(
    player,
    0, // penaltyRemaining — dock doesn't need penalty context
    PETS_METADATA,
    TAVERN_MATES
  );

  /**
   * pickMessage — generates a new banter message and seeds the typewriter.
   * MUST be declared before any early returns to preserve React hook ordering.
   */
  const pickMessage = useCallback(() => {
    const data = pickBanter();
    setBanterData(data);
    setDisplayedMsg('');
  }, [pickBanter]);

  // ═══ ALL HOOKS MUST BE BEFORE EARLY RETURNS ═══

  // Typewriter effect
  useEffect(() => {
    if (!banterData || !isExpanded) return;
    if (displayedMsg.length < banterData.message.length) {
      const timeout = setTimeout(
        () => setDisplayedMsg(banterData.message.slice(0, displayedMsg.length + 1)),
        TYPEWRITER_SPEED_MS
      );
      return () => clearTimeout(timeout);
    }
  }, [displayedMsg, banterData, isExpanded]);

  // Auto-cycle banter when expanded
  useEffect(() => {
    if (!isExpanded) return;
    pickMessage();
    const interval = setInterval(pickMessage, AUTO_CYCLE_MS);
    return () => clearInterval(interval);
  }, [isExpanded, pickMessage]);

  // Auto-collapse after inactivity
  useEffect(() => {
    if (!isExpanded) return;
    const timer = setTimeout(() => {
      setIsExpanded(false);
    }, AUTO_COLLAPSE_MS);
    setInactivityTimer(timer);
    return () => clearTimeout(timer);
  }, [isExpanded, banterData]);

  // ═══ EARLY RETURNS (safe after all hooks) ═══

  // Don't render on MenuView (CharacterBadge already shows companions)
  if (view === 'menu' || view === 'dungeon_menu') return null;

  // Don't render if only Hunter is present
  const nonHunterCompanions = activeCompanions.filter(c => c.type !== 'hunter');
  if (nonHunterCompanions.length === 0) return null;

  // ═══ REGULAR FUNCTIONS (not hooks, safe after early returns) ═══

  /**
   * Handle expanding the dock. Resets the inactivity timer.
   */
  const handleExpand = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (!isExpanded) {
      setIsExpanded(true);
      pickMessage();
    } else {
      setIsExpanded(false);
    }
  };

  /**
   * Handle clicking on a companion avatar.
   * Opens the CompanionChatModal for the tapped companion.
   */
  const handleCompanionClick = (comp) => {
    if (onOpenChat) {
      onOpenChat(comp);
    } else {
      // Fallback: expand dock and cycle banter
      if (isExpanded) {
        pickMessage();
      } else {
        setIsExpanded(true);
        pickMessage();
      }
    }
  };

  const prefixColor = banterData?.color || 'var(--neon-cyan)';
  const prefixLabel = banterData?.prefix || '[COMM_LINK]';

  return (
    <div
      className={`fixed z-40 transition-all duration-300
        ${isExpanded ? 'bottom-3 right-3 md:bottom-4 md:right-4' : 'bottom-2 right-2 md:bottom-3 md:right-3'}
        flex flex-col items-end gap-2 max-w-[85vw] md:max-w-sm`}
    >
      {/* ─── COMPANION AVATAR ROW ─── */}
      <div
        className={`flex items-center gap-1.5 bg-white/95 backdrop-blur-md
          border-2 border-black rounded-full px-2.5 py-1.5 md:px-3 md:py-2
          shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
          transition-all duration-200 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
          cursor-pointer select-none`}
        onClick={handleExpand}
      >
        {nonHunterCompanions.map((comp, i) => {
          const isActiveSpeaker = banterData?.speaker?.type === comp.type && isExpanded;
          return (
            <button
              key={`${comp.type}-${i}`}
              onClick={(e) => { e.stopPropagation(); handleCompanionClick(comp); }}
              className={`transition-all duration-200 rounded-full shrink-0
                ${isActiveSpeaker
                  ? 'scale-110 ring-2 ring-offset-1'
                  : 'opacity-60 hover:opacity-100 hover:scale-105'
                }`}
              style={{
                borderColor: isActiveSpeaker ? comp.color : undefined,
                boxShadow: isActiveSpeaker ? `0 0 12px ${comp.color}60` : undefined
              }}
              title={`${comp.displayName} — ${comp.type}`}
            >
              <CompanionThumb comp={comp} player={player} />
              {/* Active speaker dot */}
              {isActiveSpeaker && (
                <div
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white animate-pulse"
                  style={{ backgroundColor: comp.color }}
                />
              )}
            </button>
          );
        })}

        {/* Expand/Collapse Toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); handleExpand(); }}
          className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-black flex items-center
            justify-center text-white hover:scale-110 transition-transform shrink-0 ml-1"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* ─── SPEAKER BUBBLE (when expanded) ─── */}
      {isExpanded && banterData && (
        <div
          className="w-full bg-black border-2 border-black rounded-2xl p-3 md:p-4
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            animate-in slide-in-from-bottom-2 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Speaker header */}
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center
                text-[8px] font-black text-white shrink-0"
              style={{ backgroundColor: prefixColor }}
            >
              {banterData.speaker.displayName.charAt(0).toUpperCase()}
            </div>
            <span
              className="text-[7px] md:text-[8px] font-black uppercase tracking-widest leading-none"
              style={{ color: prefixColor }}
            >
              {prefixLabel}
            </span>
            <span className="text-[6px] font-black text-white/30 uppercase tracking-wider ml-auto">
              {banterData.speaker.displayName.length > 10
                ? banterData.speaker.displayName.slice(0, 8) + '..'
                : banterData.speaker.displayName}
            </span>
          </div>

          {/* Message with typewriter */}
          <div className="flex items-start gap-2">
            <MessageCircle size={12} className="text-white/40 mt-0.5 shrink-0" />
            <p className="text-[10px] md:text-xs font-black text-white uppercase leading-snug italic flex-1 min-w-0">
              {displayedMsg}
              <span
                className="w-1 h-2.5 ml-0.5 inline-block animate-pulse rounded-sm"
                style={{ backgroundColor: prefixColor }}
              />
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

PartyCompanionDock.displayName = 'PartyCompanionDock';
