import React, { useEffect, useRef, useState, useCallback } from 'react';
import { create } from 'zustand';
import { 
  Cpu, Orbit, TrendingUp, Gauge, Zap, Trophy, Shield, 
  RotateCw, Share2, Layers, Activity, Hexagon
} from 'lucide-react';

/**
 * Game State Management
 */
const useGameStore = create((set) => ({
  score: 0,
  highScore: 0,
  gameState: 'START', 
  ballsLeft: 3,
  multiplier: 1,
  addScore: (points) => set((state) => ({ 
    score: state.score + Math.round(points * state.multiplier) 
  })),
  incrementMultiplier: () => set((state) => ({ 
    multiplier: Math.min(state.multiplier + 0.2, 12) 
  })),
  startGame: () => set({ 
    score: 0, gameState: 'PLAYING', ballsLeft: 3, multiplier: 1
  }),
  endBall: () => set((state) => {
    const nextBalls = state.ballsLeft - 1;
    if (nextBalls <= 0) {
      return { gameState: 'GAMEOVER', highScore: Math.max(state.score, state.highScore) };
    }
    return { ballsLeft: nextBalls, multiplier: 1 };
  }),
}));

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 640;
const BALL_RADIUS = 7.5;
const GRAVITY = 0.38;
const MAX_VELOCITY = 18;
const SUB_STEPS = 10; 

const App = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const store = useGameStore();

  // Reference-based physics state for high performance
  const ball = useRef({ 
    x: 380, y: 580, vx: 0, vy: 0, 
    inPlay: false, trail: [] 
  });
  
  const flippers = useRef({
    left: { x: 120, y: 580, angle: 0.5, active: false, targetUp: -0.6, targetDown: 0.5, length: 78, r: 10 },
    right: { x: 280, y: 580, angle: -0.5, active: false, targetUp: 0.6, targetDown: -0.5, length: 78, r: 10 }
  });
  
  const [shake, setShake] = useState(0);

  const world = useRef({
    bumpers: [
      { x: 130, y: 150, r: 26, color: '#f43f5e', power: 1.7, id: 1 },
      { x: 270, y: 150, r: 26, color: '#f43f5e', power: 1.7, id: 2 },
      { x: 200, y: 70, r: 32, color: '#0ea5e9', power: 1.9, id: 3 },
    ],
    portals: [
      { x: 40, y: 250, r: 20, color: '#f59e0b', pair: 1 },
      { x: 360, y: 250, r: 20, color: '#8b5cf6', pair: 0 },
    ],
    walls: [
      { x1: 5, y1: 640, x2: 5, y2: 150 },      
      { x1: 395, y1: 640, x2: 395, y2: 150 },  
      { x1: 360, y1: 640, x2: 360, y2: 200 }, 
      { x1: 5, y1: 450, x2: 80, y2: 540 },    
      { x1: 80, y1: 540, x2: 80, y2: 600 },   
      { x1: 360, y1: 450, x2: 320, y2: 540 }, 
      { x1: 320, y1: 540, x2: 320, y2: 600 }, 
      { x1: 0, y1: 639, x2: 100, y2: 639 },
      { x1: 300, y1: 639, x2: 400, y2: 639 },
    ]
  });

  const getClosestPointOnSegment = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return { x: x1, y: y1 };
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return { x: x1 + t * dx, y: y1 + t * dy };
  };

  const updatePhysics = useCallback(() => {
    if (store.gameState !== 'PLAYING') return;
    const b = ball.current;

    for (let s = 0; s < SUB_STEPS; s++) {
      // Integration
      b.vy += GRAVITY / SUB_STEPS;
      b.x += b.vx / SUB_STEPS;
      b.y += b.vy / SUB_STEPS;

      // Flipper Movement
      const f = flippers.current;
      const fSpeed = 0.55;
      f.left.angle += (f.left.active ? f.left.targetUp - f.left.angle : f.left.targetDown - f.left.angle) * fSpeed;
      f.right.angle += (f.right.active ? f.right.targetUp - f.right.angle : f.right.targetDown - f.right.angle) * fSpeed;

      // Collisions: Flippers
      [ {fl: f.left, side: 1}, {fl: f.right, side: -1} ].forEach(({fl, side}) => {
        const tipX = fl.x + Math.cos(fl.angle) * fl.length * side;
        const tipY = fl.y + Math.sin(fl.angle) * fl.length * side;
        const closest = getClosestPointOnSegment(b.x, b.y, fl.x, fl.y, tipX, tipY);
        const dx = b.x - closest.x;
        const dy = b.y - closest.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < BALL_RADIUS + fl.r) {
          const nx = dx / dist;
          const ny = dy / dist;
          // Eject ball from interior
          b.x = closest.x + nx * (BALL_RADIUS + fl.r);
          b.y = closest.y + ny * (BALL_RADIUS + fl.r);
          
          const dot = b.vx * nx + b.vy * ny;
          if (dot < 0) {
            const bounce = fl.active ? 15 : 4;
            b.vx = (b.vx - 2 * dot * nx) + (nx * bounce);
            b.vy = (b.vy - 2 * dot * ny) + (ny * bounce);
            if(fl.active) {
                setShake(5);
                store.addScore(5);
            }
          }
        }
      });

      // Collisions: World Walls
      world.current.walls.forEach(w => {
        const closest = getClosestPointOnSegment(b.x, b.y, w.x1, w.y1, w.x2, w.y2);
        const dx = b.x - closest.x;
        const dy = b.y - closest.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < BALL_RADIUS) {
          const nx = dx / dist;
          const ny = dy / dist;
          b.x = closest.x + nx * (BALL_RADIUS + 0.1);
          b.y = closest.y + ny * (BALL_RADIUS + 0.1);
          const dot = b.vx * nx + b.vy * ny;
          if (dot < 0) {
            b.vx = (b.vx - 2 * dot * nx) * 0.7;
            b.vy = (b.vy - 2 * dot * ny) * 0.7;
          }
        }
      });

      // Collisions: Curved Top Dome
      if (b.y < 150) {
        const dx = b.x - 200;
        const dy = b.y - 150;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const r = 195;
        if (dist > r - BALL_RADIUS) {
          const nx = -dx / dist;
          const ny = -dy / dist;
          b.x = 200 - nx * (r - BALL_RADIUS - 0.2);
          b.y = 150 - ny * (r - BALL_RADIUS - 0.2);
          const dot = b.vx * nx + b.vy * ny;
          if (dot < 0) {
            b.vx = (b.vx - 2 * dot * nx) * 0.8;
            b.vy = (b.vy - 2 * dot * ny) * 0.8;
          }
        }
      }

      // Collisions: Bumpers
      world.current.bumpers.forEach(bump => {
        const dx = b.x - bump.x;
        const dy = b.y - bump.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bump.r + BALL_RADIUS) {
          const nx = dx / dist;
          const ny = dy / dist;
          b.x = bump.x + nx * (bump.r + BALL_RADIUS + 0.2);
          b.y = bump.y + ny * (bump.r + BALL_RADIUS + 0.2);
          const dot = b.vx * nx + b.vy * ny;
          b.vx = (b.vx - 2 * dot * nx) * bump.power;
          b.vy = (b.vy - 2 * dot * ny) * bump.power;
          store.addScore(200);
          store.incrementMultiplier();
          setShake(8);
        }
      });
    }

    // Portals
    world.current.portals.forEach((p, idx) => {
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      if (Math.sqrt(dx*dx + dy*dy) < p.r) {
        const target = world.current.portals[p.pair];
        b.x = target.x + (b.vx > 0 ? 30 : -30);
        b.y = target.y;
        setShake(4);
      }
    });

    // Velocity Clamp
    const currentSpeed = Math.sqrt(b.vx**2 + b.vy**2);
    if (currentSpeed > MAX_VELOCITY) {
      b.vx = (b.vx / currentSpeed) * MAX_VELOCITY;
      b.vy = (b.vy / currentSpeed) * MAX_VELOCITY;
    }

    // Drain
    if (b.y > CANVAS_HEIGHT + 20) {
      store.endBall();
      b.x = 380; b.y = 580; b.vx = 0; b.vy = 0; b.inPlay = false; b.trail = [];
    }

    // Trail logic
    b.trail.push({x: b.x, y: b.y});
    if (b.trail.length > 10) b.trail.shift();
  }, [store]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.save();
    if (shake > 0) {
      ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake);
      setShake(s => Math.max(0, s - 0.6));
    }

    // BG
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    for(let i=0; i<CANVAS_WIDTH; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,640); ctx.stroke(); }
    for(let i=0; i<CANVAS_HEIGHT; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(CANVAS_WIDTH,i); ctx.stroke(); }

    // Table Bounds
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    world.current.walls.forEach(w => {
      ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke();
    });

    // Dome
    ctx.beginPath(); ctx.arc(200, 150, 195, Math.PI, 0); 
    ctx.stroke();

    // Portals
    world.current.portals.forEach(p => {
      ctx.shadowBlur = 10; ctx.shadowColor = p.color;
      ctx.strokeStyle = p.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Bumpers
    world.current.bumpers.forEach(bump => {
      ctx.shadowBlur = 15; ctx.shadowColor = bump.color;
      ctx.fillStyle = bump.color;
      ctx.beginPath(); ctx.arc(bump.x, bump.y, bump.r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Flippers
    const drawFlip = (f, side) => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      const grad = ctx.createLinearGradient(0, 0, f.length * side, 0);
      grad.addColorStop(0, '#1d4ed8');
      grad.addColorStop(1, f.active ? '#38bdf8' : '#2563eb');
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (side === 1) ctx.roundRect(0, -f.r, f.length, f.r * 2, f.r);
      else ctx.roundRect(-f.length, -f.r, f.length, f.r * 2, f.r);
      ctx.fill();
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    };
    drawFlip(flippers.current.left, 1);
    drawFlip(flippers.current.right, -1);

    // Ball
    const b = ball.current;
    b.trail.forEach((t, i) => {
      ctx.globalAlpha = (i / b.trail.length) * 0.3;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(t.x, t.y, BALL_RADIUS - 1, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
    updatePhysics();
    requestRef.current = requestAnimationFrame(render);
  }, [updatePhysics, shake]);

  useEffect(() => {
    const handleKey = (e, down) => {
      if (e.code === 'KeyZ' || e.code === 'ArrowLeft') flippers.current.left.active = down;
      if (e.code === 'KeyM' || e.code === 'ArrowRight') flippers.current.right.active = down;
      
      if (down && e.code === 'Space') {
        if (store.gameState === 'PLAYING') {
          // Launch only from gutter
          if (!ball.current.inPlay && ball.current.x > 360 && ball.current.y > 550) {
            ball.current.vy = -36; 
            ball.current.vx = -0.05;
            ball.current.inPlay = true;
          }
        } else {
          store.startGame();
        }
      }
    };
    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));
    requestRef.current = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      cancelAnimationFrame(requestRef.current);
    }
  }, [store, render]);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-4 select-none">
      
      {/* Header HUD */}
      <div className="w-[420px] mb-6 flex justify-between items-end px-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sky-400">
            <Hexagon size={16} className="animate-spin-slow" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60">System Online</span>
          </div>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${i < store.ballsLeft ? 'bg-sky-500 shadow-[0_0_12px_#38bdf8]' : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 text-amber-500 mb-1">
            <TrendingUp size={14} />
            <span className="text-xs font-black">x{store.multiplier.toFixed(1)}</span>
          </div>
          <div className="text-5xl font-mono font-black tracking-tighter tabular-nums">
            {store.score.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex gap-8 items-center">
        {/* Machine Frame */}
        <div className="relative p-6 bg-slate-900 rounded-[5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-b-[20px] border-slate-950">
          <div className="relative rounded-[4rem] overflow-hidden border-[10px] border-slate-950 bg-black">
            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block cursor-none" />
            
            {/* UI Overlay */}
            {store.gameState !== 'PLAYING' && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-12 text-center z-50">
                <Orbit className="w-24 h-24 text-sky-500 animate-pulse mb-8" />
                
                <h1 className="text-6xl font-black italic tracking-tighter mb-10 leading-none">
                  NEO<span className="text-sky-500">PIN</span>
                </h1>
                
                <div className="space-y-4 w-full mb-10">
                  <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-3xl border border-slate-800/50">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Left</span>
                    <span className="text-sky-400 font-mono font-bold">Z / ←</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-3xl border border-slate-800/50">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Right</span>
                    <span className="text-sky-400 font-mono font-bold">M / →</span>
                  </div>
                </div>

                <button 
                  onClick={store.startGame}
                  className="w-full py-6 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-3xl transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3"
                >
                  <Zap size={20} className="text-amber-300" />
                  <span className="tracking-widest uppercase text-xl">Initialize</span>
                </button>

                {store.gameState === 'GAMEOVER' && (
                  <div className="mt-8 flex flex-col items-center gap-1">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Sector Best</p>
                    <p className="text-3xl font-mono text-white font-black">{store.highScore.toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer Instructions */}
      <div className="mt-10 flex items-center gap-8 text-slate-700 text-[10px] font-bold tracking-[0.4em] uppercase">
        <div className="flex items-center gap-2">
          <Shield size={12} className="text-emerald-600" />
          <span>Buffer: Stable</span>
        </div>
        <span>Space to Launch</span>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 15s linear infinite; }
        canvas {
          image-rendering: pixelated;
        }
      `}</style>
    </div>
  );
};

export default App;