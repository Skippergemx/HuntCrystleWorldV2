import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, CheckCircle, AlertCircle, X } from 'lucide-react';
import { CitizenMedia, AvatarMedia } from './GameUI';

/**
 * A Unified Talking NPC Component for Anime Comic Aesthetic.
 * Features typewriter text and "talking" animation.
 */
export const TalkingNPC = React.memo(({ 
  npcIndex, 
  name, 
  dialogue, 
  accentColor = 'bg-cyan-500', 
  isTalking = false,
  className = "" 
}) => {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    setDisplayed('');
  }, [dialogue]);

  useEffect(() => {
    if (displayed.length < dialogue.length) {
      const timeout = setTimeout(() => {
        setDisplayed(dialogue.slice(0, displayed.length + 1));
      }, 25);
      return () => clearTimeout(timeout);
    }
  }, [displayed, dialogue]);

  const isTyping = displayed.length < dialogue.length;

  return (
    <div className={`flex flex-col md:flex-row gap-4 items-start ${className}`}>
      {/* Portrait with "Talking" pulse */}
      <div className="relative shrink-0">
        <div className={`w-24 h-32 md:w-32 md:h-44 border-[4px] border-black rounded-2xl overflow-hidden bg-slate-900 shadow-[6px_6px_0_rgba(0,0,0,1)] relative z-10 transition-transform ${isTyping ? 'animate-talking scale-105' : 'hover:scale-105'}`}>
          <CitizenMedia num={npcIndex} className="w-full h-full object-cover object-top" />
          <div className={`absolute inset-x-0 bottom-0 ${accentColor} text-black text-[8px] font-black px-2 py-1 border-t-[3px] border-black text-center uppercase italic z-20`}>
            {name}
          </div>
        </div>
        {/* Dynamic Shadow */}
        <div className={`absolute inset-0 ${accentColor} opacity-20 blur-xl rounded-full -z-10 animate-pulse`}></div>
      </div>

      {/* Speech Bubble */}
      <div className="flex-1 relative mt-2 md:mt-4">
        <div className="bg-white border-[4px] border-black p-4 shadow-[8px_8px_0_rgba(0,0,0,1)] relative transform -rotate-1 min-h-[80px] flex items-center">
          <div className="absolute left-[-14px] top-6 w-6 h-6 bg-white border-l-[4px] border-b-[4px] border-black transform rotate-45 hidden md:block" />
          <div className="absolute top-[-14px] left-8 w-6 h-6 bg-white border-l-[4px] border-t-[4px] border-black transform rotate-45 md:hidden" />
          
          <p className="text-sm md:text-base font-black text-black uppercase italic leading-snug tracking-tight">
            "{displayed}
            <span className="w-2 h-4 bg-black inline-block ml-1 animate-pulse align-middle" />"
          </p>
        </div>
      </div>
    </div>
  );
});

/**
 * Unified Comic-Style Quest Card.
 */
export const ComicQuestCard = React.memo(({ 
  npcIndex, 
  title, 
  subtitle, 
  badge, 
  accentColor = "bg-amber-400",
  onClick,
  isCompleted = false,
  isReady = false,
  children,
  footer,
  idx = 0
}) => {
  const rotation = idx % 2 === 0 ? '-rotate-1' : 'rotate-1';
  
  return (
    <div 
      onClick={onClick}
      className={`relative group ${rotation} transform transition-all cursor-pointer active:translate-y-0 active:scale-[0.98] ${isCompleted ? 'opacity-60 grayscale-[0.5]' : 'hover:-translate-y-2 hover:rotate-0'}`}
    >
      {/* Background Offset */}
      <div className={`absolute inset-0 ${accentColor} rounded-2xl translate-x-2 translate-y-2 opacity-20 group-hover:opacity-40 transition-all shadow-xl`} />
      
      <div className="relative bg-white border-[4px] border-black rounded-2xl overflow-hidden shadow-[6px_6px_0_rgba(0,0,0,1)] flex h-48 md:h-52">
        {/* Left Side: Portrait Panel */}
        <div className="w-28 md:w-36 shrink-0 relative bg-slate-900 border-r-[4px] border-black overflow-hidden group-hover:bg-slate-800 transition-colors">
          <CitizenMedia 
            num={npcIndex} 
            className={`w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ${isReady ? 'animate-comic-bounce' : ''}`} 
          />
          
          {/* Halftone Overlay */}
          <div className="absolute inset-0 opacity-[0.15] bg-comic-dots pointer-events-none" />
          
          {/* NPC Name Tag */}
          <div className={`absolute inset-x-0 bottom-0 ${accentColor} text-black text-[8px] font-black py-1.5 uppercase italic tracking-tighter border-t-[3px] border-black text-center z-20`}>
            {title}
          </div>
        </div>

        {/* Right Side: Mission Content */}
        <div className="flex-1 p-3 md:p-4 flex flex-col bg-[#fdfaf5] relative">
          {/* Internal Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '15px 15px' }} />

          {/* Header Area */}
          <div className="flex items-start justify-between mb-2 relative z-10">
            <div className={`px-2 py-0.5 rounded border-2 border-black ${accentColor} text-[8px] md:text-[10px] font-black uppercase italic tracking-widest shadow-[2px_2px_0_rgba(0,0,0,1)] transform -rotate-2`}>
              {badge}
            </div>
            {isReady && !isCompleted && (
              <div className="bg-green-500 text-white text-[8px] font-black px-1.5 py-0.5 border-2 border-black uppercase rotate-6 shadow-lg animate-bounce">
                READY!
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 space-y-2 relative z-10 overflow-hidden">
            <p className="text-[10px] md:text-xs font-bold text-slate-800 uppercase italic leading-tight tracking-tight line-clamp-3">
              {subtitle}
            </p>
            {children}
          </div>

          {/* Footer Area */}
          <div className="mt-2 pt-2 border-t-2 border-dashed border-black/10 flex items-center justify-between relative z-10">
            {footer}
            <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase italic">
              <span>SYNC LINK</span>
              <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Completed Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[1px] flex items-center justify-center z-30">
            <div className="bg-emerald-500 text-black text-xs md:text-sm font-black px-6 py-2 border-[4px] border-black -rotate-12 uppercase italic shadow-[6px_6px_0_rgba(0,0,0,1)] flex items-center gap-2 animate-badge-pop">
              <CheckCircle size={20} />
              SUCCESS
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * A DRAMATIC Full-Screen Modal for Quests.
 */
export const ComicQuestModal = ({ 
  isOpen, 
  onClose, 
  npcIndex, 
  npcName, 
  dialogue, 
  title, 
  accentColor = "bg-amber-400",
  children,
  actions 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-[#faf6f0] border-[5px] border-black rounded-[2.5rem] overflow-hidden shadow-[15px_15px_0_rgba(0,0,0,1)] animate-slide-skew-in">
        
        {/* Dynamic Header */}
        <div className={`w-full ${accentColor} py-4 px-8 border-b-[5px] border-black flex items-center justify-between shadow-inner`}>
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-black rounded-full animate-pulse" />
            <h2 className="text-xl md:text-2xl font-black text-black uppercase italic tracking-tighter drop-shadow-sm">
              MISSION_LOG: {title}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-red-600 text-white rounded-lg border-[3px] border-black flex items-center justify-center hover:bg-red-500 transition-all hover:scale-110 active:scale-95 shadow-[2px_2px_0_rgba(0,0,0,1)]"
          >
            <X size={20} strokeWidth={4} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-full max-h-[85vh] md:max-h-[600px] overflow-y-auto custom-scrollbar">
          {/* Left Panel: Dramatic NPC Portrait */}
          <div className="w-full md:w-64 shrink-0 relative bg-slate-950 border-b-[5px] md:border-b-0 md:border-r-[5px] border-black overflow-hidden group">
            <CitizenMedia 
              num={npcIndex} 
              className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity duration-700" 
            />
            {/* Action Lines Overlay */}
            <div className="absolute inset-0 opacity-[0.1] bg-comic-dots pointer-events-none" />
            
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-lg text-center">
                <p className="text-[10px] font-black text-white uppercase italic tracking-[0.25em]">{npcName}</p>
                <p className="text-[8px] font-bold text-white/50 uppercase mt-1">Authorized Civilian</p>
              </div>
            </div>
            
            {/* Scanline Animation */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none animate-scroll-diag opacity-20" />
          </div>

          {/* Right Panel: Interactive Console */}
          <div className="flex-1 p-6 md:p-8 flex flex-col relative bg-[#fdfaf5]">
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1.5px, transparent 1.5px), linear-gradient(90deg, #000 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }} />

            {/* Talking Block */}
            <div className="mb-8 relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-2 py-1 bg-black text-white text-[8px] font-black uppercase italic tracking-widest rounded">COMM_LINK</div>
                <div className="h-[2px] flex-1 bg-black/10" />
              </div>
              
              <div className="bg-white border-[4px] border-black p-5 rounded-3xl shadow-[6px_6px_0_rgba(0,0,0,1)] relative group">
                <div className="absolute -left-2 top-8 w-5 h-5 bg-white border-l-[4px] border-b-[4px] border-black rotate-45 hidden md:block" />
                <p className="text-15px md:text-lg font-black text-black leading-tight uppercase italic quote">
                  "{dialogue}"
                </p>
              </div>
            </div>

            {/* Content Slot */}
            <div className="flex-1 relative z-10 mb-8 min-h-[120px]">
              {children}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 relative z-20">
              {actions}
            </div>
          </div>
        </div>

        {/* Floating Background Decorations */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-black opacity-[0.02] rounded-full pointer-events-none" />
      </div>
    </div>
  );
};
