import React, { useRef, useEffect, useState } from 'react';

/**
 * Arcade Ultra Pinball - Visual & UX Overhaul
 * Enhanced with High-DPI Support, Dynamic Lighting, and Motion Trails.
 */
const App = () => {
  const canvasRef = useRef(null);

  // --- Game State ---
  const [gameState, setGameState] = useState('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isTilted, setTilt] = useState(false);
  const [nudgeCount, setNudgeCount] = useState(0);
  const [plungerPosition, setPlungerPosition] = useState(0);
  const [shake, setShake] = useState(0);

  // --- Refs for Physics Engine ---
  const ballsRef = useRef([]);
  const particlesRef = useRef([]);
  const flippersRef = useRef({
    leftAngle: Math.PI / 6,
    rightAngle: -Math.PI / 6,
    isLeftFlipping: false,
    isRightFlipping: false
  });

  // --- Game Constants ---
  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 700;
  const FLIPPER_LENGTH = 85;
  const FLIPPER_WIDTH = 14;
  const FLIPPER_ANGLE_DEFAULT = Math.PI / 6;
  const FLIPPER_ANGLE_UP = -Math.PI / 4;
  const GRAVITY = 0.3;
  const BUMPER_ELASTICITY = 1.45;
  const WALL_ELASTICITY = 0.7;
  const FRICTION = 0.994;

  const gameElements = [
    { id: 'Pop Bumper 1', x: 150, y: 180, radius: 35, color: '#ff0055', score: 100, type: 'bumper' },
    { id: 'Pop Bumper 2', x: 350, y: 180, radius: 35, color: '#ff0055', score: 100, type: 'bumper' },
    { id: 'Whirlpool', x: 250, y: 80, radius: 40, color: '#7000ff', score: 500, type: 'whirlpool' },
    { id: 'Slingshot L', x: 100, y: 500, radius: 20, color: '#00d4ff', score: 50, type: 'slingshot' },
    { id: 'Slingshot R', x: 400, y: 500, radius: 20, color: '#00d4ff', score: 50, type: 'slingshot' },
    { id: 'Central Target', x: 250, y: 320, radius: 25, color: '#ffcc00', score: 250, type: 'bumper' },
  ];

  // --- Actions ---
  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setTilt(false);
    setNudgeCount(0);
    ballsRef.current = [];
    particlesRef.current = [];
  };

  const createParticles = (x, y, color) => {
    for (let i = 0; i < 12; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1.0,
        color
      });
    }
  };

  const checkFlipperCollision = (ball, fX, fY, fAngle, isLeft) => {
    const start = { x: fX, y: fY };
    const end = {
      x: fX + (isLeft ? 1 : -1) * FLIPPER_LENGTH * Math.cos(fAngle),
      y: fY + (isLeft ? 1 : -1) * FLIPPER_LENGTH * Math.sin(fAngle)
    };
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const l2 = dx * dx + dy * dy;
    let t = ((ball.x - start.x) * dx + (ball.y - start.y) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const closest = { x: start.x + t * dx, y: start.y + t * dy };
    const distDx = ball.x - closest.x;
    const distDy = ball.y - closest.y;
    const distance = Math.sqrt(distDx * distDx + distDy * distDy);

    return {
      collided: distance < ball.radius + FLIPPER_WIDTH / 2,
      normalX: distDx / distance,
      normalY: distDy / distance,
      t
    };
  };

  // --- Input ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isTilted || gameState !== 'PLAYING') return;
      const key = e.key.toLowerCase();
      if (key === 'z') flippersRef.current.isLeftFlipping = true;
      if (key === 'm') flippersRef.current.isRightFlipping = true;
      if (key === ' ' && ballsRef.current.length === 0) {
        setPlungerPosition(p => Math.min(p + 5, 60));
      }
      if (['arrowleft', 'arrowright', 'arrowup'].includes(key)) {
        setNudgeCount(n => {
          if (n >= 5) { setTilt(true); return n; }
          ballsRef.current.forEach(b => {
            b.vx += key === 'arrowleft' ? -3 : (key === 'arrowright' ? 3 : 0);
            b.vy += key === 'arrowup' ? -3 : 0;
          });
          setShake(15);
          return n + 1;
        });
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'z') flippersRef.current.isLeftFlipping = false;
      if (key === 'm') flippersRef.current.isRightFlipping = false;
      if (key === ' ' && gameState === 'PLAYING' && ballsRef.current.length === 0) {
        setPlungerPosition(curr => {
          if (curr > 10) {
            ballsRef.current = [{
              x: 475, y: 650, radius: 10, vx: 0, vy: -curr / 1.8, isLaunched: true, color: '#ffffff', trail: []
            }];
          }
          return 0;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, isTilted]);

  // --- Game Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // High DPI Scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    let animationId;

    const update = () => {
      if (gameState !== 'PLAYING') return;

      const flips = flippersRef.current;
      const targetLeft = flips.isLeftFlipping ? FLIPPER_ANGLE_UP : FLIPPER_ANGLE_DEFAULT;
      const targetRight = flips.isRightFlipping ? -FLIPPER_ANGLE_UP : -FLIPPER_ANGLE_DEFAULT;
      flips.leftAngle += (targetLeft - flips.leftAngle) * 0.45;
      flips.rightAngle += (targetRight - flips.rightAngle) * 0.45;

      if (isTilted) return;

      particlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      setShake(s => Math.max(0, s * 0.85));

      ballsRef.current.forEach((ball) => {
        // Trail update
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 8) ball.trail.shift();

        ball.vy += GRAVITY;
        ball.vx *= FRICTION;
        ball.vy *= FRICTION;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collisions
        if (ball.x + ball.radius > CANVAS_WIDTH) { ball.vx *= -WALL_ELASTICITY; ball.x = CANVAS_WIDTH - ball.radius; }
        else if (ball.x - ball.radius < 0) { ball.vx *= -WALL_ELASTICITY; ball.x = ball.radius; }
        if (ball.y - ball.radius < 0) { ball.vy *= -WALL_ELASTICITY; ball.y = ball.radius; }

        // Element collisions
        gameElements.forEach(el => {
          const dx = ball.x - el.x;
          const dy = ball.y - el.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < ball.radius + el.radius) {
            const nx = dx / dist;
            const ny = dy / dist;
            const dot = ball.vx * nx + ball.vy * ny;
            
            ball.vx = (ball.vx - 2 * dot * nx) * (el.type === 'whirlpool' ? 0.3 : BUMPER_ELASTICITY);
            ball.vy = (ball.vy - 2 * dot * ny) * (el.type === 'whirlpool' ? 0.3 : BUMPER_ELASTICITY);
            ball.x += nx * ((ball.radius + el.radius) - dist);
            ball.y += ny * ((ball.radius + el.radius) - dist);

            setScore(s => s + el.score);
            createParticles(el.x, el.y, el.color);
            setShake(10);

            if (el.type === 'whirlpool' && ballsRef.current.length < 2) {
              setTimeout(() => {
                ballsRef.current.push({
                  x: el.x, y: el.y, radius: 10, vx: 6, vy: 6, isLaunched: true, color: '#fbbf24', trail: []
                });
              }, 100);
            }
          }
        });

        // Flipper collisions
        const fData = [{ x: 135, y: 645, a: flips.leftAngle, l: true }, { x: 325, y: 645, a: flips.rightAngle, l: false }];
        fData.forEach(f => {
          const col = checkFlipperCollision(ball, f.x, f.y, f.a, f.l);
          if (col.collided) {
            const flipping = f.l ? flips.isLeftFlipping : flips.isRightFlipping;
            const power = flipping ? 16 : 2;
            ball.vx = col.normalX * power * (1 + col.t);
            ball.vy = col.normalY * power * (1 + col.t);
            ball.x += col.normalX * 10;
            ball.y += col.normalY * 10;
            setScore(s => s + 25);
            setShake(5);
          }
        });
      });

      const remainingBalls = ballsRef.current.filter(b => b.y - b.radius < CANVAS_HEIGHT);
      if (ballsRef.current.length > 0 && remainingBalls.length === 0) {
        setGameState('GAMEOVER');
        setHighScore(prev => Math.max(prev, score));
      }
      ballsRef.current = remainingBalls;
    };

    const draw = () => {
      const flips = flippersRef.current;
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

      // Deep Space BG
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Neon Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for(let i=0; i<CANVAS_WIDTH; i+=50) {
        ctx.globalAlpha = i % 100 === 0 ? 0.2 : 0.05;
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // Draw Elements with Lighting
      gameElements.forEach(el => {
        ctx.save();
        ctx.shadowBlur = 25;
        ctx.shadowColor = el.color;
        
        const grad = ctx.createRadialGradient(el.x, el.y, 2, el.x, el.y, el.radius);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.3, el.color);
        grad.addColorStop(1, '#000');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });

      // Particles
      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Plunger
      ctx.fillStyle = '#475569';
      ctx.fillRect(470, 620 + plungerPosition, 20, 80);

      // Flippers
      const drawF = (x, y, a, l) => {
        ctx.save();
        ctx.translate(x, y); ctx.rotate(a);
        ctx.shadowBlur = 15; ctx.shadowColor = '#3b82f6';
        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath(); 
        ctx.roundRect(0, -FLIPPER_WIDTH/2, l ? FLIPPER_LENGTH : -FLIPPER_LENGTH, FLIPPER_WIDTH, [10]);
        ctx.fill(); ctx.stroke();
        ctx.restore();
      };
      drawF(135, 645, flips.leftAngle, true);
      drawF(325, 645, flips.rightAngle, false);

      // Balls & Trails
      ballsRef.current.forEach(b => {
        // Trail
        b.trail.forEach((t, i) => {
          ctx.globalAlpha = i / b.trail.length * 0.4;
          ctx.fillStyle = b.color;
          ctx.beginPath(); ctx.arc(t.x, t.y, b.radius * (i / b.trail.length), 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Lighting Effect (Glow on board)
        const ballGlow = ctx.createRadialGradient(b.x, b.y, b.radius, b.x, b.y, b.radius * 4);
        ballGlow.addColorStop(0, (isTilted ? '#f43f5e33' : b.color + '33'));
        ballGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = ballGlow;
        ctx.fillRect(b.x - 50, b.y - 50, 100, 100);

        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = isTilted ? '#f43f5e' : b.color;
        ctx.fillStyle = isTilted ? '#f43f5e' : b.color;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Glass Cover Reflection
      const glassGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      glassGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
      glassGrad.addColorStop(0.4, 'transparent');
      glassGrad.addColorStop(1, 'rgba(255,255,255,0.08)');
      ctx.fillStyle = glassGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.restore();
    };

    const loop = () => { update(); draw(); animationId = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [gameState, isTilted, score, shake, plungerPosition]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 font-sans select-none overflow-hidden">
      {/* Visual Header */}
      <div className="mb-6 text-center">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_30px_rgba(6,182,212,0.6)]">
          ULTRA PIN
        </h1>
        <div className="flex justify-center gap-12 mt-4">
          <div className="text-center group">
            <p className="text-[10px] uppercase text-slate-500 font-black tracking-[0.3em] group-hover:text-cyan-400 transition-colors">Score</p>
            <p className="text-4xl font-mono font-bold text-white leading-none">{score.toLocaleString()}</p>
          </div>
          <div className="text-center group">
            <p className="text-[10px] uppercase text-slate-500 font-black tracking-[0.3em] group-hover:text-purple-400 transition-colors">Record</p>
            <p className="text-4xl font-mono font-bold text-white leading-none">{highScore.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Main Cabinet Frame */}
      <div className="relative border-[14px] border-slate-900 rounded-[54px] overflow-hidden shadow-[0_0_120px_rgba(59,130,246,0.25)] bg-slate-950 p-1">
        <canvas ref={canvasRef} style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }} className="max-w-full h-auto cursor-none block" />
        
        {/* Overlay Layers */}
        {gameState === 'START' && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-700">
            <div className="w-32 h-32 bg-cyan-500/20 rounded-full animate-pulse absolute" />
            <h2 className="text-6xl font-black text-white mb-6 z-10 tracking-tight">READY PILOT?</h2>
            <p className="text-slate-400 text-lg mb-12 max-w-xs z-10 font-medium">
              Launch the ball into the <span className="text-purple-400">Whirlpool</span> to trigger Multi-Ball mode.
            </p>
            <button 
              onClick={startGame}
              className="z-10 group relative px-16 py-5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-2xl rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-[0_20px_50px_rgba(6,182,212,0.4)]"
            >
              IGNITE ENGINE
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-red-950/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
            <h2 className="text-7xl font-black text-white mb-4 drop-shadow-2xl">DRAINED</h2>
            <p className="text-white/90 text-2xl font-mono mb-10 italic tracking-widest bg-black/40 px-6 py-2 rounded-full border border-white/10">
              FINAL: {score.toLocaleString()}
            </p>
            <button 
              onClick={startGame}
              className="px-14 py-5 bg-white text-black font-black text-xl rounded-2xl hover:bg-slate-200 transition-all hover:scale-105 active:scale-95 shadow-[0_20px_60px_rgba(255,255,255,0.2)]"
            >
              RE-LAUNCH
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && ballsRef.current.length === 0 && (
          <div className="absolute bottom-40 left-0 right-0 text-center pointer-events-none">
            <p className="text-cyan-400 font-black text-xl tracking-tighter uppercase italic drop-shadow-md animate-pulse">Hold [SPACE] to Power Up</p>
            <div className="mt-4 w-60 h-2 bg-slate-800/80 mx-auto rounded-full overflow-hidden border border-white/10 backdrop-blur-sm">
               <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-75 shadow-[0_0_15px_rgba(6,182,212,0.8)]" style={{ width: `${(plungerPosition/60)*100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Controller Legend */}
      <div className="mt-10 grid grid-cols-3 gap-8 max-w-lg w-full bg-slate-900/30 p-6 rounded-[40px] border border-white/5 backdrop-blur-md shadow-inner">
        <div className="text-center group">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-4 group-hover:text-cyan-400 transition-colors">Left</p>
          <kbd className="inline-flex w-16 h-16 items-center justify-center bg-slate-800 rounded-3xl border-b-[8px] border-slate-950 text-3xl font-black text-cyan-400 shadow-2xl active:translate-y-1 active:border-b-0 transition-all">Z</kbd>
        </div>
        <div className="text-center flex flex-col items-center justify-center pt-2">
          <div className="flex flex-col gap-3">
             <span className="px-5 py-2 bg-slate-800/80 rounded-xl text-[10px] font-black text-white/40 border border-white/5 uppercase">Space: Launch</span>
             <span className="px-5 py-2 bg-slate-800/80 rounded-xl text-[10px] font-black text-white/40 border border-white/5 uppercase">Arrows: Nudge</span>
          </div>
        </div>
        <div className="text-center group">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-4 group-hover:text-cyan-400 transition-colors">Right</p>
          <kbd className="inline-flex w-16 h-16 items-center justify-center bg-slate-800 rounded-3xl border-b-[8px] border-slate-950 text-3xl font-black text-cyan-400 shadow-2xl active:translate-y-1 active:border-b-0 transition-all">M</kbd>
        </div>
      </div>

      {isTilted && (
        <div className="mt-6 px-10 py-3 bg-red-600/20 text-red-500 border-2 border-red-600 font-black italic text-3xl animate-bounce rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.4)] backdrop-blur-md">
          TILTED!
        </div>
      )}
    </div>
  );
};

export default App;