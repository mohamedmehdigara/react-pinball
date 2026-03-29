import React, { useEffect, useRef, useState, useCallback } from 'react';
import { create } from 'zustand';
import Matter from 'matter-js';
import { Trophy, RefreshCw, Play, Zap, Heart, Award } from 'lucide-react';

/**
 * GAME STATE MANAGEMENT
 * Using Zustand to decouple game logic from the React render cycle,
 * preventing stale closures in Matter.js event listeners.
 */
const useGameStore = create((set, get) => ({
  score: 0,
  balls: 3,
  gameState: 'START', // 'START', 'PLAYING', 'GAMEOVER'
  highScore: parseInt(localStorage.getItem('pinball-highscore')) || 0,
  
  addScore: (points) => {
    const newScore = get().score + points;
    set({ score: newScore });
    if (newScore > get().highScore) {
      set({ highScore: newScore });
      localStorage.setItem('pinball-highscore', newScore.toString());
    }
  },
  
  loseBall: () => {
    const remaining = get().balls - 1;
    if (remaining <= 0) {
      set({ balls: 0, gameState: 'GAMEOVER' });
    } else {
      set({ balls: remaining });
    }
  },
  
  startGame: () => {
    set({ gameState: 'PLAYING', score: 0, balls: 3 });
  }
}));

const App = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(Matter.Engine.create());
  const runnerRef = useRef(null);
  const renderRef = useRef(null);
  
  // Local refs for physics objects to avoid React state lag
  const leftFlipperRef = useRef(null);
  const rightFlipperRef = useRef(null);

  const { score, balls, gameState, highScore, addScore, loseBall, startGame } = useGameStore();

  const WIDTH = 400;
  const HEIGHT = 650;

  const initPhysics = useCallback(() => {
    const engine = engineRef.current;
    const world = engine.world;
    world.gravity.y = 1.5; // High gravity for fast-paced action

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: WIDTH,
        height: HEIGHT,
        wireframes: false,
        background: '#020617', // Slate 950
        pixelRatio: window.devicePixelRatio
      }
    });
    renderRef.current = render;

    // --- Boundaries ---
    const wallProps = { isStatic: true, friction: 0, restitution: 0.5, render: { fillStyle: '#1e293b' } };
    const walls = [
      Matter.Bodies.rectangle(WIDTH / 2, -10, WIDTH, 40, wallProps), // Top
      Matter.Bodies.rectangle(-10, HEIGHT / 2, 40, HEIGHT, wallProps), // Left
      Matter.Bodies.rectangle(WIDTH + 10, HEIGHT / 2, 40, HEIGHT, wallProps), // Right
      // Plunger Lane Wall
      Matter.Bodies.rectangle(WIDTH - 50, HEIGHT - 150, 10, 350, wallProps)
    ];

    // Out of bounds sensor
    const voidSensor = Matter.Bodies.rectangle(WIDTH / 2, HEIGHT + 50, WIDTH, 60, {
      isStatic: true, isSensor: true, label: 'VOID'
    });

    // --- Bumpers ---
    const createBumper = (x, y, radius, pts) => Matter.Bodies.circle(x, y, radius, {
      isStatic: true,
      label: 'BUMPER',
      plugin: { points: pts },
      restitution: 1.6,
      render: { fillStyle: '#e11d48', strokeStyle: '#fb7185', lineWidth: 4 }
    });

    const bumpers = [
      createBumper(120, 180, 25, 100),
      createBumper(280, 180, 25, 100),
      createBumper(200, 300, 30, 250)
    ];

    // --- Flippers Logic ---
    const createFlipper = (x, y, side) => {
      const isLeft = side === 'left';
      const group = Matter.Body.nextGroup(true);
      
      const flipper = Matter.Bodies.trapezoid(x, y, 100, 25, 0.2, {
        label: isLeft ? 'L_FLIPPER' : 'R_FLIPPER',
        collisionFilter: { group },
        chamfer: { radius: [12, 12, 5, 5] },
        render: { fillStyle: '#3b82f6' }
      });

      const pivot = Matter.Bodies.circle(isLeft ? x - 40 : x + 40, y, 5, {
        isStatic: true,
        collisionFilter: { group },
        render: { visible: false }
      });

      const constraint = Matter.Constraint.create({
        bodyA: flipper,
        bodyB: pivot,
        pointB: { x: 0, y: 0 },
        pointA: { x: isLeft ? -40 : 40, y: 0 },
        stiffness: 1,
        length: 0,
        render: { visible: false }
      });

      return { body: flipper, pivot, constraint };
    };

    const leftF = createFlipper(130, HEIGHT - 80, 'left');
    const rightF = createFlipper(WIDTH - 180, HEIGHT - 80, 'right');
    leftFlipperRef.current = leftF.body;
    rightFlipperRef.current = rightF.body;

    // Slingshots (triangular bumpers above flippers)
    const leftSling = Matter.Bodies.fromVertices(70, HEIGHT - 180, 
      [{x:0, y:0}, {x:40, y:60}, {x:0, y:100}], 
      { isStatic: true, label: 'BUMPER', plugin: { points: 50 }, restitution: 1.8, render: { fillStyle: '#1d4ed8' } }
    );

    Matter.Composite.add(world, [
      ...walls, voidSensor, ...bumpers, leftSling,
      leftF.body, leftF.pivot, leftF.constraint,
      rightF.body, rightF.pivot, rightF.constraint
    ]);

    // Collision Logic
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        
        if (labels.includes('BUMPER')) {
          const b = pair.bodyA.label === 'BUMPER' ? pair.bodyA : pair.bodyB;
          useGameStore.getState().addScore(b.plugin.points || 50);
          b.render.fillStyle = '#ffffff';
          setTimeout(() => b.render.fillStyle = (b.circleRadius ? '#e11d48' : '#1d4ed8'), 100);
        }

        if (labels.includes('VOID')) {
          const ball = pair.bodyA.label === 'BALL' ? pair.bodyA : (pair.bodyB.label === 'BALL' ? pair.bodyB : null);
          if (ball) {
            Matter.Composite.remove(world, ball);
            useGameStore.getState().loseBall();
          }
        }
      });
    });

    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    const handleKeyDown = (e) => {
      if (e.code === 'KeyZ' || e.code === 'ArrowLeft') {
        Matter.Body.setAngularVelocity(leftFlipperRef.current, -0.5);
      }
      if (e.code === 'KeyM' || e.code === 'ArrowRight') {
        Matter.Body.setAngularVelocity(rightFlipperRef.current, 0.5);
      }
      if (e.code === 'Space') {
        spawnBall();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      Matter.World.clear(world);
      render.canvas.remove();
    };
  }, []);

  useEffect(() => {
    const cleanup = initPhysics();
    return cleanup;
  }, [initPhysics]);

  const spawnBall = () => {
    const world = engineRef.current.world;
    const existingBalls = world.bodies.filter(b => b.label === 'BALL');
    
    // Prevent spawning if game is over or ball is already active
    if (useGameStore.getState().gameState !== 'PLAYING' || existingBalls.length > 0) return;

    const ball = Matter.Bodies.circle(WIDTH - 25, HEIGHT - 50, 12, {
      label: 'BALL',
      restitution: 0.5,
      friction: 0.01,
      density: 0.02,
      render: { fillStyle: '#f8fafc', strokeStyle: '#94a3b8', lineWidth: 2 }
    });

    Matter.Composite.add(world, ball);
    Matter.Body.applyForce(ball, ball.position, { x: 0, y: -0.4 });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 overflow-hidden select-none font-sans">
      
      {/* HUD */}
      <div className="w-full max-w-[400px] flex justify-between items-end mb-4 px-2">
        <div>
          <h2 className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em]">High Score</h2>
          <div className="flex items-center gap-2 text-amber-500">
            <Award size={16} />
            <span className="font-mono text-xl">{highScore.toLocaleString()}</span>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em]">Current Score</h2>
          <div className="text-3xl font-black text-white font-mono leading-none">
            {score.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="relative rounded-2xl border-[6px] border-slate-800 shadow-[0_0_60px_-15px_rgba(59,130,246,0.5)] overflow-hidden">
        <div ref={sceneRef} />

        {/* Dynamic Lives Indicator */}
        <div className="absolute top-4 left-4 flex gap-1.5">
          {[...Array(3)].map((_, i) => (
            <Heart 
              key={i} 
              size={14} 
              className={i < balls ? "fill-rose-500 text-rose-500" : "text-slate-800"} 
            />
          ))}
        </div>

        {/* Start Overlay */}
        {gameState === 'START' && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-8 backdrop-blur-md">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl rotate-12">
              <Zap size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter mb-2">NEON RUSH</h1>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Precision pinball physics. <br/>
              <span className="text-blue-400 font-bold">Z / M</span> to Flip. <span className="text-white font-bold">Space</span> to Launch.
            </p>
            <button 
              onClick={startGame}
              className="group relative px-12 py-4 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Play size={18} fill="black" /> INITIALIZE
              </span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-rose-950/95 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
            <Trophy size={64} className="text-amber-400 mb-4" />
            <h1 className="text-5xl font-black mb-2 tracking-tighter">FINISH</h1>
            <div className="bg-white/10 px-6 py-3 rounded-2xl mb-8">
              <span className="text-slate-300 text-xs block uppercase font-bold mb-1">Final Credits</span>
              <span className="text-3xl font-mono font-bold text-white">{score.toLocaleString()}</span>
            </div>
            <button 
              onClick={startGame}
              className="flex items-center gap-2 px-10 py-4 bg-white text-rose-950 font-black rounded-full transition-transform active:scale-90"
            >
              <RefreshCw size={20} /> REBOOT SYSTEM
            </button>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="mt-6 flex justify-between w-full max-w-[400px] text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
        <div className="flex items-center gap-2">
          <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded">Z</span>
          <span>Left</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded">SPACE</span>
          <span>Launch Ball</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Right</span>
          <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded">M</span>
        </div>
      </div>
    </div>
  );
};

export default App;