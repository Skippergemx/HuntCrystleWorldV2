import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

/**
 * ULTRA-PERFORMANCE PARTICLE ENGINE (V4)
 * - Shared Arena Canvas (Singleton pattern)
 * - Auto-Sleep Loop (0% CPU when idle)
 * - High-Efficiency Rect Batching
 * - Low-DPI Scaling for Battery Saver
 */

class Particle {
  constructor(ctx) {
    this.ctx = ctx;
    this.active = false;
  }

  reset(x, y, type, config) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.config = config;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * this.config.speed + 1;
    
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    
    this.life = 1.0;
    this.decay = Math.random() * 0.05 + 0.03; 
    this.size = Math.random() * this.config.size + 1;
    
    const colors = {
      fire: ['#ef4444', '#f59e0b', '#facc15'],
      spark: ['#facc15', '#ffffff'],
      heal: ['#10b981', '#34d399', '#ffffff'],
      levelup: ['#fbbf24', '#ffffff'],
      ice: ['#06b6d4', '#ffffff'],
      tech: ['#06b6d4', '#000000'],
      impact: ['#ffffff', '#ef4444']
    };
    
    const palette = colors[type] || ['#ffffff'];
    this.color = palette[Math.floor(Math.random() * palette.length)];

    // NEW: Special Handling for Arrow Particles
    if (type === 'levelup_arrow') {
       this.vx = (Math.random() - 0.5) * 3;
       this.vy = -(Math.random() * 6 + 4); // Fast Upward Surge
       this.decay = Math.random() * 0.02 + 0.01; 
       this.size = Math.random() * 12 + 10;
       this.emoji = '⬆️';
    }

    this.active = true;
  }

  update() {
    if (!this.active) return false;
    this.x += this.vx;
    this.y += this.vy;
    
    if (this.type === 'levelup_arrow') {
       this.vy *= 1.02; // Accelerate upward
    } else {
       this.vy += this.config.gravity;
    }
    
    this.life -= this.decay;
    if (this.life <= 0) this.active = false;
    return this.active;
  }

  draw(lowPerf) {
    if (!this.active) return;
    const s = this.size * this.life;
    this.ctx.globalAlpha = lowPerf ? 1.0 : this.life;
    
    if (this.type === 'levelup_arrow') {
       this.ctx.font = `${s * 2}px serif`;
       this.ctx.textAlign = 'center';
       this.ctx.fillText(this.emoji, this.x, this.y);
    } else {
       this.ctx.fillStyle = this.color;
       this.ctx.fillRect(this.x - s/2, this.y - s/2, s, s);
    }
  }
}

export const BattleParticles = forwardRef(({ lowPerfMode }, ref) => {
  const canvasRef = useRef(null);
  const poolRef = useRef([]);
  const activeCountRef = useRef(0);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (poolRef.current.length === 0) {
      for (let i = 0; i < 300; i++) {
        poolRef.current.push(new Particle(ctx));
      }
    }

    const updateSize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const scale = lowPerfMode ? 0.5 : 1;
        canvas.width = parent.clientWidth * scale;
        canvas.height = parent.clientHeight * scale;
        if (lowPerfMode) {
          ctx.scale(0.5, 0.5);
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [lowPerfMode]);

  const startLoop = () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas || activeCountRef.current === 0) {
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width / (lowPerfMode ? 0.5 : 1), canvas.height / (lowPerfMode ? 0.5 : 1));
        }
        isRunningRef.current = false;
        return;
      }
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width / (lowPerfMode ? 0.5 : 1), canvas.height / (lowPerfMode ? 0.5 : 1));
      
      let stillActive = 0;
      for (const p of poolRef.current) {
        if (p.active) {
          if (p.update()) {
            p.draw(lowPerfMode);
            stillActive++;
          }
        }
      }
      activeCountRef.current = stillActive;
      requestAnimationFrame(render);
    };
    render();
  };

  const spawn = (x, y, type, config) => {
    let count = config.count || 20;
    if (lowPerfMode) count = Math.ceil(count * 0.15);
    
    let emitted = 0;
    for (const p of poolRef.current) {
      if (!p.active) {
        p.reset(x, y, type, config);
        emitted++;
        activeCountRef.current++;
        if (emitted >= count) break;
      }
    }
    startLoop();
  };

  useImperativeHandle(ref, () => ({
    emit: (x, y, type, config) => spawn(x, y, type, config),
    triggerLevelUp: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = canvas.width / (lowPerfMode ? 0.5 : 1);
      const height = canvas.height / (lowPerfMode ? 0.5 : 1);
      
      for (let i = 0; i < 40; i++) {
        spawn(Math.random() * width, height + 20, 'levelup_arrow', { speed: 0, size: 0, gravity: 0, count: 1 });
      }
    }
  }));

  return (
    <canvas 
      ref={canvasRef}
      className="absolute inset-0 z-10 pointer-events-none w-full h-full"
    />
  );
});

export const ImpactSplash = React.memo(({ splash }) => {
  if (!splash) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-impact relative will-change-transform flex flex-col items-center">
        <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-60 scale-150 rounded-full animate-pulse"></div>
        <div className="bg-amber-500 text-black font-black text-2xl md:text-3xl px-6 py-1.5 rounded-sm border-[4px] border-black transform -rotate-12 shadow-[6px_6px_0_rgba(0,0,0,1)] z-20 mb-[-10px] relative">
          {splash.text}
        </div>
        <div className="bg-white text-black font-[1000] text-3xl md:text-5xl px-4 py-2 rounded-lg border-[4px] border-black shadow-[8px_8px_0_rgba(239,68,68,1)] z-30 transform rotate-3 animate-bounce-short">
          <span className="text-red-600 mr-1">-</span>{Math.floor(splash.dmg)}
        </div>
      </div>
    </div>
  );
});

export const BossImpactSplash = React.memo(({ splash }) => {
  if (!splash) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-impact relative will-change-transform flex flex-col items-center scale-[1.5] md:scale-[2.0]">
        <div className="absolute inset-0 bg-red-600 blur-3xl opacity-70 scale-[2.0] rounded-full animate-ping"></div>
        <div className="bg-red-600 text-white font-[1000] text-3xl md:text-4xl px-8 py-3 rounded-sm border-[6px] border-black transform -rotate-12 shadow-[12px_12px_0_#000] z-20 mb-[-15px] relative uppercase italic">
          {splash.text}
        </div>
        <div className="bg-black text-white font-[1000] text-4xl md:text-7xl px-8 py-4 rounded-xl border-[6px] border-red-600 shadow-[15px_15px_0_rgba(0,0,0,0.5)] z-30 transform rotate-6">
          <span className="text-red-500 mr-2">-</span>{Math.floor(splash.dmg)}
        </div>
      </div>
    </div>
  );
});
