import React, { useState, useEffect, useCallback } from 'react';
import { CitizenMedia, AvatarMedia } from './GameUI';

/**
 * Reusable Talking NPC Card with typewriter dialogue.
 * @param {number}   citizenNum   - CrystleTownCitizen asset number (1–30)
 * @param {number}   avatarNum    - Optional elite AvatarMedia number (overrides citizenNum if set)
 * @param {string}   name         - Display name label on the portrait
 * @param {string}   accentColor  - Tailwind bg color for accents (e.g. 'bg-amber-500')
 * @param {string}   textColor    - Tailwind text color for the speaker prefix (e.g. 'text-amber-600')
 * @param {string}   glowColor    - Tailwind bg color for glow blur (e.g. 'bg-amber-500')
 * @param {string}   statusTag    - Status line 1 text (e.g. 'SYSTEM_ONLINE')
 * @param {string}   statusTag2   - Status line 2 text (e.g. 'LINK_STABLE')
 * @param {string[]} dialogues    - Array of dialogue strings to cycle through
 * @param {string}   prefix       - Speaker prefix symbol+name (e.g. '◢BARTENDER: ')
 * @param {boolean}  isHeader     - If true, applies compact styling for sticky headers
 */
export const NPCCard = React.memo(({
  citizenNum = 1,
  avatarNum = null,
  name = 'NPC',
  accentColor = 'bg-cyan-500',
  textColor = 'text-cyan-600',
  glowColor = 'bg-cyan-500',
  statusTag = 'SYSTEM_ONLINE',
  statusTag2 = 'LINK_STABLE',
  dialogues = ["Hello, traveller!"],
  prefix = '◢NPC: ',
  isHeader = false,
}) => {
  const [fullMsg, setFullMsg] = useState('');
  const [displayedMsg, setDisplayedMsg] = useState('');

  const pickMessage = useCallback(() => {
    const msg = dialogues[Math.floor(Math.random() * dialogues.length)];
    setFullMsg(msg);
    setDisplayedMsg('');
  }, [dialogues]);

  useEffect(() => {
    if (displayedMsg.length < fullMsg.length) {
      const timeout = setTimeout(() => {
        setDisplayedMsg(fullMsg.slice(0, displayedMsg.length + 1));
      }, 28);
      return () => clearTimeout(timeout);
    }
  }, [displayedMsg, fullMsg]);

  useEffect(() => {
    pickMessage();
    const interval = setInterval(pickMessage, 12000);
    return () => clearInterval(interval);
  }, [dialogues]); // Depend on dialogues directly, skip pickMessage dependency trickery

  return (
    <div
      className={`flex items-center gap-4 bg-white/5 backdrop-blur-md p-3 border-[3px] border-black rounded-2xl relative overflow-visible group shadow-[8px_8px_0_rgba(0,0,0,1)] -rotate-1 transform transition-all hover:rotate-0 z-20 cursor-pointer ${isHeader ? 'max-w-xl mx-auto my-2' : ''}`}
      onClick={pickMessage}
    >
      {/* Portrait */}
      <div className="relative shrink-0">
        <div className={`absolute -inset-1 ${glowColor} rounded-xl blur opacity-30 animate-pulse`}></div>
        <div className={`${isHeader ? 'w-16 h-24' : 'w-20 h-32 md:w-24 md:h-40'} border-4 border-black rounded-xl overflow-hidden bg-slate-900 shadow-[4px_4px_0_rgba(0,0,0,1)] relative z-10 transition-transform group-hover:scale-105`}>
          {avatarNum ? (
            <AvatarMedia num={avatarNum} animated={true} className="w-full h-full object-cover object-top" />
          ) : (
            <CitizenMedia num={citizenNum} className="w-full h-full object-cover object-top" />
          )}
          <div className={`absolute inset-x-0 bottom-0 ${accentColor} text-black text-[6px] font-black px-1 py-0.5 border-t-2 border-black text-center uppercase italic z-20`}>
            {name}
          </div>
        </div>
      </div>

      {/* Speech Bubble */}
      <div className="flex-1 relative">
        <div className="bg-white border-[3px] border-black p-3 shadow-[6px_6px_0_rgba(0,0,0,0.5)] relative transform -rotate-1 flex items-center min-h-[60px]">
          <div className="absolute left-[-11px] top-4 w-4 h-4 bg-white border-l-[3px] border-b-[3px] border-black transform rotate-45" />
          <p className="text-[10px] md:text-[12px] font-black text-black uppercase italic leading-tight tracking-tight">
            <span className={textColor}>{prefix}</span>
            {displayedMsg}
            <span className="w-1.5 h-3 bg-black inline-block ml-1 animate-pulse" />
          </p>
        </div>
        <div className="mt-1 flex gap-2 flex-wrap">
          <div className="flex items-center gap-1 opacity-50">
            <div className={`w-1.5 h-1.5 ${accentColor} rounded-full animate-pulse`} />
            <span className={`text-[7px] font-black uppercase italic tracking-widest ${textColor}`}>{statusTag}</span>
          </div>
          {statusTag2 && (
            <div className="flex items-center gap-1 opacity-50">
              <div className={`w-1.5 h-1.5 ${accentColor} rounded-full animate-bounce`} />
              <span className={`text-[7px] font-black uppercase italic tracking-widest ${textColor}`}>{statusTag2}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
