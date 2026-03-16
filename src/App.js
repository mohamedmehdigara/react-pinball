import React, { useState, useEffect, useRef, useCallback } from 'react';

/** --- CONFIG & CONSTANTS --- */
const WIDTH = 480;
const HEIGHT = 800;
const BALL_RADIUS = 9;
const PADDLE_Y = 730;
const PADDLE_LEN = 105; 
const GRAVITY = 0.55;
const FRICTION = 0.994;
const SUB_STEPS = 12; // High-precision sub-stepping

const usePinballEngine = (onScore, onLifeLost, onCombo, onMultiBall) => {
  const balls = useRef([{ 
    x: 455, y: 750, vx: 0, vy: 0, 
    active: true, inLane: true, 
    trail: [], spin: 0, id: Math.random() 
  }]);
  const screenShake = useRef(0);
  const comboCounter = useRef(0);
  const lastHitTime = useRef(0);
  const particles = useRef([]); 
  const inputState = useRef({ Left: false, Right: false, Space: false });
  
  const flippers = useRef({
    left: { angle: 0.4, target: 0.4, base: 0.4, up: -0.6, x: 105, isLeft: true },
    right: { angle: -0.4, target: -0.4, base: -0.4, up: 0.6, x: 345, isLeft: false }
  });

  const bumpers = useRef([
    { x: 140, y: 160, r: 35, color: '#ff00ff', pulse: 0, type: 'BUMPER' },
    { x: 340, y: 160, r: 35, color: '#ff00ff', pulse: 0, type: 'BUMPER' },
    { x: 240, y: 310, r: 45, color: '#00ffff', pulse: 0, type: 'BUMPER' },
    // Slingshots (Triangular kickers)
    { x1: 60, y1: 600, x2: 100, y2: 680, x3: 60, y3: 680, color: '#ffff00', pulse: 0, type: 'SLINGSHOT', side: 'left' },
    { x1: 420, y1: 600, x2: 380, y2: 680, x3: 420, y3: 680, color: '#ffff00', pulse: 0, type: 'SLINGSHOT', side: 'right' }
  ]);

  const createSparks = (x, y, color, count = 12) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1.0,
        color
      });
    }
  };

  const physicsStep = useCallback((dt) => {
    // Particle Physics
    particles.current.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.2;
      p.life *= 0.94;
    });
    particles.current = particles.current.filter(p => p.life > 0.05);

    balls.current.forEach((b) => {
      if (!b.active) return;

      b.vy += GRAVITY * dt;
      b.vx *= Math.pow(FRICTION, dt);
      b.vy *= Math.pow(FRICTION, dt);

      // Launcher Lane Logic
      if (b.inLane) {
        if (b.y < 200) b.inLane = false;
        b.x = 455;
        if (b.y > 760) { b.y = 760; b.vy = 0; }
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Table Geometry (Implicit walls)
      const margin = 20 + BALL_RADIUS;
      const laneWall = 435 - BALL_RADIUS;
      
      if (b.x < margin) { b.x = margin; b.vx *= -0.6; b.spin += b.vy * 0.1; }
      if (b.x > WIDTH - margin) { b.x = WIDTH - margin; b.vx *= -0.6; b.spin -= b.vy * 0.1; }
      if (!b.inLane && b.x > laneWall && b.y > 200) { b.x = laneWall; b.vx *= -0.6; }
      if (b.y < margin) { b.y = margin; b.vy *= -0.6; }

      // Top Arc Collision
      if (b.y < 250) {
        const dx = b.x - 240, dy = b.y - 250;
        const dist = Math.hypot(dx, dy);
        if (dist > 220 && b.x < 430) {
          const nx = -dx/dist, ny = -dy/dist;
          const dot = b.vx * nx + b.vy * ny;
          b.vx -= 1.8 * dot * nx; b.vy -= 1.8 * dot * ny;
          b.x = 240 - nx * 219; b.y = 250 - ny * 219;
        }
      }

      // Flipper Collision (CCD - Continuous Collision Detection)
      const checkFlipper = (f) => {
        const isDown = f.isLeft ? inputState.current.Left : inputState.current.Right;
        f.target = isDown ? f.up : f.base;
        const oldAngle = f.angle;
        f.angle += (f.target - f.angle) * 0.5;
        const angVel = (f.angle - oldAngle) / dt;

        const x1 = f.x, y1 = PADDLE_Y;
        const len = f.isLeft ? PADDLE_LEN : -PADDLE_LEN;
        const x2 = x1 + Math.cos(f.angle) * len, y2 = y1 + Math.sin(f.angle) * len;

        const dx = x2 - x1, dy = y2 - y1;
        const l2 = dx*dx + dy*dy;
        let t = ((b.x - x1) * dx + (b.y - y1) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        const px = x1 + t * dx, py = y1 + t * dy;
        const dist = Math.hypot(b.x - px, b.y - py);

        if (dist < BALL_RADIUS + 8) {
          const normal = f.angle + (f.isLeft ? -Math.PI/2 : Math.PI/2);
          const nx = Math.cos(normal), ny = Math.sin(normal);
          const kick = Math.abs(angVel) * 15 + 8;
          
          b.vx = (b.vx - 2 * (b.vx * nx + b.vy * ny) * nx) + nx * kick;
          b.vy = (b.vy - 2 * (b.vx * nx + b.vy * ny) * ny) * 0.4 + ny * kick;
          b.x = px + nx * (BALL_RADIUS + 9);
          b.y = py + ny * (BALL_RADIUS + 9);
          if (Math.abs(angVel) > 0.05) screenShake.current = 10;
        }
      };
      checkFlipper(flippers.current.left);
      checkFlipper(flippers.current.right);

      // Bumper & Slingshot Logic
      bumpers.current.forEach(obj => {
        if (obj.type === 'BUMPER') {
          const dist = Math.hypot(b.x - obj.x, b.y - obj.y);
          if (dist < BALL_RADIUS + obj.r) {
            const nx = (b.x - obj.x) / dist, ny = (b.y - b.y) / dist; // Simple radial bounce
            b.vx = (b.x - obj.x) / dist * 18;
            b.vy = (b.y - obj.y) / dist * 18;
            obj.pulse = 1.0;
            screenShake.current = 15;
            createSparks(b.x, b.y, obj.color);
            handleScore(100, obj.color);
          }
        } else if (obj.type === 'SLINGSHOT') {
          // Simplified triangle proximity
          const midX = (obj.x1 + obj.x2) / 2;
          const midY = (obj.y1 + obj.y2) / 2;
          const dist = Math.hypot(b.x - midX, b.y - midY);
          if (dist < 40) {
            const nx = obj.side === 'left' ? 1 : -1;
            b.vx = nx * 20; b.vy = -5;
            obj.pulse = 1.0;
            screenShake.current = 8;
            createSparks(b.x, b.y, obj.color, 5);
            handleScore(50, obj.color);
          }
        }
      });

      if (b.y > HEIGHT + 50) {
        b.active = false;
        const activeCount = balls.current.filter(bl => bl.active).length;
        if (activeCount === 0) onLifeLost();
      }
    });

    screenShake.current *= 0.85;
  }, [onScore, onLifeLost, onCombo]);

  const handleScore = (val, color) => {
    const now = Date.now();
    if (now - lastHitTime.current < 1000) {
      comboCounter.current++;
    } else {
      comboCounter.current = 1;
    }
    lastHitTime.current = now;
    onScore(val * comboCounter.current);
    onCombo(comboCounter.current);
    
    // Multi-ball trigger on high combo
    if (comboCounter.current === 15) {
      balls.current.push({ 
        x: 240, y: 400, vx: 10, vy: -10, 
        active: true, inLane: false, 
        trail: [], spin: 0, id: Math.random() 
      });
      onMultiBall();
    }
  };

  return { balls, flippers, bumpers, physicsStep, inputState, particles, screenShake };
};

const App = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('MENU');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(1);
  const [charge, setCharge] = useState(0);

  const { balls, flippers, bumpers, physicsStep, inputState, particles, screenShake } = usePinballEngine(
    (s) => setScore(prev => prev + s),
    () => setLives(l => l > 1 ? l - 1 : (setGameState('GAMEOVER'), 0)),
    (c) => setCombo(c),
    () => {} // Multi-ball callback
  );

  useEffect(() => {
    const handleKey = (e, down) => {
      if (e.code === 'KeyZ' || e.code === 'ArrowLeft') inputState.current.Left = down;
      if (e.code === 'KeyM' || e.code === 'ArrowRight') inputState.current.Right = down;
      if (e.code === 'Space') {
        inputState.current.Space = down;
        if (!down) {
          const b = balls.current.find(b => b.inLane && b.active);
          if (b) { b.vy = -(charge * 0.5 + 12); setCharge(0); }
        }
      }
    };
    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
    };
  }, [charge, balls]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    let raf;

    const render = () => {
      if (gameState === 'PLAYING') {
        if (inputState.current.Space) setCharge(c => Math.min(c + 2, 70));
        for (let i = 0; i < SUB_STEPS; i++) physicsStep(1 / SUB_STEPS);
      }

      // Background
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Camera Perspective
      ctx.save();
      if (screenShake.current > 0.1) {
        ctx.translate((Math.random()-0.5)*screenShake.current, (Math.random()-0.5)*screenShake.current);
      }

      // Grid
      ctx.strokeStyle = '#00f2ff11';
      ctx.lineWidth = 1;
      for(let i=0; i<WIDTH; i+=50) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, HEIGHT); ctx.stroke(); }
      for(let i=0; i<HEIGHT; i+=50) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(WIDTH, i); ctx.stroke(); }

      // Elements
      bumpers.current.forEach(obj => {
        ctx.shadowBlur = 15 + obj.pulse * 20;
        ctx.shadowColor = obj.color;
        ctx.strokeStyle = obj.color;
        ctx.lineWidth = 3 + obj.pulse * 5;

        if (obj.type === 'BUMPER') {
          ctx.beginPath(); ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI*2); ctx.stroke();
          ctx.fillStyle = obj.pulse > 0.1 ? '#fff' : '#000';
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(obj.x1, obj.y1); ctx.lineTo(obj.x2, obj.y2); ctx.lineTo(obj.x3, obj.y3); ctx.closePath();
          ctx.stroke();
          ctx.fillStyle = obj.pulse > 0.1 ? '#fff' : '#111';
          ctx.fill();
        }
        obj.pulse *= 0.9;
      });

      // Sparks
      particles.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
      });
      ctx.globalAlpha = 1;

      // Flippers
      const drawF = (f) => {
        ctx.save();
        ctx.translate(f.x, PADDLE_Y);
        ctx.rotate(f.angle);
        const isActive = f.isLeft ? inputState.current.Left : inputState.current.Right;
        ctx.fillStyle = isActive ? '#fff' : '#111';
        ctx.shadowBlur = isActive ? 30 : 5;
        ctx.shadowColor = '#00f2ff';
        const l = f.isLeft ? PADDLE_LEN : -PADDLE_LEN;
        ctx.beginPath(); ctx.roundRect(0, -10, l, 20, 10); ctx.fill();
        ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      };
      drawF(flippers.current.left);
      drawF(flippers.current.right);

      // Balls
      balls.current.forEach(b => {
        if (!b.active) return;
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 15) b.trail.shift();

        // Speed Blur / Trail
        ctx.beginPath();
        b.trail.forEach((t, i) => {
          ctx.lineTo(t.x, t.y);
          ctx.strokeStyle = `rgba(0, 242, 255, ${i/30})`;
          ctx.lineWidth = (i/15) * BALL_RADIUS * 2;
        });
        ctx.stroke();

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.spin * 0.1);
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 15; ctx.shadowColor = '#00f2ff';
        ctx.beginPath(); ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI*2); ctx.fill();
        // Inner detail for spin
        ctx.fillStyle = '#00f2ff';
        ctx.fillRect(-2, -BALL_RADIUS, 4, BALL_RADIUS*2);
        ctx.restore();
      });

      // Table Borders
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#222'; ctx.lineWidth = 20;
      ctx.strokeRect(10, 10, WIDTH-20, HEIGHT-20);
      ctx.beginPath(); ctx.moveTo(435, 200); ctx.lineTo(435, HEIGHT); ctx.stroke();

      ctx.restore();

      // CRT Scanlines
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      for(let i=0; i<HEIGHT; i+=4) ctx.fillRect(0, i, WIDTH, 1);

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [gameState, physicsStep, balls]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020205] text-white p-4 font-sans select-none overflow-hidden">
      <div className="w-[480px] flex justify-between items-end mb-6">
        <div>
          <p className="text-[10px] text-cyan-500 font-bold tracking-[0.3em] uppercase mb-1">Neural Interface Active</p>
          <h1 className="text-6xl font-black italic tracking-tighter text-white">
            {score.toLocaleString()}
          </h1>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black italic text-rose-500 animate-pulse">
            {combo > 1 ? `x${combo}` : ''}
          </div>
          <div className="flex gap-2 mt-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full ${i < lives ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-zinc-800'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-[1px] border-zinc-800 rounded-3xl shadow-[0_0_100px_rgba(0,242,255,0.1)] overflow-hidden">
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="bg-black block" />
        
        {/* UI Overlays */}
        {charge > 0 && (
          <div className="absolute bottom-10 right-4 w-2 h-40 bg-zinc-900 rounded-full flex flex-col-reverse overflow-hidden border border-zinc-700">
            <div className="bg-cyan-400 w-full transition-all duration-75" style={{ height: `${(charge/70)*100}%` }} />
          </div>
        )}

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-[#000000ee] flex flex-col items-center justify-center text-center p-12">
            <div className="mb-8 space-y-[-15px]">
              <h2 className="text-8xl font-black italic tracking-tighter text-white">NEON</h2>
              <h2 className="text-6xl font-black italic tracking-widest text-cyan-500">PULSE</h2>
            </div>
            <button 
              onClick={() => { setScore(0); setLives(3); setGameState('PLAYING'); }}
              className="group relative px-16 py-6 bg-white text-black font-black text-2xl rounded-xl hover:scale-110 transition-transform active:scale-95"
            >
              START MISSION
            </button>
            <div className="mt-12 grid grid-cols-2 gap-8 text-[10px] font-bold text-zinc-500 tracking-widest">
              <div>[Z] LEFT FLIPPER</div>
              <div>[M] RIGHT FLIPPER</div>
              <div className="col-span-2">[SPACE] PLUNGER CHARGE</div>
            </div>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-md flex flex-col items-center justify-center p-12">
            <h3 className="text-7xl font-black italic text-white mb-4">HALT</h3>
            <p className="text-rose-400 font-bold tracking-[0.5em] mb-12">CORE DE-STABILIZED</p>
            <div className="text-4xl font-black mb-12 text-white">{score.toLocaleString()}</div>
            <button 
              onClick={() => setGameState('MENU')}
              className="w-full py-6 bg-white text-black font-black rounded-xl hover:bg-rose-500 hover:text-white transition-colors"
            >
              RE-INITIALIZE
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-zinc-800 text-[9px] font-black uppercase tracking-[0.4em]">
        Elite Physical Engine • Multi-Ball Enabled • No Cloud Latency
      </div>
    </div>
  );
};

export default App;