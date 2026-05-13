import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { TrendingUp, Lock, Zap, Database, Wallet, PieChart, Coins } from 'lucide-react';

Chart.register(...registerables);

export const TokenomicsView = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      
      const centerTextPlugin = {
        id: 'centerText',
        afterDraw: (chart) => {
          const { ctx, chartArea: { top, height } } = chart;
          const width = chart.width;
          ctx.save();
          ctx.font = 'bold 24px "Bungee", cursive';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.fillText('$DWGX', width / 2, height / 2 + top + 10);
          ctx.restore();
        }
      };

      chartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Bonding Curve', 'In Containers', 'Treasury'],
          datasets: [{
            data: [500000, 110000, 390000],
            backgroundColor: ['#00ffff', '#ff00ff', '#ccff00'],
            borderColor: '#000000',
            borderWidth: 6,
            hoverOffset: 20
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              backgroundColor: '#000',
              titleFont: { family: '"Bungee", cursive' },
              bodyFont: { family: 'Inter', weight: 'bold' },
              borderColor: '#fff',
              borderWidth: 2
            }
          },
          cutout: '65%'
        },
        plugins: [centerTextPlugin]
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f051d] text-white p-4 md:p-10 font-sans selection:bg-[#ff00ff]/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bungee&family=Inter:wght@400;900&display=swap');
        
        .bungee { font-family: 'Bungee', cursive; }
        
        .anime-cutout {
          background: white;
          color: black;
          border: 4px solid black;
          box-shadow: 8px 8px 0px 0px #ff00ff;
          transition: all 0.2s ease;
          position: relative;
        }

        .anime-cutout:hover {
          transform: translate(-4px, -4px);
          box-shadow: 12px 12px 0px 0px #00ffff;
        }

        .sticker-label {
          transform: rotate(-3deg);
          background: #ccff00;
          color: black;
          font-weight: 900;
          padding: 2px 10px;
          border: 2px solid black;
          display: inline-block;
        }

        .halftone-bg {
          background-image: radial-gradient(#ffffff33 2px, transparent 2px);
          background-size: 10px 10px;
        }

        .speech-bubble {
          position: relative;
          background: white;
          color: black;
          border: 4px solid black;
          border-radius: 20px;
          padding: 15px;
        }

        .speech-bubble::after {
          content: '';
          position: absolute;
          bottom: -20px;
          left: 30px;
          border-width: 20px 20px 0;
          border-style: solid;
          border-color: black transparent;
          display: block;
          width: 0;
        }

        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .floating { animation: float 3s ease-in-out infinite; }

        .neon-card-cyan {
          background: #000;
          border: 4px solid #00ffff;
          box-shadow: 6px 6px 0px 0px #fff;
        }

        .neon-card-pink {
          background: #000;
          border: 4px solid #ff00ff;
          box-shadow: 6px 6px 0px 0px #fff;
        }

        .neon-card-lime {
          background: #000;
          border: 4px solid #ccff00;
          box-shadow: 6px 6px 0px 0px #fff;
        }
      `}</style>

      <header className="max-w-6xl mx-auto mb-20 relative">
        <div className="absolute -top-10 -left-10 opacity-20 floating">
          <h2 className="text-9xl font-black italic select-none">DWGX</h2>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div>
            <div className="sticker-label mb-4 bungee text-xl">MINT CLUB STATUS: 50% LOADED</div>
            <h1 className="text-7xl md:text-9xl font-black bungee tracking-tighter leading-none italic">
              DWG<span className="text-[#ff00ff]">X</span>
            </h1>
            <p className="text-2xl mt-4 font-black italic bg-[#00ffff] text-black inline-block px-4 py-1">
              MC: $5,170.94 | ROYALTIES: 0.5%
            </p>
          </div>

          <div className="flex gap-4">
            <div className="anime-cutout p-4 flex flex-col items-center">
              <span className="text-xs font-black uppercase">Max Supply</span>
              <span className="text-4xl bungee">1.0M</span>
            </div>
            <div className="anime-cutout p-4 flex flex-col items-center !bg-[#ccff00]">
              <span className="text-xs font-black uppercase">Locked</span>
              <span className="text-4xl bungee">60%</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-24">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-[#1a0b2e] p-8 rounded-[40px] border-4 border-white shadow-[15px_15px_0px_0px_#000]">
          <div>
            <div className="sticker-label mb-4 bungee text-xl">ECONOMY SNAPSHOT</div>
            <h2 className="text-5xl font-black bungee italic text-[#ff00ff] mb-6 uppercase">Supply Breakdown</h2>
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border-l-8 border-[#00ffff]">
                <div className="w-4 h-4 bg-[#00ffff] rounded-full"></div>
                <div>
                  <p className="bungee text-lg">50% BONDING CURVE</p>
                  <p className="text-xs font-bold text-zinc-400">500K TOKENS LIQUID ON BASE MINT CLUB</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border-l-8 border-[#ff00ff]">
                <div className="w-4 h-4 bg-[#ff00ff] rounded-full"></div>
                <div>
                  <p className="bungee text-lg">11% LIQUID CONTAINERS</p>
                  <p className="text-xs font-bold text-zinc-400">110K BACKING 2,100 ACTIVE GEMS & BADGES</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border-l-8 border-[#ccff00]">
                <div className="w-4 h-4 bg-[#ccff00] rounded-full"></div>
                <div>
                  <p className="bungee text-lg">39% TREASURY RESERVE</p>
                  <p className="text-xs font-bold text-zinc-400">REMAINING DEV FUND FOR FUTURE REWARDS & IP</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative anime-cutout !bg-black p-6 flex flex-col items-center">
            <div className="h-[300px] w-full relative">
              <canvas ref={chartRef}></canvas>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-[#ccff00] text-black p-2 bungee text-sm rotate-6 border-2 border-black">
              1,000,000 TOTAL
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="speech-bubble anime-cutout">
              <h3 className="bungee text-2xl mb-2">WHAT IS A LIQUID CONTAINER?</h3>
              <p className="font-bold text-lg">It's an NFT with a <b>HARD FLOOR!</b> Every artwork shell acts as a vault for physical $DWGX tokens.</p>
            </div>

            <div className="p-8 border-4 border-dashed border-[#00ffff] rounded-3xl relative overflow-hidden">
              <div className="halftone-bg absolute inset-0 opacity-10"></div>
              <div className="relative z-10 text-center space-y-4">
                <div className="text-5xl text-[#ccff00] mb-4 bungee" style={{ textShadow: '4px 4px 0 #000' }}>POW!</div>
                <div className="bg-black border-2 border-white p-6 rounded-xl">
                  <p className="text-xl font-mono text-[#00ffff]">
                    Asset Value = Art Premium + <span className="text-[#ff00ff]">Intrinsic Tokens</span>
                  </p>
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-zinc-400">The Golden Ratio of Web3 IP</p>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="anime-cutout p-8 !bg-[#111] !text-white !border-white overflow-hidden">
              <div className="flex flex-col items-center space-y-6">
                <div className="w-32 h-32 bg-[#ff00ff] border-4 border-white flex items-center justify-center text-6xl shadow-[8px_8px_0px_0px #00ffff] rounded-2xl rotate-3">
                  💎
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black mb-1 italic">ART SHELL</div>
                  <p className="text-xs font-black text-zinc-400">VISUAL RARITY & LORE</p>
                </div>
                <div className="text-4xl bungee text-[#ccff00]">+</div>
                <div className="w-full bg-white text-black p-4 border-4 border-black text-center bungee text-2xl">
                  50-100 $DWGX
                </div>
                <div className="text-xs font-black uppercase tracking-tighter text-zinc-500 italic">"Shatter the shell to claim the core"</div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 bg-[#ff00ff] text-white border-4 border-black p-4 bungee text-2xl rotate-12 shadow-xl">
              KA-CHING!
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-12">
            <h2 className="text-5xl font-black bungee italic text-[#00ffff]">TREASURY MAP</h2>
            <div className="h-1 flex-grow bg-white border-b-4 border-black"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="neon-card-pink p-6 flex flex-col justify-between text-left">
              <div>
                <div className="text-4xl mb-4 text-left">🎮</div>
                <h4 className="bungee text-lg leading-tight text-[#ff00ff]">P2E & Future Tiers</h4>
              </div>
              <div className="mt-8">
                <span className="text-4xl bungee">190K</span>
                <p className="text-[10px] font-black uppercase text-zinc-500 leading-tight">Backing for new IP artwork drops & rewards.</p>
              </div>
            </div>
            <div className="neon-card-cyan p-6 flex flex-col justify-between text-left">
              <div>
                <div className="text-4xl mb-4">📦</div>
                <h4 className="bungee text-lg leading-tight text-[#00ffff]">Active Containers</h4>
              </div>
              <div className="mt-8">
                <span className="text-4xl bungee">110K</span>
                <p className="text-[10px] font-black uppercase text-zinc-500 leading-tight">Physically locked inside 2,100 Gems/Badges.</p>
              </div>
            </div>
            <div className="neon-card-lime p-6 flex flex-col justify-between text-left !border-[#ccff00]">
              <div>
                <div className="text-4xl mb-4">📢</div>
                <h4 className="bungee text-lg leading-tight text-[#ccff00]">Social Rep</h4>
              </div>
              <div className="mt-8">
                <span className="text-4xl bungee">100K</span>
                <p className="text-[10px] font-black uppercase text-zinc-500 leading-tight">Discord, Farcaster Recasts, and X Events.</p>
              </div>
            </div>
            <div className="neon-card-cyan p-6 flex flex-col justify-between text-left">
              <div>
                <div className="text-4xl mb-4">💧</div>
                <h4 className="bungee text-lg leading-tight text-[#00ffff]">Liquidity</h4>
              </div>
              <div className="mt-8">
                <span className="text-4xl bungee">75K</span>
                <p className="text-[10px] font-black uppercase text-zinc-500 leading-tight">Market stability & Bonding Curve support.</p>
              </div>
            </div>
            <div className="neon-card-pink p-6 flex flex-col justify-between text-left !border-zinc-500">
              <div>
                <div className="text-4xl mb-4">🛡️</div>
                <h4 className="bungee text-lg leading-tight text-zinc-500">Reserve</h4>
              </div>
              <div className="mt-8">
                <span className="text-4xl bungee">25K</span>
                <p className="text-[10px] font-black uppercase text-zinc-500 leading-tight">Emergency fund & safety buffer.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-20">
          <h2 className="text-4xl font-black bungee mb-12 italic uppercase text-left">The Collection Wall</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="anime-cutout p-3 !bg-black group border-white">
              <img src="https://placehold.co/400x400/111/ff00ff?text=RUBY" alt="Ruby" className="w-full border-2 border-white mb-2" />
              <div className="flex justify-between items-center px-1">
                <span className="bungee text-xs text-white">RUBY</span>
                <span className="sticker-label text-[10px]">500 STOCK</span>
              </div>
            </div>
            <div className="anime-cutout p-3 !bg-black group border-white">
              <img src="https://placehold.co/400x400/111/00ffff?text=SAPPHIRE" alt="Sapphire" className="w-full border-2 border-white mb-2" />
              <div className="flex justify-between items-center px-1">
                <span className="bungee text-xs text-white">SAPPHIRE</span>
                <span className="sticker-label text-[10px]">500 STOCK</span>
              </div>
            </div>
            <div className="anime-cutout p-3 !bg-black group border-white">
              <img src="https://placehold.co/400x400/111/ccff00?text=EMERALD" alt="Emerald" className="w-full border-2 border-white mb-2" />
              <div className="flex justify-between items-center px-1">
                <span className="bungee text-xs text-white">EMERALD</span>
                <span className="sticker-label text-[10px]">500 STOCK</span>
              </div>
            </div>
            <div className="anime-cutout p-3 !bg-black group border-white">
              <img src="https://placehold.co/400x400/111/bf94ff?text=QUARTZ" alt="Quartz" className="w-full border-2 border-white mb-2" />
              <div className="flex justify-between items-center px-1">
                <span className="bungee text-xs text-white">QUARTZ</span>
                <span className="sticker-label text-[10px]">500 STOCK</span>
              </div>
            </div>
            <div className="anime-cutout p-3 !bg-[#ff00ff] group border-black scale-105 rotate-2">
              <img src="https://placehold.co/400x400/000/fff?text=FOUNDER" alt="Founder" className="w-full border-4 border-black mb-2" />
              <div className="flex justify-between items-center px-1">
                <span className="bungee text-xs text-black">FOUNDER</span>
                <span className="bg-black text-white text-[10px] px-2 font-black">100 STOCK</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto border-t-4 border-black pt-10 text-center pb-10">
        <div className="text-4xl bungee text-white mb-2" style={{ textShadow: '4px 4px 0 #ff00ff' }}>ZAP!</div>
        <p className="bungee text-zinc-600">DWGX ECOSYSTEM PROTOCOL • 2026</p>
      </footer>
    </div>
  );
};
