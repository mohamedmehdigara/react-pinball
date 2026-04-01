import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { Cpu, Zap, Trophy, PlayCircle, ChevronUp } from 'lucide-react';

const WIDTH = 450;
const HEIGHT = 800;
const BALL_RADIUS = 14;

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
  const gameRef = useRef({ score: 0, balls: 3, state: 'START' });

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
    if (ballRef.current) Matter.Composite.remove(engineRef.current.world, ballRef.current);

    const ball = Matter.Bodies.circle(WIDTH - 28, HEIGHT - 80, BALL_RADIUS, {
      label: 'ball',
      restitution: 0.5,
      friction: 0.0001,
      frictionAir: 0.005,
      density: 0.05,
      render: { 
        fillStyle: '#ffffff', 
        strokeStyle: '#818cf8', 
        lineWidth: 4,
      }
    });

    ballRef.current = ball;
    Matter.Composite.add(engineRef.current.world, ball);
  }, []);

  const initGame = () => {
    cleanup();

    const engine = Matter.Engine.create({
      enableSleeping: false,
      positionIterations: 30, 
      velocityIterations: 30
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
        pixelRatio: window.devicePixelRatio
      }
    });
    renderRef.current = render;

    const wallOpts = { isStatic: true, render: { fillStyle: '#1e293b' }, friction: 0, restitution: 0.5 };
    
    // Procedure: Top Arc Generation
    const arcWalls = [];
    const segments = 12;
    for (let i = 0; i <= segments; i++) {
      const angle = (Math.PI / segments) * i;
      const x = WIDTH / 2 + Math.cos(angle + Math.PI) * (WIDTH / 2);
      const y = 150 + Math.sin(angle + Math.PI) * 150;
      arcWalls.push(Matter.Bodies.rectangle(x, y, 80, 20, { 
        ...wallOpts, 
        angle: angle + Math.PI / 2 
      }));
    }

    const walls = [
      Matter.Bodies.rectangle(WIDTH / 2, -10, WIDTH, 40, wallOpts),
      Matter.Bodies.rectangle(-10, HEIGHT / 2, 40, HEIGHT, wallOpts),
      Matter.Bodies.rectangle(WIDTH + 10, HEIGHT / 2, 40, HEIGHT, wallOpts),
      Matter.Bodies.rectangle(WIDTH - 55, HEIGHT - 180, 10, 600, wallOpts), 
      Matter.Bodies.rectangle(70, HEIGHT - 160, 220, 25, { ...wallOpts, angle: 0.6, chamfer: { radius: 10 } }),
      Matter.Bodies.rectangle(WIDTH - 145, HEIGHT - 160, 180, 25, { ...wallOpts, angle: -0.6, chamfer: { radius: 10 } }),
      Matter.Bodies.rectangle(WIDTH / 2, HEIGHT + 100, WIDTH, 50, { 
        isStatic: true, isSensor: true, label: 'drain', render: { visible: false } 
      })
    ];

    const bumpers = [
      { x: 120, y: 250, pts: 100, color: '#f43f5e' },
      { x: 280, y: 250, pts: 100, color: '#f43f5e' },
      { x: 200, y: 380, pts: 500, color: '#10b981' },
      { x: 80, y: 450, pts: 250, color: '#6366f1' },
      { x: 320, y: 450, pts: 250, color: '#6366f1' }
    ].map(b => {
      const body = Matter.Bodies.circle(b.x, b.y, 28, {
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
        chamfer: { radius: 12 },
        label: 'flipper',
        collisionFilter: { group: group },
        density: 0.1,
        friction: 0,
        render: { fillStyle: '#818cf8' }
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

    flippers.current.left = createFlipper(WIDTH / 2 - 95, HEIGHT - 110, false);
    flippers.current.right = createFlipper(WIDTH / 2 + 35, HEIGHT - 110, true);

    Matter.Events.on(engine, 'beforeUpdate', () => {
      [flippers.current.left, flippers.current.right].forEach((f) => {
        if (!f) return;
        const active = f.isRight ? keys.current.right : keys.current.left;
        const targetAngle = active ? (f.isRight ? -0.5 : 0.5) : (f.isRight ? 0.6 : -0.6);
        const newAngle = f.body.angle + (targetAngle - f.body.angle) * 0.45;
        Matter.Body.setAngle(f.body, newAngle);
      });

      if (keys.current.space) {
        setPlungerPower(p => Math.min(p + 1.5, 100));
      } else if (plungerPower > 0) {
        if (ballRef.current && ballRef.current.position.x > WIDTH - 60) {
          const force = (plungerPower / 100) * 0.7;
          Matter.Body.applyForce(ballRef.current, ballRef.current.position, { x: 0, y: -force });
        }
        setPlungerPower(0);
      }

      if (ballRef.current) {
        const vel = ballRef.current.velocity;
        if (Math.abs(vel.x) < 0.1 && Math.abs(vel.y) < 0.1 && ballRef.current.position.y < HEIGHT - 200) {
          Matter.Body.applyForce(ballRef.current, ballRef.current.position, { x: 0.002, y: 0 });
        }
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
      }, 1000);
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
    gameRef.current = { score: 0, balls: 3, state: 'PLAYING' };
    setBallsRemaining(3);
    setScore(0);
    setGameState('PLAYING');
    setTimeout(initGame, 50);
  };

  return (
    <div className="min-h-screen bg-[#020205] flex flex-col items-center justify-center p-4 text-slate-100 overflow-hidden">
      
      <div className="w-full max-w-[450px] flex justify-between items-end mb-6 px-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.25em] mb-1">
            <Cpu size={12} className="animate-pulse" /> Core Status: Nominal
          </div>
          <div className="text-6xl font-black tabular-nums tracking-tighter text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]">
            {score.toLocaleString().padStart(6, '0')}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 mb-2">
           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reserve Units</div>
           <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full transition-all duration-700 ${i < ballsRemaining ? 'bg-indigo-500 shadow-[0_0_15px_#6366f1]' : 'bg-neutral-800'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="relative w-[450px] h-[800px] bg-[#080810] rounded-[3.5rem] border-[14px] border-[#1e1e30] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
        <div ref={containerRef} className="absolute inset-0 z-10" />
        
        <div className="absolute right-[12px] bottom-[30px] w-[30px] h-[160px] bg-neutral-900/50 rounded-full border border-white/5 overflow-hidden z-20 flex flex-col justify-end p-1">
          <div 
            className="w-full bg-gradient-to-t from-indigo-600 via-indigo-400 to-white rounded-full transition-all duration-75 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            style={{ height: `${plungerPower}%` }}
          />
          <ChevronUp className="absolute top-2 left-1/2 -translate-x-1/2 text-white/20 animate-bounce" size={16} />
        </div>

        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 z-50 bg-[#020205]/90 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center">
            {gameState === 'START' ? (
              <>
                <Zap size={100} className="text-indigo-500 mb-8" />
                <h1 className="text-7xl font-black mb-4 uppercase italic tracking-tighter leading-none">
                  NEO<span className="text-indigo-500">PIN</span>
                </h1>
                <p className="text-indigo-400/60 text-[10px] font-bold tracking-[0.4em] mb-16 uppercase">Physical Logic Engine v2.5</p>
              </>
            ) : (
              <>
                <Trophy size={100} className="text-yellow-500 mb-8 animate-pulse" />
                <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase">MISSION COMPLETE</h2>
                <div className="text-7xl font-black text-white mb-16 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">{score.toLocaleString()}</div>
              </>
            )}
            
            <button 
              onClick={startGame} 
              className="group relative bg-white text-black font-black px-16 py-6 rounded-3xl overflow-hidden transition-all hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-3 text-2xl tracking-tight uppercase">
                {gameState === 'START' ? 'Engage' : 'Re-Engage'} <PlayCircle size={28} />
              </span>
              <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-10 grid grid-cols-3 gap-16 text-[11px] text-slate-500 font-black tracking-[0.25em]">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="bg-[#1e1e30] px-4 py-2 rounded-xl text-white border border-white/5 shadow-xl min-w-[48px]">A</span>
          <span>L-FLIP</span>
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="bg-indigo-600 px-4 py-2 rounded-xl text-white border border-white/20 shadow-[0_0_20px_rgba(99,102,241,0.4)]">SPACE</span>
          <span>PULSE</span>
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="bg-[#1e1e30] px-4 py-2 rounded-xl text-white border border-white/5 shadow-xl min-w-[48px]">D</span>
          <span>R-FLIP</span>
        </div>
      </div>
    </div>
  );
}