import React, { useState, useEffect, useRef } from 'react';

// Configuration
const WIDTH = 500;
const HEIGHT = 850;
const BALL_RADIUS = 11;
const SUBSTEPS = 12; // Physics precision
const GRAVITY_BASE = 0.52 / SUBSTEPS;
const FRICTION = Math.pow(0.995, 1 / SUBSTEPS);
const BOUNCINESS = 0.45;

const App = () => {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [gameState, setGameState] = useState('IDLE');
  const [combo, setCombo] = useState(0);
  const canvasRef = useRef(null);
  const keys = useRef({});
  const requestRef = useRef();
  const shakeRef = useRef(0);
  
  const p = useRef({
    ball: { x: 465, y: 800, vx: 0, vy: 0, trail: [], color: '#38bdf8' },
    flippers: [
      { 
        side: 'left', x: 175, y: 775, angle: 0.5, targetAngle: 0.5, 
        minA: -0.55, maxA: 0.55, length: 95, width: 24, color: '#2563eb', active: false
      },
      { 
        side: 'right', x: 325, y: 775, angle: 2.64, targetAngle: 2.64, 
        minA: 2.59, maxA: 3.69, length: 95, width: 24, color: '#dc2626', active: false
      }
    ],
    bumpers: [
      { x: 150, y: 240, r: 35, color: '#fbbf24', hit: 0, value: 500, label: 'CORE' },
      { x: 350, y: 240, r: 35, color: '#fbbf24', hit: 0, value: 500, label: 'CORE' },
      { x: 250, y: 140, r: 30, color: '#22c55e', hit: 0, value: 1500, label: 'APEX' },
      { x: 250, y: 390, r: 42, color: '#ec4899', hit: 0, value: 250, label: 'MASS' },
      { x: 65, y: 550, r: 25, color: '#818cf8', hit: 0, value: 100, isSling: true },
      { x: 435, y: 550, r: 25, color: '#818cf8', hit: 0, value: 100, isSling: true }
    ],
    walls: [
      // Outer shell
      { x1: 5, y1: 850, x2: 5, y2: 250 }, 
      { x1: 5, y1: 250, x2: 60, y2: 60 }, 
      { x1: 60, y1: 60, x2: 250, y2: 5 }, 
      { x1: 250, y1: 5, x2: 440, y2: 60 }, 
      { x1: 440, y1: 60, x2: 495, y2: 120 },
      { x1: 495, y1: 120, x2: 495, y2: 850 }, 
      
      // Chute divider
      { x1: 440, y1: 850, x2: 440, y2: 220 },
      
      // Drain slopes
      { x1: 5, y1: 720, x2: 150, y2: 810 },
      { x1: 440, y1: 720, x2: 350, y2: 810 },

      // Outlane dividers
      { x1: 80, y1: 620, x2: 80, y2: 740 },
      { x1: 360, y1: 620, x2: 360, y2: 740 }
    ]
  });

  const triggerShake = (amt) => { shakeRef.current = Math.min(shakeRef.current + amt, 15); };

  const launch = () => {
    if (gameState !== 'IDLE') return;
    p.current.ball.x = 465;
    p.current.ball.y = 820;
    p.current.ball.vy = -62; 
    p.current.ball.vx = (Math.random() - 0.5) * 1.5;
    setGameState('PLAYING');
    setMultiplier(1);
    setScore(0);
    setCombo(0);
  };

  const updatePhysics = () => {
    const state = p.current;
    const b = state.ball;

    // Flipper Logic
    state.flippers[0].active = !!keys.current['z'];
    state.flippers[1].active = !!(keys.current['/'] || keys.current['arrowright']);
    state.flippers[0].targetAngle = state.flippers[0].active ? state.flippers[0].minA : state.flippers[0].maxA;
    state.flippers[1].targetAngle = state.flippers[1].active ? state.flippers[1].maxA : state.flippers[1].minA;

    const rotSpeed = 2.2 / SUBSTEPS;
    state.flippers.forEach(f => f.angle += (f.targetAngle - f.angle) * rotSpeed);

    if (gameState === 'PLAYING') {
      for (let s = 0; s < SUBSTEPS; s++) {
        // Dynamic Gravity (pulls harder at bottom)
        const gMult = 1 + (b.y / HEIGHT) * 0.4;
        b.vy += GRAVITY_BASE * gMult;
        b.vx *= FRICTION;
        b.vy *= FRICTION;
        b.x += b.vx / SUBSTEPS;
        b.y += b.vy / SUBSTEPS;

        // Wall collisions
        state.walls.forEach(w => {
          const dx = w.x2 - w.x1;
          const dy = w.y2 - w.y1;
          const l2 = dx * dx + dy * dy;
          let t = ((b.x - w.x1) * dx + (b.y - w.y1) * dy) / l2;
          t = Math.max(0, Math.min(1, t));
          const cx = w.x1 + t * dx;
          const cy = w.y1 + t * dy;
          const dist = Math.sqrt((b.x - cx)**2 + (b.y - cy)**2);
          
          if (dist < BALL_RADIUS) {
            const nx = (b.x - cx) / dist;
            const ny = (b.y - cy) / dist;
            const dot = b.vx * nx + b.vy * ny;
            if (dot < 0) {
              b.vx = (b.vx - 1.7 * dot * nx) * 0.8;
              b.vy = (b.vy - 1.7 * dot * ny) * 0.8;
            }
            b.x = cx + nx * (BALL_RADIUS + 0.1);
            b.y = cy + ny * (BALL_RADIUS + 0.1);
          }
        });

        // Flipper Collisions
        state.flippers.forEach(f => {
          const cos = Math.cos(f.angle);
          const sin = Math.sin(f.angle);
          const dx = cos * f.length;
          const dy = sin * f.length;
          const l2 = dx * dx + dy * dy;
          let t = ((b.x - f.x) * dx + (b.y - f.y) * dy) / l2;
          t = Math.max(0, Math.min(1, t));
          
          const cx = f.x + t * dx;
          const cy = f.y + t * dy;
          const dist = Math.sqrt((b.x - cx)**2 + (b.y - cy)**2);
          const hitWidth = f.width * (1 - t * 0.3); 
          const minDist = BALL_RADIUS + (hitWidth / 2);

          if (dist < minDist) {
            const nx = (b.x - cx) / dist;
            const ny = (b.y - cy) / dist;
            
            // Flipper rotation impulse
            const angVel = f.active ? (f.side === 'left' ? -3.8 : 3.8) : 0.6;
            const vPointX = -(cy - f.y) * angVel;
            const vPointY = (cx - f.x) * angVel;

            const relVx = b.vx - vPointX;
            const relVy = b.vy - vPointY;
            const dot = relVx * nx + relVy * ny;

            if (dot < 0) {
              const energy = f.active ? 2.2 : 1.1;
              b.vx = (relVx - energy * dot * nx) * BOUNCINESS + vPointX;
              b.vy = (relVy - energy * dot * ny) * BOUNCINESS + vPointY;
              
              if (f.active) {
                  const boost = (0.5 + t) * 18; 
                  b.vx += nx * boost;
                  b.vy += ny * boost;
                  triggerShake(2);
              }
            }
            b.x = cx + nx * (minDist + 0.5);
            b.y = cy + ny * (minDist + 0.5);
          }
        });

        // Bumper Physics
        state.bumpers.forEach(bump => {
          const dx = b.x - bump.x;
          const dy = b.y - bump.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < bump.r + BALL_RADIUS) {
            const nx = dx / dist;
            const ny = dy / dist;
            const force = bump.isSling ? 32 : 25;
            const dot = b.vx * nx + b.vy * ny;
            
            if (dot < 0) {
              b.vx = (b.vx - 1.9 * dot * nx) + nx * force;
              b.vy = (b.vy - 1.9 * dot * ny) + ny * force;
            }
            b.x = bump.x + nx * (bump.r + BALL_RADIUS + 1);
            bump.hit = 1.0;
            triggerShake(bump.isSling ? 4 : 2);
            
            setScore(prev => {
                const newScore = prev + (bump.value * multiplier);
                if (newScore > highScore) setHighScore(newScore);
                return newScore;
            });
            setCombo(c => c + 1);
            if (bump.value >= 1000) setMultiplier(m => Math.min(m + 1, 15));
          }
          bump.hit *= 0.92;
        });
      }

      // Lose Condition
      if (b.y > HEIGHT + 100) {
        setGameState('IDLE');
        b.x = 465; b.y = 800; b.vx = 0; b.vy = 0; b.trail = [];
      }

      // Trail
      if (Math.abs(b.vx) + Math.abs(b.vy) > 1) {
        b.trail.push({x: b.x, y: b.y});
        if (b.trail.length > 12) b.trail.shift();
      }
    }
    
    // Decay Screenshake
    shakeRef.current *= 0.85;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const render = () => {
      updatePhysics();
      
      ctx.save();
      if (shakeRef.current > 0.5) {
          ctx.translate((Math.random()-0.5) * shakeRef.current, (Math.random()-0.5) * shakeRef.current);
      }

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Grid/Pattern Background
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < WIDTH; i += 50) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, HEIGHT); ctx.stroke();
      }
      for (let i = 0; i < HEIGHT; i += 50) {
          ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(WIDTH, i); ctx.stroke();
      }

      // Walls
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      p.current.walls.forEach(w => {
        ctx.beginPath();
        ctx.moveTo(w.x1, w.y1);
        ctx.lineTo(w.x2, w.y2);
        ctx.stroke();
      });

      // Trail
      const b = p.current.ball;
      b.trail.forEach((pos, i) => {
        ctx.fillStyle = `rgba(56, 189, 248, ${i / b.trail.length * 0.3})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, BALL_RADIUS * (0.5 + i / b.trail.length * 0.5), 0, Math.PI*2);
        ctx.fill();
      });

      // Bumpers
      p.current.bumpers.forEach(bump => {
        ctx.save();
        const activeScale = 1 + (bump.hit * 0.2);
        ctx.shadowBlur = bump.hit * 40;
        ctx.shadowColor = bump.color;
        ctx.fillStyle = bump.hit > 0.6 ? '#fff' : bump.color;
        ctx.beginPath();
        ctx.arc(bump.x, bump.y, bump.r * activeScale, 0, Math.PI * 2);
        ctx.fill();
        
        // Ring
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(bump.x, bump.y, bump.r * activeScale + 5, 0, Math.PI * 2);
        ctx.stroke();

        if (bump.label) {
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(bump.label, bump.x, bump.y + 4);
        }
        ctx.restore();
      });

      // Flippers
      p.current.flippers.forEach(f => {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.angle);
        ctx.shadowBlur = f.active ? 30 : 5;
        ctx.shadowColor = f.color;
        ctx.fillStyle = f.active ? '#fff' : f.color;
        ctx.beginPath();
        ctx.roundRect(0, -f.width/2, f.length, f.width, [12, 30, 30, 12]);
        ctx.fill();
        // Pivot point
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      });

      // Ball
      ctx.fillStyle = '#f8fafc';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#38bdf8';
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();

      requestRef.current = requestAnimationFrame(render);
    };
    requestRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
        keys.current[e.key.toLowerCase()] = true;
        if (e.code === 'Space') launch();
    };
    const handleKeyUp = (e) => keys.current[e.key.toLowerCase()] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen bg-[#020617] text-slate-100 p-6 font-sans overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-8 items-stretch max-w-6xl w-full justify-center">
        
        {/* Sidebar Info */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] border-t border-slate-700/50 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
            <h1 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">NEON</h1>
            <h1 className="text-5xl font-black italic tracking-tighter text-white -mt-2">STRIKE</h1>
            <p className="text-[10px] mt-4 uppercase tracking-[0.5em] text-blue-400/60 font-black">Plasma Engine v4.0</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl group">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] block mb-1">Session Score</span>
              <div className="text-4xl font-mono text-blue-400 tabular-nums">{score.toLocaleString()}</div>
            </div>

            <div className="p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] block mb-1">High Score</span>
              <div className="text-2xl font-mono text-slate-400 tabular-nums">{highScore.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex-1 bg-slate-900/40 p-6 rounded-[2.5rem] border border-slate-800/50 space-y-6">
             <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl">
                <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Multiplier</span>
                    <span className="text-2xl font-black text-pink-500">x{multiplier}</span>
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Combo</span>
                    <span className="text-2xl font-black text-cyan-400">{combo}</span>
                </div>
             </div>

             <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-widest">Left Flipper</span>
                    <kbd className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-blue-400 font-mono shadow-sm text-sm">Z</kbd>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-widest">Right Flipper</span>
                    <kbd className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-red-400 font-mono shadow-sm text-sm">/</kbd>
                </div>
             </div>

             <button 
                onClick={launch}
                disabled={gameState === 'PLAYING'}
                className={`w-full py-5 rounded-2xl font-black uppercase text-sm tracking-[0.3em] transition-all shadow-[0_8px_0_rgba(0,0,0,0.3)] ${
                    gameState === 'IDLE' 
                    ? 'bg-blue-600 hover:bg-blue-500 active:translate-y-1 active:shadow-none text-white' 
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none translate-y-1'
                }`}
             >
                {gameState === 'IDLE' ? 'Engage Core' : 'System Active'}
             </button>
          </div>
        </div>

        {/* Playfield Area */}
        <div className="relative">
          <div className="absolute -inset-10 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="relative bg-slate-950 border-[16px] border-slate-900 rounded-[4.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
            <canvas 
              ref={canvasRef} 
              width={WIDTH} 
              height={HEIGHT} 
              className="max-h-[85vh] h-auto w-auto cursor-none select-none touch-none"
            />
            {gameState === 'IDLE' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-md">
                <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/50 mb-6 animate-pulse">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                         <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615l-4.695 4.502c-0.267 0.257-0.514 0.384-0.785 0.384-0.273 0-0.522-0.127-0.788-0.384l-4.692-4.502c-0.409-0.418-0.437-1.17 0-1.615z" transform="rotate(-90 10 10)"/></svg>
                    </div>
                </div>
                <h2 className="text-2xl font-black tracking-[0.4em] uppercase text-white">Ready for Launch</h2>
                <p className="text-slate-500 mt-2 font-bold tracking-widest text-xs">PRESS SPACE OR ENGAGE CORE</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;