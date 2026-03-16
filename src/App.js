import React, { useState, useEffect, useRef, useCallback } from 'react';

/** * --- CONSTANTS & CONFIG --- */
const WIDTH = 480;
const HEIGHT = 800;
const BALL_RADIUS = 10;
const PADDLE_Y = 700;
const PADDLE_LEN = 110; 
const GRAVITY = 0.5;
const FRICTION = 0.995;
const SUB_STEPS = 12; // 720Hz Physics Precision

const usePinballEngine = (onScore, onLifeLost) => {
  const ball = useRef({ x: 455, y: 750, vx: 0, vy: 0, active: false, inLane: true, trail: [] });
  
  // Input buffer supporting multiple keys for the same action
  const inputState = useRef({ 
    Left: false,   // ArrowLeft or KeyZ
    Right: false,  // ArrowRight or KeyM
    Space: false 
  });
  
  const flippers = useRef({
    left: { angle: 0.4, target: 0.4, base: 0.4, up: -0.6, x: 110, isLeft: true },
    right: { angle: -0.4, target: -0.4, base: -0.4, up: 0.6, x: 340, isLeft: false }
  });

  const bumpers = useRef([
    { x: 150, y: 200, r: 35, color: '#ff007b', hit: 0, score: 100 },
    { x: 330, y: 200, r: 35, color: '#ff007b', hit: 0, score: 100 },
    { x: 240, y: 350, r: 45, color: '#00f2ff', hit: 0, score: 250 },
    { x: 80, y: 450, r: 25, color: '#7000ff', hit: 0, score: 50 },
    { x: 400, y: 450, r: 25, color: '#7000ff', hit: 0, score: 50 },
  ]);

  const physicsStep = useCallback((dt) => {
    const b = ball.current;
    if (!b.active) return;

    // Apply Forces
    b.vy += GRAVITY * dt;
    b.vx *= Math.pow(FRICTION, dt);
    b.vy *= Math.pow(FRICTION, dt);

    // Launcher Logic
    if (b.inLane) {
      if (b.y < 150) b.inLane = false;
      if (b.inLane) {
        b.x = 455;
        if (b.y > 750) { b.y = 750; b.vy = 0; }
      }
    }

    // Step Movement
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Boundary Collisions
    const leftWall = 20;
    const rightWall = b.inLane ? 475 : 440;
    if (b.x < leftWall + BALL_RADIUS) { b.x = leftWall + BALL_RADIUS; b.vx = Math.abs(b.vx) * 0.5; }
    if (b.x > rightWall - BALL_RADIUS) { b.x = rightWall - BALL_RADIUS; b.vx = -Math.abs(b.vx) * 0.5; }
    if (b.y < 20 + BALL_RADIUS) { b.y = 20 + BALL_RADIUS; b.vy = Math.abs(b.vy) * 0.5; }

    // Flipper Physics
    const processFlipper = (f) => {
      const isPressed = f.isLeft ? inputState.current.Left : inputState.current.Right;
      f.target = isPressed ? f.up : f.base;
      
      const oldAngle = f.angle;
      const snap = isPressed ? 0.7 : 0.3;
      f.angle += (f.target - f.angle) * snap;

      const x1 = f.x;
      const y1 = PADDLE_Y;
      const length = f.isLeft ? PADDLE_LEN : -PADDLE_LEN;
      const x2 = x1 + Math.cos(f.angle) * length;
      const y2 = y1 + Math.sin(f.angle) * length;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const l2 = dx * dx + dy * dy;
      let t = ((b.x - x1) * dx + (b.y - y1) * dy) / l2;
      t = Math.max(0, Math.min(1, t));
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      const dist = Math.hypot(b.x - px, b.y - py);

      const padding = 14; 
      if (dist < BALL_RADIUS + padding) {
        const isFlicking = Math.abs(f.angle - oldAngle) > 0.001 && isPressed;
        const normalAngle = f.angle + (f.isLeft ? -Math.PI / 2 : Math.PI / 2);
        const nx = Math.cos(normalAngle);
        const ny = Math.sin(normalAngle);

        const dot = b.vx * nx + b.vy * ny;
        if (dot < 0 || isFlicking) {
          const boost = isFlicking ? 28 : 8; 
          b.vx = (b.vx - 2 * dot * nx) + nx * boost;
          b.vy = (b.vy - 2 * dot * ny) * 0.6 + ny * boost;
          onScore(10);
        }
        
        b.x = px + nx * (BALL_RADIUS + padding + 1);
        b.y = py + ny * (BALL_RADIUS + padding + 1);
      }
    };

    processFlipper(flippers.current.left);
    processFlipper(flippers.current.right);

    // Bumper Collisions
    bumpers.current.forEach(bmp => {
      const dist = Math.hypot(b.x - bmp.x, b.y - bmp.y);
      if (dist < BALL_RADIUS + bmp.r) {
        const nx = (b.x - bmp.x) / dist;
        const ny = (b.y - bmp.y) / dist;
        b.vx = nx * 18;
        b.vy = ny * 18;
        b.x = bmp.x + nx * (BALL_RADIUS + bmp.r + 2);
        b.y = bmp.y + ny * (BALL_RADIUS + bmp.r + 2);
        bmp.hit = 1.0;
        onScore(bmp.score);
      }
    });

    if (b.y > HEIGHT + 50) {
      b.active = false;
      onLifeLost();
    }
  }, [onScore, onLifeLost]);

  return { ball, flippers, bumpers, physicsStep, inputState };
};

const App = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('MENU');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [plungerPower, setPlungerPower] = useState(0);
  
  const { ball, flippers, bumpers, physicsStep, inputState } = usePinballEngine(
    (pts) => setScore(s => s + pts),
    () => {
      setLives(l => {
        if (l <= 1) {
          setGameState('GAMEOVER');
          return 0;
        }
        ball.current = { x: 455, y: 750, vx: 0, vy: 0, active: true, inLane: true, trail: [] };
        return l - 1;
      });
    }
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyZ') inputState.current.Left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyM') inputState.current.Right = true;
      if (e.code === 'Space') inputState.current.Space = true;
      
      // Prevent scrolling with arrows/space
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyZ') inputState.current.Left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyM') inputState.current.Right = false;
      if (e.code === 'Space') {
        if (ball.current.inLane && ball.current.active) {
          ball.current.vy = - (plungerPower * 0.7 + 10);
          setPlungerPower(0);
        }
        inputState.current.Space = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [plungerPower]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d', { alpha: false });
    let raf;

    const renderLoop = () => {
      if (gameState === 'PLAYING') {
        if (inputState.current.Space && ball.current.inLane) {
          setPlungerPower(p => Math.min(p + 1.8, 55));
        }
        for (let i = 0; i < SUB_STEPS; i++) physicsStep(1 / SUB_STEPS);

        if (ball.current.active) {
          ball.current.trail.push({ x: ball.current.x, y: ball.current.y });
          if (ball.current.trail.length > 8) ball.current.trail.shift();
        }
      }

      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Grid
      ctx.strokeStyle = '#101030';
      ctx.lineWidth = 1;
      for(let x=0; x<WIDTH; x+=40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke(); }
      for(let y=0; y<HEIGHT; y+=40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke(); }

      // Bumpers
      bumpers.current.forEach(bmp => {
        ctx.shadowBlur = bmp.hit * 30;
        ctx.shadowColor = bmp.color;
        ctx.fillStyle = bmp.hit > 0.5 ? '#fff' : bmp.color;
        ctx.beginPath(); ctx.arc(bmp.x, bmp.y, bmp.r, 0, Math.PI * 2); ctx.fill();
        bmp.hit *= 0.9;
      });
      ctx.shadowBlur = 0;

      // Ball
      ball.current.trail.forEach((t, i) => {
        ctx.fillStyle = `rgba(0, 242, 255, ${i / 10})`;
        ctx.beginPath(); ctx.arc(t.x, t.y, BALL_RADIUS * (i / 8), 0, Math.PI * 2); ctx.fill();
      });

      if (ball.current.active) {
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
        ctx.beginPath(); ctx.arc(ball.current.x, ball.current.y, BALL_RADIUS, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Flippers
      const drawFlipper = (f) => {
        ctx.save();
        ctx.translate(f.x, PADDLE_Y);
        ctx.rotate(f.angle);
        const active = f.isLeft ? inputState.current.Left : inputState.current.Right;
        ctx.fillStyle = active ? '#00f2ff' : '#0044cc';
        ctx.shadowBlur = active ? 15 : 0;
        ctx.shadowColor = '#00f2ff';
        const len = f.isLeft ? PADDLE_LEN : -PADDLE_LEN;
        ctx.beginPath();
        ctx.roundRect(0, -12, len, 24, 12);
        ctx.fill();
        ctx.restore();
      };
      drawFlipper(flippers.current.left);
      drawFlipper(flippers.current.right);

      // Walls
      ctx.strokeStyle = '#222266';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, WIDTH-8, HEIGHT-8);
      ctx.beginPath(); ctx.moveTo(445, 150); ctx.lineTo(445, HEIGHT); ctx.stroke();

      raf = requestAnimationFrame(renderLoop);
    };

    raf = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(raf);
  }, [gameState, physicsStep]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 select-none">
      <div className="w-[480px] flex justify-between items-end mb-4 bg-zinc-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-lg">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Score</p>
          <p className="text-4xl font-black text-cyan-400 font-mono tracking-tighter">{score.toLocaleString()}</p>
        </div>
        <div className="flex gap-3 mb-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${i < lives ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-zinc-800'}`} />
          ))}
        </div>
      </div>

      <div className="relative rounded-[40px] border-[12px] border-zinc-800 shadow-2xl overflow-hidden">
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="bg-black" />

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center">
            <h1 className="text-6xl font-black italic tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">NEON PIN</h1>
            <button 
              onClick={() => { setScore(0); setLives(3); setGameState('PLAYING'); ball.current.active = true; }}
              className="px-12 py-4 bg-cyan-500 text-black font-black text-xl rounded-2xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(6,182,212,0.4)]"
            >
              LAUNCH MISSION
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
            <h2 className="text-4xl font-black text-rose-500 mb-2">MISSION FAILED</h2>
            <p className="text-xl font-bold mb-8">{score.toLocaleString()} PTS</p>
            <button 
              onClick={() => setGameState('MENU')}
              className="px-8 py-3 bg-white text-black font-bold rounded-xl"
            >
              RETRY
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-8 w-full max-w-[480px]">
        <div className="text-center">
          <p className="text-[10px] text-zinc-600 font-bold uppercase mb-2">Left</p>
          <div className="w-12 h-12 mx-auto bg-zinc-900 border-2 border-zinc-700 rounded-xl flex items-center justify-center font-black text-cyan-400 text-xl">←</div>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-zinc-600 font-bold uppercase mb-2">Plunger</p>
          <div className="h-12 px-4 mx-auto bg-zinc-900 border-2 border-zinc-700 rounded-xl flex items-center justify-center font-black text-white text-xs">SPACE</div>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-zinc-600 font-bold uppercase mb-2">Right</p>
          <div className="w-12 h-12 mx-auto bg-zinc-900 border-2 border-zinc-700 rounded-xl flex items-center justify-center font-black text-cyan-400 text-xl">→</div>
        </div>
      </div>
    </div>
  );
};

export default App;