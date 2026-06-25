/**
 * CompanionChatModal.jsx
 *
 * A deep-conversation modal triggered by tapping a companion avatar in the
 * PartyCompanionDock or CharacterBadge. Shows the companion's portrait,
 * a scrollable chat log, and contextual topic-response buttons.
 *
 * Phase 3 of the Companion Banter System.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { TOPIC_RESPONSES } from '../data/companion_dialogues';

/* ─── Helpers ─── */

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Determine available topics for a given companion + game context.
 */
const getAvailableTopics = (companion, context) => {
  const baseTopics = [
    { id: 'how_are_you', label: 'How are you?' },
    { id: 'cheer_up', label: 'Cheer me up' },
  ];

  // Element/lore topics for pet/gemx
  if (companion.type === 'pet' || companion.type === 'gemx') {
    baseTopics.push({ id: 'element', label: 'Tell me about your element' });
    baseTopics.push({ id: 'bond', label: 'Our bond?' });
    baseTopics.push({ id: 'lore', label: 'What do you know?' });
    baseTopics.push({ id: 'enemy_tip', label: 'Enemy weakness?' });
  }

  // Tactical topics for mate
  if (companion.type === 'mate') {
    baseTopics.push({ id: 'tactics', label: 'Any combat advice?' });
    baseTopics.push({ id: 'lore', label: 'Tell me a story' });
    baseTopics.push({ id: 'enemy_tip', label: 'Enemy weakness?' });
  }

  // Dragon topics
  if (companion.type === 'dragon') {
    baseTopics.push({ id: 'element', label: 'Show me your power' });
    baseTopics.push({ id: 'tactics', label: 'Battle strategy?' });
    baseTopics.push({ id: 'enemy_tip', label: 'Enemy weakness?' });
    baseTopics.push({ id: 'lore', label: 'Ancient knowledge' });
  }

  // Hunter topics
  if (companion.type === 'hunter') {
    baseTopics.push({ id: 'status', label: "What's our status?" });
    baseTopics.push({ id: 'heal_advice', label: 'I need healing' });
  }

  // Context-sensitive additions
  if (context === 'lowHp' || context === 'penalized') {
    baseTopics.push({ id: 'heal_advice', label: 'I need healing' });
  }

  return baseTopics;
};

/**
 * Resolve a companion's topic response from TOPIC_RESPONSES data.
 */
const resolveTopicResponse = (companion, topicId) => {
  const { type, elementOrId } = companion;

  const typePool = TOPIC_RESPONSES[type];
  if (!typePool) return pickRandom(TOPIC_RESPONSES.hunter?.how_are_you || ["I'm here."]);

  // pet/gemx have element sub-keys
  if (type === 'pet' || type === 'gemx') {
    const elem = elementOrId || 'cosmic';
    const elementPool = typePool[elem];
    if (!elementPool) return pickRandom(TOPIC_RESPONSES.hunter?.how_are_you || ["..."]);
    const responses = elementPool[topicId];
    if (!responses || responses.length === 0) {
      // fallback: try how_are_you
      const fallback = elementPool.how_are_you;
      return fallback ? pickRandom(fallback) : "...";
    }
    return pickRandom(responses);
  }

  // mate has mate-id sub-keys
  if (type === 'mate') {
    const mateId = elementOrId;
    const matePool = typePool[mateId];
    if (!matePool) return pickRandom(TOPIC_RESPONSES.hunter?.how_are_you || ["..."]);
    const responses = matePool[topicId];
    if (!responses || responses.length === 0) {
      const fallback = matePool.how_are_you;
      return fallback ? pickRandom(fallback) : "...";
    }
    return pickRandom(responses);
  }

  // hunter, dragon — direct topic keys
  const responses = typePool[topicId];
  if (!responses || responses.length === 0) {
    const fallback = typePool.how_are_you;
    return fallback ? pickRandom(fallback) : "...";
  }
  return pickRandom(responses);
};

/**
 * Get an opening line for the companion using topics.
 * Uses 'how_are_you' topic as the opener, or context-specific.
 */
const getOpeningLine = (companion, context) => {
  // For lowHp context, start with heal_advice
  if (context === 'lowHp' || context === 'penalized') {
    const line = resolveTopicResponse(companion, 'heal_advice');
    if (line !== '...') return line;
  }
  return resolveTopicResponse(companion, 'how_are_you');
};

/* ─── CompanionThumb (mini version for modal header) ─── */

const CompanionThumb = ({ comp, player }) => {
  const sizeClass = 'w-10 h-10 md:w-12 md:h-12';

  switch (comp.avatarType) {
    case 'pet':
      return (
        <div className={`${sizeClass} rounded-xl border-2 border-black overflow-hidden bg-slate-950 shrink-0`}>
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
        <div className={`${sizeClass} rounded-xl border-2 border-black bg-purple-700 flex items-center justify-center text-white text-base shrink-0 overflow-hidden`}>
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
        <div className={`${sizeClass} rounded-xl border-2 border-black bg-cyan-800 overflow-hidden shrink-0`}>
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
        <div className={`${sizeClass} rounded-xl border-2 border-black bg-orange-700 flex items-center justify-center text-white text-lg shrink-0`}>
          <span>🐉</span>
        </div>
      );
    default:
      return (
        <div className={`${sizeClass} rounded-xl border-2 border-black bg-slate-600 flex items-center justify-center text-white shrink-0`}>
          ?
        </div>
      );
  }
};

/* ─── CompanionChatModal ─── */

export const CompanionChatModal = React.memo(({ companion, player, context, onClose }) => {
  const [chatLog, setChatLog] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [openingDone, setOpeningDone] = useState(false);

  // Determine the element display string
  const elementLabel = useMemo(() => {
    if (!companion.elementOrId) return null;
    if (['pet', 'gemx'].includes(companion.type)) {
      return companion.elementOrId.charAt(0).toUpperCase() + companion.elementOrId.slice(1);
    }
    return null;
  }, [companion]);

  // Get companion level display if available
  const levelLabel = useMemo(() => {
    // Pet level can be derived from player petLevel if available
    // For now, show a generic tag
    if (companion.type === 'pet') {
      const petLvl = player.petLevels?.[player.petId] || player.petLevel || 1;
      return `LVL ${petLvl}`;
    }
    if (companion.type === 'mate' && player?.hiredMate) {
      return 'HIRED';
    }
    if (companion.type === 'gemx') {
      return 'AWAKE';
    }
    if (companion.type === 'dragon') {
      return 'BONDED';
    }
    return null;
  }, [companion, player]);

  // Initialize chat on mount
  useEffect(() => {
    if (openingDone) return;

    const openingLine = getOpeningLine(companion, context);
    setChatLog([{ speaker: 'companion', text: openingLine }]);
    setAvailableTopics(getAvailableTopics(companion, context));
    setOpeningDone(true);
  }, [companion, context, openingDone]);

  /**
   * Handle clicking a topic button.
   */
  const handleTopicClick = useCallback((topic) => {
    // Add player's message
    setChatLog(prev => [...prev, { speaker: 'player', text: topic.label }]);

    // Resolve companion response
    const response = resolveTopicResponse(companion, topic.id);
    setChatLog(prev => [...prev, { speaker: 'companion', text: response }]);

    // Refresh topics (remove the selected one, keep others)
    setAvailableTopics(prev => {
      const filtered = prev.filter(t => t.id !== topic.id);
      // Add a follow-up option if topics are running low
      if (filtered.length < 2) {
        const moreTopics = getAvailableTopics(companion, context);
        // Add any topics not already in the list
        const existingIds = new Set([...prev.map(t => t.id), ...filtered.map(t => t.id)]);
        const newTopics = moreTopics.filter(t => !existingIds.has(t.id));
        return [...filtered, ...newTopics];
      }
      return filtered;
    });
  }, [companion, context]);

  /**
   * Handle clicking outside the modal to close.
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const companionColor = companion.color || 'var(--neon-cyan)';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white border-[4px] border-black rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,1)]
          w-full max-w-sm md:max-w-md flex flex-col overflow-hidden
          max-h-[95vh] md:max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ HEADER — Companion info + Close ═══ */}
        <div className="flex items-center gap-3 p-3 md:p-4 border-b-2 border-black/10 shrink-0">
          <CompanionThumb comp={companion} player={player} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[8px] md:text-[10px] font-black uppercase tracking-widest leading-none"
                style={{ color: companionColor }}
              >
                {companion.label}
              </span>
              <span className="text-xs md:text-sm font-black truncate leading-none">
                {companion.displayName}
              </span>
              {levelLabel && (
                <span
                  className="text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded border leading-none"
                  style={{
                    backgroundColor: companionColor + '20',
                    borderColor: companionColor + '40',
                    color: companionColor
                  }}
                >
                  {levelLabel}
                </span>
              )}
            </div>
            {elementLabel && (
              <div className="flex items-center gap-1.5 mt-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: companionColor }}
                />
                <span className="text-[8px] font-black text-black/40 uppercase tracking-wider leading-none">
                  Element: {elementLabel}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 md:w-8 md:h-8 rounded-full bg-black flex items-center justify-center
              text-white hover:scale-110 transition-transform shrink-0 active:scale-95"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ═══ CHAT LOG ═══ */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 custom-scrollbar min-h-[200px]">
          {chatLog.map((entry, i) => (
            <div
              key={i}
              className={`flex ${entry.speaker === 'player' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-1 fade-in duration-150`}
            >
              <div
                className={`max-w-[85%] md:max-w-[80%] px-3 py-2 rounded-xl border-2 border-black
                  ${entry.speaker === 'player'
                    ? 'bg-black text-white rounded-br-none'
                    : 'bg-white text-black rounded-bl-none'
                  }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  {entry.speaker === 'companion' ? (
                    <span className="text-[7px] font-black uppercase tracking-widest opacity-50" style={{ color: companionColor }}>
                      {companion.label}
                    </span>
                  ) : (
                    <span className="text-[7px] font-black uppercase tracking-widest text-white/50">
                      YOU
                    </span>
                  )}
                </div>
                <p className="text-[10px] md:text-xs font-bold uppercase leading-snug italic">
                  {entry.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ TOPIC BUTTONS ═══ */}
        <div className="p-3 md:p-4 border-t-2 border-black/10 bg-black/5 shrink-0">
          <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center">
            {availableTopics.map(topic => (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic)}
                className="px-2.5 py-1.5 md:px-3 md:py-1.5 bg-white border-2 border-black rounded-full
                  text-[8px] md:text-[9px] font-black uppercase tracking-wider italic
                  hover:bg-black hover:text-white transition-all duration-150
                  active:scale-95 shadow-[2px_2px_0px_rgba(0,0,0,1)]
                  hover:shadow-[3px_3px_0px_rgba(0,0,0,1)]"
              >
                <span className="flex items-center gap-1">
                  <MessageCircle size={10} className="shrink-0" />
                  {topic.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 10px; }
        @keyframes zoom-in-95 {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-in.zoom-in-95 {
          animation: zoom-in-95 0.2s ease-out;
        }
      `}</style>
    </div>
  );
});

CompanionChatModal.displayName = 'CompanionChatModal';
