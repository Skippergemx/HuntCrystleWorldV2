import React from 'react';
import { X, Sparkles, PlusCircle, HelpCircle } from 'lucide-react';

export const Header = React.memo(({ title, onClose, onHelp }) => (
  <div className="flex justify-between items-center mb-4 md:mb-6 w-full relative z-20">
    <div className="bg-white text-black px-3 md:px-4 py-0.5 md:py-1 border-[3px] md:border-[4px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-1 max-w-[60%] md:max-w-[70%]">
      <h2 className="text-sm md:text-xl font-black uppercase tracking-tighter italic truncate">{title}</h2>
    </div>
    <div className="flex gap-2 shrink-0">
      {onHelp && (
        <button 
          onClick={onHelp} 
          className="p-1.5 md:p-2 bg-cyan-600 border-[2px] md:border-[3px] border-black text-black hover:bg-cyan-400 transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          title="Open Guide"
        >
          <HelpCircle size={16} md:size={20} strokeWidth={3} />
        </button>
      )}
      <button 
        onClick={onClose} 
        className="p-1.5 md:p-2 bg-black border-[2px] md:border-[3px] border-black text-white hover:text-red-500 transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        <X size={16} md:size={20} strokeWidth={3} />
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

export const NavBtn = React.memo(({ onClick, icon, title, sub, color, disabled, backdrop }) => (
  <button 
    onClick={onClick} 
    disabled={disabled} 
    className={`flex flex-col items-center justify-center p-3 md:p-6 border-[3px] md:border-[4px] border-black rounded-xl md:rounded-2xl transition-all active:scale-95 group relative overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] ${disabled ? 'bg-slate-950 cursor-not-allowed opacity-50 shadow-none translate-x-1 translate-y-1' : 'bg-slate-900 hover:border-cyan-500 hover:bg-slate-800 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0_rgba(0,0,0,1)]'} transition-all duration-200`}
  >
    {backdrop && (
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src={backdrop} 
          className="w-full h-full object-cover grayscale-[0.4] contrast-150 opacity-40 group-hover:scale-110 group-hover:opacity-60 transition-all duration-700" 
          alt=""
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>
    )}

    <div className={`relative z-20 p-2 md:p-4 ${color} rounded-xl md:rounded-2xl mb-1.5 md:mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] group-hover:scale-110 group-hover:-rotate-3 transition-transform text-white border-[2px] md:border-[3px] border-black flex items-center justify-center shrink-0`}>
      {React.cloneElement(icon, { size: 18, className: 'md:w-6 md:h-6 h-4 w-4' })}
    </div>
    
    <div className="relative z-20 text-center">
      <h3 className="font-black text-[9px] md:text-xs uppercase tracking-widest text-white italic drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-none">{title}</h3>
      <p className="text-[6px] md:text-[8px] font-black text-slate-400 uppercase mt-0.5 md:mt-1 tracking-tighter italic leading-none opacity-80">{sub}</p>
    </div>
  </button>
));

export const StatTile = React.memo(({ icon, label, value, color, desc, isBuffed }) => (
  <div className={`border-[3px] md:border-[4px] border-black p-2.5 md:p-4 rounded-lg md:rounded-xl flex flex-col justify-center gap-1.5 md:gap-2 shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all h-full transform md:-rotate-1 relative overflow-hidden ${isBuffed ? 'bg-purple-900/40 border-purple-500 animate-pulse' : 'bg-slate-900 hover:bg-slate-800'}`}>
    {isBuffed && (
       <div className="absolute top-0 right-0 p-1 bg-purple-500 text-white leading-none">
          <Sparkles size={8} className="animate-spin" />
       </div>
    )}
    <div className="flex items-center gap-2 md:gap-3">
      <div className={`${color} bg-black p-1.5 md:p-2 rounded-lg border-[2px] border-white/20 shrink-0 shadow-lg ${isBuffed ? 'ring-2 ring-purple-500' : ''}`}>{icon}</div>
      <div className="min-w-0">
        <p className={`text-[8px] md:text-[10px] font-black uppercase leading-none mb-0.5 md:mb-1 tracking-tighter italic truncate ${isBuffed ? 'text-purple-300' : 'text-slate-500'}`}>{label} {isBuffed && 'BOOST'}</p>
        <p className={`text-base md:text-xl font-black leading-none tracking-tight italic ${isBuffed ? 'text-white' : ''}`}>{value}</p>
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
        <span className="text-xl md:text-3xl font-black text-black italic drop-shadow-sm">{value}</span>
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
return <img src={imgSrc} className={className} alt="Avatar" loading="lazy" />;
});

export const SquadHUD = React.memo(({ player, dragonTimeLeft = 0, TAVERN_MATES, orientation = 'vertical' }) => {
  const isHorizontal = orientation === 'horizontal';
  const hasDragon = dragonTimeLeft > 0 || player?.dragonSummoned;
  
  return (
    <div className={`flex ${isHorizontal ? 'flex-row items-center gap-1.5 md:gap-2' : 'flex-col justify-center gap-1.5 md:gap-3'} shrink-0 py-1 scale-[0.8] md:scale-[0.9] z-20`}>
      {player?.hiredMate && (
        <div className="w-8 md:w-11 aspect-[9/16] rounded-md md:rounded-lg border-[1.5px] md:border-[2.5px] border-black bg-purple-600 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)] transform hover:scale-110 transition-transform relative group" title={`Companion: ${TAVERN_MATES.find(m => m.id === player.hiredMate)?.name}`}>
          <img
            src={`/assets/partymemberavatar/${TAVERN_MATES.find(m => m.id === player.hiredMate)?.name}.jpg`}
            className="w-full h-full object-cover grayscale-[0.2] contrast-125"
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + player.hiredMate; }}
            alt="Mate"
          />
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
        <div className="w-8 md:w-11 aspect-[9/16] rounded-md md:rounded-lg border-[1.5px] md:border-[2.5px] border-black bg-cyan-900 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)] transform hover:scale-110 transition-transform relative group" title={`Genesis Pet #${player.petId}`}>
          <img
             src={`/assets/pets/genesis-pets/Genesis Pets (${player.petId}).jpg`}
             className="w-full h-full object-cover contrast-125 brightness-110"
             alt="Pet"
          />
          <div className="absolute inset-x-0 bottom-0 bg-cyan-500 text-black text-[4px] md:text-[5px] font-black text-center py-0.5 truncate uppercase leading-none">GENESIS</div>
        </div>
      )}
    </div>
  );
});

