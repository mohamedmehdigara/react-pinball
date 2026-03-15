import React, { useState, useEffect, useRef } from 'react';

/**
 * Cyber Neon Pinball - Pro Edition (Standalone)
 * Fix: Improved Flipper Response & Physics Interaction
 */

const WIDTH = 500;
const HEIGHT = 750;
const GRAVITY = 0.45;
const FRICTION = 0.993;
const SUBSTEPS = 12;
const BALL_RADIUS = 10;
const FLIPPER_Y = 680;
const FLIPPER_LENGTH = 105;

const App = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState('START'); 
  const [shake, setShake] = useState({ x: 0, y: 0 });
  const [plungerPower, setPlungerPower] = useState(0);

  // High Performance Physics Refs
  const balls = useRef([]);
  const particles = useRef([]);
  
  // Use a ref for key states to ensure physics loop always has latest data
  const keys = useRef({ z: false, m: false, space: false });

  const flippers = useRef({
    left: { angle: 0.4, target: 0.4, x: 130, baseAngle: 0.4, upAngle: -0.6 },
    right: { angle: -0.4, target: -0.4, x: 350, baseAngle: -0.4, upAngle: 0.6 }
  });
  
  const bumpers = useRef([
    { x: 150, y: 220, r: 35, color: '#ff007b', score: 100, pulse: 0, id: 1 },
    { x: 350, y: 220, r: 35, color: '#ff007b', score: 100, pulse: 0, id: 2 },
    { x: 250, y: 120, r: 25, color: '#00f2ff', score: 500, pulse: 0, id: 3 },
    { x: 250, y: 340, r: 45, color: '#7000ff', score: 250, pulse: 0, id: 4 }
  ]);

  const slingshots = useRef([
    { x1: 100, y1: 580, x2: 130, y2: 640, x3: 80, y3: 640, color: '#00f2ff', pulse: 0 },
    { x1: 400, y1: 580, x2: 370, y2: 640, x3: 420, y3: 640, color: '#00f2ff', pulse: 0 }
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('neon-pinball-highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const initGame = () => {
    setScore(0);
    setMultiplier(1);
    setLives(3);
    balls.current = [];
    particles.current = [];
    setGameState('PLAYING');
  };

  const spawnBall = (power) => {
    if (lives <= 0) return;
    balls.current.push({
      x: 475, y: 710, vx: 0, vy: -16 - (power / 4.5),
      radius: BALL_RADIUS, trail: []
    });
  };

  const createExplosion = (x, y, color, count = 12) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 1.0,
        color
      });
    }
  };

  // Improved Keyboard Handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      const code = e.code;
      if (code === 'KeyZ') {
          keys.current.z = true;
          flippers.current.left.target = flippers.current.left.upAngle;
      }
      if (code === 'KeyM') {
          keys.current.m = true;
          flippers.current.right.target = flippers.current.right.upAngle;
      }
      if (code === 'Space') keys.current.space = true;
      if (e.key.includes('Arrow')) {
        setShake({ x: (Math.random() - 0.5) * 12, y: (Math.random() - 0.5) * 12 });
        balls.current.forEach(b => { b.vx += (Math.random() - 0.5) * 4; b.vy -= 0.5; });
      }
    };

    const handleKeyUp = (e) => {
      const code = e.code;
      if (code === 'KeyZ') {
          keys.current.z = false;
          flippers.current.left.target = flippers.current.left.baseAngle;
      }
      if (code === 'KeyM') {
          keys.current.m = false;
          flippers.current.right.target = flippers.current.right.baseAngle;
      }
      if (code === 'Space') {
        if (gameState === 'PLAYING' && balls.current.length === 0) {
            spawnBall(plungerPower);
            setPlungerPower(0);
        }
        keys.current.space = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, plungerPower]);

  // Main Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const loop = () => {
      if (gameState === 'PLAYING') {
        // Handle Spacebar Plunger Charging
        if (keys.current.space && balls.current.length === 0) {
          setPlungerPower(p => Math.min(p + 2.5, 100));
        }

        // Flipper Animation Smoothing
        flippers.current.left.angle += (flippers.current.left.target - flippers.current.left.angle) * 0.5;
        flippers.current.right.angle += (flippers.current.right.target - flippers.current.right.angle) * 0.5;

        // Substep Physics for accuracy
        for (let s = 0; s < SUBSTEPS; s++) {
          balls.current.forEach((ball) => {
            ball.vy += GRAVITY / SUBSTEPS;
            ball.vx *= Math.pow(FRICTION, 1/SUBSTEPS);
            ball.vy *= Math.pow(FRICTION, 1/SUBSTEPS);
            ball.x += ball.vx / SUBSTEPS;
            ball.y += ball.vy / SUBSTEPS;

            // Curved Top Boundary
            if (ball.y < 240) {
                const dx = ball.x - 250;
                const dy = ball.y - 150;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 240 - ball.radius) {
                    const nx = -dx / dist;
                    const ny = -dy / dist;
                    const vDotN = ball.vx * nx + ball.vy * ny;
                    ball.vx = (ball.vx - 2 * vDotN * nx) * 0.7;
                    ball.vy = (ball.vy - 2 * vDotN * ny) * 0.7;
                    ball.x = 250 - nx * (240 - ball.radius);
                    ball.y = 150 - ny * (240 - ball.radius);
                }
            }

            // Slingshot Collisions
            slingshots.current.forEach(sl => {
                const dx = sl.x2 - sl.x1;
                const dy = sl.y2 - sl.y1;
                const l2 = dx*dx + dy*dy;
                const t = Math.max(0, Math.min(1, ((ball.x - sl.x1) * dx + (ball.y - sl.y1) * dy) / l2));
                const px = sl.x1 + t * dx;
                const py = sl.y1 + t * dy;
                const d = Math.sqrt((ball.x - px)**2 + (ball.y - py)**2);
                if (d < ball.radius + 6) {
                    const nx = (ball.x - px) / d;
                    const ny = (ball.y - py) / d;
                    ball.vx = nx * 18;
                    ball.vy = ny * 18;
                    if (s === 0) {
                        sl.pulse = 1.0;
                        setScore(prev => prev + 25 * multiplier);
                        createExplosion(px, py, '#00f2ff', 6);
                    }
                }
            });

            // Bumper Collisions
            bumpers.current.forEach(bump => {
              const dx = ball.x - bump.x;
              const dy = ball.y - bump.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist < ball.radius + bump.r) {
                const nx = dx / dist;
                const ny = dy / dist;
                const vDotN = ball.vx * nx + ball.vy * ny;
                ball.vx = (ball.vx - 2 * vDotN * nx) * 1.65;
                ball.vy = (ball.vy - 2 * vDotN * ny) * 1.65;
                ball.x = bump.x + nx * (ball.radius + bump.r + 2);
                ball.y = bump.y + ny * (ball.radius + bump.r + 2);
                if (s === 0) {
                  setScore(prev => prev + bump.score * multiplier);
                  bump.pulse = 1.0;
                  createExplosion(bump.x, bump.y, bump.color);
                  if (bump.id === 3) setMultiplier(m => Math.min(m + 1, 10));
                }
              }
            });

            // Improved Flipper Collisions
            const solveF = (f, isLeft) => {
              const dir = isLeft ? 1 : -1;
              const endX = f.x + dir * Math.cos(f.angle) * FLIPPER_LENGTH;
              const endY = FLIPPER_Y + dir * Math.sin(f.angle) * FLIPPER_LENGTH;
              
              const dx = endX - f.x;
              const dy = endY - FLIPPER_Y;
              const l2 = dx*dx + dy*dy;
              const t = Math.max(0, Math.min(1, ((ball.x - f.x) * dx + (ball.y - FLIPPER_Y) * dy) / l2));
              
              const px = f.x + t * dx;
              const py = FLIPPER_Y + t * dy;
              const d = Math.sqrt((ball.x - px)**2 + (ball.y - py)**2);
              
              if (d < ball.radius + 8) {
                // Determine collision normal
                const nx = (ball.x - px) / d;
                const ny = (ball.y - py) / d;
                
                // Calculate flipper speed at point of contact
                const active = isLeft ? keys.current.z : keys.current.m;
                const surfaceVel = active ? 24 : 4;
                
                ball.vx = nx * surfaceVel;
                ball.vy = ny * surfaceVel;
                
                // Pop ball out of flipper to prevent sticking
                ball.x = px + nx * (ball.radius + 10);
                ball.y = py + ny * (ball.radius + 10);
              }
            };
            solveF(flippers.current.left, true);
            solveF(flippers.current.right, false);

            // Bounds
            if (ball.x < ball.radius) { ball.vx = Math.abs(ball.vx) * 0.5; ball.x = ball.radius; }
            if (ball.x > WIDTH - ball.radius) {
                if (ball.y > 150) { ball.vx = -Math.abs(ball.vx) * 0.5; ball.x = WIDTH - ball.radius; }
            }
          });
        }

        // Trail Update
        balls.current.forEach(b => {
            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 8) b.trail.shift();
        });

        // Life Management
        const activeBalls = balls.current.filter(b => b.y < HEIGHT + 50);
        if (balls.current.length > 0 && activeBalls.length === 0) {
            setLives(l => {
                const next = l - 1;
                if (next <= 0) {
                    setGameState('GAMEOVER');
                    setHighScore(hs => {
                        const newHs = Math.max(hs, score);
                        localStorage.setItem('neon-pinball-highscore', newHs.toString());
                        return newHs;
                    });
                } else {
                    setMultiplier(1);
                }
                return next;
            });
        }
        balls.current = activeBalls;

        // Visual Decay
        particles.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.025; });
        particles.current = particles.current.filter(p => p.life > 0);
        bumpers.current.forEach(b => b.pulse *= 0.9);
        slingshots.current.forEach(sl => sl.pulse *= 0.85);
        setShake(s => ({ x: s.x * 0.8, y: s.y * 0.8 }));
      }

      // --- Draw Cycle ---
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // BG Elements
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.05)';
      ctx.lineWidth = 1;
      for(let i=0; i<WIDTH; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, HEIGHT); ctx.stroke(); }
      for(let i=0; i<HEIGHT; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(WIDTH, i); ctx.stroke(); }

      // Slingshots
      slingshots.current.forEach(sl => {
          ctx.beginPath();
          ctx.moveTo(sl.x1, sl.y1); ctx.lineTo(sl.x2, sl.y2); ctx.lineTo(sl.x3, sl.y3); ctx.closePath();
          ctx.fillStyle = sl.pulse > 0.1 ? '#fff' : '#111';
          ctx.fill();
          ctx.strokeStyle = '#00f2ff';
          ctx.lineWidth = 3 + sl.pulse * 5;
          ctx.stroke();
      });

      // Bumpers
      bumpers.current.forEach(b => {
        ctx.save();
        ctx.shadowBlur = 15 + b.pulse * 30;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + b.pulse * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      });

      // Flippers
      const drawF = (f, isLeft) => {
        ctx.save();
        ctx.translate(f.x, FLIPPER_Y);
        ctx.rotate(f.angle);
        ctx.shadowBlur = 15; ctx.shadowColor = '#00f2ff';
        ctx.fillStyle = '#1a1a25'; ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 4;
        const w = isLeft ? FLIPPER_LENGTH : -FLIPPER_LENGTH;
        ctx.beginPath(); ctx.roundRect(0, -10, w, 20, 10); ctx.fill(); ctx.stroke();
        ctx.restore();
      };
      drawF(flippers.current.left, true);
      drawF(flippers.current.right, false);

      // Balls
      balls.current.forEach(b => {
        b.trail.forEach((t, i) => {
            ctx.globalAlpha = i / b.trail.length * 0.4;
            ctx.fillStyle = '#00f2ff';
            ctx.beginPath(); ctx.arc(t.x, t.y, b.radius * (i/b.trail.length), 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 15; ctx.shadowColor = '#fff';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Particles
      particles.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Scanline Effect Overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for(let i=0; i<HEIGHT; i+=4) ctx.fillRect(0, i, WIDTH, 1);

      raf = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(raf);
  }, [gameState, plungerPower, multiplier, score]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#010103] text-white p-4 font-sans select-none overflow-hidden">
      {/* HUD Header */}
      <div className="w-[500px] bg-black border-x border-t border-cyan-500/20 rounded-t-3xl p-5 flex justify-between items-end">
        <div>
          <p className="text-[10px] text-cyan-500 font-black tracking-widest uppercase mb-1">Score</p>
          <p className="text-4xl font-mono font-black italic">{score.toLocaleString()}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className={`text-xs font-bold px-3 py-1 rounded border transition-colors ${multiplier > 1 ? 'border-pink-500 text-pink-500 bg-pink-500/10' : 'border-gray-800 text-gray-500'}`}>
                {multiplier}X MULTIPLIER
            </div>
            <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-3 h-6 skew-x-[-15deg] transition-all duration-300 ${i < lives ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-gray-800'}`} />
                ))}
            </div>
        </div>
      </div>

      {/* Game Table */}
      <div className="relative bg-[#020205] border-[10px] border-[#1a1a25] rounded-b-[40px] shadow-2xl overflow-hidden" style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block" />

        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-white/20 font-mono tracking-[0.2em]">
            BEST: {highScore.toLocaleString()}
        </div>

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-8 text-center backdrop-blur-sm">
            <h1 className="text-8xl font-black italic tracking-tighter text-white mb-2">NEON</h1>
            <h2 className="text-2xl text-cyan-400 font-bold tracking-[0.4em] mb-12 uppercase">Striker Pro</h2>
            <button onClick={initGame} className="group relative px-12 py-4 border-2 border-cyan-400 text-cyan-400 font-black text-xl hover:bg-cyan-400 hover:text-black transition-all">
                <span className="relative z-10">START ENGINE</span>
                <div className="absolute inset-0 bg-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </button>
            <div className="mt-12 text-[10px] text-gray-500 font-mono space-y-1 uppercase tracking-widest">
                <p>Z / M : FLIPPERS</p>
                <p>SPACE : LAUNCHER</p>
                <p>ARROWS : NUDGE</p>
            </div>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-50 text-center p-8 animate-in fade-in duration-500">
            <h1 className="text-6xl font-black italic text-pink-600 mb-4 animate-bounce">CRASHED</h1>
            <p className="text-2xl font-mono mb-8 text-white/60">RECORD: {score.toLocaleString()}</p>
            <button onClick={initGame} className="px-10 py-3 bg-white text-black font-black hover:bg-cyan-400 hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              REBOOT
            </button>
          </div>
        )}

        {plungerPower > 0 && (
            <div className="absolute right-4 bottom-10 w-2 h-40 bg-gray-900/50 rounded-full overflow-hidden border border-white/5">
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-600 to-cyan-300" style={{ height: `${plungerPower}%` }} />
            </div>
        )}
      </div>

      {/* Controls Help */}
      <div className="mt-8 grid grid-cols-3 gap-12 text-center">
        <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-10 border-2 rounded flex items-center justify-center text-sm font-bold transition-colors ${keys.current.z ? 'border-cyan-400 bg-cyan-400 text-black shadow-[0_0_15px_#06b6d4]' : 'border-white/20 text-white/40'}`}>Z</div>
            <span className="text-[10px] font-bold tracking-widest opacity-40">LEFT</span>
        </div>
        <div className="flex flex-col items-center gap-2">
            <div className={`w-24 h-10 border-2 rounded flex items-center justify-center text-sm font-bold transition-colors ${keys.current.space ? 'border-cyan-400 bg-cyan-400 text-black shadow-[0_0_15px_#06b6d4]' : 'border-white/20 text-white/40'}`}>SPACE</div>
            <span className="text-[10px] font-bold tracking-widest opacity-40">LAUNCH</span>
        </div>
        <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-10 border-2 rounded flex items-center justify-center text-sm font-bold transition-colors ${keys.current.m ? 'border-cyan-400 bg-cyan-400 text-black shadow-[0_0_15px_#06b6d4]' : 'border-white/20 text-white/40'}`}>M</div>
            <span className="text-[10px] font-bold tracking-widest opacity-40">RIGHT</span>
        </div>
      </div>
    </div>
  );
};

export default App;