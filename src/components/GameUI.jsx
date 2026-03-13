import React from 'react';
import { X, Sparkles, PlusCircle } from 'lucide-react';

export const Header = ({ title, onClose }) => (
  <div className="flex justify-between items-center mb-6 w-full relative z-20">
    <div className="bg-white text-black px-4 py-1 border-[4px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-1">
      <h2 className="text-xl font-black uppercase tracking-tighter italic">{title}</h2>
    </div>
    <button onClick={onClose} className="p-2 bg-black border-[3px] border-black text-white hover:text-red-500 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none">
      <X size={20} strokeWidth={3} />
    </button>
  </div>
);

export const NavBtn = ({ onClick, icon, title, sub, color, disabled }) => (
  <button 
    onClick={onClick} 
    disabled={disabled} 
    className={`flex flex-col items-center justify-center p-6 border-[4px] border-black rounded-2xl transition-all active:scale-95 group relative overflow-hidden shadow-[6px_6px_0_rgba(0,0,0,1)] ${disabled ? 'bg-slate-900 cursor-not-allowed opacity-50 shadow-none translate-x-1 translate-y-1' : 'bg-slate-800 hover:border-cyan-500 hover:bg-slate-700 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_rgba(0,0,0,1)]'} transition-transform`}
  >
    <div className={`p-4 ${color} rounded-2xl mb-3 shadow-[4px_4px_0_rgba(0,0,0,1)] group-hover:scale-110 transition-transform text-white border-[3px] border-black`}>{icon}</div>
    <h3 className="font-black text-xs uppercase tracking-widest text-white italic drop-shadow-md">{title}</h3>
    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-tighter italic">{sub}</p>
  </button>
);

export const StatTile = ({ icon, label, value, color, desc, isBuffed }) => (
  <div className={`border-[4px] border-black p-4 rounded-xl flex flex-col justify-center gap-2 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all h-full transform -rotate-1 relative overflow-hidden ${isBuffed ? 'bg-purple-900/40 border-purple-500 animate-pulse' : 'bg-slate-900 hover:bg-slate-800'}`}>
    {isBuffed && (
       <div className="absolute top-0 right-0 p-1 bg-purple-500 text-white leading-none">
          <Sparkles size={8} className="animate-spin" />
       </div>
    )}
    <div className="flex items-center gap-3">
      <div className={`${color} bg-black p-2 rounded-lg border-2 border-white/20 shrink-0 shadow-lg ${isBuffed ? 'ring-2 ring-purple-500' : ''}`}>{icon}</div>
      <div>
        <p className={`text-[10px] font-black uppercase leading-none mb-1 tracking-tighter italic ${isBuffed ? 'text-purple-300' : 'text-slate-500'}`}>{label} {isBuffed && 'BOOST'}</p>
        <p className={`text-xl font-black leading-none tracking-tight italic ${isBuffed ? 'text-white' : ''}`}>{value}</p>
      </div>
    </div>
    {desc && <p className="text-[8px] text-slate-500 font-black leading-tight tracking-tighter uppercase border-t border-black/50 pt-2 italic">{desc}</p>}
  </div>
);

export const AttributeRow = ({ label, value, onAdd, color, disabled, desc }) => (
  <div className="flex items-center justify-between bg-white p-5 border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 transform rotate-1">
    <div className="flex flex-col items-start text-left">
      <div className="flex items-baseline gap-3 mb-1">
        <span className={`text-sm font-black uppercase ${color} italic underline decoration-black decoration-2`}>{label}</span>
        <span className="text-3xl font-black text-black italic drop-shadow-sm">{value}</span>
      </div>
      <span className="text-[9px] text-slate-500 font-black leading-tight uppercase italic max-w-[160px]">{desc}</span>
    </div>
    <button 
      onClick={onAdd} 
      disabled={disabled} 
      className={`p-3 rounded-full border-[3px] border-black transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${disabled ? 'bg-slate-200 text-slate-400 border-slate-300 shadow-none' : 'bg-amber-400 text-black hover:bg-amber-300'}`}
    >
      <PlusCircle size={32} strokeWidth={3} />
    </button>
  </div>
);

export const AvatarMedia = ({ num, animated, className }) => {
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
};

