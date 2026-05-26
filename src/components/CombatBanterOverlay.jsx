import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useCombatBanter } from '../hooks/useCombatBanter';

const TYPWRITER_SPEED_MS = 35;
const DISPLAY_DURATION_MS = 4500;
const FADE_DURATION_MS = 500;

/**
 * renderAvatar — returns a React element for the companion's avatar thumbnail.
 *
 * @param {Object} avatar - Avatar info { type, num?, petId?, element?, mateId?, icon? }
 * @param {string} sizeClass - Tailwind size classes (e.g. 'w-8 h-8')
 * @returns {JSX.Element}
 */
const renderAvatar = (avatar, sizeClass) => {
  if (!avatar) return null;
  const baseStyle = `rounded-full border-2 border-black flex-shrink-0 overflow-hidden bg-slate-900 ${sizeClass}`;

  switch (avatar.type) {
    case 'pet':
      return (
        <div className={`${baseStyle} flex items-center justify-center`}>
          <img
            src={`/assets/pets/genesis-pets/Genesis Pets (${avatar.petId}).jpg`}
            alt="Pet"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      );
    case 'mate': {
      // Derive mate name from mateId for the image path
      const mateName = avatar.mateId
        ? avatar.mateId.charAt(0).toUpperCase() + avatar.mateId.slice(1)
        : 'Unknown';
      return (
        <div className={`${baseStyle} flex items-center justify-center`}>
          <img
            src={`/assets/partymemberavatar/${mateName}.jpg`}
            alt={mateName}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      );
    }
    case 'gemx': {
      const gemxFileMap = {
        cosmic: 'Cosmic gemx (1).gif',
        earthen: 'Earthen gemx (2).gif',
        gale: 'Gale gemx (3).gif',
        pyro: 'Pyro gemx (4).gif',
        hydro: 'Hydro gemx (5).gif'
      };
      const gemxFile = gemxFileMap[avatar.element?.toLowerCase()] || 'Cosmic gemx (1).gif';
      return (
        <div className={`${baseStyle} flex items-center justify-center`}>
          <img
            src={`/assets/dragonsground/gemx/${gemxFile}`}
            alt="Gemx"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      );
    }
    case 'dragon':
      return (
        <div className={`${baseStyle} flex items-center justify-center text-lg md:text-2xl bg-black`}>
          🐉
        </div>
      );
    case 'player':
    default:
      return (
        <div className={`${baseStyle} flex items-center justify-center`}>
          <img
            src={`/assets/playeravatar/CrystleHunterAvatar (${avatar.num || 1}).jpg`}
            alt="Hunter"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      );
  }
};

/**
 * CombatBanterOverlay — persistent banter bar in the combat arena.
 * Watches combat state changes and displays contextual companion reactions.
 *
 * Props:
 *   combat      — Combat state from useGame()
 *   player      — Player object
 *   enemy       — Current enemy (optional)
 *   petsMeta    — PETS_METADATA from game context
 *   tavernMates — TAVERN_MATES from game context
 */
export const CombatBanterOverlay = React.memo(({ combat, player, enemy, petsMeta, tavernMates }) => {
  const { currentBanter, triggerBanter, banterHistory } = useCombatBanter({
    combat,
    player,
    enemy,
    petsMeta,
    tavernMates
  });

  const [displayedBanter, setDisplayedBanter] = useState(null);
  const [typewriterText, setTypewriterText] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const typewriterRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  // Typewriter animation when currentBanter changes
  useEffect(() => {
    if (!currentBanter) return;

    // Clear any pending timers
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    // Show immediately (preempt old banter)
    setDisplayedBanter(currentBanter);
    setTypewriterText('');
    setIsVisible(true);

    let charIndex = 0;
    const message = currentBanter.message || '';

    typewriterRef.current = setInterval(() => {
      charIndex++;
      if (charIndex >= message.length) {
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
        setTypewriterText(message);

        // Start dismiss timer after typewriter finishes
        dismissTimerRef.current = setTimeout(() => {
          setIsVisible(false);
          fadeTimerRef.current = setTimeout(() => {
            setDisplayedBanter(null);
            setTypewriterText('');
          }, FADE_DURATION_MS);
        }, DISPLAY_DURATION_MS);
      } else {
        setTypewriterText(message.slice(0, charIndex));
      }
    }, TYPWRITER_SPEED_MS);

    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [currentBanter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  const sizeClass = useMemo(() => 'w-8 h-8 md:w-10 md:h-10', []);

  if (!displayedBanter) return null;

  return (
    <div className="w-full flex justify-center z-50 mb-2 px-2">
      <div
        className={`
          bg-black/90 border-2 border-white rounded-xl
          shadow-[4px_4px_0px_0px_var(--neon-cyan)]
          flex items-center gap-2 md:gap-3
          max-w-lg w-full
          px-3 py-2 md:px-4 md:py-2.5
          transition-all duration-300
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}
      >
        {/* Companion Avatar Thumbnail */}
        {renderAvatar(displayedBanter.avatar, sizeClass)}

        {/* Prefix + Message */}
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className="text-[8px] md:text-[10px] font-black uppercase tracking-wider"
            style={{ color: displayedBanter.color }}
          >
            {displayedBanter.prefix}
          </span>
          <p className="text-white text-[11px] md:text-sm font-black italic leading-tight truncate">
            {typewriterText}
            {typewriterRef.current && (
              <span className="animate-pulse ml-0.5 text-white/60">▊</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
});

CombatBanterOverlay.displayName = 'CombatBanterOverlay';
