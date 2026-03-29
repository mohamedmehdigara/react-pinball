import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Cpu, Zap, Activity, Shield } from 'lucide-react';

const GRAVITY = -0.022;
const FRICTION = 0.992;
const BALL_RADIUS = 0.38;
const TABLE_WIDTH = 13;
const TABLE_HEIGHT = 24;

class Spark {
  constructor(pos, color) {
    this.pos = pos.clone();
    this.vel = new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, Math.random() * 0.2);
    this.life = 1.0;
    this.decay = 0.03 + Math.random() * 0.04;
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), material);
    this.mesh.position.copy(this.pos);
  }
  update() {
    this.pos.add(this.vel);
    this.life -= this.decay;
    this.mesh.position.copy(this.pos);
    this.mesh.material.opacity = this.life;
    this.mesh.scale.setScalar(Math.max(0.01, this.life));
  }
}

const App = () => {
  const mountRef = useRef(null);
  const [gameState, setGameState] = useState('START'); 
  const [score, setScore] = useState(0);
  const [ballsLeft, setBallsLeft] = useState(3);
  const [multiplier, setMultiplier] = useState(1);
  const [syncProgress, setSyncProgress] = useState(0);

  const engine = useRef({
    scene: null, camera: null, renderer: null,
    balls: [], particles: [],
    flippers: {
      left: { pivot: new THREE.Vector3(-3.2, -10, 0.5), angle: -0.4, target: -0.4, length: 3, mesh: null, active: false },
      right: { pivot: new THREE.Vector3(3.2, -10, 0.5), angle: 0.4, target: 0.4, length: 3, mesh: null, active: false }
    },
    bumpers: [],
    plunger: { mesh: null, basePos: -11, power: 0, isCharging: false },
    shake: 0,
    multiballProgress: 0,
    mainLight: null,
    clock: new THREE.Clock()
  });

  const spawnParticles = (pos, color, count = 10) => {
    for (let i = 0; i < count; i++) {
      const s = new Spark(pos, color);
      engine.current.particles.push(s);
      engine.current.scene.add(s.mesh);
    }
  };

  const createBall = useCallback((x, y, vx = 0, vy = 0) => {
    // High Visibility Gold Chrome Ball
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_RADIUS, 32, 32),
      new THREE.MeshStandardMaterial({ 
        color: 0xffcc00, 
        metalness: 1.0, 
        roughness: 0.05,
        emissive: 0xaa8800,
        emissiveIntensity: 0.5
      })
    );
    const light = new THREE.PointLight(0xffffff, 1.2, 5);
    mesh.add(light);
    mesh.position.set(x, y, 0.5);
    engine.current.scene.add(mesh);
    const ballObj = { mesh, pos: new THREE.Vector3(x, y, 0.5), vel: new THREE.Vector3(vx, vy, 0), active: true };
    engine.current.balls.push(ballObj);
    return ballObj;
  }, []);

  const initScene = useCallback(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010103);
    engine.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, -25, 28);
    camera.lookAt(0, -2, 0);
    engine.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    engine.current.renderer = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambient);

    const mainLight = new THREE.PointLight(0x00ffff, 3, 100);
    mainLight.position.set(0, 5, 20);
    scene.add(mainLight);
    engine.current.mainLight = mainLight;

    // Floor and Grid
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 50),
      new THREE.MeshStandardMaterial({ color: 0x050510, metalness: 0.8, roughness: 0.2 })
    );
    scene.add(floor);

    const grid = new THREE.GridHelper(50, 50, 0x00ffff, 0x111133);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.02;
    scene.add(grid);

    // Walls
    const createWall = (w, h, x, y, color = 0x222255) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.5), new THREE.MeshStandardMaterial({ color }));
      mesh.position.set(x, y, 1.25);
      scene.add(mesh);
    };
    createWall(0.5, TABLE_HEIGHT, -TABLE_WIDTH/2, 0);
    createWall(0.5, TABLE_HEIGHT, TABLE_WIDTH/2, 0);
    createWall(TABLE_WIDTH, 0.5, 0, TABLE_HEIGHT/2);
    createWall(0.3, 16, 5.0, -4, 0x4444aa); // Plunger Channel

    // High Vis Plunger Launcher
    const plungerMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.8, 1.5),
        new THREE.MeshStandardMaterial({ color: 0xff0066, emissive: 0xff0066, emissiveIntensity: 2 })
    );
    plungerMesh.position.set(5.75, -11, 0.75);
    scene.add(plungerMesh);
    engine.current.plunger.mesh = plungerMesh;

    // Flippers
    const setupFlipper = (side) => {
      const f = engine.current.flippers[side];
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.35, 2.3, 8, 16),
        new THREE.MeshStandardMaterial({ 
          color: 0x00ffee, 
          emissive: 0x00ffee, 
          emissiveIntensity: 1.5 
        })
      );
      mesh.rotation.z = Math.PI / 2;
      mesh.position.x = side === 'left' ? 1.2 : -1.2;
      group.add(mesh);
      group.position.copy(f.pivot);
      scene.add(group);
      f.mesh = group;
    };
    setupFlipper('left');
    setupFlipper('right');

    // Bumpers
    const addBumper = (x, y, color) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.0, 1.2, 32),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3 })
      );
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(x, y, 0.6);
      scene.add(mesh);
      engine.current.bumpers.push({ 
        mesh, 
        pos: new THREE.Vector3(x, y, 0.6), 
        radius: 1.0, 
        hit: 0, 
        baseColor: new THREE.Color(color) 
      });
    };
    addBumper(-3, 6, 0x00ffff);
    addBumper(3, 6, 0x00ffff);
    addBumper(0, 10, 0xff00ff);

    return { scene, camera, renderer };
  }, []);

  useEffect(() => {
    const { scene, camera, renderer } = initScene();

    const onKey = (e, down) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') engine.current.flippers.left.active = down;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') engine.current.flippers.right.active = down;
      if (e.code === 'Space') {
        engine.current.plunger.isCharging = down;
        if (!down && gameState === 'PLAYING') {
            const ballInLane = engine.current.balls.some(b => b.active && b.pos.x > 5.1 && b.pos.y < -5);
            if (!ballInLane) {
                createBall(5.75, -10.5, 0, 0.5 + engine.current.plunger.power * 1.5);
                engine.current.plunger.power = 0;
            }
        }
      }
    };

    const handleDown = (e) => onKey(e, true);
    const handleUp = (e) => onKey(e, false);
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);

    let frame;
    const loop = () => {
      if (gameState === 'PLAYING') {
        // Plunger Physics & Visuals
        const p = engine.current.plunger;
        if (p.isCharging) {
            p.power = Math.min(p.power + 0.025, 1.0);
            p.mesh.position.y = p.basePos - p.power * 1.5;
            p.mesh.material.emissiveIntensity = 2 + p.power * 10;
        } else {
            p.mesh.position.y += (p.basePos - p.mesh.position.y) * 0.4;
            p.mesh.material.emissiveIntensity = 2;
        }

        // Particle Update
        for (let i = engine.current.particles.length - 1; i >= 0; i--) {
            const part = engine.current.particles[i];
            part.update();
            if (part.life <= 0) {
                scene.remove(part.mesh);
                engine.current.particles.splice(i, 1);
            }
        }

        // Flipper Animation
        Object.keys(engine.current.flippers).forEach(k => {
          const f = engine.current.flippers[k];
          const isL = k === 'left';
          const target = f.active ? (isL ? 0.8 : -0.8) : (isL ? -0.4 : 0.4);
          f.angle += (target - f.angle) * 0.5;
          f.mesh.rotation.z = f.angle;
        });

        // Ball Physics Loop
        engine.current.balls.forEach((ball, bIdx) => {
          if (!ball.active) return;
          ball.vel.y += GRAVITY;
          ball.vel.multiplyScalar(FRICTION);
          ball.pos.add(ball.vel);

          // Walls & Bounds
          if (ball.pos.x < -TABLE_WIDTH/2 + BALL_RADIUS + 0.25) { ball.pos.x = -TABLE_WIDTH/2 + BALL_RADIUS + 0.25; ball.vel.x *= -0.6; }
          if (ball.pos.x > TABLE_WIDTH/2 - BALL_RADIUS - 0.25) { ball.pos.x = TABLE_WIDTH/2 - BALL_RADIUS - 0.25; ball.vel.x *= -0.6; }
          if (ball.pos.y > TABLE_HEIGHT/2 - BALL_RADIUS - 0.25) { ball.pos.y = TABLE_HEIGHT/2 - BALL_RADIUS - 0.25; ball.vel.y *= -0.6; }
          
          // Launcher One-way Gate
          if (ball.pos.x > 5.0 - BALL_RADIUS && ball.pos.x < 5.0 && ball.pos.y < 8 && ball.vel.x > 0) {
             ball.pos.x = 5.0 - BALL_RADIUS; ball.vel.x *= -0.7;
          }

          // Bumper Logic
          engine.current.bumpers.forEach(b => {
            const dist = ball.pos.distanceTo(b.pos);
            if (dist < b.radius + BALL_RADIUS) {
              const normal = new THREE.Vector3().subVectors(ball.pos, b.pos).normalize();
              ball.pos.copy(b.pos).add(normal.multiplyScalar(b.radius + BALL_RADIUS + 0.05));
              ball.vel.reflect(normal).multiplyScalar(1.65);
              b.hit = 1.0;
              setScore(s => s + (250 * multiplier));
              spawnParticles(ball.pos, b.baseColor, 15);
              
              engine.current.multiballProgress += 5;
              setSyncProgress(Math.min(engine.current.multiballProgress, 100));
              if (engine.current.multiballProgress >= 100) {
                createBall(0, 8, -0.3, -0.1);
                setMultiplier(m => m + 1);
                engine.current.multiballProgress = 0;
                engine.current.shake = 0.8;
              }
            }
          });

          // Flipper Collisions
          Object.keys(engine.current.flippers).forEach(k => {
            const f = engine.current.flippers[k];
            const isL = k === 'left';
            const tip = new THREE.Vector3(f.pivot.x + Math.cos(f.angle) * (isL ? f.length : -f.length), f.pivot.y + Math.sin(f.angle) * (isL ? f.length : -f.length), 0.5);
            const line = new THREE.Vector3().subVectors(tip, f.pivot);
            const bToP = new THREE.Vector3().subVectors(ball.pos, f.pivot);
            const t = Math.max(0, Math.min(1, bToP.dot(line) / line.lengthSq()));
            const closest = new THREE.Vector3().addVectors(f.pivot, line.multiplyScalar(t));
            
            if (ball.pos.distanceTo(closest) < BALL_RADIUS + 0.2) {
              const n = new THREE.Vector3().subVectors(ball.pos, closest).normalize();
              ball.pos.copy(closest).add(n.multiplyScalar(BALL_RADIUS + 0.21));
              const kickPower = f.active ? 0.9 : 0.15;
              ball.vel.reflect(n).multiplyScalar(0.4).add(n.multiplyScalar(kickPower));
              if (f.active) {
                spawnParticles(ball.pos, 0x00ffee, 8);
                engine.current.shake = 0.3;
              }
            }
          });

          ball.mesh.position.copy(ball.pos);

          // Drain
          if (ball.pos.y < -15) {
            ball.active = false;
            scene.remove(ball.mesh);
            engine.current.balls.splice(bIdx, 1);
            if (engine.current.balls.filter(b => b.active).length === 0) {
              setBallsLeft(prev => {
                if (prev <= 1) { setGameState('GAMEOVER'); return 0; }
                return prev - 1;
              });
            }
          }
        });

        // Bumper Flash Rendering
        engine.current.bumpers.forEach(b => {
            if (b.hit > 0) {
                b.hit -= 0.05;
                b.mesh.scale.setScalar(1 + b.hit * 0.3);
                b.mesh.material.emissiveIntensity = 3 + b.hit * 12;
            } else {
                b.mesh.scale.setScalar(1);
                b.mesh.material.emissiveIntensity = 3;
            }
        });
        
        // Camera Shake
        if (engine.current.shake > 0) {
            camera.position.x = (Math.random() - 0.5) * engine.current.shake;
            camera.position.y = -25 + (Math.random() - 0.5) * engine.current.shake;
            engine.current.shake *= 0.9;
        } else {
            camera.position.x = 0;
            camera.position.y = -25;
        }
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [gameState, multiplier, createBall, initScene]);

  const startReset = () => {
    engine.current.balls.forEach(b => { if (b.mesh) engine.current.scene.remove(b.mesh); });
    engine.current.balls = [];
    engine.current.multiballProgress = 0;
    setScore(0); setBallsLeft(3); setMultiplier(1); setSyncProgress(0);
    setGameState('PLAYING');
  };

  return (
    <div className="relative w-full h-screen bg-black text-white font-mono overflow-hidden select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* Stats UI */}
      <div className="absolute top-10 left-10 space-y-6 pointer-events-none">
        <div className="flex items-center gap-6">
            <div className="p-4 bg-cyan-500/10 border-2 border-cyan-500/40 rounded-xl">
                <Cpu size={32} className="text-cyan-400 animate-pulse" />
            </div>
            <div>
                <div className="text-xs text-cyan-400 font-black tracking-widest uppercase opacity-80">Score Engine</div>
                <div className="text-6xl font-black tabular-nums tracking-tighter shadow-cyan-500/50 drop-shadow-lg">
                    {score.toLocaleString()}
                </div>
            </div>
        </div>
        
        <div className="flex gap-3">
            {[...Array(3)].map((_, i) => (
                <div key={i} className={`h-2.5 w-16 rounded-full transition-all duration-700 ${i < ballsLeft ? 'bg-pink-500 shadow-[0_0_20px_#ec4899]' : 'bg-white/10'}`} />
            ))}
        </div>
      </div>

      <div className="absolute top-10 right-10 text-right">
        <div className="text-xs text-yellow-500 font-black tracking-[0.3em] uppercase mb-1">X-Multiplier</div>
        <div className="text-8xl font-black italic text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]">
            {multiplier}
        </div>
      </div>

      {/* HUD Bar */}
      <div className="absolute left-10 bottom-10 flex items-center gap-4">
        <div className="w-8 h-48 bg-white/5 border border-white/10 rounded-lg p-1 relative overflow-hidden">
            <div 
                className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-cyan-600 to-cyan-300 shadow-[0_0_25px_#06b6d4] transition-all duration-300"
                style={{ height: `${syncProgress}%` }}
            />
        </div>
        <div className="[writing-mode:vertical-lr] text-[10px] font-bold text-cyan-400/60 tracking-[1em]">SYSTEM_SYNC_STATUS</div>
      </div>

      {/* Start/GameOver Screen */}
      {gameState !== 'PLAYING' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center space-y-12">
            <div className="space-y-2">
                <h1 className="text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-cyan-800">
                    {gameState === 'GAMEOVER' ? 'CRITICAL_FAIL' : 'CYBER_BALL'}
                </h1>
                <div className="flex justify-center items-center gap-6 text-cyan-400 font-bold tracking-[0.8em]">
                    <Shield size={20} />
                    AUTHORIZED_USERS_ONLY
                    <Shield size={20} />
                </div>
            </div>

            <button 
                onClick={startReset}
                className="group relative px-20 py-8 overflow-hidden rounded-lg bg-white text-black font-black text-3xl italic tracking-tighter transition-all hover:scale-105 active:scale-95"
            >
                <span className="relative z-10">{gameState === 'GAMEOVER' ? 'RE-INITIALIZE' : 'BOOT_CORE'}</span>
                <div className="absolute inset-0 bg-cyan-400 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
            </button>
            
            <div className="flex gap-12 justify-center opacity-30 text-xs font-bold tracking-widest uppercase">
                <div className="flex flex-col gap-2"><div className="p-3 border rounded">A / D</div>Flippers</div>
                <div className="flex flex-col gap-2"><div className="p-3 border rounded">Space</div>Launcher</div>
            </div>
          </div>
        </div>
      )}

      {/* Charge Status */}
      {gameState === 'PLAYING' && (
          <div className="absolute bottom-10 right-10 flex flex-col items-end gap-3">
             <div className="flex items-center gap-2 text-pink-500 font-bold italic">
                <Zap size={18} className={engine.current.plunger.isCharging ? 'animate-bounce' : ''} />
                LAUNCH_PRESSURE
             </div>
             <div className="w-80 h-4 bg-white/5 rounded-full overflow-hidden border border-white/20 p-1">
                <div 
                    className="h-full bg-gradient-to-r from-pink-600 to-pink-300 shadow-[0_0_20px_#ec4899] transition-all duration-75" 
                    style={{ width: `${engine.current.plunger.power * 100}%` }} 
                />
             </div>
          </div>
      )}
    </div>
  );
};

export default App;