import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { Zap, Trophy, PlayCircle, Activity, ChevronUp } from 'lucide-react';

const WIDTH = 450;
const HEIGHT = 800;
const BALL_RADIUS = 13;

export default function App() {
  const [score, setScore] = useState(0);
  const [ballsRemaining, setBallsRemaining] = useState(3);
  const [gameState, setGameState] = useState('START');
  const [plungerPower, setPlungerPower] = useState(0);
  
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const ballRef = useRef(null);
  
  const flippers = useRef({ left: null, right: null });
  const keys = useRef({ left: false, right: false, space: false });
  
  // Game state held in a Ref to prevent stale closures in Matter.js event loops
  const gameRef = useRef({ 
    score: 0, 
    balls: 3, 
    state: 'START',
    isLaunching: false
  });

  const cleanup = () => {
    if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
    if (renderRef.current) {
      Matter.Render.stop(renderRef.current);
      if (renderRef.current.canvas) renderRef.current.canvas.remove();
    }
    if (engineRef.current) {
      Matter.World.clear(engineRef.current.world);
      Matter.Engine.clear(engineRef.current);
    }
  };

  const spawnBall = useCallback(() => {
    if (!engineRef.current) return;
    
    // Safety: Remove existing ball if it exists
    if (ballRef.current) {
      Matter.Composite.remove(engineRef.current.world, ballRef.current);
    }

    const ball = Matter.Bodies.circle(WIDTH - 30, HEIGHT - 100, BALL_RADIUS, {
      label: 'ball',
      restitution: 0.5,
      friction: 0.001,
      frictionAir: 0.005,
      density: 0.1,
      render: { 
        fillStyle: '#ffffff', 
        strokeStyle: '#818cf8', 
        lineWidth: 3 
      }
    });

    ballRef.current = ball;
    Matter.Composite.add(engineRef.current.world, ball);
  }, []);

  const initGame = () => {
    cleanup();

    const engine = Matter.Engine.create({
      enableSleeping: false,
      positionIterations: 10,
      velocityIterations: 10
    });
    engine.gravity.y = 1.2;
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

    const wallOpts = { isStatic: true, render: { fillStyle: '#1e293b' }, friction: 0.05, restitution: 0.5 };
    
    // Create the top arch
    const arcSegments = 16;
    const arcWalls = [];
    for(let i=0; i<=arcSegments; i++) {
        const angle = (Math.PI / arcSegments) * i;
        const x = WIDTH/2 + Math.cos(angle + Math.PI) * (WIDTH/2);
        const y = 150 + Math.sin(angle + Math.PI) * 150;
        arcWalls.push(Matter.Bodies.rectangle(x, y, 60, 20, { 
            ...wallOpts, 
            angle: angle + Math.PI/2 
        }));
    }

    const walls = [
      Matter.Bodies.rectangle(-10, HEIGHT / 2, 40, HEIGHT, wallOpts), // Left
      Matter.Bodies.rectangle(WIDTH + 10, HEIGHT / 2, 40, HEIGHT, wallOpts), // Right
      Matter.Bodies.rectangle(WIDTH - 55, HEIGHT - 200, 10, 600, wallOpts), // Launcher Lane
      // Bottom slopes
      Matter.Bodies.rectangle(90, HEIGHT - 180, 200, 20, { ...wallOpts, angle: 0.55 }),
      Matter.Bodies.rectangle(WIDTH - 140, HEIGHT - 180, 180, 20, { ...wallOpts, angle: -0.55 }),
      // Drain sensor
      Matter.Bodies.rectangle(WIDTH / 2, HEIGHT + 100, WIDTH, 100, { 
        isStatic: true, isSensor: true, label: 'drain', render: { visible: false } 
      })
    ];

    const bumpers = [
      { x: 130, y: 250, pts: 100, color: '#f43f5e' },
      { x: 270, y: 250, pts: 100, color: '#f43f5e' },
      { x: 200, y: 380, pts: 500, color: '#10b981' },
      { x: 80, y: 440, pts: 250, color: '#818cf8' },
      { x: 320, y: 440, pts: 250, color: '#818cf8' },
    ].map(b => {
      const body = Matter.Bodies.circle(b.x, b.y, 30, {
        isStatic: true, label: 'bumper', restitution: 1.6,
        render: { fillStyle: b.color, strokeStyle: '#fff', lineWidth: 4 }
      });
      body.scoreValue = b.pts;
      return body;
    });

    const createFlipper = (x, y, isRight) => {
      const group = Matter.Body.nextGroup(true);
      const width = 110;
      const height = 24;
      
      const body = Matter.Bodies.rectangle(x, y, width, height, {
        chamfer: { radius: 10 },
        label: 'flipper',
        collisionFilter: { group: group },
        density: 0.1,
        render: { fillStyle: '#6366f1' }
      });
      
      const pivotX = isRight ? x + 45 : x - 45;
      const constraint = Matter.Constraint.create({
        pointA: { x: pivotX, y: y },
        bodyB: body,
        pointB: { x: isRight ? 45 : -45, y: 0 },
        stiffness: 1,
        length: 0,
        render: { visible: false }
      });
      
      return { body, constraint, isRight };
    };

    flippers.current.left = createFlipper(WIDTH / 2 - 85, HEIGHT - 135, false);
    flippers.current.right = createFlipper(WIDTH / 2 + 30, HEIGHT - 135, true);

    Matter.Events.on(engine, 'beforeUpdate', () => {
      // Flipper actuation
      [flippers.current.left, flippers.current.right].forEach((f) => {
        if (!f) return;
        const active = f.isRight ? keys.current.right : keys.current.left;
        const targetAngle = active ? (f.isRight ? -0.5 : 0.5) : (f.isRight ? 0.6 : -0.6);
        const angleDelta = (targetAngle - f.body.angle) * 0.35;
        Matter.Body.setAngle(f.body, f.body.angle + angleDelta);
        Matter.Body.setAngularVelocity(f.body, angleDelta);
      });

      // Launcher power logic
      if (keys.current.space && gameRef.current.state === 'PLAYING') {
        setPlungerPower(p => Math.min(p + 2.5, 100));
        gameRef.current.isLaunching = true;
      } else if (gameRef.current.isLaunching) {
        if (ballRef.current && ballRef.current.position.x > WIDTH - 60) {
          const force = (plungerPower / 100) * 2.2;
          Matter.Body.applyForce(ballRef.current, ballRef.current.position, { x: 0, y: -force });
        }
        setPlungerPower(0);
        gameRef.current.isLaunching = false;
      }
    });

    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach(pair => {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        
        if (labels.includes('bumper')) {
          const b = pair.bodyA.label === 'bumper' ? pair.bodyA : pair.bodyB;
          gameRef.current.score += b.scoreValue;
          setScore(gameRef.current.score);
        }
        
        if (labels.includes('drain') && labels.includes('ball')) {
          handleBallLoss();
        }
      });
    });

    Matter.Composite.add(engine.world, [
      ...walls, ...arcWalls, ...bumpers,
      flippers.current.left.body, flippers.current.left.constraint,
      flippers.current.right.body, flippers.current.right.constraint
    ]);

    Matter.Render.run(render);
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);
    spawnBall();
  };

  const handleBallLoss = useCallback(() => {
    if (gameRef.current.state !== 'PLAYING') return;
    
    gameRef.current.balls -= 1;
    setBallsRemaining(gameRef.current.balls);

    if (gameRef.current.balls <= 0) {
      setGameState('GAMEOVER');
      gameRef.current.state = 'GAMEOVER';
    } else {
      setTimeout(() => {
        if (gameRef.current.state === 'PLAYING') spawnBall();
      }, 800);
    }
  }, [spawnBall]);

  useEffect(() => {
    const handleDown = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') keys.current.left = true;
      if (k === 'd' || k === 'arrowright') keys.current.right = true;
      if (k === ' ' || k === 'arrowdown') keys.current.space = true;
    };
    const handleUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') keys.current.left = false;
      if (k === 'd' || k === 'arrowright') keys.current.right = false;
      if (k === ' ' || k === 'arrowdown') keys.current.space = false;
    };
    
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      cleanup();
    };
  }, []);

  const startGame = () => {
    gameRef.current = { score: 0, balls: 3, state: 'PLAYING', isLaunching: false };
    setBallsRemaining(3);
    setScore(0);
    setGameState('PLAYING');
    // Short delay to ensure DOM is ready for Matter.js container
    setTimeout(initGame, 50);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 text-white font-mono select-none overflow-hidden">
      
      {/* Top Header */}
      <div className="w-[450px] flex justify-between items-end mb-6 px-2">
        <div>
          <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-2 mb-1">
            <Activity size={12} className="text-emerald-400 animate-pulse" /> Live Session
          </div>
          <div className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            {score.toLocaleString().padStart(6, '0')}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="text-[10px] text-neutral-500 font-bold uppercase">Cores</div>
            <div className="flex gap-1.5">
                {[...Array(3)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-3 h-8 rounded-full transition-all duration-500 border border-white/5 ${
                            i < ballsRemaining ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]' : 'bg-neutral-900'
                        }`} 
                    />
                ))}
            </div>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="relative w-[450px] h-[800px] bg-neutral-900 rounded-[2.5rem] border-[10px] border-neutral-800 shadow-2xl ring-2 ring-white/5 overflow-hidden">
        <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none" />
        
        {/* Launcher Indicator */}
        <div className="absolute right-4 bottom-24 w-6 h-36 bg-black/40 rounded-full border border-white/10 z-20 flex flex-col justify-end p-1">
          <div 
            className="w-full bg-gradient-to-t from-indigo-600 to-indigo-300 rounded-full transition-all duration-75"
            style={{ height: `${plungerPower}%` }}
          />
        </div>

        {/* Overlay Screens */}
        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 z-50 bg-neutral-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            {gameState === 'START' ? (
              <div className="space-y-6">
                <div className="relative inline-block">
                    <div className="absolute inset-0 blur-3xl bg-indigo-500/30 animate-pulse" />
                    <div className="relative p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/30">
                        <Zap size={64} className="text-indigo-400" />
                    </div>
                </div>
                <div>
                    <h1 className="text-6xl font-black italic tracking-tighter">
                      NEO<span className="text-indigo-500">PIN</span>
                    </h1>
                    <p className="text-neutral-500 text-[10px] tracking-[0.4em] uppercase mt-2">Experimental Physics Engine</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-4 mx-auto w-fit">
                    <Trophy size={64} className="text-yellow-500" />
                </div>
                <h2 className="text-neutral-400 text-sm tracking-widest uppercase">Final Score</h2>
                <div className="text-7xl font-black text-white tabular-nums">
                  {score.toLocaleString()}
                </div>
              </div>
            )}
            
            <button 
              onClick={startGame} 
              className="mt-12 group relative bg-indigo-600 text-white font-black px-12 py-5 rounded-2xl transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-xl overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3 text-lg uppercase tracking-tight">
                {gameState === 'START' ? 'Initialize' : 'Re-engage'} <PlayCircle size={22} />
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Controls Help */}
      <div className="mt-8 flex gap-12 text-[10px] text-neutral-500 font-bold tracking-widest uppercase">
        <div className="flex items-center gap-3">
          <div className="flex gap-1 text-neutral-400">
            <span className="bg-neutral-900 px-2 py-1 rounded border border-white/5">A</span>
            <span className="bg-neutral-900 px-2 py-1 rounded border border-white/5">D</span>
          </div>
          <span>Flippers</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-neutral-900 px-3 py-1 rounded border border-white/5 text-neutral-400">SPACE</span>
          <span>Launch Ball</span>
        </div>
      </div>
    </div>
  );
}