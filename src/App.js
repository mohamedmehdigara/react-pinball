import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { Play, RotateCcw, Shield, Trophy, Activity, Zap } from 'lucide-react';

const WIDTH = 450;
const HEIGHT = 800;
const BALL_RADIUS = 13;

export default function App() {
  // UI State for React Rendering
  const [score, setScore] = useState(0);
  const [ballsRemaining, setBallsRemaining] = useState(3);
  const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER
  const [plungerPower, setPlungerPower] = useState(0);
  
  // Physics Engine Refs
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const ballRef = useRef(null);
  const flippers = useRef({ left: null, right: null });
  const keys = useRef({ left: false, right: false, space: false });

  // Source of Truth Ref (Prevents stale closures in the physics loop)
  const gameRef = useRef({
    score: 0,
    balls: 3,
    state: 'START'
  });

  // Sync state changes to the Ref for the Engine loop
  useEffect(() => {
    gameRef.current.state = gameState;
  }, [gameState]);

  const spawnBall = useCallback(() => {
    if (!engineRef.current) return;
    
    // Remove existing ball if any
    if (ballRef.current) {
      Matter.Composite.remove(engineRef.current.world, ballRef.current);
    }

    const ball = Matter.Bodies.circle(WIDTH - 28, HEIGHT - 100, BALL_RADIUS, {
      label: 'ball',
      restitution: 0.5,
      friction: 0.005,
      frictionAir: 0.001,
      density: 0.1,
      render: { 
        fillStyle: '#ffffff', 
        strokeStyle: '#818cf8', 
        lineWidth: 4 
      }
    });

    ballRef.current = ball;
    Matter.Composite.add(engineRef.current.world, ball);
  }, []);

  const handleBallLoss = useCallback(() => {
    if (gameRef.current.state !== 'PLAYING') return;

    gameRef.current.balls -= 1;
    setBallsRemaining(gameRef.current.balls);

    if (gameRef.current.balls <= 0) {
      setGameState('GAMEOVER');
    } else {
      // Small delay before respawning
      setTimeout(() => {
        if (gameRef.current.state === 'PLAYING') spawnBall();
      }, 1000);
    }
  }, [spawnBall]);

  const initGame = useCallback(() => {
    // 1. Rigorous Cleanup
    if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
    if (renderRef.current) {
      Matter.Render.stop(renderRef.current);
      if (renderRef.current.canvas) renderRef.current.canvas.remove();
    }
    if (engineRef.current) Matter.Engine.clear(engineRef.current);

    // 2. Initialize Engine
    const engine = Matter.Engine.create();
    engine.gravity.y = 1.4;
    engineRef.current = engine;

    const render = Matter.Render.create({
      element: containerRef.current,
      engine: engine,
      options: {
        width: WIDTH,
        height: HEIGHT,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio || 1
      }
    });
    renderRef.current = render;

    // 3. World Boundaries
    const wallOpts = { isStatic: true, render: { fillStyle: '#1e293b' } };
    const walls = [
      Matter.Bodies.rectangle(WIDTH / 2, -20, WIDTH, 40, wallOpts),
      Matter.Bodies.rectangle(-20, HEIGHT / 2, 40, HEIGHT, wallOpts),
      Matter.Bodies.rectangle(WIDTH + 20, HEIGHT / 2, 40, HEIGHT, wallOpts),
      Matter.Bodies.rectangle(WIDTH - 55, HEIGHT - 180, 10, 650, wallOpts), // Plunger lane
      // Slopes leading to flippers
      Matter.Bodies.rectangle(80, HEIGHT - 160, 200, 30, { ...wallOpts, angle: 0.5 }),
      Matter.Bodies.rectangle(WIDTH - 135, HEIGHT - 160, 150, 30, { ...wallOpts, angle: -0.5 }),
      // Drain Sensor
      Matter.Bodies.rectangle(WIDTH / 2, HEIGHT + 100, WIDTH, 100, { 
        isStatic: true, isSensor: true, label: 'drain' 
      })
    ];

    // 4. Interactive Bumpers
    const bumpers = [
      { x: 130, y: 180, pts: 1000 }, { x: 270, y: 180, pts: 1000 },
      { x: 200, y: 320, pts: 2500 }, { x: 80, y: 480, pts: 500 },
      { x: 320, y: 480, pts: 500 }
    ].map(b => {
      const bumper = Matter.Bodies.circle(b.x, b.y, 30, {
        isStatic: true,
        label: 'bumper',
        restitution: 1.6,
        render: { fillStyle: '#f43f5e', strokeStyle: '#fff', lineWidth: 4 }
      });
      bumper.scoreValue = b.pts;
      return bumper;
    });

    // 5. Kinetic Flippers
    const createFlipper = (x, y, isRight) => {
      const body = Matter.Bodies.rectangle(x, y, 110, 24, {
        chamfer: { radius: 12 },
        label: 'flipper',
        density: 0.1,
        render: { fillStyle: '#6366f1', strokeStyle: '#fff', lineWidth: 2 }
      });

      const pivotX = isRight ? x + 45 : x - 45;
      const pivot = Matter.Constraint.create({
        pointA: { x: pivotX, y: y },
        bodyB: body,
        pointB: { x: isRight ? 45 : -45, y: 0 },
        stiffness: 1,
        length: 0,
        render: { visible: false }
      });

      return { 
        body, 
        constraint: pivot, 
        isRight, 
        upAngle: isRight ? -0.6 : 0.6, 
        downAngle: isRight ? 0.3 : -0.3 
      };
    };

    flippers.current.left = createFlipper(WIDTH / 2 - 95, HEIGHT - 140, false);
    flippers.current.right = createFlipper(WIDTH / 2 + 40, HEIGHT - 140, true);

    const plunger = Matter.Bodies.rectangle(WIDTH - 28, HEIGHT - 10, 40, 60, {
      isStatic: true, render: { fillStyle: '#475569' }
    });

    // 6. Engine Update Logic
    Matter.Events.on(engine, 'beforeUpdate', () => {
      // Flipper physics
      [flippers.current.left, flippers.current.right].forEach((f, i) => {
        const active = i === 0 ? keys.current.left : keys.current.right;
        const targetAngle = active ? f.upAngle : f.downAngle;
        const diff = targetAngle - f.body.angle;
        Matter.Body.setAngularVelocity(f.body, diff * 0.45);
      });

      // Plunger mechanics
      if (keys.current.space) {
        if (plunger.position.y < HEIGHT + 60) {
          Matter.Body.setPosition(plunger, { x: plunger.position.x, y: plunger.position.y + 4 });
          setPlungerPower(p => Math.min(p + 2, 100));
        }
      } else {
        if (plunger.position.y > HEIGHT - 10) {
          if (ballRef.current && ballRef.current.position.x > WIDTH - 60 && ballRef.current.position.y > HEIGHT - 150) {
            const force = (plunger.position.y - (HEIGHT - 10)) * 0.04;
            Matter.Body.applyForce(ballRef.current, ballRef.current.position, { x: 0, y: -force });
          }
          Matter.Body.setPosition(plunger, { x: plunger.position.x, y: HEIGHT - 10 });
          setPlungerPower(0);
        }
      }
    });

    // 7. Collision Detection
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach(pair => {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        
        if (labels.includes('bumper')) {
          const b = pair.bodyA.label === 'bumper' ? pair.bodyA : pair.bodyB;
          gameRef.current.score += (b.scoreValue || 100);
          setScore(gameRef.current.score);
        }
        
        if (labels.includes('drain')) {
          const ballFound = pair.bodyA.label === 'ball' || pair.bodyB.label === 'ball';
          if (ballFound) handleBallLoss();
        }
      });
    });

    Matter.Composite.add(engine.world, [
      ...walls, ...bumpers, plunger,
      flippers.current.left.body, flippers.current.left.constraint,
      flippers.current.right.body, flippers.current.right.constraint
    ]);

    Matter.Render.run(render);
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    spawnBall();
  }, [spawnBall, handleBallLoss]);

  useEffect(() => {
    const down = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') keys.current.left = true;
      if (k === 'd' || k === 'arrowright') keys.current.right = true;
      if (k === ' ' || k === 'arrowdown') keys.current.space = true;
    };
    const up = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') keys.current.left = false;
      if (k === 'd' || k === 'arrowright') keys.current.right = false;
      if (k === ' ' || k === 'arrowdown') keys.current.space = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
    };
  }, []);

  const handleStart = () => {
    gameRef.current = { score: 0, balls: 3, state: 'PLAYING' };
    setBallsRemaining(3);
    setScore(0);
    setGameState('PLAYING');
    initGame();
  };

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-4 select-none overflow-hidden font-sans">
      
      {/* HUD */}
      <div className="w-full max-w-[450px] flex justify-between items-end mb-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
            <Activity size={14} className="animate-pulse" /> Kinetic Data
          </div>
          <div className="text-6xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            {score.toLocaleString().padStart(6, '0')}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 pb-1">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                  i < ballsRemaining 
                  ? 'bg-indigo-500 border-indigo-200 shadow-[0_0_10px_#6366f1]' 
                  : 'bg-neutral-900 border-neutral-800 scale-75 opacity-30'
                }`} 
              />
            ))}
          </div>
          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Ball Cache</span>
        </div>
      </div>

      {/* Game Table Container */}
      <div className="relative w-[450px] h-[800px] bg-neutral-950 rounded-[3rem] border-[12px] border-[#1a1a1e] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden ring-1 ring-white/10">
        <div ref={containerRef} className="absolute inset-0" />
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30 bg-[radial-gradient(circle_at_50%_30%,_rgba(99,102,241,0.2)_0%,_transparent_70%)]" />
        
        {/* Plunger Gauge */}
        <div className="absolute right-3.5 bottom-24 w-1.5 h-40 bg-neutral-900/80 rounded-full overflow-hidden border border-white/5 backdrop-blur-md">
          <div 
            className="w-full bg-gradient-to-t from-indigo-600 via-indigo-400 to-white shadow-[0_0_15px_#6366f1] transition-all duration-75" 
            style={{ height: `${plungerPower}%`, marginTop: `${100 - plungerPower}%` }} 
          />
        </div>

        {/* Modal Overlays */}
        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 z-50 bg-[#050508]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
            {gameState === 'START' ? (
              <>
                <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-8">
                   <Shield size={48} className="text-indigo-500" />
                </div>
                <h1 className="text-6xl font-black text-white italic tracking-tighter mb-2">
                  NEO<span className="text-indigo-500">PIN</span>
                </h1>
                <p className="text-neutral-500 text-[10px] font-bold tracking-[0.4em] mb-16 uppercase">Advanced Physics Engine</p>
              </>
            ) : (
              <>
                <Trophy size={80} className="text-rose-500 mb-8 animate-bounce" />
                <h2 className="text-4xl font-black text-white tracking-tight mb-2 uppercase italic">Mission Over</h2>
                <div className="mb-16 p-8 rounded-3xl bg-white/5 border border-white/10 w-full">
                  <p className="text-neutral-500 text-[10px] uppercase tracking-widest mb-2 font-bold opacity-50">Yield Harvested</p>
                  <p className="text-7xl font-black text-white tracking-tighter">{score.toLocaleString()}</p>
                </div>
              </>
            )}
            
            <button 
              onClick={handleStart}
              className="group relative flex items-center gap-5 bg-white text-black px-14 py-6 rounded-2xl font-black text-xl transition-all hover:bg-indigo-500 hover:text-white active:scale-95 shadow-2xl"
            >
              {gameState === 'START' ? <Play fill="currentColor" size={24} /> : <RotateCcw size={24} />}
              <span>{gameState === 'START' ? 'INITIALIZE' : 'REBOOT'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Control Legend */}
      <div className="mt-10 flex gap-12 text-[11px] text-neutral-600 font-bold uppercase tracking-[0.3em]">
        <div className="flex items-center gap-3">
          <kbd className="bg-neutral-900 px-2.5 py-1.5 rounded border border-neutral-800 text-neutral-400 font-mono">A / D</kbd>
          <span>Impulse</span>
        </div>
        <div className="flex items-center gap-3">
          <kbd className="bg-neutral-900 px-2.5 py-1.5 rounded border border-neutral-800 text-neutral-400 font-mono">SPACE</kbd>
          <span>Launch</span>
        </div>
      </div>
    </div>
  );
}