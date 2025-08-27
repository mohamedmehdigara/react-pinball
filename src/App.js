import React, { useRef, useEffect, useState, useCallback } from 'react';

// Main Pinball Game component
const App = () => {
 // Use a ref to get the canvas element for drawing the game
 const canvasRef = useRef(null);

 // State for the game's physics simulation
 const [score, setScore] = useState(0);
 const [highScore, setHighScore] = useState(0);
 const [message, setMessage] = useState("Press 'Space' to launch!");
 const [isGameOver, setIsGameOver] = useState(true);
 const [isTilted, setTilt] = useState(false);
 const [nudgeCount, setNudgeCount] = useState(0);
 const [canPlunge, setCanPlunge] = useState(true);

 const [ball, setBall] = useState({
 x: 0,
 y: 0,
 radius: 10,
 vx: 0,
 vy: 0,
 isLaunched: false
 });

 // State for game elements
 const [plungerPosition, setPlungerPosition] = useState(0);
 const [flippers, setFlippers] = useState({
 leftAngle: Math.PI / 6,
 rightAngle: -Math.PI / 6
 });
 const [gameElements] = useState([
 { id: 'Pop Bumper', x: 250, y: 200, radius: 30, color: 'rgb(255, 100, 100)', score: 100 },
 { id: 'Magnet', x: 350, y: 350, radius: 25, color: 'rgb(100, 200, 255)', score: 250 },
 { id: 'Loop Shot', x: 150, y: 300, radius: 20, color: 'rgb(255, 255, 100)', score: 500 },
 { id: 'Tube', x: 450, y: 150, radius: 40, color: 'rgb(150, 255, 150)', score: 750 },
 ]);

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

 // Flipper collision helper function
 const checkFlipperCollision = useCallback((ball, flipper) => {
 const flipperStart = { x: flipper.x, y: flipper.y };
 const flipperEnd = {
 x: flipper.x + FLIPPER_LENGTH * Math.cos(flipper.angle),
 y: flipper.y + FLIPPER_LENGTH * Math.sin(flipper.angle)
 };

 const lineX = flipperEnd.x - flipperStart.x;
 const lineY = flipperEnd.y - flipperStart.y;
 const lineLengthSq = lineX * lineX + lineY * lineY;
 const t = ((ball.x - flipperStart.x) * lineX + (ball.y - flipperStart.y) * lineY) / lineLengthSq;

 let closestPoint = {};
 if (t < 0) {
 closestPoint = flipperStart;
 } else if (t > 1) {
 closestPoint = flipperEnd;
 } else {
 closestPoint.x = flipperStart.x + t * lineX;
 closestPoint.y = flipperStart.y + t * lineY;
 }

 const dx = ball.x - closestPoint.x;
 const dy = ball.y - closestPoint.y;
 const distance = Math.sqrt(dx * dx + dy * dy);

 return {
 isColliding: distance < ball.radius,
 closestPoint,
 dx,
 dy
 };
 }, []);

 // Handles key presses for flippers and plunger
 const handleKeyDown = useCallback((e) => {
 if (isTilted) return;
 if (e.key === 'z') {
 setFlippers(prev => ({ ...prev, leftAngle: FLIPPER_ANGLE_FLIPPED }));
 }
 if (e.key === 'm') {
 setFlippers(prev => ({ ...prev, rightAngle: -FLIPPER_ANGLE_FLIPPED }));
 }
 if (e.key === ' ' && isGameOver && canPlunge) {
 if (plungerPosition < 100) {
 setPlungerPosition(p => p + 5);
 }
 }
 // Nudge logic
 if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp') && !isGameOver) {
 if (nudgeCount < 3) {
 setNudgeCount(n => n + 1);
 setBall(prev => ({
 ...prev,
 vx: prev.vx + (e.key === 'ArrowLeft' ? -1 : (e.key === 'ArrowRight' ? 1 : 0)),
 vy: prev.vy + (e.key === 'ArrowUp' ? -1 : 0)
 }));
 } else {
 setTilt(true);
 setMessage("TILT!");
 }
 }
 }, [isTilted, isGameOver, plungerPosition, canPlunge, nudgeCount]);

 // Handles key releases to reset flippers and launch the ball
 const handleKeyUp = useCallback((e) => {
 if (isTilted) return;
 if (e.key === 'z') {
 setFlippers(prev => ({ ...prev, leftAngle: FLIPPER_ANGLE_DEFAULT }));
 }
 if (e.key === 'm') {
 setFlippers(prev => ({ ...prev, rightAngle: -FLIPPER_ANGLE_DEFAULT }));
 }
 if (e.key === ' ' && isGameOver && plungerPosition > 0) {
 setBall(prev => ({
 ...prev,
 vx: 0,
 vy: -plungerPosition / 5,
 isLaunched: true
 }));
 setIsGameOver(false);
 setScore(0);
 setPlungerPosition(0);
 setMessage("");
 setCanPlunge(false);
 setTilt(false);
 setNudgeCount(0);
 }
 }, [isTilted, isGameOver, plungerPosition]);

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
 setBall(prevBall => {
 if (!prevBall.isLaunched || isTilted) return prevBall;

 let newBall = { ...prevBall };
 newBall.vy += GRAVITY;
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
 setIsGameOver(true);
 setMessage("Game Over! Press 'Space' to play again.");
 setHighScore(s => (score > s ? score : s));
 return { ...prevBall, isLaunched: false, x: 450, y: 650, vx: 0, vy: 0 };
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
 const normalX = dx / distance;
 const normalY = dy / distance;
 const dotProduct = newBall.vx * normalX + newBall.vy * normalY;
 newBall.vx = (newBall.vx - 2 * dotProduct * normalX) * BUMPER_ELASTICITY;
 newBall.vy = (newBall.vy - 2 * dotProduct * normalY) * BUMPER_ELASTICITY;
 setScore(s => s + element.score);
 const overlap = (newBall.radius + element.radius) - distance;
 newBall.x += normalX * overlap;
 newBall.y += normalY * overlap;
}
 });

 // Flipper collision logic
 const leftFlipper = { x: 150, y: 650, angle: flippers.leftAngle };
 const leftCollision = checkFlipperCollision(newBall, leftFlipper);
 if (leftCollision.isColliding) {
 const normal = { x: -leftCollision.dy, y: leftCollision.dx };
 const magnitude = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
 normal.x /= magnitude;
 normal.y /= magnitude;
 const dotProduct = newBall.vx * normal.x + newBall.vy * normal.y;
 newBall.vx = (newBall.vx - 2 * dotProduct * normal.x) * FLIPPER_ELASTICITY;
 newBall.vy = (newBall.vy - 2 * dotProduct * normal.y) * FLIPPER_ELASTICITY;
 setScore(s => s + 10);
 }

 const rightFlipper = { x: 350, y: 650, angle: flippers.rightAngle };
 const rightCollision = checkFlipperCollision(newBall, rightFlipper);
 if (rightCollision.isColliding) {
 const normal = { x: -rightCollision.dy, y: rightCollision.dx };
 const magnitude = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
 normal.x /= magnitude;
 normal.y /= magnitude;
 const dotProduct = newBall.vx * normal.x + newBall.vy * normal.y;
 newBall.vx = (newBall.vx - 2 * dotProduct * normal.x) * FLIPPER_ELASTICITY;
 newBall.vy = (newBall.vy - 2 * dotProduct * normal.y) * FLIPPER_ELASTICITY;
 setScore(s => s + 10);
 }

 return newBall;
 });
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
 ctx.fillStyle = 'white';
 ctx.font = '12px Inter, sans-serif';
 ctx.textAlign = 'center';
 ctx.fillText(element.id, element.x, element.y + 4);
 });
 // Draw plunger
 ctx.fillStyle = 'gray';
 ctx.fillRect(450, 600 + plungerPosition, 30, 80 - plungerPosition);
 // Draw flippers
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
 ctx.fillStyle = isTilted ? 'red' : 'white';
 ctx.beginPath();
 ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
 ctx.fill();
 };

 let animationFrameId;
 const gameLoop = () => {
 updateGame();
 draw();
 animationFrameId = requestAnimationFrame(gameLoop);
 };
 gameLoop();
 return () => cancelAnimationFrame(animationFrameId);
 }, [ball, flippers, plungerPosition, gameElements, isGameOver, score, isTilted, nudgeCount, checkFlipperCollision]);

 // Initial ball position and game reset logic
 useEffect(() => {
 if (isGameOver) {
 setBall({
 x: 450,
 y: 650,
 radius: 10,
 vx: 0,
 vy: 0,
 isLaunched: false
 });
 setPlungerPosition(0);
 setCanPlunge(true);
 setFlippers({
 leftAngle: FLIPPER_ANGLE_DEFAULT,
 rightAngle: -FLIPPER_ANGLE_DEFAULT
 });
 }
 }, [isGameOver]);

 return (
 <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans">
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
 </div>
 <div className="mt-4 text-center">
 <p className="text-lg font-semibold">{message}</p>
 {nudgeCount > 0 && !isGameOver && (
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