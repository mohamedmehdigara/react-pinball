import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Enhanced Pinball Game
 * Features: Multi-ball, Particle System, Screen Shake, Slingshots, and Whirlpools.
 */
const App = () => {
  const canvasRef = useRef(null);

  // --- Game State ---
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [message, setMessage] = useState("Hold 'Space' to charge plunger!");
  const [isGameOver, setIsGameOver] = useState(true);
  const [isTilted, setTilt] = useState(false);
  const [nudgeCount, setNudgeCount] = useState(0);
  const [canPlunge, setCanPlunge] = useState(true);
  const [plungerPosition, setPlungerPosition] = useState(0);
  const [shake, setShake] = useState(0);

  // --- Refs for Physics Engine ---
  const ballsRef = useRef([]); // Support for multiple balls
  const particlesRef = useRef([]); // Visual effects
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
  const GRAVITY = 0.28;
  const BUMPER_ELASTICITY = 1.35;
  const WALL_ELASTICITY = 0.75;
  const FRICTION = 0.992;

  const gameElements = [
    { id: 'Pop Bumper', x: 150, y: 180, radius: 35, color: '#ff4d4d', score: 100, type: 'bumper' },
    { id: 'Pop Bumper', x: 350, y: 180, radius: 35, color: '#ff4d4d', score: 100, type: 'bumper' },
    { id: 'Whirlpool', x: 250, y: 80, radius: 40, color: '#a855f7', score: 500, type: 'whirlpool' },
    { id: 'Slingshot L', x: 100, y: 500, radius: 20, color: '#3b82f6', score: 50, type: 'slingshot' },
    { id: 'Slingshot R', x: 400, y: 500, radius: 20, color: '#3b82f6', score: 50, type: 'slingshot' },
    { id: 'Target', x: 250, y: 320, radius: 25, color: '#fbbf24', score: 250, type: 'bumper' },
  ];

  // --- Helper Functions ---
  const createParticles = (x, y, color) => {
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
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
      if (isTilted) return;
      const key = e.key.toLowerCase();
      if (key === 'z') flippersRef.current.isLeftFlipping = true;
      if (key === 'm') flippersRef.current.isRightFlipping = true;
      if (key === ' ' && isGameOver && canPlunge) {
        setPlungerPosition(p => Math.min(p + 6, 60));
      }
      if (['arrowleft', 'arrowright', 'arrowup'].includes(key) && !isGameOver && !isTilted) {
        setNudgeCount(n => {
          if (n >= 4) { setTilt(true); setMessage("TILT!"); return n; }
          ballsRef.current.forEach(b => {
            b.vx += key === 'arrowleft' ? -2.5 : (key === 'arrowright' ? 2.5 : 0);
            b.vy += key === 'arrowup' ? -2.5 : 0;
          });
          setShake(10);
          return n + 1;
        });
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'z') flippersRef.current.isLeftFlipping = false;
      if (key === 'm') flippersRef.current.isRightFlipping = false;
      if (key === ' ' && isGameOver && canPlunge) {
        setPlungerPosition(curr => {
          if (curr > 10) {
            ballsRef.current = [{
              x: 475, y: 650, radius: 10, vx: 0, vy: -curr / 2.2, isLaunched: true, color: '#fff'
            }];
            setIsGameOver(false);
            setScore(0);
            setMessage("");
            setCanPlunge(false);
            setTilt(false);
            setNudgeCount(0);
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
  }, [isGameOver, canPlunge, isTilted]);

  // --- Game Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const update = () => {
      const flips = flippersRef.current;
      const targetLeft = flips.isLeftFlipping ? FLIPPER_ANGLE_UP : FLIPPER_ANGLE_DEFAULT;
      const targetRight = flips.isRightFlipping ? -FLIPPER_ANGLE_UP : -FLIPPER_ANGLE_DEFAULT;
      flips.leftAngle += (targetLeft - flips.leftAngle) * 0.45;
      flips.rightAngle += (targetRight - flips.rightAngle) * 0.45;

      if (isTilted) return;

      // Update Particles
      particlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // Update Screen Shake
      setShake(s => Math.max(0, s * 0.9));

      // Update Balls
      ballsRef.current.forEach((ball, idx) => {
        if (!ball.isLaunched) return;
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
            
            ball.vx = (ball.vx - 2 * dot * nx) * (el.type === 'whirlpool' ? 0.2 : BUMPER_ELASTICITY);
            ball.vy = (ball.vy - 2 * dot * ny) * (el.type === 'whirlpool' ? 0.2 : BUMPER_ELASTICITY);
            ball.x += nx * ((ball.radius + el.radius) - dist);
            ball.y += ny * ((ball.radius + el.radius) - dist);

            setScore(s => s + el.score);
            createParticles(el.x, el.y, el.color);
            setShake(5);

            // Whirlpool Logic: Multiball
            if (el.type === 'whirlpool' && ballsRef.current.length < 2) {
              setTimeout(() => {
                ballsRef.current.push({
                  x: el.x, y: el.y, radius: 10, vx: 5, vy: 5, isLaunched: true, color: '#fbbf24'
                });
              }, 200);
            }
          }
        });

        // Flipper collisions
        const fData = [{ x: 135, y: 645, a: flips.leftAngle, l: true }, { x: 325, y: 645, a: flips.rightAngle, l: false }];
        fData.forEach(f => {
          const col = checkFlipperCollision(ball, f.x, f.y, f.a, f.l);
          if (col.collided) {
            const flipping = f.l ? flips.isLeftFlipping : flips.isRightFlipping;
            const power = flipping ? 14 : 2;
            ball.vx = col.normalX * power * (1 + col.t);
            ball.vy = col.normalY * power * (1 + col.t);
            ball.x += col.normalX * 6;
            ball.y += col.normalY * 6;
            setScore(s => s + 10);
          }
        });
      });

      // Handle Drain
      ballsRef.current = ballsRef.current.filter(b => b.y - b.radius < CANVAS_HEIGHT);
      if (ballsRef.current.length === 0 && !isGameOver) {
        setIsGameOver(true);
        setMessage("BALL LOST! Charge Space.");
        setHighScore(prev => Math.max(prev, score));
      }
    };

    const draw = () => {
      const flips = flippersRef.current;
      ctx.save();
      // Screen Shake
      if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grid/Lane lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for(let i=0; i<CANVAS_WIDTH; i+=50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke(); }

      // Elements
      gameElements.forEach(el => {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(el.x, el.y, 2, el.x, el.y, el.radius);
        grad.addColorStop(0, el.color);
        grad.addColorStop(1, '#000');
        ctx.fillStyle = grad;
        ctx.arc(el.x, el.y, el.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Particles
      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
      });
      ctx.globalAlpha = 1.0;

      // Plunger & Flippers
      ctx.fillStyle = '#64748b';
      ctx.fillRect(470, 620 + plungerPosition, 20, 80);

      const drawF = (x, y, a, l) => {
        ctx.save();
        ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath(); ctx.roundRect(0, -FLIPPER_WIDTH/2, l ? FLIPPER_LENGTH : -FLIPPER_LENGTH, FLIPPER_WIDTH, 10);
        ctx.fill(); ctx.stroke(); ctx.restore();
      };
      drawF(135, 645, flips.leftAngle, true);
      drawF(325, 645, flips.rightAngle, false);

      // Balls
      ballsRef.current.forEach(b => {
        ctx.fillStyle = isTilted ? '#ef4444' : b.color;
        ctx.shadowBlur = 15; ctx.shadowColor = b.color;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.restore();
    };

    const loop = () => { update(); draw(); animationId = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [isGameOver, isTilted, score, shake]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-4 font-sans select-none overflow-hidden">
      <div className="mb-4 text-center">
        <h1 className="text-6xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 drop-shadow-lg">
          ARCADE ULTRA
        </h1>
        <p className="text-xs text-cyan-400 font-mono tracking-widest mt-1 uppercase">Physics Simulation v2.5</p>
      </div>

      <div className="flex gap-4 mb-4 w-full max-w-lg">
        <div className="flex-1 bg-slate-900 border-2 border-cyan-500/30 p-3 rounded-2xl shadow-xl text-center">
          <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Score</p>
          <p className="text-3xl font-mono font-bold text-cyan-400">{score.toLocaleString()}</p>
        </div>
        <div className="flex-1 bg-slate-900 border-2 border-purple-500/30 p-3 rounded-2xl shadow-xl text-center">
          <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Record</p>
          <p className="text-3xl font-mono font-bold text-purple-400">{highScore.toLocaleString()}</p>
        </div>
      </div>

      <div className="relative border-[12px] border-slate-800 rounded-[40px] overflow-hidden shadow-[0_0_80px_rgba(34,211,238,0.15)] bg-slate-900">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="max-w-full h-auto cursor-none" />
        
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-4xl font-black text-white mb-2">{message}</h2>
            <p className="text-slate-400 text-sm mb-6 uppercase tracking-widest">Release Space to Fire</p>
            <div className="w-64 h-3 bg-slate-800 rounded-full p-1 border border-slate-700">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-75" 
                     style={{ width: `${(plungerPosition / 60) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between gap-12 text-center max-w-lg w-full bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Flippers</p>
          <div className="flex gap-2">
            <kbd className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-xl border-b-4 border-slate-950 text-xl font-bold text-cyan-400 shadow-lg">Z</kbd>
            <kbd className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-xl border-b-4 border-slate-950 text-xl font-bold text-cyan-400 shadow-lg">M</kbd>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Plunger</p>
          <kbd className="w-full h-12 flex items-center justify-center bg-cyan-600 rounded-xl border-b-4 border-cyan-800 text-lg font-bold text-white shadow-lg">SPACE</kbd>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Nudge</p>
          <div className="flex gap-2">
            <kbd className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-xl border-b-4 border-slate-950 text-lg shadow-lg">←↑→</kbd>
          </div>
        </div>
      </div>
      {nudgeCount > 0 && !isGameOver && (
        <div className={`mt-4 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${nudgeCount > 3 ? 'bg-red-500/20 text-red-500 border-red-500 animate-pulse' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50'}`}>
          Tilt Danger: {nudgeCount} / 4
        </div>
      )}
    </div>
  );
};

export default App;