import React, { useState, useEffect, useRef } from 'react';
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
import BallLauncher from './components/BallLauncher'; // Using the improved one
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
const INITIAL_BALL_X = PLAY_AREA_WIDTH * 0.75; // Start near the launcher
const INITIAL_BALL_Y = PLAY_AREA_HEIGHT - 50; // Start near the launcher
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
  const [ballVelocity, setBallVelocity] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [ballLaunched, setBallLaunched] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [activeBonus, setActiveBonus] = useState(0);
  const [earnedExtraBalls, setEarnedExtraBalls] = useState(0);
  const [tubeEntranceX, setTubeEntranceX] = useState(0);
  const [tubeEntranceY, setTubeEntranceY] = useState(0);
  const [tubeWidth, setTubeWidth] = useState(0);
  const [tubeHeight, setTubeHeight] = useState(0);
  const [ballIsInTube, setBallIsInTube] = useState(false);
  const ballRef = useRef(null);

  const tubeExitY = tubeEntranceY + tubeHeight;
  const isLaneChangeAllowed = true;

  const handleCollision = (ballPosition, radius, velocity) => {
    // Basic collision with walls (using ball's internal physics now)
  };

  const handleOutOfBounds = (ballPosition) => {
    if (ballPosition.y > PLAY_AREA_HEIGHT + BALL_RADIUS * 2) {
      setBallPosition({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
      setBallVelocity({ x: 0, y: 0 });
      setBallLaunched(false);
      setLives(prev => prev - 1);
      if (lives <= 0) {
        setGameOver(true);
      }
    } else if (ballPosition.y < -BALL_RADIUS * 2) {
      setBallVelocity(prev => ({ ...prev, y: -prev.y * 0.8 }));
    } else if (ballPosition.x < -BALL_RADIUS * 2 || ballPosition.x > PLAY_AREA_WIDTH + BALL_RADIUS * 2) {
      setBallVelocity(prev => ({ ...prev, x: -prev.x * 0.8 }));
    }
  };

  const handleLaneChange = (direction) => {
    if (!isLaneChangeAllowed) return;
    setBallPosition(prev => ({ ...prev, x: prev.x + (direction === 'left' ? -LANE_CHANGE_DISTANCE : LANE_CHANGE_DISTANCE) }));
    setTimeout(() => {}, LANE_CHANGE_COOLDOWN);
  };

  useEffect(() => {
    if (!gameOver && ballLaunched && ballRef.current) {
      const animationFrameId = requestAnimationFrame(() => {
        setBallPosition(prevPosition => ({
          x: prevPosition.x + ballVelocity.x,
          y: prevPosition.y + ballVelocity.y,
        }));
      });
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [gameOver, ballLaunched, ballVelocity]);

  const handlePlungerRelease = (launchPower) => {
    console.log(`Launch power: ${launchPower}`);
    if (!ballLaunched) {
      const launchForce = launchPower * 15;
      setBallVelocity({ x: -5, y: -launchForce }); // Launch to the left and up
      setBallLaunched(true);
    }
  };

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
    if (ballLaunched && ballIsInTube) {
      setBallPosition(prev => ({ ...prev, y: prev.y - 5 }));
      if (currentBallPosition.y <= tubeExitY) {
        setBallIsInTube(false);
        setBallPosition(prev => ({ ...prev, x: tubeEntranceX + tubeWidth / 2 }));
        setBallVelocity(prev => ({ ...prev, y: 5 }));
      }
    } else if (ballLaunched && currentBallPosition.x >= tubeEntranceX && currentBallPosition.x <= tubeEntranceX + tubeWidth && currentBallPosition.y >= tubeEntranceY && currentBallPosition.y <= tubeEntranceY + tubeHeight) {
      setBallIsInTube(true);
    }
  }, [ballLaunched, currentBallPosition, tubeEntranceX, tubeEntranceY, tubeWidth, tubeHeight, tubeExitY, ballIsInTube]);

  const handleGameStart = () => {
    console.log('Game started!');
    setGameOver(false);
    setScore(0);
    setLives(3);
    setBallLaunched(false);
    setBallPosition({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
    setBallVelocity({ x: 0, y: 0 });
  };

  return (
    <Container>
      <PinballGame>
        {/* Bottom Right Launcher and Tube */}
        <BallLauncher onLaunch={handlePlungerRelease} right={20} bottom={20} />
        <Tube
          type="vertical"
          onEntrance={handleTubeEntrance}
          x={PLAY_AREA_WIDTH - 80}
          y={PLAY_AREA_HEIGHT - 220} // Position above the launcher
          width={40}
          height={100}
        />

        {/* Middle Area Components */}
        <LeftFlipper top={450} left={150} />
        <RightFlipper top={450} left={400} />
        <Bumper onCollision={() => setScore(prev => prev + BUMPER_SCORE)} x={250} y={150} radius={30} />
        <Bumper onCollision={() => setScore(prev => prev + BUMPER_SCORE)} x={550} y={150} radius={30} />
        <PinballTarget id="target1" size={40} initialTop={100} initialLeft={300} onClick={() => setScore(prev => prev + TARGET_SCORE)} />
        <PinballTarget id="target2" size={40} initialTop={100} initialLeft={500} onClick={() => setScore(prev => prev + TARGET_SCORE)} />
        <Slingshot top={400} left={100} armLength={70} angle={30} />
        <Slingshot top={400} left={600} armLength={70} angle={-30} />
        <Spinner type="left" top={200} left={350} />
        <Ramp width={180} height={50} top={300} left={50} angle={15} />
        <LoopShot size="50px" top="250px" left="650px" speed="2s" />
        <PopBumper top={250} left={400} />
        <DropTarget top={150} left={650} />
        <Magnet top={100} left={150} />
        {/* ... more components in the middle ... */}
        <Outlane onDrain={handleBallDrain} left={0} top={PLAY_AREA_HEIGHT - 80} width={100} height={80} />
        <Outlane onDrain={handleBallDrain} right={0} top={PLAY_AREA_HEIGHT - 80} width={100} height={80} />
        <LaneChange onClick={() => handleLaneChange('left')} left={120} top={PLAY_AREA_HEIGHT - 100} />
        <LaneChange onClick={() => handleLaneChange('right')} left={580} top={PLAY_AREA_HEIGHT - 100} />

        <Ball position={currentBallPosition} radius={BALL_RADIUS} ref={ballRef} velocity={ballVelocity} updateBallPosition={setBallPosition} onCollision={handleCollision} playAreaWidth={PLAY_AREA_WIDTH} playAreaHeight={PLAY_AREA_HEIGHT} friction={0.01} gravity={0.1} />

        {/* UI Elements */}
        <Scoreboard score={score} lives={lives} bonus={activeBonus} extraBalls={earnedExtraBalls} top={20} left={20} />
        <ScoreDisplay score={score} top={60} left={20} />
        {activeBonus > 1 && <BonusDisplay bonus={activeBonus} duration={3000} top={100} left={20} />}
        <ExtraBallIndicator earnedExtraBalls={earnedExtraBalls} top={140} left={20} />
        {gameOver && <GameOverMessage score={score} />}
        <GameStartButton onStartGame={handleGameStart} top={20} left={PLAY_AREA_WIDTH - 150} />
        {/* Removed VerticalBallLauncher and Tunnels as they are not visually placed */}
        {/* You can add more components in the middle as needed */}
      </PinballGame>
    </Container>
  );
};

export default Pinball;