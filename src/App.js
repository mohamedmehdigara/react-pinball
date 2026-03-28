import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Zap, Trophy, Cpu, Play, ChevronRight } from 'lucide-react';

/**
 * CONSTANTS & CONFIGURATION
 */
const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 22;
const BALL_RADIUS = 0.35;
const GRAVITY = -0.12;
const FRICTION = 0.992;
const FLIPPER_LENGTH = 3.0;
const FLIPPER_WIDTH = 0.6;
const BUMPER_RADIUS = 0.8;

const App = () => {
  const mountRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER

  // The engineRef holds the non-reactive physics state to avoid React lag
  const engineRef = useRef({
    ball: { 
      pos: new THREE.Vector3(4, -5, BALL_RADIUS), 
      vel: new THREE.Vector3(0, 0, 0),
      mesh: null 
    },
    flippers: {
      left: { mesh: null, angle: -0.4, target: -0.4 },
      right: { mesh: null, angle: 0.4, target: 0.4 }
    },
    bumpers: [],
    keys: {},
    score: 0,
    gameState: 'START'
  });

  // Keep ref in sync with state for the engine
  useEffect(() => {
    engineRef.current.gameState = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // --- THREE.JS SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -18, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    const mainLight = new THREE.PointLight(0x00ffff, 2, 50);
    mainLight.position.set(0, 5, 10);
    scene.add(mainLight);

    const pinkLight = new THREE.PointLight(0xff00ff, 1.5, 30);
    pinkLight.position.set(0, -10, 5);
    scene.add(pinkLight);

    // --- GAME WORLD OBJECTS ---
    
    // Floor & Grid
    const floorGeo = new THREE.PlaneGeometry(BOARD_WIDTH, BOARD_HEIGHT);
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x050510, shininess: 100 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    scene.add(floor);

    const grid = new THREE.GridHelper(24, 24, 0x00ffff, 0x112244);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = 0.01;
    scene.add(grid);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1a3a, metalness: 0.8, roughness: 0.2 });
    const createWall = (w, h, x, y) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2), wallMat);
      mesh.position.set(x, y, 1);
      scene.add(mesh);
    };
    createWall(0.5, BOARD_HEIGHT, -BOARD_WIDTH / 2 - 0.25, 0); // Left
    createWall(0.5, BOARD_HEIGHT, BOARD_WIDTH / 2 + 0.25, 0);  // Right
    createWall(BOARD_WIDTH + 1, 0.5, 0, BOARD_HEIGHT / 2 + 0.25); // Top

    // Ball
    const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      metalness: 0.9, 
      roughness: 0.1,
      emissive: 0x222222 
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.set(4, -5, BALL_RADIUS);
    scene.add(ballMesh);
    engineRef.current.ball.mesh = ballMesh;

    // Flippers
    const createFlipper = (isLeft) => {
      const group = new THREE.Group();
      const geo = new THREE.CapsuleGeometry(FLIPPER_WIDTH / 2, FLIPPER_LENGTH - FLIPPER_WIDTH, 12, 12);
      geo.rotateZ(Math.PI / 2);
      geo.translate(isLeft ? FLIPPER_LENGTH / 2 : -FLIPPER_LENGTH / 2, 0, 0);
      const mat = new THREE.MeshStandardMaterial({ 
        color: isLeft ? 0x00ffff : 0xff00ff,
        emissive: isLeft ? 0x00ffff : 0xff00ff,
        emissiveIntensity: 0.6
      });
      const mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);
      group.position.set(isLeft ? -4 : 4, -9, BALL_RADIUS);
      scene.add(group);
      return group;
    };
    engineRef.current.flippers.left.mesh = createFlipper(true);
    engineRef.current.flippers.right.mesh = createFlipper(false);

    // Bumpers
    const createBumper = (x, y, color) => {
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(BUMPER_RADIUS, BUMPER_RADIUS, 1, 32),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1 })
      );
      mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
      group.position.set(x, y, 0.5);
      scene.add(group);
      return group;
    };
    engineRef.current.bumpers = [
      createBumper(-3, 4, 0x00ffff),
      createBumper(3, 4, 0xff00ff),
      createBumper(0, 7, 0xffff00),
      createBumper(-2.5, 9, 0x00ff00),
      createBumper(2.5, 9, 0xff0000),
    ];

    // --- INPUT ---
    const handleKeyDown = (e) => (engineRef.current.keys[e.code] = true);
    const handleKeyUp = (e) => (engineRef.current.keys[e.code] = false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // --- GAME LOOP ---
    let animationId;
    const update = () => {
      const engine = engineRef.current;
      const { ball, flippers, bumpers, keys, gameState } = engine;

      if (gameState === 'PLAYING') {
        // Flipper Logic
        flippers.left.target = (keys['KeyA'] || keys['ArrowLeft']) ? 0.6 : -0.4;
        flippers.right.target = (keys['KeyD'] || keys['ArrowRight']) ? -0.6 : 0.4;
        
        flippers.left.angle += (flippers.left.target - flippers.left.angle) * 0.4;
        flippers.right.angle += (flippers.right.target - flippers.right.angle) * 0.4;
        
        flippers.left.mesh.rotation.z = flippers.left.angle;
        flippers.right.mesh.rotation.z = flippers.right.angle;

        // Ball Physics
        ball.vel.y += GRAVITY;
        ball.vel.multiplyScalar(FRICTION);
        ball.pos.add(ball.vel.clone().multiplyScalar(0.12));

        // Wall Collisions
        if (Math.abs(ball.pos.x) > BOARD_WIDTH / 2 - BALL_RADIUS) {
          ball.vel.x *= -0.7;
          ball.pos.x = Math.sign(ball.pos.x) * (BOARD_WIDTH / 2 - BALL_RADIUS);
        }
        if (ball.pos.y > BOARD_HEIGHT / 2 - BALL_RADIUS) {
          ball.vel.y *= -0.7;
          ball.pos.y = BOARD_HEIGHT / 2 - BALL_RADIUS;
        }

        // Bumper Collisions
        bumpers.forEach(bumper => {
          const dx = ball.pos.x - bumper.position.x;
          const dy = ball.pos.y - bumper.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < BUMPER_RADIUS + BALL_RADIUS) {
            const angle = Math.atan2(dy, dx);
            ball.vel.set(Math.cos(angle) * 2.5, Math.sin(angle) * 2.5, 0);
            engine.score += 250;
            setScore(engine.score);
            
            // Visual feedback
            bumper.scale.set(1.5, 1.5, 1.5);
            setTimeout(() => bumper.scale.set(1, 1, 1), 60);
          }
        });

        // Flipper Collisions (Simplified projection)
        const checkFlipper = (fGroup, isLeft) => {
          const ballLocal = fGroup.worldToLocal(ball.pos.clone());
          const isActive = isLeft ? (flippers.left.angle > 0.2) : (flippers.right.angle < -0.2);
          
          const inRangeX = isLeft 
            ? (ballLocal.x > 0 && ballLocal.x < FLIPPER_LENGTH) 
            : (ballLocal.x < 0 && ballLocal.x > -FLIPPER_LENGTH);
            
          if (inRangeX && Math.abs(ballLocal.y) < FLIPPER_WIDTH) {
            ball.vel.y = Math.abs(ball.vel.y) * 0.5 + (isActive ? 3.0 : 1.5);
            ball.vel.x += isLeft ? 0.5 : -0.5;
            ball.pos.y += 0.5; // Eject
            engine.score += 50;
            setScore(engine.score);
          }
        };
        checkFlipper(flippers.left.mesh, true);
        checkFlipper(flippers.right.mesh, false);

        // Update Mesh
        ball.mesh.position.copy(ball.pos);

        // Death Check
        if (ball.pos.y < -BOARD_HEIGHT / 2 - 2) {
          setGameState('GAMEOVER');
        }
      }

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(update);
    };

    update();

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  const handleStart = useCallback(() => {
    const engine = engineRef.current;
    engine.score = 0;
    setScore(0);
    engine.ball.pos.set(4, -5, BALL_RADIUS);
    engine.ball.vel.set(-0.2, 3.5, 0);
    setGameState('PLAYING');
  }, []);

  useEffect(() => {
    if (gameState === 'GAMEOVER' && score > highScore) {
      setHighScore(score);
    }
  }, [gameState, score, highScore]);

  return (
    <div className="relative w-full h-screen bg-[#020205] overflow-hidden font-sans text-white">
      {/* Three.js Container */}
      <div ref={mountRef} className="w-full h-full cursor-none" />

      {/* Score HUD */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-none select-none">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-cyan-400/60 tracking-[0.2em] uppercase text-[10px] font-bold">
            <Trophy size={14} /> High Record
          </div>
          <div className="text-3xl font-black italic tracking-tighter">
            {highScore.toLocaleString()}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-pink-500/80 tracking-[0.2em] uppercase text-[10px] font-bold">
            Score <Zap size={14} />
          </div>
          <div className="text-5xl font-black italic tracking-tighter drop-shadow-[0_0_15px_rgba(236,72,153,0.4)]">
            {score.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Modal Overlays */}
      {gameState !== 'PLAYING' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <div className="mb-8 inline-flex p-5 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)]">
              <Cpu size={56} className="text-cyan-400 animate-pulse" />
            </div>

            <h1 className="text-6xl font-black mb-4 tracking-tighter uppercase italic leading-none">
              {gameState === 'START' ? 'Neon\nPulse' : 'System\nFailure'}
            </h1>

            <p className="text-gray-400 mb-12 text-xs font-bold uppercase tracking-[0.4em] opacity-70">
              {gameState === 'START' 
                ? 'High Fidelity Pinball Protocol' 
                : `Final Score: ${score.toLocaleString()}`}
            </p>

            <button 
              onClick={handleStart}
              className="group relative w-full overflow-hidden rounded-2xl bg-white p-5 text-black transition-all hover:scale-[1.03] active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-center gap-3 font-black text-xl uppercase tracking-tighter group-hover:text-white transition-colors">
                <Play size={24} fill="currentColor" />
                {gameState === 'START' ? 'Initialize' : 'Reboot System'}
              </div>
            </button>
            
            <div className="mt-10 flex flex-wrap justify-center gap-8 opacity-40">
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] border border-white/20">A</kbd>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] border border-white/20">D</kbd>
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase">Flippers</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] border border-white/20">←</kbd>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] border border-white/20">→</kbd>
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase">Alternate</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decorative footer */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 text-[9px] font-black text-white/10 tracking-[0.8em] uppercase pointer-events-none select-none">
        <ChevronRight size={12} /> Physical Simulation v2.5 <ChevronRight size={12} />
      </div>
    </div>
  );
};

export default App;