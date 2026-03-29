import React, { useEffect, useRef } from 'react';
import { create } from 'zustand';
import Matter from 'matter-js';
import { 
  Trophy, 
  Play, 
  RotateCcw, 
  Zap, 
  Gamepad2, 
  Flame,
  Layers
} from 'lucide-react';

// --- ZUSTAND GAME STORE ---
const useGameStore = create((set, get) => ({
  score: 0,
  highScore: 0,
  ballsRemaining: 3,
  multiplier: 1,
  combo: 0,
  gameState: 'START', // START, PLAYING, GAMEOVER
  activePowerUp: null,
  
  addPoints: (points) => {
    const currentScore = get().score;
    const bonus = points * get().multiplier;
    const newScore = currentScore + bonus;
    
    set((state) => ({ 
      score: newScore,
      combo: state.combo + 1,
      multiplier: Math.floor((state.combo + 1) / 10) + 1
    }));
  },

  resetCombo: () => set({ combo: 0, multiplier: 1 }),

  triggerPowerUp: (type) => {
    set({ activePowerUp: type });
    setTimeout(() => set({ activePowerUp: null }), 10000);
  },
  
  loseBall: () => {
    const remaining = get().ballsRemaining - 1;
    if (remaining <= 0) {
      const finalScore = get().score;
      set({ 
        ballsRemaining: 0, 
        gameState: 'GAMEOVER',
        highScore: Math.max(finalScore, get().highScore)
      });
    } else {
      set({ ballsRemaining: remaining, combo: 0, multiplier: 1 });
    }
  },
  
  startGame: () => set({ 
    score: 0, 
    ballsRemaining: 3, 
    gameState: 'PLAYING',
    combo: 0,
    multiplier: 1,
    activePowerUp: null
  })
}));

const App = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  
  const { score, highScore, ballsRemaining, multiplier, combo, gameState, activePowerUp } = useGameStore();
  const { addPoints, loseBall, startGame, triggerPowerUp } = useGameStore();

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;
    
    const engine = Engine.create({ gravity: { x: 0, y: 1.2 } });
    const world = engine.world; // Defined here to fix the no-undef error
    engineRef.current = engine;
    
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: 450,
        height: 750,
        wireframes: false,
        background: 'transparent',
      }
    });

    // --- WORLD BOUNDARIES ---
    const wallOpts = { isStatic: true, render: { fillStyle: '#1e293b' } };
    const ground = Bodies.rectangle(225, 760, 450, 40, { ...wallOpts, label: 'ground', isSensor: true });
    const leftWall = Bodies.rectangle(-10, 375, 20, 750, wallOpts);
    const rightWall = Bodies.rectangle(460, 375, 20, 750, wallOpts);
    const topWall = Bodies.rectangle(225, -10, 450, 20, wallOpts);
    
    const roofLeft = Bodies.rectangle(80, 40, 250, 20, { ...wallOpts, angle: Math.PI / 6 });
    const roofRight = Bodies.rectangle(370, 40, 250, 20, { ...wallOpts, angle: -Math.PI / 6 });

    // --- FLIPPERS ---
    const flipperGroup = Body.nextGroup(true);
    const createFlipper = (x, y, side) => {
      const isLeft = side === 'left';
      const flipper = Bodies.rectangle(x, y, 100, 20, {
        collisionFilter: { group: flipperGroup },
        chamfer: { radius: 10 },
        render: { fillStyle: isLeft ? '#38bdf8' : '#fb7185' },
        label: 'flipper'
      });
      
      const pivot = Bodies.circle(isLeft ? x - 40 : x + 40, y, 5, { isStatic: true, render: { visible: false } });
      const constraint = Matter.Constraint.create({
        bodyA: flipper,
        pointB: { x: isLeft ? -40 : 40, y: 0 },
        bodyB: pivot,
        stiffness: 0.8,
        length: 0
      });

      return { body: flipper, constraint, pivot };
    };

    const leftF = createFlipper(140, 680, 'left');
    const rightF = createFlipper(310, 680, 'right');

    const bumpers = [
      Bodies.circle(150, 220, 25, { isStatic: true, restitution: 1.5, label: 'bumper', render: { fillStyle: '#f43f5e' }, plugin: { pts: 100 } }),
      Bodies.circle(300, 220, 25, { isStatic: true, restitution: 1.5, label: 'bumper', render: { fillStyle: '#f43f5e' }, plugin: { pts: 100 } }),
      Bodies.circle(225, 340, 35, { isStatic: true, restitution: 1.8, label: 'bumper', render: { fillStyle: '#fbbf24' }, plugin: { pts: 500 } }),
      Bodies.rectangle(225, 120, 60, 15, { isStatic: true, label: 'powerup', render: { fillStyle: '#a855f7' }, chamfer: { radius: 5 } })
    ];

    const mainBall = Bodies.circle(415, 600, 12, {
      restitution: 0.4,
      friction: 0.001,
      density: 0.005,
      label: 'ball',
      render: { 
        fillStyle: '#f8fafc',
        shadowBlur: 15,
        shadowColor: '#38bdf8'
      }
    });

    World.add(world, [
      ground, leftWall, rightWall, topWall, roofLeft, roofRight,
      leftF.body, leftF.pivot, leftF.constraint,
      rightF.body, rightF.pivot, rightF.constraint,
      ...bumpers,
      mainBall
    ]);

    // --- CONTROLS ---
    const keys = {};
    const handleKey = (e) => { keys[e.code] = e.type === 'keydown'; };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);

    Events.on(engine, 'beforeUpdate', () => {
      if (keys['ArrowLeft']) Body.setAngularVelocity(leftF.body, -0.2);
      else Body.setAngularVelocity(leftF.body, 0.1);
      
      if (keys['ArrowRight']) Body.setAngularVelocity(rightF.body, 0.2);
      else Body.setAngularVelocity(rightF.body, -0.1);

      if (keys['Space'] && mainBall.position.x > 380 && mainBall.position.y > 500) {
        Body.applyForce(mainBall, mainBall.position, { x: 0, y: -0.015 });
      }
    });

    Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        
        if (labels.includes('bumper')) {
          const b = pair.bodyA.label === 'bumper' ? pair.bodyA : pair.bodyB;
          addPoints(b.plugin.pts);
          b.render.opacity = 0.4;
          setTimeout(() => { if(b.render) b.render.opacity = 1; }, 100);
        }

        if (labels.includes('powerup')) {
          triggerPowerUp('FRENZY');
          addPoints(1000);
        }

        if (labels.includes('ground') && labels.includes('ball')) {
          const ballBody = pair.bodyA.label === 'ball' ? pair.bodyA : pair.bodyB;
          loseBall();
          Body.setPosition(ballBody, { x: 415, y: 600 });
          Body.setVelocity(ballBody, { x: 0, y: 0 });
        }
      });
    });

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      Render.stop(render);
      Runner.stop(runner);
      World.clear(world);
      Engine.clear(engine);
      if (render.canvas) render.canvas.remove();
    };
  }, [gameState, addPoints, loseBall, triggerPowerUp]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100 overflow-hidden">
      
      {/* HUD */}
      <div className="w-full max-w-[450px] mb-4 grid grid-cols-3 gap-4 items-end">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white tabular-nums tracking-tighter">
              {score.toLocaleString()}
            </span>
            {multiplier > 1 && (
              <span className="text-sky-400 font-bold animate-pulse text-sm">x{multiplier}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Energy</span>
          <div className="flex gap-1.5">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className={`w-6 h-1.5 rounded-full transition-all duration-500 ${
                  i < ballsRemaining ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-slate-800'
                }`} 
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Combo</span>
          <span className={`text-2xl font-black transition-all ${combo > 0 ? 'text-amber-400 scale-110' : 'text-slate-700'}`}>
            {combo}
          </span>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative group">
        <div className="absolute -inset-4 bg-gradient-to-b from-sky-500/20 to-purple-500/20 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative w-[450px] h-[750px] bg-slate-900 border-[6px] border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
          {activePowerUp && (
            <div className="absolute top-10 inset-x-0 z-50 flex justify-center animate-bounce">
              <div className="bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-black tracking-widest flex items-center gap-2 shadow-lg shadow-purple-500/50">
                <Flame size={14} /> FRENZY MODE
              </div>
            </div>
          )}

          <div ref={sceneRef} className="w-full h-full" />

          {gameState === 'START' && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-12 text-center z-50">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-sky-500 blur-3xl opacity-20 animate-pulse" />
                <Gamepad2 size={80} className="text-sky-400 relative" />
              </div>
              <h1 className="text-5xl font-black italic tracking-tighter mb-4">NEON<br/>STRIKE</h1>
              <p className="text-slate-400 text-sm mb-10 leading-relaxed uppercase tracking-widest">
                Flippers: <span className="text-white">Arrows</span><br/>
                Launch: <span className="text-white">Spacebar</span>
              </p>
              <button 
                onClick={startGame}
                className="group relative bg-white text-slate-950 px-10 py-5 rounded-full font-black text-xl overflow-hidden hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
              >
                <div className="absolute inset-0 bg-sky-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center gap-3">
                  INITIATE <Play size={20} fill="currentColor" />
                </span>
              </button>
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 bg-rose-950/95 flex flex-col items-center justify-center p-8 z-50 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
                <Trophy size={40} className="text-rose-400" />
              </div>
              <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase">Game Over</h2>
              <div className="text-6xl font-black mb-8 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                {score.toLocaleString()}
              </div>
              
              <div className="flex gap-4 mb-10">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center min-w-[120px]">
                  <span className="text-[10px] uppercase font-bold text-rose-300/50">Best</span>
                  <span className="text-xl font-bold">{highScore.toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={startGame}
                className="flex items-center gap-3 bg-white text-rose-950 px-12 py-5 rounded-full font-black text-lg hover:bg-rose-50 active:scale-95 transition-all"
              >
                <RotateCcw size={22} /> RE-ENGAGE
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-12 text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
        <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" /><span>Bumper</span></div>
        <div className="flex items-center gap-3 text-purple-400"><Layers size={14} /><span>Power</span></div>
      </div>
    </div>
  );
};

export default App;