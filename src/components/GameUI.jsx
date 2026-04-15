import React from 'react';
import { X, Sparkles, PlusCircle, HelpCircle, ShieldAlert } from 'lucide-react';

export const Header = React.memo(({ title, onClose, onHelp, npcNum, icon, children }) => (
  <div className="w-full z-[100] px-4 md:px-0 pt-2 flex flex-row items-center justify-between gap-4 relative">
    <div className="flex items-center gap-4 flex-1">
      {/* NEW: Large NPC Avatar in Header - "Mission Commander" Mode */}
      {npcNum && (
        <div className="absolute -left-12 -top-6 w-32 h-44 hidden lg:block z-0 opacity-20 hover:opacity-100 transition-opacity pointer-events-none -rotate-6">
          <div className="relative w-full h-full">
            <AvatarMedia num={npcNum} animated={true} className="w-full h-full object-cover object-top grayscale hover:grayscale-0 transition-all filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          </div>
        </div>
      )}

      {/* Standard Header Badge */}
      <div className="bg-black border-[3px] border-white/20 rounded-xl p-3 md:p-4 shadow-[4px_4px_0_rgba(255,255,255,0.05)] transform -skew-x-2 flex items-center gap-3 md:gap-4 flex-shrink-0 relative z-10 group hover:border-cyan-500/50 transition-all">
        {npcNum ? (
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-lg border-2 border-white/20 overflow-hidden relative shadow-[2px_2px_0_rgba(255,255,255,0.1)] shrink-0">
             <AvatarMedia num={npcNum} animated={true} className="w-full h-full object-cover object-top" />
          </div>
        ) : icon ? (
          <div className="p-2 md:p-3 bg-white/5 rounded-lg border-2 border-white/10 text-white shrink-0">
            {icon}
          </div>
        ) : null}
        <div className="flex flex-col">
          <span className="text-[6px] md:text-[8px] font-black text-white/50 uppercase tracking-[0.4em] mb-0.5 leading-none italic">{npcNum ? 'REPRESENTATIVE_SYNC' : 'SYSTEM_SIGNAL'}</span>
          <h1 className="text-sm md:text-2xl font-black text-white italic uppercase tracking-tighter leading-none group-hover:text-cyan-400 transition-colors">{title || 'SYSTEM COMMAND'}</h1>
        </div>
        
        {/* Technical Sub-Tag */}
        <div className="absolute -bottom-2 -right-2 bg-black text-white text-[6px] md:text-[8px] font-black px-1.5 py-0.5 border-2 border-white transform rotate-3">
          LOGID: {npcNum ? `AUTH_${npcNum}` : 'SYS_GRID_0'}
        </div>
      </div>

      {/* Children Slot for custom tools (Potions, etc) */}
      <div className="flex-1 hidden lg:flex items-center justify-center">
        {children}
      </div>
    </div>

    {/* Tactical Controls */}
    <div className="flex gap-3 shrink-0 relative z-30 pt-1">
      {onHelp && (
        <button 
          onClick={onHelp} 
          className="p-2 md:p-3 bg-cyan-500 border-[3px] border-black text-black hover:bg-cyan-300 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transform rotate-3"
          title="Open Guide"
        >
          <HelpCircle size={20} className="md:w-7 md:h-7" strokeWidth={4} />
        </button>
      )}
      <button 
        onClick={onClose} 
        className="p-2 md:p-3 bg-red-650 border-[3px] border-black text-black hover:bg-red-500 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transform -rotate-3"
      >
        <X size={20} className="md:w-7 md:h-7 text-white" strokeWidth={4} />
      </button>
    </div>
  </div>
));

export const GuideModal = React.memo(({ isOpen, onClose, title, content = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="relative max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Comic Panel Shadow */}
        <div className="absolute inset-0 bg-cyan-800 rounded-3xl transform translate-x-2 translate-y-2"></div>
        
        <div className="relative bg-white border-[4px] border-black rounded-3xl overflow-hidden shadow-2xl flex flex-col flex-1">
          {/* Halftone Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
          
          {/* Header Banner */}
          <div className="w-full bg-cyan-600 py-4 md:py-6 border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg">
            <h2 className="text-2xl md:text-4xl font-black text-white text-center uppercase tracking-tighter italic drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
              {title || 'ENROLLMENT GUIDE'}
            </h2>
            <div className="absolute -bottom-3 right-8 bg-black text-white px-3 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] transform rotate-2 border-2 border-white">
              Tactical Intelligence Brief
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-2 right-4 text-white hover:text-black transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Guide Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar relative z-10">
            {content.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="bg-black text-white text-[10px] font-black px-2 py-0.5 transform -rotate-2 border-2 border-black inline-block">
                    SECTION {idx + 1}
                  </div>
                  <h3 className="text-lg font-black text-black uppercase tracking-tight italic">{item.topic}</h3>
                </div>
                <div className="bg-slate-50 border-l-[6px] border-cyan-500 p-3 md:p-4 text-xs md:text-sm font-bold text-slate-700 leading-relaxed uppercase tracking-tight italic">
                  {item.text}
                </div>
              </div>
            ))}
            
            <div className="bg-amber-100 border-[3px] border-black p-4 rounded-xl transform rotate-1 shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black text-amber-700 uppercase leading-tight italic">
                PRO TIP: "Always check your dragon buff timers and companion status before venturing into Sector 7. The Metaverse is unforgiving to the unprepared."
              </p>
            </div>
          </div>

          {/* Footer Close */}
          <div className="p-4 md:p-6 bg-slate-50 border-t-[4px] border-black flex justify-center">
            <button 
              onClick={onClose}
              className="w-full max-w-xs bg-black text-white py-3 md:py-4 rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic text-sm md:text-base"
            >
              UNDERSTOOD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export const NavBtn = React.memo(({ onClick, icon, title, sub, color, disabled, backdrop, npcNum, idx = 0 }) => {
  const rotation = idx % 2 === 0 ? 'rotate-1' : '-rotate-1';
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`flex flex-col items-center justify-center p-3 md:p-7 border-[3px] md:border-[4px] border-black rounded-xl md:rounded-2xl transition-all active:scale-95 group relative overflow-visible shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_rgba(0,0,0,1)] ${rotation} ${disabled ? 'bg-slate-200 cursor-not-allowed' : 'bg-[#faf6f0] hover:border-black hover:-translate-y-1 hover:shadow-[12px_12px_0_rgba(0,0,0,1)]'} transition-all duration-300`}
    >
      {/* Physical Tape Accent */}
      {!disabled && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 md:w-20 h-5 bg-slate-400/30 border-x-[2px] border-black/5 rotate-2 z-50 backdrop-blur-sm pointer-events-none" style={{ maskImage: 'linear-gradient(to right, transparent, black, transparent)' }} />
      )}

      {disabled && (
        <div className="absolute inset-0 bg-slate-900/40 z-10 pointer-events-none rounded-xl md:rounded-2xl flex items-center justify-center">
           <div className="bg-black text-white text-[8px] font-black px-2 py-1 rotate-12 border-2 border-white shadow-xl opacity-100">LOCKED_SYNC</div>
        </div>
      )}

      {backdrop && (
        <div className="absolute inset-2 z-0 pointer-events-none rounded-lg border-[3px] border-black overflow-hidden bg-slate-900 shadow-inner group-hover:scale-[1.02] transition-transform duration-700">
          <img 
            src={backdrop} 
            className="w-full h-full object-cover grayscale-[0.2] contrast-125 opacity-40 group-hover:opacity-70 transition-all" 
            alt=""
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + title; 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Decorative Corner Tabs */}
      {!disabled && (
        <div className={`absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-black/20 group-hover:border-black transition-colors ${color.replace('bg-', 'text-')}`} />
      )}

      {/* Central Identity Block: NPC Avatar AND System Icon */}
      <div className="relative z-20 flex items-end gap-2 mb-2 md:mb-4 group-hover:scale-105 transition-all">
        {npcNum && (
          <div className={`w-16 h-20 md:w-24 md:h-32 ${color} rounded-xl md:rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)] border-[3px] border-black overflow-hidden transform -rotate-2 group-hover:rotate-0 transition-transform`}>
            <div className="w-full h-full relative">
              <CitizenMedia num={npcNum} className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          </div>
        )}

        <div className={`p-2 md:p-4 ${color} rounded-xl md:rounded-2xl shadow-[3px_3px_0_rgba(0,0,0,1)] border-[3px] border-black transform ${npcNum ? 'rotate-6 -ml-4 mb-2' : ''} group-hover:rotate-0 transition-all flex items-center justify-center shrink-0`}>
           {React.cloneElement(icon, { size: 18, className: 'md:w-7 md:h-7 h-5 w-5 text-white drop-shadow-md' })}
        </div>
      </div>
      
      <div className="relative z-30 text-center w-full mt-auto flex flex-col items-center">
        <div className={`bg-white/95 border-[2px] md:border-[3px] border-black py-1.5 md:py-3 px-1 md:px-2 shadow-[4px_4px_0_rgba(0,0,0,1)] -rotate-1 transform group-hover:rotate-0 transition-transform ${disabled ? 'opacity-50' : ''}`}>
          <h3 className={`font-black text-[10px] md:text-xs lg:text-sm uppercase tracking-tighter italic leading-none transition-colors ${disabled ? 'text-slate-500' : 'text-black'}`}>
            {title}
          </h3>
          <div className={`text-[6px] md:text-[8px] font-black uppercase mt-1 md:mt-1.5 tracking-widest italic leading-none transition-colors ${disabled ? 'text-slate-400' : 'text-black/50'}`}>
            {sub}
          </div>
        </div>
      </div>

      {/* Subtle halftone texture overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '6px 6px' }} />
    </button>
  );
});

export const StatTile = React.memo(({ icon, label, value, color, desc, isBuffed, activeFoodEffect, isFoodActive }) => (
  <div className={`border-[3px] md:border-[4px] border-black p-2.5 md:p-4 rounded-lg md:rounded-xl flex flex-col justify-center gap-1.5 md:gap-2 shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all h-full transform md:-rotate-1 relative overflow-visible ${isBuffed ? 'bg-purple-900/40 border-purple-500 animate-pulse' : 'bg-slate-900 hover:bg-slate-800'}`}>
    {isBuffed && (
       <div className="absolute top-0 right-0 p-1 bg-purple-500 text-white leading-none z-10">
          <Sparkles size={8} className="animate-spin" />
       </div>
    )}

    {/* Food Sticker Overlay */}
    {isFoodActive && (activeFoodEffect?.stat === label?.toLowerCase() || activeFoodEffect?.stat2 === label?.toLowerCase()) && (
      <div className="absolute -top-1.5 -right-1.5 bg-emerald-400 text-black px-1.5 py-0.5 text-[6px] md:text-[8px] font-[1000] border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] rotate-6 z-30 whitespace-nowrap uppercase italic animate-in zoom-in duration-300 pointer-events-none flex items-center gap-1">
        <span>{activeFoodEffect.icon || '🍛'}</span>
        <span>+{activeFoodEffect.stat === label?.toLowerCase() ? activeFoodEffect.amount : (activeFoodEffect.amount2 || activeFoodEffect.amount)}</span>
      </div>
    )}

    <div className="flex items-center gap-2 md:gap-3">
      <div className={`${color} bg-black p-1.5 md:p-2 rounded-lg border-[2px] border-white/20 shrink-0 shadow-lg ${isBuffed ? 'ring-2 ring-purple-500' : ''}`}>{icon}</div>
      <div className="min-w-0">
        <p className={`text-[8px] md:text-[10px] font-black uppercase leading-none mb-0.5 md:mb-1 tracking-tighter italic truncate ${isBuffed ? 'text-purple-300' : 'text-slate-500'}`}>{label} {isBuffed && 'BOOST'}</p>
        <p className={`text-base md:text-xl font-black leading-none tracking-tight italic ${isBuffed ? 'text-white' : ''}`}>{typeof value === 'object' ? '???' : value}</p>
      </div>
    </div>
    {desc && <p className="text-[7px] md:text-[8px] text-slate-500 font-black leading-tight tracking-tighter uppercase border-t border-black/50 pt-1.5 md:pt-2 italic line-clamp-2">{desc}</p>}
  </div>
));

export const AttributeRow = React.memo(({ label, value, onAdd, color, disabled, desc }) => (
  <div className="flex items-center justify-between bg-white p-3 md:p-5 border-[3px] md:border-[4px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 transform md:rotate-1">
    <div className="flex flex-col items-start text-left shrink">
      <div className="flex items-baseline gap-2 md:gap-3 mb-1">
        <span className={`text-xs md:text-sm font-black uppercase ${color} italic underline decoration-black decoration-2`}>{label}</span>
        <span className="text-xl md:text-3xl font-black text-black italic drop-shadow-sm">{typeof value === 'object' ? '???' : value}</span>
      </div>
      <span className="text-[7px] md:text-[9px] text-slate-500 font-black leading-tight uppercase italic max-w-[120px] md:max-w-[160px]">{desc}</span>
    </div>
    <button 
      onClick={onAdd} 
      disabled={disabled} 
      className={`p-2 md:p-3 rounded-full border-[2px] md:border-[3px] border-black transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${disabled ? 'bg-slate-200 text-slate-400 border-slate-300 shadow-none' : 'bg-amber-400 text-black hover:bg-amber-300'}`}
    >
      <PlusCircle size={24} md:size={32} strokeWidth={3} className="w-5 h-5 md:w-8 md:h-8" />
    </button>
  </div>
));

export const AvatarMedia = React.memo(({ num, animated, className }) => {
  const imgSrc = `/assets/playeravatar/CrystleHunterAvatar (${num}).jpg`;
  if (animated) {
    return (
      <video
        key={`vid-${num}`}
        className={className}
        autoPlay loop muted playsInline
        poster={imgSrc}
      >
        <source src={`/assets/playeravatarvideo/CrystleHunterAvatar (${num}) video.mp4`} type="video/mp4" />
      </video>
    );
  }
return <img src={imgSrc} className={className} alt="Avatar" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + num; }} />;
});

export const CitizenMedia = React.memo(({ num, className }) => {
  const imgSrc = `/assets/CrystleTown/CrystleTownCitizen/CrystleTownCitizen (${num}).jpg`;
  return <img src={imgSrc} className={className} alt="Citizen" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + num; }} />;
});

export const SquadHUD = React.memo(({ player, dragonTimeLeft = 0, TAVERN_MATES, orientation = 'vertical', isBuffActive = false, isPetActive = false }) => {
  const isHorizontal = orientation === 'horizontal';
  const hasDragon = dragonTimeLeft > 0 || player?.dragonSummoned;
  
  return (
    <div className={`flex ${isHorizontal ? 'flex-row items-center gap-1.5 md:gap-2' : 'flex-col justify-center gap-1.5 md:gap-3'} shrink-0 py-1 scale-[0.8] md:scale-[0.9] z-20`}>
      {player?.hiredMate && (
        <div className={`w-8 md:w-11 aspect-[9/16] rounded-md md:rounded-lg border-[1.5px] md:border-[2.5px] border-black overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)] transform hover:scale-110 transition-transform relative group ${isBuffActive ? 'animate-pulse ring-2 md:ring-4 ring-yellow-400 border-yellow-400' : 'bg-purple-600'}`} title={`Companion: ${TAVERN_MATES.find(m => m.id === player.hiredMate)?.name}`}>
          <img
            src={`/assets/partymemberavatar/${TAVERN_MATES.find(m => m.id === player.hiredMate)?.name}.jpg`}
            className={`w-full h-full object-cover contrast-125 ${isBuffActive ? 'brightness-125 saturate-150' : 'grayscale-[0.2]'}`}
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + player.hiredMate; }}
            alt="Mate"
          />
          {isBuffActive && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <span className="text-[4px] md:text-[6px] font-black text-yellow-400 uppercase italic tracking-tighter bg-black/80 px-1 py-0.5 rounded border border-yellow-400/50 animate-bounce">BUFF ACTIVATED</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[4px] md:text-[5px] font-black text-white text-center py-0.5 truncate uppercase leading-none">MATE</div>
        </div>
      )}
      {hasDragon && (
        <div className="w-8 md:w-11 aspect-[9/16] rounded-md md:rounded-lg border-[1.5px] md:border-[2.5px] border-black bg-emerald-600 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)] transform hover:scale-110 transition-transform relative group" title="Summoned Dragon Power">
          <img
             src="/assets/dragonsground/dragons/DragonAvatar (1).jpg"
             className="w-full h-full object-cover grayscale-[0.2] contrast-125"
             onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=dragon'; }}
             alt="Drake"
          />
          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[4px] md:text-[5px] font-black text-white text-center py-0.5 truncate uppercase leading-none">DRAKE</div>
        </div>
      )}
      {player?.gemx?.level >= 1 && (
        <div className="w-8 md:w-11 aspect-[9/16] rounded-md md:rounded-lg border-[1.5px] md:border-[2.5px] border-black bg-cyan-600 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)] transform hover:scale-110 transition-transform relative group" title={`GEMX Sentinel Level ${player.gemx.level}`}>
          <img
             src={`/assets/dragonsground/gemx/${player.gemxAvatar || player.gemxAvatar || 'gemx (1).gif'}`}
             className="w-full h-full object-cover contrast-125"
             onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=gemx'; }}
             alt="Gemx"
          />
          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[4px] md:text-[5px] font-black text-white text-center py-0.5 truncate uppercase leading-none">GEMX</div>
        </div>
      )}
      {player?.petId && (
        <div className={`w-8 md:w-11 aspect-[9/16] rounded-md md:rounded-lg border-[1.5px] md:border-[2.5px] border-black overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)] transform hover:scale-110 transition-transform relative group ${isPetActive ? 'animate-pulse ring-2 md:ring-4 ring-emerald-400 border-emerald-400' : 'bg-cyan-900'}`} title={`Crystle Pet #${player.petId}`}>
          <img
             src={`/assets/pets/genesis-pets/Genesis Pets (${player.petId}).jpg`}
             className={`w-full h-full object-cover contrast-125 ${isPetActive ? 'brightness-125 saturate-125' : 'brightness-110'}`}
             alt="Pet"
          />
          {isPetActive && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <span className="text-[4px] md:text-[6px] font-black text-emerald-400 uppercase italic tracking-tighter bg-black/80 px-1 py-0.5 rounded border border-emerald-400/50 animate-bounce">POWERUP</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-cyan-500 text-black text-[4px] md:text-[5px] font-black text-center py-0.5 truncate uppercase leading-none">CRYSTLE</div>
        </div>
      )}
    </div>
  );
});


export const ConfirmationModal = React.memo(({ isOpen, onClose, onConfirm, title, message, confirmText = "CONFIRM", cancelText = "CANCEL" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="relative max-w-sm w-full">
        <div className="absolute inset-0 bg-red-800 rounded-3xl transform translate-x-3 translate-y-3"></div>
        <div className="relative bg-white border-[4px] border-black rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 flex flex-col items-center text-center">
          <div className="bg-red-600 p-4 rounded-full border-4 border-black animate-bounce">
            <ShieldAlert size={40} className="text-white" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-black uppercase italic tracking-tighter leading-none">{title}</h2>
            <p className="text-xs md:text-sm font-bold text-slate-600 uppercase italic tracking-tight">{message}</p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-red-500 transition-all border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic text-base"
            >
              {confirmText}
            </button>
            <button 
              onClick={onClose}
              className="w-full bg-slate-200 text-black py-3 rounded-xl font-black uppercase tracking-widest hover:bg-white transition-all border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic text-sm"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
