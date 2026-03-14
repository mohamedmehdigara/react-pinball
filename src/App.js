import React, { useRef, useEffect, useState } from 'react';

/**
 * Arcade Ultra Pinball - Final Polish
 * Fixes: Robust drain detection, launch protection, and collision edge-cases.
 */
const App = () => {
  const canvasRef = useRef(null);

  // --- Game State ---
  const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isTilted, setTilt] = useState(false);
  const [nudgeCount, setNudgeCount] = useState(0);
  const [plungerPosition, setPlungerPosition] = useState(0);
  const [shake, setShake] = useState(0);
  const [ballInPlay, setBallInPlay] = useState(false);

  // --- Refs for Physics Engine ---
  const ballsRef = useRef([]);
  const particlesRef = useRef([]);
  const combosRef = useRef([]);
  const framesSinceLaunch = useRef(0);
  const flippersRef = useRef({
    leftAngle: Math.PI / 6,
    rightAngle: -Math.PI / 6,
    isLeftFlipping: false,
    isRightFlipping: false
  });

  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 700;
  const FLIPPER_LENGTH = 85;
  const FLIPPER_WIDTH = 14;
  const FLIPPER_ANGLE_DEFAULT = Math.PI / 6;
  const FLIPPER_ANGLE_UP = -Math.PI / 4;
  const GRAVITY = 0.38; // Slightly increased for snappier feel
  const BUMPER_ELASTICITY = 1.65;
  const WALL_ELASTICITY = 0.7;
  const FRICTION = 0.992;

  const gameElements = [
    { id: 'Pop 1', x: 150, y: 180, radius: 35, color: '#ff0055', score: 100, type: 'bumper' },
    { id: 'Pop 2', x: 350, y: 180, radius: 35, color: '#ff0055', score: 100, type: 'bumper' },
    { id: 'Whirlpool', x: 250, y: 80, radius: 45, color: '#7000ff', score: 500, type: 'whirlpool' },
    { id: 'Slingshot L', x: 100, y: 500, radius: 22, color: '#00d4ff', score: 50, type: 'slingshot' },
    { id: 'Slingshot R', x: 400, y: 500, radius: 22, color: '#00d4ff', score: 50, type: 'slingshot' },
    { id: 'Mid Bumper', x: 250, y: 320, radius: 28, color: '#ffcc00', score: 250, type: 'bumper' },
  ];

  const startGame = () => {
    ballsRef.current = [];
    particlesRef.current = [];
    combosRef.current = [];
    framesSinceLaunch.current = 0;
    setScore(0);
    setCombo(0);
    setTilt(false);
    setNudgeCount(0);
    setBallInPlay(false);
    setGameState('PLAYING');
  };

  const createParticles = (x, y, color) => {
    for (let i = 0; i < 12; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        radius: Math.random() * 2 + 1,
        life: 1.0,
        color
      });
    }
  };

  const triggerCombo = (x, y) => {
    setCombo(prev => prev + 1);
    combosRef.current.push({ x, y: y - 30, life: 1.0, text: `X${combo + 1}` });
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
      normalX: distDx / (distance || 1),
      normalY: distDy / (distance || 1),
      t
    };
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'PLAYING' || isTilted) return;
      const key = e.key.toLowerCase();
      if (key === 'z') flippersRef.current.isLeftFlipping = true;
      if (key === 'm') flippersRef.current.isRightFlipping = true;
      if (key === ' ' && !ballInPlay) {
        setPlungerPosition(p => Math.min(p + 6, 75));
      }
      if (['arrowleft', 'arrowright', 'arrowup'].includes(key)) {
        setNudgeCount(n => {
          if (n >= 8) { setTilt(true); return n; }
          ballsRef.current.forEach(b => {
            b.vx += key === 'arrowleft' ? -3 : (key === 'arrowright' ? 3 : 0);
            b.vy += key === 'arrowup' ? -3 : 0;
          });
          setShake(20);
          return n + 1;
        });
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'z') flippersRef.current.isLeftFlipping = false;
      if (key === 'm') flippersRef.current.isRightFlipping = false;
      if (key === ' ' && gameState === 'PLAYING' && !ballInPlay) {
        if (plungerPosition > 5) {
          ballsRef.current = [{
            x: 475, y: 640, radius: 10, vx: 0, vy: -plungerPosition / 1.3, color: '#ffffff', trail: []
          }];
          framesSinceLaunch.current = 0;
          setBallInPlay(true);
        }
        setPlungerPosition(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, isTilted, ballInPlay, plungerPosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
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

      if (!isTilted) {
        particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.03; });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
        combosRef.current.forEach(c => { c.y -= 0.8; c.life -= 0.015; });
        combosRef.current = combosRef.current.filter(c => c.life > 0);
        setShake(s => Math.max(0, s * 0.9));
      }

      ballsRef.current.forEach((ball) => {
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 8) ball.trail.shift();

        ball.vy += GRAVITY;
        ball.vx *= FRICTION;
        ball.vy *= FRICTION;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Boundaries
        if (ball.x + ball.radius > CANVAS_WIDTH) { ball.vx *= -WALL_ELASTICITY; ball.x = CANVAS_WIDTH - ball.radius; }
        else if (ball.x - ball.radius < 0) { ball.vx *= -WALL_ELASTICITY; ball.x = ball.radius; }
        if (ball.y - ball.radius < 0) { ball.vy *= -WALL_ELASTICITY; ball.y = ball.radius; }

        if (!isTilted) {
          // Element Collisions
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
              ball.x += nx * (ball.radius + el.radius - dist + 1);
              ball.y += ny * (ball.radius + el.radius - dist + 1);

              setScore(s => s + el.score * (combo + 1));
              createParticles(el.x, el.y, el.color);
              triggerCombo(el.x, el.y);
              setShake(8);
              
              if (el.type === 'whirlpool' && ballsRef.current.length < 3) {
                // Multiball logic
                ballsRef.current.push({ 
                  x: el.x, y: el.y, radius: 10, 
                  vx: (Math.random() - 0.5) * 10, 
                  vy: 5, color: '#fbbf24', trail: [] 
                });
              }
            }
          });

          // Flipper Collisions
          const fData = [{ x: 135, y: 645, a: flips.leftAngle, l: true }, { x: 325, y: 645, a: flips.rightAngle, l: false }];
          fData.forEach(f => {
            const col = checkFlipperCollision(ball, f.x, f.y, f.a, f.l);
            if (col.collided) {
              const flipping = f.l ? flips.isLeftFlipping : flips.isRightFlipping;
              const power = flipping ? 22 : 4;
              ball.vx = col.normalX * power * (1.2 + col.t);
              ball.vy = col.normalY * power * (1.2 + col.t);
              ball.x += col.normalX * 10;
              ball.y += col.normalY * 10;
              setScore(s => s + 10);
              if (flipping) setCombo(0);
            }
          });
        }
      });

      if (ballInPlay) {
        framesSinceLaunch.current++;
      }

      // Refined remaining ball logic
      const activeBalls = ballsRef.current.filter(b => b.y - b.radius < CANVAS_HEIGHT + 50);
      
      // Drain check: Only game over if no balls remain and launch buffer has passed
      if (ballInPlay && framesSinceLaunch.current > 30 && activeBalls.length === 0) {
        setGameState('GAMEOVER');
        setHighScore(prev => Math.max(prev, score));
        setBallInPlay(false);
      }
      
      ballsRef.current = activeBalls;
    };

    const draw = () => {
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.05;
      for(let i=0; i<CANVAS_WIDTH; i+=50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // Draw Elements
      gameElements.forEach(el => {
        ctx.save();
        ctx.shadowBlur = 20; ctx.shadowColor = el.color;
        const grad = ctx.createRadialGradient(el.x, el.y, 2, el.x, el.y, el.radius);
        grad.addColorStop(0, '#fff'); grad.addColorStop(0.3, el.color); grad.addColorStop(1, '#000');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(el.x, el.y, el.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // Draw Flippers
      const flips = flippersRef.current;
      const drawF = (x, y, a, l) => {
        ctx.save();
        ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = isTilted ? '#475569' : '#3b82f6';
        ctx.shadowBlur = isTilted ? 0 : 15; ctx.shadowColor = '#3b82f6';
        ctx.beginPath(); ctx.roundRect(0, -FLIPPER_WIDTH/2, l ? FLIPPER_LENGTH : -FLIPPER_LENGTH, FLIPPER_WIDTH, [10]);
        ctx.fill(); ctx.restore();
      };
      drawF(135, 645, flips.leftAngle, true);
      drawF(325, 645, flips.rightAngle, false);

      // Plunger Lane Visual
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(460, 0, 40, CANVAS_HEIGHT);
      ctx.fillStyle = '#475569';
      ctx.fillRect(470, 630 + plungerPosition, 20, 70);

      // Balls
      ballsRef.current.forEach(b => {
        b.trail.forEach((t, i) => {
          ctx.globalAlpha = (i / b.trail.length) * 0.3;
          ctx.fillStyle = isTilted ? '#f43f5e' : b.color;
          ctx.beginPath(); ctx.arc(t.x, t.y, b.radius * (i / b.trail.length), 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1.0;
        ctx.save();
        ctx.shadowBlur = 15; ctx.shadowColor = isTilted ? '#f43f5e' : b.color;
        ctx.fillStyle = isTilted ? '#f43f5e' : b.color;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // UI effects
      particlesRef.current.forEach(p => { 
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color; 
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); 
      });
      combosRef.current.forEach(c => { 
        ctx.globalAlpha = c.life; ctx.fillStyle = '#fff'; 
        ctx.font = 'bold 24px monospace'; ctx.fillText(c.text, c.x, c.y); 
      });

      ctx.restore();
    };

    const loop = () => { update(); draw(); animationId = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [gameState, isTilted, score, shake, plungerPosition, combo, ballInPlay]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 font-sans select-none overflow-hidden">
      <div className="mb-6 flex justify-between w-full max-w-lg items-center px-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-500 font-bold">Score</p>
          <p className="text-5xl font-black font-mono">{score.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.3em] text-purple-500 font-bold">Best</p>
          <p className="text-3xl font-black font-mono text-slate-400">{highScore.toLocaleString()}</p>
        </div>
      </div>

      <div className="relative border-[12px] border-slate-900 rounded-[60px] overflow-hidden shadow-2xl bg-slate-950">
        <canvas ref={canvasRef} style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }} className="max-w-full h-auto" />
        
        {gameState === 'START' && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-8 text-center">
            <h1 className="text-7xl font-black italic text-cyan-500 mb-8 tracking-tighter">ULTRA PIN</h1>
            <p className="text-cyan-400/60 mb-8 font-mono tracking-widest uppercase text-xs">High Fidelity Arcade Simulation</p>
            <button onClick={startGame} className="px-16 py-6 bg-cyan-500 text-black font-black text-2xl rounded-2xl hover:scale-110 transition-transform shadow-[0_0_30px_rgba(6,182,212,0.5)]">START GAME</button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
            <h2 className="text-6xl font-black text-white mb-2 tracking-tighter">BALL DRAINED</h2>
            <p className="text-white/40 mb-8 font-mono tracking-widest uppercase">Score: {score.toLocaleString()}</p>
            <button onClick={startGame} className="px-12 py-5 bg-white text-black font-black text-xl rounded-2xl hover:scale-105 transition-transform">PLAY AGAIN</button>
          </div>
        )}

        {gameState === 'PLAYING' && !ballInPlay && (
          <div className="absolute bottom-40 left-0 right-0 text-center animate-pulse">
            <p className="text-cyan-400 font-black text-sm uppercase tracking-widest">Hold [SPACE] to Charge Plunger</p>
            <div className="mt-4 w-48 h-3 bg-slate-800 mx-auto rounded-full overflow-hidden border border-white/10 p-0.5">
               <div className="h-full bg-cyan-500 rounded-full transition-all duration-75" style={{ width: `${(plungerPosition/75)*100}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 grid grid-cols-3 gap-8 max-w-lg w-full">
        <div className="text-center">
          <kbd className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-2xl font-black mx-auto border-b-4 border-slate-950">Z</kbd>
          <p className="mt-2 text-[10px] uppercase text-slate-500 font-bold">Left Flipper</p>
        </div>
        <div className="text-center self-center text-[10px] uppercase text-slate-600 font-black leading-tight">
          SPACE: Plunger<br/>
          ARROWS: Nudge Table
        </div>
        <div className="text-center">
          <kbd className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-2xl font-black mx-auto border-b-4 border-slate-950">M</kbd>
          <p className="mt-2 text-[10px] uppercase text-slate-500 font-bold">Right Flipper</p>
        </div>
      </div>

      {isTilted && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-12 py-4 bg-red-600 text-white font-black italic text-4xl rounded-2xl animate-bounce shadow-2xl border-4 border-white/20">
          TILT!
        </div>
      )}
    </div>
  );
};

export default App;