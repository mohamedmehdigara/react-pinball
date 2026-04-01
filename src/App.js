import React, { useEffect, useRef, useState, useCallback } from 'react';
import { create } from 'zustand';
import { LucideTrophy, LucidePlay, LucideRotateCcw, LucideZap, LucideChevronUp } from 'lucide-react';

/**
 * Game State Management
 */
const useGameStore = create((set) => ({
  score: 0,
  highScore: 0,
  gameState: 'START', 
  ballsLeft: 3,
  addScore: (points) => set((state) => ({ score: state.score + points })),
  startGame: () => set({ score: 0, gameState: 'PLAYING', ballsLeft: 3 }),
  endBall: () => set((state) => {
    const nextBalls = state.ballsLeft - 1;
    if (nextBalls <= 0) {
      return { 
        gameState: 'GAMEOVER', 
        ballsLeft: 0, 
        highScore: Math.max(state.score, state.highScore) 
      };
    }
    return { ballsLeft: nextBalls };
  }),
}));

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BALL_RADIUS = 8;
const GRAVITY = 0.25;
const FRICTION = 0.992;
const FLIPPER_LENGTH = 70;
const FLIPPER_WIDTH = 14;
const MAX_FLIPPER_ANGLE = 0.6; 
const FLIPPER_SPEED = 0.3;
const LAUNCHER_X = 375; 

const COLORS = {
  bg: '#05070a',
  ball: '#ffffff',
  flipper: '#38bdf8',
  flipperActive: '#7dd3fc',
  bumper: '#f43f5e',
  wall: '#1e293b',
  accent: '#6366f1',
  gold: '#fbbf24'
};

const App = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  
  // Ref-based physics state for 60fps performance
  const ball = useRef({ x: LAUNCHER_X, y: 550, vx: 0, vy: 0, inPlay: false });
  const flippers = useRef({
    left: { x: 130, y: 550, angle: 0.5, active: false, targetAngle: 0.5 },
    right: { x: 270, y: 550, angle: -0.5, active: false, targetAngle: -0.5 }
  });
  
  const bumpers = useRef([
    { x: 120, y: 150, r: 25, hit: 0, score: 500 },
    { x: 280, y: 150, r: 25, hit: 0, score: 500 },
    { x: 200, y: 260, r: 30, hit: 0, score: 1000 },
    { x: 70, y: 350, r: 20, hit: 0, score: 250 },
    { x: 330, y: 350, r: 20, hit: 0, score: 250 },
  ]);

  const { score, highScore, gameState, ballsLeft, addScore, startGame, endBall } = useGameStore();

  const launchBall = () => {
    // Only launch if the ball is in the chute (x > 350)
    if (ball.current.x > 350) {
      ball.current.vy = -22; 
      ball.current.vx = 0;
      ball.current.inPlay = false; // Stay false until it clears the top curve
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyZ' || e.code === 'ArrowLeft') flippers.current.left.active = true;
      if (e.code === 'KeyM' || e.code === 'ArrowRight') flippers.current.right.active = true;
      if (e.code === 'Space') {
        if (gameState !== 'PLAYING') startGame();
        else launchBall();
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'KeyZ' || e.code === 'ArrowLeft') flippers.current.left.active = false;
      if (e.code === 'KeyM' || e.code === 'ArrowRight') flippers.current.right.active = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, startGame]);

  const updatePhysics = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    const b = ball.current;
    b.vy += GRAVITY;
    b.vx *= FRICTION;
    b.vy *= FRICTION;

    const f = flippers.current;
    f.left.targetAngle = f.left.active ? -MAX_FLIPPER_ANGLE : 0.5;
    f.left.angle += (f.left.targetAngle - f.left.angle) * FLIPPER_SPEED;
    f.right.targetAngle = f.right.active ? MAX_FLIPPER_ANGLE : -0.5;
    f.right.angle += (f.right.targetAngle - f.right.angle) * FLIPPER_SPEED;

    b.x += b.vx;
    b.y += b.vy;

    // --- LAUNCHER LANE & TOP CURVE ---
    const chuteWallX = 350;
    
    // Top Curve Logic: If ball reaches the top of the chute
    if (b.y < 50 && b.x > 340) {
      b.vx = -10; // Kick it left into the main field
      b.vy = 2;
      b.inPlay = true;
    }

    // Walls
    // Side Walls
    if (b.x < BALL_RADIUS) { b.x = BALL_RADIUS; b.vx *= -0.5; }
    if (b.x > CANVAS_WIDTH - BALL_RADIUS) { b.x = CANVAS_WIDTH - BALL_RADIUS; b.vx *= -0.5; }
    if (b.y < BALL_RADIUS) { b.y = BALL_RADIUS; b.vy *= -0.5; }

    // Chute Internal Wall (Prevents entering chute from main field)
    if (b.inPlay) {
      if (b.x > chuteWallX - BALL_RADIUS && b.y > 80) {
        b.x = chuteWallX - BALL_RADIUS;
        b.vx *= -0.5;
      }
    } else {
      // Keep ball in chute until it goes over the top
      if (b.x < chuteWallX + BALL_RADIUS && b.y > 80) {
        b.x = chuteWallX + BALL_RADIUS;
        b.vx *= -0.2;
      }
    }

    // Drain & Reset
    if (b.y > CANVAS_HEIGHT + 50) {
      endBall();
      b.x = LAUNCHER_X; 
      b.y = 550; 
      b.vx = 0; 
      b.vy = 0; 
      b.inPlay = false;
    }

    // Bumpers Collision
    bumpers.current.forEach(bumper => {
      const dx = b.x - bumper.x;
      const dy = b.y - bumper.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bumper.r + BALL_RADIUS) {
        const nx = dx / dist;
        const ny = dy / dist;
        b.x = bumper.x + nx * (bumper.r + BALL_RADIUS);
        b.vx = nx * 14;
        b.vy = ny * 14;
        bumper.hit = 10;
        addScore(bumper.score);
      }
      if (bumper.hit > 0) bumper.hit--;
    });

    // Flipper Collision (Advanced Line-Segment Check)
    const checkFlipper = (flip, isLeft) => {
      const tipX = flip.x + Math.cos(flip.angle) * FLIPPER_LENGTH * (isLeft ? 1 : -1);
      const tipY = flip.y + Math.sin(flip.angle) * FLIPPER_LENGTH * (isLeft ? 1 : -1);
      
      const dx = tipX - flip.x;
      const dy = tipY - flip.y;
      const lengthSq = dx * dx + dy * dy;
      let t = ((b.x - flip.x) * dx + (b.y - flip.y) * dy) / lengthSq;
      t = Math.max(0, Math.min(1, t));
      
      const closestX = flip.x + t * dx;
      const closestY = flip.y + t * dy;
      const dist = Math.sqrt((b.x - closestX)**2 + (b.y - closestY)**2);

      if (dist < BALL_RADIUS + FLIPPER_WIDTH / 2) {
        const nx = (b.x - closestX) / dist;
        const ny = (b.y - closestY) / dist;
        b.x = closestX + nx * (BALL_RADIUS + FLIPPER_WIDTH / 2);
        b.y = closestY + ny * (BALL_RADIUS + FLIPPER_WIDTH / 2);
        
        // Flipper kick strength depends on activity
        const power = flip.active ? 15 : 5;
        b.vx = nx * power + b.vx * 0.2;
        b.vy = ny * power + b.vy * 0.2;
      }
    };
    checkFlipper(f.left, true);
    checkFlipper(f.right, false);

  }, [gameState, addScore, endBall]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Aesthetic Playfield Grid
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    for(let i=0; i<CANVAS_HEIGHT; i+=50) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
    }
    for(let i=0; i<CANVAS_WIDTH; i+=50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
    }

    // Launcher Chute Visuals
    ctx.strokeStyle = COLORS.wall;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(350, 600);
    ctx.lineTo(350, 80);
    ctx.quadraticCurveTo(350, 10, 200, 10); // The critical entry curve
    ctx.stroke();

    // Bumpers
    bumpers.current.forEach(bumper => {
      ctx.beginPath();
      ctx.arc(bumper.x, bumper.y, bumper.r + (bumper.hit * 1.2), 0, Math.PI * 2);
      ctx.fillStyle = bumper.hit > 0 ? '#fff' : COLORS.bumper;
      ctx.fill();
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Bumper glow
      if (bumper.hit > 0) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = COLORS.bumper;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });

    // Flippers
    const drawF = (f, isLeft) => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      ctx.lineCap = 'round';
      ctx.strokeStyle = f.active ? COLORS.flipperActive : COLORS.flipper;
      ctx.lineWidth = FLIPPER_WIDTH;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(isLeft ? FLIPPER_LENGTH : -FLIPPER_LENGTH, 0);
      ctx.stroke();
      ctx.restore();
    };
    drawF(flippers.current.left, true);
    drawF(flippers.current.right, false);

    // Ball
    const b = ball.current;
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.ball;
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'white';
    ctx.fill();
    ctx.shadowBlur = 0;

    updatePhysics();
    requestRef.current = requestAnimationFrame(draw);
  }, [updatePhysics]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(requestRef.current);
  }, [draw]);

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center font-sans text-slate-100 p-4 select-none">
      <div className="w-[400px] flex justify-between items-end mb-4 px-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LucideZap className="text-yellow-400 fill-yellow-400 w-4 h-4" />
            <h1 className="text-xl font-black italic tracking-tighter text-white">NEOPIN V4</h1>
          </div>
          <div className="flex gap-1.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${i < ballsLeft ? 'bg-sky-400' : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-widest">High Score</span>
          <span className="text-2xl font-mono text-white font-bold leading-none">{score.toLocaleString()}</span>
        </div>
      </div>

      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-3xl border-8 border-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black cursor-none"
        />

        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-8 text-center border-4 border-slate-800/50">
            {gameState === 'START' ? (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-sky-500 rounded-2xl flex items-center justify-center mb-6 mx-auto rotate-3 shadow-lg shadow-sky-500/20">
                    <LucidePlay className="w-10 h-10 text-white fill-white" />
                </div>
                <h2 className="text-4xl font-black mb-2 tracking-tighter italic">INSERT COIN</h2>
                <p className="text-slate-400 mb-8 text-sm font-medium uppercase tracking-widest">Z/M Keys • Space to Launch</p>
                <button 
                    onClick={startGame}
                    className="px-10 py-4 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-sky-400 hover:text-white transition-all shadow-xl"
                >
                    Start Game
                </button>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in duration-500">
                <LucideTrophy className="w-16 h-16 text-yellow-500 mb-4 mx-auto drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
                <h2 className="text-4xl font-black mb-1 italic">GAME OVER</h2>
                <div className="mb-8">
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Final Score</p>
                    <p className="text-3xl font-mono text-sky-400 font-bold">{score.toLocaleString()}</p>
                </div>
                <button 
                  onClick={startGame}
                  className="bg-sky-500 text-white font-black py-4 px-10 rounded-xl hover:bg-sky-400 transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  <LucideRotateCcw size={18} /> PLAY AGAIN
                </button>
              </div>
            )}
          </div>
        )}

        {gameState === 'PLAYING' && (
            <div className="absolute bottom-10 right-4 flex flex-col items-center opacity-40">
                <div className="animate-bounce">
                    <LucideChevronUp className="text-sky-400 w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Launch</span>
            </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-8 text-[10px] font-black text-slate-600 tracking-[0.3em] uppercase border-t border-slate-900 pt-6 w-[400px]">
        <div className="flex flex-col items-start gap-1">
            <span>Controls</span>
            <span className="text-slate-400">Z/Left • M/Right</span>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
            <span>System Status</span>
            <span className="text-emerald-500">Physics Stable</span>
        </div>
      </div>
    </div>
  );
};

export default App;