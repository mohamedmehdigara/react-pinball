import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import LeftFlipper from './components/LeftFlipper';
import RightFlipper from './components/RightFlipper';
import Ball from './components/Ball';
import Tube from './components/Tube';
import Spinner from './components/Spinner';
import GameOverMessage from './components/GameOverMessage';
import ScoreDisplay from './components/ScoreDisplay';
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
import PinballTarget from './components/PinballTarget';
import Slingshot from './components/Slingshot';
import LoopShot from './components/LoopShot';
import SpinnerTarget from './components/SpinnerTarget';
import PopBumper from './components/PopBumper';
import MultiballLock from './components/MultiballLock';
import SkillShotLane from './components/SkillShotLane';
import Kickback from './components/Kickback';
import Rollover from './components/Rollover';
import DropTarget from './components/DropTarget';
import KickoutHole from './components/KickoutHole';
import Magnet from './components/Magnet';
import CaptiveBall from './components/CaptiveBall';
import Hole from './components/Hole';
import Multiball from './components/Multiball';
import SkillShot from './components/SkillShot';
import DynamicObstacle from './components/DynamicObstacle';
import MysteryTarget from './components/MysteryTarget';
import ComboMeter from './components/ComboMeter';
import Ramp from './components/Ramp';
import Blocks from './components/Blocks';
import LaneGuide from './components/LaneGuide';

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

  const gameElements = [
    { type: 'bumper', position: { x: 150, y: 100 }, width: 60, height: 60 }, // Example
    { type: 'target', position: { x: 300, y: 150 }, width: 50, height: 30 }, // Example
    { type: 'flipper', position: flipper1Position, width: 80, height: 20 }, // Example
    { type: 'flipper', position: flipper2Position, width: 80, height: 20 }, // Example
    // Add positions and dimensions for other interactive elements
  ];

  const handleCollision = (ballPosition) => {
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
      if (lives <= 0) {
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
        handleCollision(currentBallPosition);
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
    setBallPosition({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y + 100 }); // Position for launch
    setBallVelocity({ x: 0, y: -5 }); // Initial launch
  };

 return (
 <Container>
 <PinballGame>
 <LeftFlipper top={500} left={200} />
 <RightFlipper top={500} left={400} />
 <Ball position={currentBallPosition} radius={BALL_RADIUS} />
 <Tube type="top" onEntrance={handleTubeEntrance} x={100} y={50} width={50} height={100} />
 <Spinner type="left" />
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
 {/* Static elements */}
 <VerticalBallLauncher onLaunch={() => {}} /> {/* No functional prop here */}
 <Tunnels tunnels={[]} /> {/* Assuming empty for now */}
 <PinballTarget id="target1" size={50} initialTop={200} initialLeft={100} onClick={() => {}} />
 <Slingshot top={500} left={100} armLength={80} angle={30} />
 <LoopShot size="60px" top="250px" left="650px" speed="3s" />
 <SpinnerTarget size="50px" top="100px" left="600px" speed="2s" />
 <PopBumper top={200} left={350} />
 <MultiballLock top={50} left={500} />
 <SkillShotLane top={50} left={50} />
 <Kickback />
 <Rollover />
 <DropTarget />
 <KickoutHole />
 <Magnet />
 <CaptiveBall />
 <Hole />
 <Multiball initialBallsCount={1} onBallLost={() => {}} onScore={() => {}} />
 <SkillShot />
 <DynamicObstacle width={30} height={30} animationDuration={5} movementDistance={50} onCollision={() => {}} />
 <MysteryTarget />
 <ComboMeter />
 <Ramp width={150} height={40} top={400} left={550} angle={-20} />
 <Blocks />
 <LaneGuide />
 </PinballGame>
 </Container>
 );
};

export default Pinball;