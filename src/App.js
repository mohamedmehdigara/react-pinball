import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Zap, RotateCcw, Trophy, Cpu } from 'lucide-react';

const App = () => {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState('idle');
  const [plungerPower, setPlungerPower] = useState(0);

  const mountRef = useRef(null);
  const gameStateRef = useRef('idle');

  // Physics Constants
  const GRAVITY = 28;
  const FRICTION = 0.992;
  const FLIPPER_STRENGTH = 45;

  // Physics State Refs
  const ballRef = useRef({
    pos: new THREE.Vector3(4.75, 0.4, 9.5),
    vel: new THREE.Vector3(0, 0, 0),
    radius: 0.3,
    inLane: true
  });

  const flipperRefs = useRef({
    left: { 
      mesh: null, 
      angle: -0.45, 
      targetAngle: -0.45, 
      pivot: new THREE.Vector3(-2.8, 0.25, 8.5),
      angularVel: 0 
    },
    right: { 
      mesh: null, 
      angle: 0.45, 
      targetAngle: 0.45, 
      pivot: new THREE.Vector3(2.8, 0.25, 8.5),
      angularVel: 0
    }
  });

  const plungerRef = useRef({ mesh: null, power: 0, charging: false });

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 24, 16);
    camera.lookAt(0, -2, -2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // --- Materials ---
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x3b82f6, emissiveIntensity: 0.5 });
    const flipperMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.2 });
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.8 });

    // --- Table & Walls ---
    const table = new THREE.Mesh(new THREE.BoxGeometry(11, 0.5, 22), tableMat);
    table.position.y = -0.25;
    scene.add(table);

    const wallGeom = new THREE.BoxGeometry(1, 1, 1);
    const createWall = (w, h, d, x, y, z) => {
      const mesh = new THREE.Mesh(wallGeom, wallMat);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      scene.add(mesh);
    };

    createWall(0.4, 1.5, 22, -5.5, 0.5, 0); // Left
    createWall(0.4, 1.5, 22, 5.5, 0.5, 0);  // Right
    createWall(11, 1.5, 0.4, 0, 0.5, -11); // Top
    createWall(0.2, 1.2, 18, 4, 0.5, 2);   // Launch Lane wall

    // --- Plunger ---
    const plungerMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.4), flipperMat);
    plungerMesh.position.set(4.75, 0.4, 10.5);
    scene.add(plungerMesh);
    plungerRef.current.mesh = plungerMesh;

    // --- Ball ---
    const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), ballMat);
    scene.add(ballMesh);

    // --- Flippers ---
    const createFlipper = (side) => {
      const group = new THREE.Group();
      const geo = new THREE.BoxGeometry(2.6, 0.4, 0.6);
      // Proper pivot alignment: translate geometry so pivot is at the end
      geo.translate(side === 'left' ? 1.3 : -1.3, 0, 0);
      const mesh = new THREE.Mesh(geo, flipperMat);
      group.add(mesh);
      group.position.copy(flipperRefs.current[side].pivot);
      scene.add(group);
      return group;
    };
    flipperRefs.current.left.mesh = createFlipper('left');
    flipperRefs.current.right.mesh = createFlipper('right');

    // --- Lighting ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    const pointLight = new THREE.PointLight(0x3b82f6, 4, 50);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    // --- Input ---
    const keys = { left: false, right: false, space: false };
    const onKeyDown = (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
      if (e.code === 'Space') keys.space = true;
    };
    const onKeyUp = (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
      if (e.code === 'Space') keys.space = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // --- Physics Update Loop ---
    const clock = new THREE.Clock();

    const updatePhysics = (dt) => {
      if (gameStateRef.current !== 'playing') return;

      const ball = ballRef.current;
      
      // Plunger Logic
      if (keys.space) {
        plungerRef.current.charging = true;
        plungerRef.current.power = Math.min(plungerRef.current.power + 1.2 * dt, 1);
        plungerRef.current.mesh.position.z = 10.5 + (plungerRef.current.power * 0.8);
        setPlungerPower(plungerRef.current.power);
      } else if (plungerRef.current.charging) {
        if (ball.pos.z > 9 && ball.pos.x > 4.2) {
          ball.vel.z = -55 * plungerRef.current.power;
          ball.inLane = true;
        }
        plungerRef.current.charging = false;
        plungerRef.current.power = 0;
        plungerRef.current.mesh.position.z = 10.5;
        setPlungerPower(0);
      }

      // Physics Sub-stepping for stability
      const steps = 8;
      const subDt = dt / steps;

      for (let s = 0; s < steps; s++) {
        ball.vel.z += GRAVITY * subDt;
        ball.vel.multiplyScalar(Math.pow(FRICTION, subDt * 60));
        ball.pos.addScaledVector(ball.vel, subDt);

        // Flipper Collisions
        ['left', 'right'].forEach(side => {
          const f = flipperRefs.current[side];
          f.targetAngle = keys[side] ? (side === 'left' ? 0.6 : -0.6) : (side === 'left' ? -0.45 : 0.45);
          
          const lastAngle = f.angle;
          f.angle += (f.targetAngle - f.angle) * 25 * subDt;
          f.angularVel = (f.angle - lastAngle) / subDt;
          f.mesh.rotation.y = f.angle;

          // Transform ball to flipper local space
          const relativePos = ball.pos.clone().sub(f.pivot);
          const localBall = relativePos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -f.angle);

          const isLeft = side === 'left';
          const flipperWidth = 2.6;
          const thickness = 0.4;

          const inX = isLeft 
            ? (localBall.x >= 0 && localBall.x <= flipperWidth) 
            : (localBall.x <= 0 && localBall.x >= -flipperWidth);

          if (inX && Math.abs(localBall.z) < (thickness + ball.radius)) {
            // Collision detected
            const kick = f.angularVel * FLIPPER_STRENGTH * subDt;
            ball.vel.z = -15 - Math.abs(kick * 1.5);
            ball.vel.x += (isLeft ? 8 : -8) + (f.angularVel * 5);
            
            // Push ball out of geometry
            localBall.z = localBall.z > 0 ? (thickness + ball.radius + 0.1) : -(thickness + ball.radius + 0.1);
            ball.pos.copy(localBall.applyAxisAngle(new THREE.Vector3(0, 1, 0), f.angle).add(f.pivot));
            
            setScore(prev => prev + 100);
          }
        });

        // Table Borders
        if (ball.pos.x < -5.2) { ball.pos.x = -5.2; ball.vel.x *= -0.5; }
        if (ball.pos.x > 5.2) { ball.pos.x = 5.2; ball.vel.x *= -0.5; }
        if (ball.pos.z < -10.7) { ball.pos.z = -10.7; ball.vel.z *= -0.5; setScore(p => p + 25); }

        // Exit Launch Lane
        if (ball.pos.x < 4.0) ball.inLane = false;
        if (ball.pos.x > 4.0 && ball.pos.z > -8 && !ball.inLane) {
            ball.pos.x = 3.95;
            ball.vel.x *= -0.5;
        }
      }

      if (ball.pos.z > 12) setGameState('gameover');
    };

    const animate = () => {
      const dt = Math.min(clock.getDelta(), 0.1);
      updatePhysics(dt);
      ballMesh.position.copy(ballRef.current.pos);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  const handleStart = () => {
    ballRef.current.pos.set(4.75, 0.4, 9.5);
    ballRef.current.vel.set(0, 0, 0);
    ballRef.current.inLane = true;
    setScore(0);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState === 'gameover' && score > highScore) setHighScore(score);
  }, [gameState, score]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative font-sans text-white">
      <div ref={mountRef} className="absolute inset-0" />
      
      <div className="absolute top-8 left-8 z-10 flex flex-col gap-4 pointer-events-none select-none">
        <div className="bg-black/60 border border-blue-500/40 p-6 backdrop-blur-xl rounded-2xl">
          <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">SCORE</div>
          <div className="text-5xl font-black italic tracking-tighter tabular-nums">{score.toLocaleString()}</div>
        </div>
        <div className="bg-black/40 border border-white/10 p-4 backdrop-blur-md rounded-xl flex items-center gap-3">
          <Trophy size={18} className="text-yellow-500" />
          <div className="text-xl font-black italic text-blue-100">{highScore.toLocaleString()}</div>
        </div>
      </div>

      <div className="absolute bottom-8 left-8 z-10 text-[10px] text-white/30 font-bold tracking-[0.3em] uppercase">
        [A/D] Flip • [Space] Plunger
      </div>

      {gameState === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
          <div className="text-center">
            <Cpu className="text-blue-500 mb-6 mx-auto animate-pulse" size={64} />
            <h1 className="text-7xl font-black italic tracking-tighter mb-8 bg-gradient-to-b from-white to-blue-500 bg-clip-text text-transparent">NEON<span className="text-blue-500">HORIZON</span></h1>
            <button onClick={handleStart} className="px-12 py-4 bg-white text-black font-black rounded-full hover:scale-110 transition-transform">ENGAGE</button>
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/80 backdrop-blur-xl z-50">
          <div className="text-center p-12 bg-black border-2 border-red-500 rounded-3xl">
            <h2 className="text-6xl font-black italic mb-2 uppercase">GAME OVER</h2>
            <div className="text-2xl font-bold text-red-500 mb-8 tracking-widest">FINAL: {score.toLocaleString()}</div>
            <button onClick={handleStart} className="flex items-center gap-3 bg-white text-black font-black px-10 py-5 rounded-full mx-auto hover:bg-red-500 hover:text-white transition-colors">
              <RotateCcw size={20} /> RETRY
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="absolute right-10 bottom-20 flex flex-col items-center">
          <div className="w-4 h-48 bg-white/10 rounded-full overflow-hidden flex flex-col justify-end p-1">
            <div className="w-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] rounded-full transition-all duration-75" style={{ height: `${plungerPower * 100}%` }} />
          </div>
          <Zap size={20} className="text-blue-400 mt-4" />
        </div>
      )}
    </div>
  );
};

export default App;