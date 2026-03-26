import React, { useState } from 'react';
import { 
  BookOpen, 
  Sword, 
  Shield, 
  Coins, 
  Trophy, 
  Zap, 
  Map as MapIcon, 
  Activity, 
  Hammer, 
  FlaskConical, 
  Users, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Package, 
  ChevronRight,
  Info,
  HelpCircle
} from 'lucide-react';
import { Header } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const ManualView = () => {
  const { adventure } = useGame();
  const { setView } = adventure;
  const [activeTab, setActiveTab] = useState('systems');

  const sections = {
    systems: {
      icon: <Activity />,
      title: "Game Systems",
      color: "bg-cyan-600",
      content: [
        {
          title: "Floor Scaling Protocol",
          desc: "Every floor you descend increases GX (Tokens) and XP rewards by 15% exponentially. Warning: Monster HP and Damage scale at the same rate. Strategy is essential for deep runs.",
          icon: <TrendingUp className="text-cyan-400" />
        },
        {
          title: "Attribute Evolution",
          desc: "Gain 5 Ability Points (AP) per level. STR fuels raw power, AGI governs evasion and speed, while DEX dictates your hit precision and forging success.",
          icon: <Target className="text-amber-400" />
        },
        {
          title: "Combat Mechanics",
          desc: "Battle is automated yet dictated by your stats. Stun cycles can be triggered by heavy hits, providing windows for critical damage without retaliation.",
          icon: <Sword className="text-red-400" />
        }
      ]
    },
    features: {
      icon: <Zap />,
      title: "Core Features",
      color: "bg-purple-600",
      content: [
        {
          title: "The Forge & Laboratory",
          desc: "Craft high-tier 'Crystle' equipment and specialized consumables. Your DEX stat determines the integrity of your forging attempts.",
          icon: <Hammer className="text-amber-500" />
        },
        {
          title: "Marketplace & Tavern",
          desc: "Trade loot with other hunters or hire 'Mates' to provide passive stat buffs during your raids.",
          icon: <Users className="text-cyan-500" />
        },
        {
          title: "Dragons Ground",
          desc: "Raise Mystic Dragons to gain permanent stat multipliers. Feed them fruits found in the dungeon to unleash their potential.",
          icon: <Sparkles className="text-emerald-500" />
        },
        {
          title: "Syndicate Warfare",
          desc: "Join global raids and secure tactical nodes in high-stakes automated combat. Cooperate with other hunters to earn unique rewards.",
          icon: <Shield className="text-red-500" />
        }
      ]
    },
    howtoplay: {
      icon: <MapIcon />,
      title: "How to Play",
      color: "bg-emerald-600",
      content: [
        {
          title: "Step 1: Infiltration",
          desc: "Select a sector from the Map. Start in Rust Canyon and progress to higher-tier zones like Sector 7 as your level increases.",
          icon: <div className="text-white bg-black w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black">1</div>
        },
        {
          title: "Step 2: Harvesting",
          desc: "Defeat monsters to earn GX and XP. Use HP Potions to stay in the fight. If defeated, you'll be extracted to the Tavern for recovery.",
          icon: <div className="text-white bg-black w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black">2</div>
        },
        {
          title: "Step 3: Ascension",
          desc: "Spend GX at the Shop or Forge, allocate stats in the Attributes menu, and challenge the World Boss for Legendary Relics.",
          icon: <div className="text-white bg-black w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black">3</div>
        }
      ]
    },
    earnings: {
      icon: <Coins />,
      title: "Hunter Earnings",
      color: "bg-amber-600",
      content: [
        {
          title: "GX Tokens",
          desc: "The primary currency of the Metaverse. Used for everything from buying potions to high-end forging.",
          icon: <Coins className="text-amber-400" />
        },
        {
          title: "Relics & Materials",
          desc: "Rare drops from Bosses and deep dungeon floors. These can be used to forge ultimate gear or sold on the P2P Marketplace for massive profit.",
          icon: <Package className="text-purple-400" />
        },
        {
          title: "Hunter Prestige",
          desc: "Climb the global Leaderboard based on your Combat Score, Wealth, and Depth. Top hunters earn exclusive seasonal rewards.",
          icon: <Trophy className="text-yellow-400" />
        }
      ]
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col relative overflow-hidden bg-slate-900/40">
      <Header title="Hunter manual v2.0" onClose={() => setView('menu')} />

      {/* Hero Banner */}
      <div className="relative mb-6 group cursor-default">
        <div className="absolute inset-0 bg-cyan-600 rounded-2xl transform translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform"></div>
        <div className="relative bg-black border-[3px] border-black rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full -mr-10 -mt-10 animate-pulse"></div>
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter mb-2 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
              Welcome to <span className="text-cyan-400">Dungeons With Gems</span>
            </h1>
            <p className="text-xs md:text-sm font-bold text-slate-400 uppercase italic leading-relaxed max-w-xl">
              You are an elite hunter in the decentralized Metaverse. Your mission: explore lethal sectors, defeat crystalline threats, and hoard enough wealth to dominate the rankings.
            </p>
          </div>
          
          {/* Halftone effect */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '6px 6px' }}></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(sections).map(([key, section]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 border-[3px] border-black rounded-xl font-black uppercase text-[10px] md:text-xs italic tracking-tighter transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${
              activeTab === key ? `text-white ${section.color} -translate-y-1` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {React.cloneElement(section.icon, { size: 14 })}
            {section.title}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {sections[activeTab].content.map((item, idx) => (
          <div 
            key={idx} 
            className="group relative bg-white border-[3px] border-black p-5 rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-[3px_3px_0_#ccc] group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic group-hover:text-cyan-500 transition-colors">
                MOD: 0{idx + 1}
              </div>
            </div>
            
            <h3 className="text-sm font-black text-black uppercase mb-3 italic leading-tight border-b-2 border-slate-100 pb-2">
              {item.title}
            </h3>
            
            <p className="text-[11px] font-bold text-slate-600 uppercase italic leading-relaxed flex-1">
              {item.text || item.desc}
            </p>
            
            <div className="absolute -bottom-2 -right-1 bg-black text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter border-2 border-white transform rotate-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Intelligence Node
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Tip */}
      <div className="mt-8 bg-amber-400 border-[3px] border-black p-4 rounded-xl flex items-start gap-3 shadow-[4px_4px_0_rgba(0,0,0,1)] transform rotate-1">
        <div className="bg-black text-amber-400 p-1.5 rounded-lg border-2 border-black">
          <Info size={18} strokeWidth={3} />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Tactical Tip</h4>
          <p className="text-[11px] font-black text-black italic uppercase leading-tight opacity-80">
            "Don't ignore Dexterity. While Strength hits hard, Dexterity ensures you actually LAND those hits deep in Sector 7—and it's the difference between a successful forge and losing your rare materials."
          </p>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-6 flex justify-between items-center opacity-40">
        <div className="flex items-center gap-1">
           <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
           <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">Neural Link Stable</span>
        </div>
        <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">H.C.W. Global Protocol 2026</span>
      </div>
    </div>
  );
};
