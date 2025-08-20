import React, { useRef, useEffect, useState, useCallback } from 'react';

// Main Pinball Game component
const App = () => {
  // Use a ref to get the canvas element for drawing the game
  const canvasRef = useRef(null);

  // Use refs for game elements to interact with them in the game loop
  const leftFlipperRef = useRef(null);
  const rightFlipperRef = useRef(null);
  const plungerRef = useRef(null);

  // The refs that were missing, now properly defined
  const loopShotRef = useRef(null);
  const popBumperRef = useRef(null);
  const magnetRef = useRef(null);
  const tubeRef = useRef(null);
  const tiltRef = useRef(null);
  const nudgeRef = useRef(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [message, setMessage] = useState("Press 'Space' to launch!");
  const [isGameOver, setIsGameOver] = useState(true);

  // State for the game's physics simulation
  const [ball, setBall] = useState({
    x: 0,
    y: 0,
    radius: 10,
    vx: 0,
    vy: 0,
    isLaunched: false
  });

  // State for game elements
  const [flippers, setFlippers] = useState({ leftAngle: 0, rightAngle: 0 });
  const [plungerPosition, setPlungerPosition] = useState(0);
  const [flapperState, setFlapperState] = useState(false);
  const [canPlunge, setCanPlunge] = useState(true); // New state variable
  const [isTilted, setTilt] = useState(false);      // New state variable
  const [nudgeCount, setNudgeCount] = useState(0);  // New state variable

  // Define the layout of the static game elements (bumpers, loops, etc.)
  const gameElements = [
    { id: 'popBumper', ref: popBumperRef, x: 250, y: 200, radius: 30, color: 'bg-indigo-500', score: 100 },
    { id: 'magnet', ref: magnetRef, x: 350, y: 350, radius: 25, color: 'bg-yellow-500', score: 50 },
    { id: 'loopShot', ref: loopShotRef, x: 150, y: 300, radius: 20, color: 'bg-green-500', score: 250 },
    { id: 'tube', ref: tubeRef, x: 450, y: 150, radius: 40, color: 'bg-red-500', score: 500 },
  ];

  // Game constants
  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 700;
  const FLIPPER_LENGTH = 70;
  const FLIPPER_ANGLE_DEFAULT = Math.PI / 6;
  const FLIPPER_ANGLE_FLIPPED = -Math.PI / 4;
  const GRAVITY = 0.5;
  const BUMPER_ELASTICITY = -0.8;
  const WALL_ELASTICITY = -0.9;
  const FLIPPER_ELASTICITY = -1.2;

  // Handles key presses for flippers and plunger
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'z' && flapperState) {
      setFlippers(prev => ({ ...prev, leftAngle: FLIPPER_ANGLE_FLIPPED }));
    }
    if (e.key === 'm' && flapperState) {
      setFlippers(prev => ({ ...prev, rightAngle: -FLIPPER_ANGLE_FLIPPED }));
    }
    if (e.key === ' ' && isGameOver && canPlunge) {
      if (plungerPosition < 100) {
        setPlungerPosition(p => p + 5);
      }
    }
    // New nudge logic
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      if (nudgeCount < 3) {
        setNudgeCount(n => n + 1);
        // You would add physics logic here to "nudge" the ball
      } else {
        setTilt(true);
        setMessage("TILT!");
      }
    }
  }, [flapperState, isGameOver, plungerPosition, canPlunge, nudgeCount]);

  // Handles key releases to reset flippers and launch the ball
  const handleKeyUp = useCallback((e) => {
    if (e.key === 'z') {
      setFlippers(prev => ({ ...prev, leftAngle: FLIPPER_ANGLE_DEFAULT }));
    }
    if (e.key === 'm') {
      setFlippers(prev => ({ ...prev, rightAngle: 0 }));
    }
    if (e.key === ' ' && isGameOver && plungerPosition > 0) {
      // Launch the ball with velocity based on plunger pull
      setBall(prev => ({
        ...prev,
        vx: 0,
        vy: -plungerPosition / 5,
        isLaunched: true
      }));
      setIsGameOver(false);
      setScore(0);
      setPlungerPosition(0);
      setFlapperState(true);
      setMessage("");
      setCanPlunge(false);
    }
  }, [isGameOver, plungerPosition]);

  // Use useEffect to add and clean up event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // The main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateGame = () => {
      if (!ball.isLaunched || isTilted) return;

      let newBall = { ...ball };

      // Apply gravity
      newBall.vy += GRAVITY;

      // Update ball position
      newBall.x += newBall.vx;
      newBall.y += newBall.vy;

      // Wall collision detection
      if (newBall.x + newBall.radius > CANVAS_WIDTH) {
        newBall.vx *= WALL_ELASTICITY;
        newBall.x = CANVAS_WIDTH - newBall.radius;
      } else if (newBall.x - newBall.radius < 0) {
        newBall.vx *= WALL_ELASTICITY;
        newBall.x = newBall.radius;
      }
      if (newBall.y + newBall.radius > CANVAS_HEIGHT) {
        // Game over condition: ball falls off the bottom
        setIsGameOver(true);
        setMessage("Game Over! Press 'Space' to play again.");
        if (score > highScore) {
          setHighScore(score);
        }
        setBall({ ...newBall, isLaunched: false, x: 450, y: 650, vx: 0, vy: 0 });
        setPlungerPosition(0);
        setFlapperState(false);
        setCanPlunge(true);
        setTilt(false);
        setNudgeCount(0);
        return;
      }
      if (newBall.y - newBall.radius < 0) {
        newBall.vy *= WALL_ELASTICITY;
        newBall.y = newBall.radius;
      }

      // Collision with game elements
      gameElements.forEach(element => {
        const dx = newBall.x - element.x;
        const dy = newBall.y - element.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < newBall.radius + element.radius) {
          // Calculate bounce direction
          const normalX = dx / distance;
          const normalY = dy / distance;
          const dotProduct = newBall.vx * normalX + newBall.vy * normalY;
          newBall.vx = (newBall.vx - 2 * dotProduct * normalX) * BUMPER_ELASTICITY;
          newBall.vy = (newBall.vy - 2 * dotProduct * normalY) * BUMPER_ELASTICITY;
          setScore(s => s + element.score);
          // Move ball to prevent sticking
          const overlap = (newBall.radius + element.radius) - distance;
          newBall.x += normalX * overlap;
          newBall.y += normalY * overlap;
        }
      });
      setBall(newBall);
    };

    // Main drawing function
    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw game elements
      gameElements.forEach(element => {
        ctx.fillStyle = element.color;
        ctx.beginPath();
        ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI);
        ctx.fill();
        // Add labels for elements
        ctx.fillStyle = 'white';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(element.id, element.x, element.y + 4);
      });

      // Draw plunger
      ctx.fillStyle = 'gray';
      ctx.fillRect(450, 600 + plungerPosition, 30, 80 - plungerPosition);

      // Draw flippers using their refs
      // Since we can't directly use refs in the canvas context, this is a conceptual drawing
      // in a full physics engine, you would use the ref's position and rotation
      // Here, we just use the state.
      ctx.fillStyle = 'hsl(210, 80%, 40%)';
      ctx.save();
      ctx.translate(150, 650);
      ctx.rotate(flippers.leftAngle);
      ctx.fillRect(0, -5, FLIPPER_LENGTH, 10);
      ctx.restore();

      ctx.save();
      ctx.translate(350, 650);
      ctx.rotate(flippers.rightAngle);
      ctx.fillRect(-FLIPPER_LENGTH, -5, FLIPPER_LENGTH, 10);
      ctx.restore();

      // Draw ball
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
      ctx.fill();

      // Update the DOM elements' positions from state for accessibility or other purposes
      // The refs are now correctly defined and can be used here.
      if (leftFlipperRef.current) {
        // Example of using a ref:
        // leftFlipperRef.current.style.transform = `rotate(${flippers.leftAngle}rad)`;
      }

    };

    let animationFrameId;
    const gameLoop = () => {
      updateGame();
      draw();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => cancelAnimationFrame(animationFrameId);
  }, [ball, flippers, plungerPosition, gameElements, isGameOver, score, highScore, isTilted, canPlunge]);

  // Initial ball position
  useEffect(() => {
    setBall(prev => ({ ...prev, x: 450, y: 650 }));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-extrabold mb-4 font-inter">Pinball</h1>
      <div className="flex justify-around w-full max-w-lg mb-4 text-center">
        <div className="p-4 bg-gray-800 rounded-lg shadow-lg">
          <p className="text-sm text-gray-400">Score</p>
          <p className="text-3xl font-bold">{score}</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg shadow-lg">
          <p className="text-sm text-gray-400">High Score</p>
          <p className="text-3xl font-bold">{highScore}</p>
        </div>
      </div>
      <div className="relative w-full max-w-lg overflow-hidden border-4 border-white rounded-2xl shadow-2xl">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="bg-gray-800 w-full"
        />
        {/*
          These are the elements that were causing the errors.
          They are now attached to their corresponding refs.
          While they are not visually styled here for simplicity,
          the refs can be used to control them programmatically.
        */}
        <div className="absolute top-[200px] left-[250px] transform -translate-x-1/2 -translate-y-1/2 rounded-full w-16 h-16" ref={popBumperRef}></div>
        <div className="absolute top-[350px] left-[350px] transform -translate-x-1/2 -translate-y-1/2 rounded-full w-12 h-12" ref={magnetRef}></div>
        <div className="absolute top-[300px] left-[150px] transform -translate-x-1/2 -translate-y-1/2 rounded-full w-10 h-10" ref={loopShotRef}></div>
        <div className="absolute top-[150px] left-[450px] transform -translate-x-1/2 -translate-y-1/2 rounded-full w-20 h-20" ref={tubeRef}></div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-lg font-semibold">{message}</p>
        {nudgeCount > 0 && (
          <p className="text-sm text-gray-400 mt-2">Nudges left: {3 - nudgeCount}</p>
        )}
      </div>
      <div className="mt-4 flex flex-col items-center">
        <p className="text-sm text-gray-400">Controls:</p>
        <p className="text-xl font-bold mt-2">
          <span className="bg-gray-700 px-3 py-1 rounded-md mx-1">Z</span> (Left Flipper)
          <span className="bg-gray-700 px-3 py-1 rounded-md mx-1">M</span> (Right Flipper)
          <span className="bg-gray-700 px-3 py-1 rounded-md mx-1">Space</span> (Plunger)
        </p>
        <p className="text-xl font-bold mt-2">
          <span className="bg-gray-700 px-3 py-1 rounded-md mx-1">Arrow Keys</span> (Nudge)
        </p>
      </div>
    </div>
  );
};

export default App;