import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import LeftFlipper from './components/LeftFlipper';
import RightFlipper from './components/RightFlipper';
import Ball from './components/Ball';
import Tube from './components/Tube';
import Spinner from './components/Spinner';
import GameOverMessage from './components/GameOverMessage';
import ScoreDisplay from './components/ScoreDisplay';
import BallLauncher from './components/BallLauncher';
import Bumper from './components/Bumper';
import LaneChange from './components/LaneChange';
import Outlane from './components/Outlane';
import Scoreboard from './components/Scoreboard';
import BonusDisplay from './components/BonusDisplay';
import ExtraBallIndicator from './components/ExtraBallIndicator';
import LaunchPlunger from './components/LaunchPlunger';
import FlipperCollisionDetector from './components/FlipperCollisionDetector';
import VerticalBallLauncher from './components/VerticalBallLauncher';
import Tunnels from './components/Tunnels';
import GameStartButton from './components/GameStartButton';

// Constants
const BALL_RADIUS = 10;
const PLAY_AREA_WIDTH = 800;
const PLAY_AREA_HEIGHT = 600;
const INITIAL_BALL_X = PLAY_AREA_WIDTH / 2;
const INITIAL_BALL_Y = PLAY_AREA_HEIGHT - 100;
const LANE_CHANGE_DISTANCE = 50;
const LANE_CHANGE_COOLDOWN = 1000;
const BUMPER_SCORE = 100;
const TARGET_SCORE = 200;

const Container = styled.div`
 display: flex;
 justify-content: center;
 align-items: center;
 height: 100vh;
 background-color: #222;
`;

const PinballGame = styled.div`
 position: relative;
 width: 800px;
 height: 600px;
 background-color: #444;
 border: 2px solid #222;
`;

const Pinball = () => {
 const [currentBallPosition, setBallPosition] = useState({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
 const [ballSpeed, setBallSpeed] = useState({ x: 0, y: -3 });
 const [gameOver, setGameOver] = useState(false);
 const [ballLaunched, setBallLaunched] = useState(false);
 const [ballVelocity, setBallVelocity] = useState({ x: 0, y: 0 });
 const [ballIsInTube, setBallIsInTube] = useState(false);
 const [tubeEntranceX, setTubeEntranceX] = useState(0);
 const [tubeEntranceY, setTubeEntranceY] = useState(0);
 const [tubeWidth, setTubeWidth] = useState(0);
 const [tubeHeight, setTubeHeight] = useState(0);
 const [flipper1Position, setFlipper1Position] = useState({ x: 100, y: 550 });
 const [flipper2Position, setFlipper2Position] = useState({ x: 300, y: 550 });
 const [score, setScore] = useState(0);
 const [lives, setLives] = useState(3);
 const [activeBonus, setActiveBonus] = useState(0);
 const [earnedExtraBalls, setEarnedExtraBalls] = useState(0);

 const tubeExitY = tubeEntranceY + tubeHeight;
 const isLaneChangeAllowed = true; // Keep as constant within component

 const handleCollision = (ballPosition, gameElements) => {
 if (!gameElements?.length) return;
  gameElements.forEach(element => {
 const isColliding =
 ballPosition.x + BALL_RADIUS > element.position.x &&
 ballPosition.x - BALL_RADIUS < element.position.x + element.width &&
 ballPosition.y + BALL_RADIUS > element.position.y &&
 ballPosition.y - BALL_RADIUS < element.position.y + element.height;

 if (isColliding) {
 switch (element.type) {
 case 'bumper': setScore(prev => prev + BUMPER_SCORE); break;
 case 'target': setScore(prev => prev + TARGET_SCORE); break;
 case 'flipper': setBallVelocity(prev => ({ x: Math.min(Math.max(-1, prev.x), 1), y: prev.y * -10 })); break;
 default: break;
 }
 }
});
 };

 const handleOutOfBounds = (ballPosition) => {
 if (ballPosition.x < 0 || ballPosition.x > PLAY_AREA_WIDTH || ballPosition.y > PLAY_AREA_HEIGHT) {
 setBallPosition({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
 setLives(prev => prev - 1);
 if (lives <= 1) {
 setGameOver(true);
 }
 setBallLaunched(false);
 setBallVelocity({ x: 0, y: 0 });
 } else if (ballPosition.y < 0) {
 setBallVelocity(prev => ({ ...prev, y: -prev.y })); // Bounce off top
 }
 };

 const handleLaneChange = (direction) => {
 if (!isLaneChangeAllowed) return;
 setBallPosition(prev => ({ ...prev, x: prev.x + (direction === 'left' ? -LANE_CHANGE_DISTANCE : LANE_CHANGE_DISTANCE) }));
 setTimeout(() => {}, LANE_CHANGE_COOLDOWN); // Simple cooldown
 };

 useEffect(() => {
 if (!gameOver && ballLaunched) {
 const interval = setInterval(() => {
 setBallPosition(prev => ({ x: prev.x + ballVelocity.x, y: prev.y + ballVelocity.y }));
 if (currentBallPosition.x - BALL_RADIUS < 0 || currentBallPosition.x + BALL_RADIUS > PLAY_AREA_WIDTH) setBallVelocity(prev => ({ ...prev, x: -prev.x }));
 handleOutOfBounds(currentBallPosition);
 // handleCollision(currentBallPosition, /* your game elements */);
 }, 16);
 return () => clearInterval(interval);
 }
 }, [gameOver, ballLaunched, ballVelocity, currentBallPosition, lives]);

 const launchBall = (power) => {
 setBallPosition({ x: 400, y: 550 });
 setBallVelocity({ x: 0, y: -power * 5 });
 setBallLaunched(true);
 };

 const handleLaunchBall = () => launchBall(5); // Simple launch

 const handleBallDrain = () => {
 setLives(prev => prev - 1);
 setBallLaunched(false);
 setBallVelocity({ x: 0, y: 0 });
 setBallPosition({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
 };

 const handleTubeEntrance = (x, y, width, height) => {
 setTubeEntranceX(x);
 setTubeEntranceY(y);
 setTubeWidth(width);
 setTubeHeight(height);
 };

 useEffect(() => {
 if (ballIsInTube) {
 setBallPosition(prev => ({ ...prev, y: prev.y - 5 }));
 if (currentBallPosition.y <= tubeExitY) {
 setBallIsInTube(false);
 setBallPosition(prev => ({ ...prev, x: tubeEntranceX + tubeWidth / 2 }));
 setBallVelocity(prev => ({ ...prev, y: 5 }));
 }
 } else if (currentBallPosition.x >= tubeEntranceX && currentBallPosition.x <= tubeEntranceX + tubeWidth && currentBallPosition.y >= tubeEntranceY && currentBallPosition.y <= tubeEntranceY + tubeHeight) {
 setBallIsInTube(true);
 }
 }, [currentBallPosition, tubeEntranceX, tubeEntranceY, tubeWidth, tubeHeight, tubeExitY, ballIsInTube]);

const handleGameStart = () => {
  console.log('Game started!');
  setGameOver(false);
  setScore(0);
  setLives(3);
  setBallLaunched(true);
  // ... any other game initialization logic
};

 return (
 <Container>
 <PinballGame>
 <LeftFlipper top={500} left={200} />
 <RightFlipper top={500} left={400} />
 <Tube type="top" onEntrance={handleTubeEntrance} x={100} y={50} width={50} height={100} />
 <Spinner type="left" />
 <Ball position={currentBallPosition} radius={BALL_RADIUS} />
 <Bumper onCollision={() => setScore(prev => prev + BUMPER_SCORE)} x={150} y={100} radius={30} />
 <Outlane onDrain={handleBallDrain} />
 <LaneChange onClick={handleLaneChange} />
 <LaunchPlunger onLaunch={handleLaunchBall} maxPull={75} />
 <Scoreboard score={score} lives={lives} bonus={activeBonus} extraBalls={earnedExtraBalls} />
 <ScoreDisplay score={score} />
 {activeBonus > 1 && <BonusDisplay bonus={activeBonus} duration={3000} />}
 <ExtraBallIndicator earnedExtraBalls={earnedExtraBalls} />
 {gameOver && <GameOverMessage score={score} />}
 <GameStartButton onStartGame={handleGameStart} />
 </PinballGame>
 </Container>
 );
};

export default Pinball;