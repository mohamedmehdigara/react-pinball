import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Zap, Shield, Target, RefreshCw } from 'lucide-react';

/**
 * CONSTANTS & CONFIG
 */
const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 22;
const BALL_RADIUS = 0.35;
const GRAVITY = -0.015; // Adjusted for frame-rate consistency
const RESTITUTION = 0.75; 
const FRICTION = 0.992; 

const App = () => {
  const mountRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('START'); 

  // Physics Engine Reference
  const engine = useRef({
    ball: {
      pos: new THREE.Vector3(5, -5, 0.4),
      vel: new THREE.Vector3(0, 0, 0),
      mesh: null
    },
    flippers: {
      left: { 
        pivot: new THREE.Vector3(-2.8, -8.5, 0.4), 
        angle: -0.4, 
        length: 2.8, 
        width: 0.45,
        mesh: null,
        isPressed: false
      },
      right: { 
        pivot: new THREE.Vector3(2.8, -8.5, 0.4), 
        angle: 0.4, 
        length: 2.8, 
        width: 0.45,
        mesh: null,
        isPressed: false
      }
    },
    colliders: [], // Static boundaries for physics
    bumpers: [],
    scene: null
  });

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    engine.current.scene = scene;
    scene.background = new THREE.Color(0x020205);

    const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, -16, 20);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);
    const mainLight = new THREE.PointLight(0x00ffff, 1.5, 50);
    mainLight.position.set(0, 5, 10);
    scene.add(mainLight);

    // --- BOARD ---
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(BOARD_WIDTH, BOARD_HEIGHT, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.2 })
    );
    board.position.z = -0.25;
    scene.add(board);

    // --- WALLS & COLLIDERS ---
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
    const colliders = [];

    const createWall = (w, h, x, y, rotation = 0) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2), wallMat);
      mesh.position.set(x, y, 1);
      mesh.rotation.z = rotation;
      scene.add(mesh);
      
      // Store for physics (simplified AABB/Circle for static walls)
      colliders.push({ mesh, x, y, w, h, rotation });
      return mesh;
    };

    // Outer Boundaries
    createWall(0.5, BOARD_HEIGHT, -BOARD_WIDTH/2, 0); 
    createWall(0.5, BOARD_HEIGHT, BOARD_WIDTH/2, 0);  
    createWall(BOARD_WIDTH, 0.5, 0, BOARD_HEIGHT/2); 

    // Slanted Guides
    createWall(6, 0.5, -4.8, -10, Math.PI / 6);
    createWall(6, 0.5, 4.8, -10, -Math.PI / 6);

    engine.current.colliders = colliders;

    // --- BUMPERS ---
    const bumperGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.8, 32);
    const bumperMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, emissiveIntensity: 0.5 });
    const bumperPos = [{x: -2.5, y: 5}, {x: 2.5, y: 5}, {x: 0, y: 8}];
    
    engine.current.bumpers = bumperPos.map(p => {
      const mesh = new THREE.Mesh(bumperGeo, bumperMat.clone());
      mesh.position.set(p.x, p.y, 0.5);
      mesh.rotation.x = Math.PI / 2;
      scene.add(mesh);
      return mesh;
    });

    // --- FLIPPERS ---
    const createFlipperMesh = (isLeft) => {
      const group = new THREE.Group();
      const capsule = new THREE.CapsuleGeometry(0.45, 2.2, 10, 16);
      capsule.rotateZ(Math.PI / 2);
      capsule.translate(isLeft ? 1.4 : -1.4, 0, 0);
      const mesh = new THREE.Mesh(capsule, new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x00f3ff, emissiveIntensity: 0.4 }));
      group.add(mesh);
      const f = engine.current.flippers[isLeft ? 'left' : 'right'];
      group.position.copy(f.pivot);
      scene.add(group);
      return group;
    };

    engine.current.flippers.left.mesh = createFlipperMesh(true);
    engine.current.flippers.right.mesh = createFlipperMesh(false);

    // --- BALL ---
    const ballMesh = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_RADIUS, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.9, roughness: 0.05 })
    );
    engine.current.ball.mesh = ballMesh;
    scene.add(ballMesh);

    // --- INPUTS ---
    const handleKey = (e, down) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') engine.current.flippers.left.isPressed = down;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') engine.current.flippers.right.isPressed = down;
    };
    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));

    // --- PHYSICS LOOP ---
    let animationId;
    const animate = () => {
      const b = engine.current.ball;
      const f = engine.current.flippers;

      if (gameState === 'PLAYING') {
        // Apply Gravity & Movement
        b.vel.y += GRAVITY;
        b.vel.multiplyScalar(FRICTION);
        b.pos.add(b.vel);

        // 1. Boundary / Static Wall Collisions
        if (Math.abs(b.pos.x) > BOARD_WIDTH/2 - BALL_RADIUS) {
          b.pos.x = (BOARD_WIDTH/2 - BALL_RADIUS) * Math.sign(b.pos.x);
          b.vel.x *= -RESTITUTION;
        }
        if (b.pos.y > BOARD_HEIGHT/2 - BALL_RADIUS) {
          b.pos.y = BOARD_HEIGHT/2 - BALL_RADIUS;
          b.vel.y *= -RESTITUTION;
        }

        // 2. Flipper Physics (Line-Segment Collision)
        Object.keys(f).forEach(side => {
          const flip = f[side];
          const isLeft = side === 'left';
          const targetAngle = flip.isPressed ? (isLeft ? 0.6 : -0.6) : (isLeft ? -0.4 : 0.4);
          const oldAngle = flip.angle;
          
          // Smoother Flipper Movement
          flip.angle += (targetAngle - flip.angle) * 0.4;
          flip.mesh.rotation.z = flip.angle;

          // Collision Check
          const p1 = flip.pivot.clone();
          const p2 = new THREE.Vector3(
            p1.x + Math.cos(flip.angle) * (isLeft ? flip.length : -flip.length),
            p1.y + Math.sin(flip.angle) * (isLeft ? flip.length : -flip.length),
            p1.z
          );

          const line = new THREE.Vector3().subVectors(p2, p1);
          const ballToP1 = new THREE.Vector3().subVectors(b.pos, p1);
          const t = Math.max(0, Math.min(1, ballToP1.dot(line) / line.lengthSq()));
          const closest = new THREE.Vector3().addVectors(p1, line.multiplyScalar(t));
          
          const dist = b.pos.distanceTo(closest);
          const minDist = BALL_RADIUS + flip.width;

          if (dist < minDist) {
            const normal = new THREE.Vector3().subVectors(b.pos, closest).normalize();
            b.pos.copy(closest).add(normal.multiplyScalar(minDist));
            
            // Flipper Kick Logic
            const flipSpeed = (flip.angle - oldAngle) * 1.5;
            const kickPower = Math.abs(flipSpeed) * 1.2;
            
            b.vel.reflect(normal).multiplyScalar(RESTITUTION);
            b.vel.add(normal.multiplyScalar(kickPower));
          }
        });

        // 3. Bumper Logic
        engine.current.bumpers.forEach(bm => {
          const dist = b.pos.distanceTo(bm.position);
          if (dist < 1.1) {
            const normal = new THREE.Vector3().subVectors(b.pos, bm.position).normalize();
            b.pos.copy(bm.position).add(normal.multiplyScalar(1.1));
            b.vel.reflect(normal).multiplyScalar(1.5);
            setScore(s => s + 50);
            bm.material.emissiveIntensity = 2;
          } else {
            bm.material.emissiveIntensity = THREE.MathUtils.lerp(bm.material.emissiveIntensity, 0.4, 0.1);
          }
        });

        // 4. Drain Check
        if (b.pos.y < -12) {
          setGameState('GAMEOVER');
        }

        b.mesh.position.copy(b.pos);
      }

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, [gameState]);

  const startGame = () => {
    engine.current.ball.pos.set(5.2, -8, 0.4);
    engine.current.ball.vel.set(-0.05, 0.45, 0);
    setScore(0);
    setGameState('PLAYING');
  };

  return (
    <div className="relative w-full h-screen bg-[#020205] text-white overflow-hidden font-mono select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* HUD */}
      <div className="absolute top-8 left-8 pointer-events-none">
        <div className="text-cyan-400 text-[10px] font-bold tracking-[0.2em] mb-1 uppercase opacity-60">System_Output</div>
        <div className="text-6xl font-black italic tracking-tighter tabular-nums text-white">
          {score.toLocaleString().padStart(6, '0')}
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-12 text-[10px] font-bold text-white/20 uppercase tracking-widest pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 border border-white/20 rounded text-white/60">A</span> 
          <span>Left_Actuator</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 border border-white/20 rounded text-white/60">D</span> 
          <span>Right_Actuator</span>
        </div>
      </div>

      {/* OVERLAYS */}
      {gameState !== 'PLAYING' && (
        <div className="absolute inset-0 bg-[#020205]/80 backdrop-blur-xl flex items-center justify-center p-6 z-50">
          <div className="max-w-sm w-full bg-[#0a0a1a] border border-white/5 rounded-[2rem] p-10 shadow-2xl text-center">
            <div className="w-24 h-24 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              {gameState === 'START' ? <Shield className="text-cyan-400" size={40} /> : <RefreshCw className="text-pink-500" size={40} />}
            </div>
            
            <h2 className="text-4xl font-black italic tracking-tighter mb-3 uppercase">
              {gameState === 'START' ? 'Core_Pinball' : 'Session_End'}
            </h2>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mb-10">
              {gameState === 'START' ? 'Initialising Physical Constraints' : `Link Terminated // Final Score: ${score}`}
            </p>

            <button 
              onClick={startGame}
              className="group relative w-full py-5 bg-white text-black font-black text-xl uppercase italic tracking-tighter rounded-2xl transition-all hover:bg-cyan-400 hover:scale-[1.02] active:scale-95 overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                <Zap size={24} fill="black" />
                {gameState === 'START' ? 'Initiate' : 'Retry'}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;