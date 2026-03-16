import React, { useState, useEffect, useRef, useCallback } from 'react';

const WIDTH = 480;
const HEIGHT = 800;
const BALL_RADIUS = 9;
const SUB_STEPS = 8;
const GRAVITY = 0.35; 
const FRICTION = 0.995;
const MAX_SPEED = 28;
const BOUNCE = 0.5; 
const FLIPPER_BOUNCE = 0.4;

const App = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState('MENU');
  const [charge, setCharge] = useState(0);

  const ball = useRef({ 
    x: 450, 
    y: 750, 
    vx: 0, 
    vy: 0, 
    active: false, 
    trail: [] 
  });

  const particles = useRef([]);
  const shake = useRef(0);
  const input = useRef({ left: false, right: false, space: false });

  const flippers = useRef({
    left: { x: 135, y: 720, angle: 0.5, target: 0.5, base: 0.5, up: -0.6, length: 90, width: 16, vel: 0 },
    right: { x: 345, y: 720, angle: 2.64, target: 2.64, base: 2.64, up: 3.74, length: 90, width: 16, vel: 0 }
  });

  const bumpers = useRef([
    { x: 240, y: 180, r: 35, color: '#00f2ff', pulse: 0, score: 500 },
    { x: 130, y: 320, r: 30, color: '#ff00ff', pulse: 0, score: 250 },
    { x: 350, y: 320, r: 30, color: '#ff00ff', pulse: 0, score: 250 },
    { x: 240, y: 460, r: 25, color: '#00ff41', pulse: 0, score: 100 },
  ]);

  const walls = useRef([
    { x1: 15, y1: 800, x2: 15, y2: 200 }, 
    { x1: 465, y1: 800, x2: 465, y2: 200 }, 
    { x1: 440, y1: 800, x2: 440, y2: 230 }, 
    { x1: 15, y1: 580, x2: 100, y2: 660 }, 
    { x1: 440, y1: 580, x2: 380, y2: 660 }, 
    { x1: 135, y1: 720, x2: 15, y2: 640 }, 
    { x1: 345, y1: 720, x2: 440, y2: 640 },
  ]);

  const resetBall = useCallback(() => {
    ball.current = {
      x: 452,
      y: 750,
      vx: 0,
      vy: 0,
      active: false,
      trail: []
    };
    setCharge(0);
  }, []);

  const spawnParticles = (x, y, color) => {
    for (let i = 0; i < 6; i++) {
      particles.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        color
      });
    }
  };

  const getClosestPoint = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return { x: x1 + t * dx, y: y1 + t * dy, t };
  };

  const updatePhysics = useCallback(() => {
    const b = ball.current;
    const flp = flippers.current;

    // Update Flipper Rotation
    [flp.left, flp.right].forEach((f, i) => {
      const isPressed = i === 0 ? input.current.left : input.current.right;
      f.target = isPressed ? f.up : f.base;
      const oldAngle = f.angle;
      const lerpSpeed = isPressed ? 0.7 : 0.25; 
      f.angle += (f.target - f.angle) * lerpSpeed;
      f.vel = (f.angle - oldAngle); // Store angular velocity
    });

    if (!b.active && gameState !== 'PLAYING') return;
    if (!b.active) return;

    for (let s = 0; s < SUB_STEPS; s++) {
      b.vy += GRAVITY / SUB_STEPS;
      b.vx *= Math.pow(FRICTION, 1/SUB_STEPS);
      b.vy *= Math.pow(FRICTION, 1/SUB_STEPS);
      
      b.x += b.vx / SUB_STEPS;
      b.y += b.vy / SUB_STEPS;

      // Speed capping
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (speed > MAX_SPEED) {
        b.vx = (b.vx / speed) * MAX_SPEED;
        b.vy = (b.vy / speed) * MAX_SPEED;
      }

      // Upper Dome
      const distToDome = Math.sqrt((b.x - 240)**2 + (b.y - 200)**2);
      if (distToDome > 225 && b.y < 200) {
        const nx = (240 - b.x) / distToDome;
        const ny = (200 - b.y) / distToDome;
        const dot = b.vx * nx + b.vy * ny;
        if (dot < 0) {
            b.vx -= (1 + BOUNCE) * dot * nx;
            b.vy -= (1 + BOUNCE) * dot * ny;
        }
        b.x = 240 - nx * 224;
        b.y = 200 - ny * 224;
      }

      // Walls
      walls.current.forEach(w => {
        const cp = getClosestPoint(b.x, b.y, w.x1, w.y1, w.x2, w.y2);
        const dx = b.x - cp.x;
        const dy = b.y - cp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < BALL_RADIUS) {
          const nx = dx / dist;
          const ny = dy / dist;
          const dot = b.vx * nx + b.vy * ny;
          if (dot < 0) {
            b.vx -= (1 + BOUNCE) * dot * nx;
            b.vy -= (1 + BOUNCE) * dot * ny;
          }
          b.x = cp.x + nx * BALL_RADIUS;
          b.y = cp.y + ny * BALL_RADIUS;
        }
      });

      // Bumpers
      bumpers.current.forEach(p => {
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < p.r + BALL_RADIUS) {
          const nx = dx / dist;
          const ny = dy / dist;
          const dot = b.vx * nx + b.vy * ny;
          const kick = 10;
          b.vx = (b.vx - 1.8 * dot * nx) + nx * kick;
          b.vy = (b.vy - 1.8 * dot * ny) + ny * kick;
          b.x = p.x + nx * (p.r + BALL_RADIUS + 1);
          p.pulse = 1;
          setScore(s => s + p.score);
          spawnParticles(b.x, b.y, p.color);
          shake.current = 8;
        }
      });

      // Flipper Collision - Unified Unified Logic
      [flp.left, flp.right].forEach((f, i) => {
        // Calculate current tip position based on true angle
        const tipX = f.x + Math.cos(f.angle) * f.length;
        const tipY = f.y + Math.sin(f.angle) * f.length;
        
        const cp = getClosestPoint(b.x, b.y, f.x, f.y, tipX, tipY);
        const dx = b.x - cp.x;
        const dy = b.y - cp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radiusTotal = BALL_RADIUS + f.width / 2;

        if (dist < radiusTotal) {
          const nx = dx / dist;
          const ny = dy / dist;

          // Velocity of flipper at the impact point
          const distFromPivot = cp.t * f.length;
          const fVelX = -Math.sin(f.angle) * f.vel * distFromPivot * SUB_STEPS;
          const fVelY = Math.cos(f.angle) * f.vel * distFromPivot * SUB_STEPS;

          const relVX = b.vx - fVelX;
          const relVY = b.vy - fVelY;
          const dot = relVX * nx + relVY * ny;

          if (dot < 0) {
            // Check if moving towards the flipping direction
            const isFlipping = i === 0 ? (f.vel < 0) : (f.vel > 0);
            const bounce = isFlipping ? 1.6 : FLIPPER_BOUNCE;
            
            b.vx = (b.vx - (1 + bounce) * dot * nx) + fVelX * 0.3;
            b.vy = (b.vy - (1 + bounce) * dot * ny) + fVelY * 0.3;
            
            if (isFlipping) {
                shake.current = 6;
                spawnParticles(b.x, b.y, '#00f2ff');
            }
          }

          // Force ball out of flipper geometry
          const overlap = radiusTotal - dist;
          b.x += nx * overlap;
          b.y += ny * overlap;
        }
      });
    }

    if (b.y > HEIGHT + 40) {
      setLives(l => {
        if (l <= 1) { setGameState('GAMEOVER'); return 0; }
        resetBall();
        return l - 1;
      });
    }

    if (b.active) {
      b.trail.unshift({ x: b.x, y: b.y });
      if (b.trail.length > 12) b.trail.pop();
    } else {
      b.trail = [];
    }
    
    particles.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life *= 0.92; });
    particles.current = particles.current.filter(p => p.life > 0.05);
    bumpers.current.forEach(p => p.pulse *= 0.85);
    shake.current *= 0.8;
  }, [gameState, resetBall]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    let raf;

    const render = () => {
      if (gameState === 'PLAYING') {
        updatePhysics();
        if (input.current.space && !ball.current.active) {
          setCharge(c => Math.min(c + 3, 100));
        }
      }

      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.save();
      if (shake.current > 0.5) ctx.translate((Math.random()-0.5)*shake.current, (Math.random()-0.5)*shake.current);

      walls.current.forEach(w => {
        ctx.strokeStyle = '#2a2a4a';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke();
      });

      ctx.beginPath(); 
      ctx.strokeStyle = '#2a2a4a';
      ctx.lineWidth = 4;
      ctx.arc(240, 200, 225, Math.PI, 0); 
      ctx.stroke();

      bumpers.current.forEach(p => {
        ctx.shadowBlur = 10 + p.pulse * 25;
        ctx.shadowColor = p.color;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 + p.pulse * 6;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = `${p.color}33`;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      [flippers.current.left, flippers.current.right].forEach((f) => {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.angle);
        ctx.fillStyle = '#1a1a35';
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(0, -f.width/2, f.length, f.width, f.width/2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#00f2ff';
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      });

      const b = ball.current;
      if (b.active || (!b.active && gameState === 'PLAYING')) {
        b.trail.forEach((t, i) => {
          ctx.fillStyle = `rgba(0, 242, 255, ${0.4 - i * 0.03})`;
          ctx.beginPath(); ctx.arc(t.x, t.y, BALL_RADIUS * (1 - i * 0.07), 0, Math.PI * 2); ctx.fill();
        });
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f2ff';
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      particles.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 2, 2);
      });
      ctx.globalAlpha = 1;

      ctx.restore();
      raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [gameState, updatePhysics]);

  useEffect(() => {
    const handleDown = (e) => {
      if (e.code === 'KeyZ' || e.code === 'ArrowLeft') input.current.left = true;
      if (e.code === 'KeyM' || e.code === 'ArrowRight') input.current.right = true;
      if (e.code === 'Space') input.current.space = true;
    };
    const handleUp = (e) => {
      if (e.code === 'KeyZ' || e.code === 'ArrowLeft') input.current.left = false;
      if (e.code === 'KeyM' || e.code === 'ArrowRight') input.current.right = false;
      if (e.code === 'Space') {
        input.current.space = false;
        if (!ball.current.active && gameState === 'PLAYING') {
          ball.current.active = true;
          ball.current.vy = -18 - (charge / 4);
          ball.current.vx = -1.2;
        }
      }
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => { 
        window.removeEventListener('keydown', handleDown); 
        window.removeEventListener('keyup', handleUp); 
    };
  }, [charge, gameState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#010103] text-white font-mono p-4 select-none">
      <div className="mb-4 w-[480px] flex justify-between items-end border-b border-white/5 pb-2 px-4">
        <div>
          <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest opacity-70">Data_Score</div>
          <div className="text-4xl font-black">{score.toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-pink-500 font-bold uppercase tracking-widest opacity-70">Core_Integrity</div>
          <div className="flex gap-1.5 justify-end mt-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-3.5 h-3.5 rounded-full border border-pink-500/30 ${i < lives ? 'bg-pink-500 shadow-[0_0_12px_#ec4899]' : 'bg-transparent'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-[8px] border-[#1a1a35] rounded-[40px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] bg-black">
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
        
        <div className="absolute right-4 bottom-24 w-2 h-40 bg-white/5 rounded-full overflow-hidden border border-white/10">
          <div className="w-full bg-cyan-400 absolute bottom-0 transition-all duration-75 shadow-[0_0_15px_#00f2ff]" style={{ height: `${charge}%` }} />
        </div>

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-10 z-10">
            <h1 className="text-7xl font-black italic mb-2 tracking-tighter">NEON<span className="text-cyan-400">FLUX</span></h1>
            <p className="text-white/30 text-[9px] mb-12 tracking-[0.5em]">SYSTEMS_READY_V2.0</p>
            <button 
              onClick={() => { setScore(0); setLives(3); setGameState('PLAYING'); resetBall(); }}
              className="group relative px-12 py-5 bg-transparent border border-cyan-400 text-cyan-400 font-bold uppercase transition-all hover:bg-cyan-400 hover:text-black active:scale-95"
            >
              <span className="relative z-10">Ignite Engine</span>
            </button>
            <div className="mt-12 text-[9px] text-white/20 uppercase tracking-[0.2em] leading-relaxed">
              [Z] Left Flipper • [M] Right Flipper<br/>Hold [Space] To Launch
            </div>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-10 text-center z-10">
            <div className="text-pink-500 text-xs font-bold tracking-[0.4em] mb-4 uppercase opacity-50">Session Terminated</div>
            <h2 className="text-5xl font-black italic mb-8">CONNECTION_LOST</h2>
            <div className="text-cyan-400 text-3xl font-black mb-12 tracking-wider">{score.toLocaleString()}</div>
            <button onClick={() => setGameState('MENU')} className="px-10 py-4 border border-white/20 text-white/80 font-bold uppercase hover:bg-white hover:text-black transition-all text-sm">Reconnect</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;