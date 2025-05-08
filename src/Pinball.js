import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import LeftFlipper from './components/LeftFlipper';
import RightFlipper from './components/RightFlipper';
import Ball from './components/Ball';
import Tube from './components/Tube';
import Blocks from './components/Blocks';
import Spinner from './components/Spinner';
import GameOverMessage from './components/GameOverMessage';
import ScoreDisplay from './components/ScoreDisplay';
import BallLauncher from './components/BallLauncher';
import Bumper from './components/Bumper';
import LaneGuide from './components/LaneGuide';
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
import PinballTarget from './components/PinballTarget';
import Ramp from './components/Ramp';
import Slingshot from './components/Slingshot';
import LoopShot from './components/LoopShot';
import SpinnerTarget from './components/SpinnerTarget';
import LaneChange from './components/LaneChange';
import PopBumper from './components/PopBumper';
import MultiballLock from './components/MultiballLock';
import SkillShotLane from './components/SkillShotLane';
import Outlane from './components/Outlane';
import Scoreboard from './components/Scoreboard';
import BonusDisplay from './components/BonusDisplay';
import ExtraBallIndicator from './components/ExtraBallIndicator';
import LaunchPlunger from './components/LaunchPlunger';
import FlipperCollisionDetector from './components/FlipperCollisionDetector';
import VerticalBallLauncher from './components/VerticalBallLauncher';
import Tunnels from './components/Tunnels';
import ScoreManager from './components/ScoreManager';
import { useGame } from './components/GameManager';

const ScoreMultiplier = 2;
// Constants
const BALL_RADIUS = 10;
const BUMPER_SCORE = 100;
const TARGET_SCORE = 200;
const PLAY_AREA_WIDTH = 800;
const PLAY_AREA_HEIGHT = 600;
const INITIAL_BALL_X = PLAY_AREA_WIDTH / 2;
const INITIAL_BALL_Y = PLAY_AREA_HEIGHT - 100;
const LANE_CHANGE_DISTANCE = 50;
const LANE_CHANGE_COOLDOWN = 1000;

// Variables
let playerLives = 3;
let isLaneChangeAllowed = true;

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

const Score = styled.div`
  font-size: 24px;
  color: white;
  position: absolute;
  top: 20px;
  left: 20px;
`;

const BottomRight = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
`;

const Pinball = () => {
  const [currentBallPosition, setBallPosition] = useState({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
  const [ballSpeed, setBallSpeed] = useState({ x: 0, y: -3 });
  const [gameOver, setGameOver] = useState(false);
  const [ballLaunched, setBallLaunched] = useState(false);
  const [launchDirection, setLaunchDirection] = useState({ x: 1, y: -0.5 });
  const [ballVelocity, setBallVelocity] = useState({ x: 0, y: 0 });
  const [ballIsInTube, setBallIsInTube] = useState(false);
  const [tubeEntranceX, setTubeEntranceX] = useState(0); // Initialize with a default value
  const [tubeEntranceY, setTubeEntranceY] = useState(0); // Initialize with a default value
  const [tubeWidth, setTubeWidth] = useState(0); // Initialize with a default value
  const [tubeHeight, setTubeHeight] = useState(0); // Initialize with a default value
  const [flipper1Position, setFlipper1Position] = useState({ x: 100, y: 200 });
  const [flipper2Position, setFlipper2Position] = useState({ x: 300, y: 200 });
  const canvasHeight = 400;
  const { score, lives, isGameOver, updateScore, decreaseLives } = useGame();
  const scoreManager = ScoreManager();

  const tubeExitY = tubeEntranceY + tubeHeight;

  const handleCollision = (ballPosition, gameElements) => {
    if (!gameElements || typeof gameElements[Symbol.iterator] !== 'function') {
      console.error('gameElements is not iterable');
      return;
    }

    for (const element of gameElements) {
      const elementBounds = {
        top: element.position.y,
        bottom: element.position.y + element.height,
        left: element.position.x,
        right: element.position.x + element.width,
      };

      const ballBounds = {
        top: ballPosition.y - BALL_RADIUS,
        bottom: ballPosition.y + BALL_RADIUS,
        left: ballPosition.x - BALL_RADIUS,
        right: ballPosition.x + BALL_RADIUS,
      };

      if (
        ballBounds.right > elementBounds.left &&
        ballBounds.left < elementBounds.right &&
        ballBounds.bottom > elementBounds.top &&
        ballBounds.top < elementBounds.bottom
      ) {
        switch (element.type) {
          case 'bumper':
            scoreManager.awardPoints('bumperHit');
            break;
          case 'target':
            scoreManager.awardPoints('targetHit');
            break;
          case 'flipper':
            setBallVelocity((prevVelocity) => ({
              x: Math.min(Math.max(-1, prevVelocity.x), 1),
              y: prevVelocity.y * -10,
            }));
            break;
          default:
            break;
        }
      }
    }
  };

  const handleOutOfBounds = (ballPosition) => {
    if (
      ballPosition.x < 0 || ballPosition.x > PLAY_AREA_WIDTH ||
      ballPosition.y < 0 || ballPosition.y > PLAY_AREA_HEIGHT
    ) {
      setBallPosition({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
      playerLives--;
      if (playerLives <= 0) {
        setGameOver(true);
      }
      decreaseLives(); // Update game state
    }
  };

  const handleLaneChange = (direction) => {
    if (!isLaneChangeAllowed) return;

    setBallPosition((prevPosition) => ({
      ...prevPosition,
      x: prevPosition.x + (direction === 'left' ? -LANE_CHANGE_DISTANCE : LANE_CHANGE_DISTANCE),
    }));

    isLaneChangeAllowed = false;
    setTimeout(() => {
      isLaneChangeAllowed = true;
    }, LANE_CHANGE_COOLDOWN);
  };

  useEffect(() => {
    // Game loop (basic example - needs more sophisticated physics)
    const gameInterval = setInterval(() => {
      if (!gameOver && ballLaunched) {
        setBallPosition((prevPosition) => ({
          x: prevPosition.x + ballVelocity.x,
          y: prevPosition.y + ballVelocity.y,
        }));

        // Basic collision detection with walls
        if (currentBallPosition.x - BALL_RADIUS < 0 || currentBallPosition.x + BALL_RADIUS > PLAY_AREA_WIDTH) {
          setBallVelocity((prevVelocity) => ({ ...prevVelocity, x: -prevVelocity.x }));
        }
        if (currentBallPosition.y - BALL_RADIUS < 0) {
          setBallVelocity((prevVelocity) => ({ ...prevVelocity, y: -prevVelocity.y }));
        }

        // Basic out of bounds check (you'll need to refine this)
        if (currentBallPosition.y + BALL_RADIUS > PLAY_AREA_HEIGHT) {
          handleOutOfBounds(currentBallPosition);
          setBallLaunched(false); // Stop ball movement after drain
          setBallVelocity({ x: 0, y: 0 }); // Reset velocity
          setBallPosition({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y }); // Reset position
        }

        // Example collision handling (you'll need to integrate your game elements)
        // handleCollision(currentBallPosition, /* your game elements array */);
      }
    }, 16); // Roughly 60 FPS

    return () => clearInterval(gameInterval);
  }, [gameOver, ballLaunched, ballVelocity, currentBallPosition, decreaseLives, scoreManager]);

  const launchBall = (launchPower) => {
    setBallPosition({ x: 400, y: 550 }); // Launch from near the flippers
    const launchForce = launchPower * 10; // Adjust multiplier
    setBallVelocity({ x: 0, y: -launchForce });
    setBallLaunched(true);
  };

  const handleLaunchBall = () => {
    setBallLaunched(true);
    setBallVelocity({ x: 0, y: -5 }); // Initial launch velocity
    setBallPosition({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y + 50 }); // Position above plunger
  };

  const handleBallDrain = () => {
    decreaseLives();
    setBallLaunched(false);
    setBallVelocity({ x: 0, y: 0 });
    setBallPosition({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
  };

  const handleBallLaunch = (launchPower) => {
    const launchForce = launchPower * 10;
    setBallVelocity({ x: 0, y: -launchForce });
    setBallLaunched(true);
  };

  const handleLaunch = () => {
    console.log('Ball launched!');
  };

  const tunnelData = [
    { id: 'tunnel1', width: 50, height: 100, top: 200, left: 300 },
  ];

  const handleObstacleCollision = (ballPosition, obstaclePosition) => {
    console.log('Ball collided with obstacle!');
    setBallVelocity((prevVelocity) => ({ x: -prevVelocity.x * 0.8, y: -prevVelocity.y * 0.8 })); // Example deflection
  };

  const handleTubeEntrance = (x, y, width, height) => {
    setTubeEntranceX(x);
    setTubeEntranceY(y);
    setTubeWidth(width);
    setTubeHeight(height);
  };

  useEffect(() => {
    if (currentBallPosition.x >= tubeEntranceX &&
      currentBallPosition.x <= tubeEntranceX + tubeWidth &&
      currentBallPosition.y >= tubeEntranceY &&
      currentBallPosition.y <= tubeEntranceY + tubeHeight &&
      !ballIsInTube) {
      setBallIsInTube(true);
      setBallVelocity((prevVelocity) => ({ ...prevVelocity, y: -Math.abs(prevVelocity.y) })); // Move upwards
    } else if (ballIsInTube && currentBallPosition.y <= tubeExitY) {
      setBallIsInTube(false);
      setBallVelocity((prevVelocity) => ({ ...prevVelocity, y: Math.abs(prevVelocity.y) })); // Move downwards
      setBallPosition((prevPosition) => ({ ...prevPosition, x: tubeEntranceX + tubeWidth / 2 })); // Center on exit
    }
  }, [currentBallPosition, tubeEntranceX, tubeEntranceY, tubeWidth, tubeHeight, tubeExitY, ballIsInTube, ballSpeed]);

  return (
    <Container>
      <PinballGame>
        <LeftFlipper top={500} left={200} />
        <RightFlipper top={500} left={400} />
        <Tube type="top" onEntrance={handleTubeEntrance} x={100} y={50} width={50} height={100} />
        <Tube type="middle" onEntrance={handleTubeEntrance} x={250} y={150} width={50} height={150} />
        <Tube type="bottom" onEntrance={handleTubeEntrance} x={400} y={350} width={50} height={100} />
        <Spinner type="left" />
        <Spinner type="right" />
        <Ramp width={200} height={50} top={300} left={100} angle={30} />
        <Slingshot top={500} left={100} armLength={100} angle={45} />
        <LoopShot size="50px" top="200px" left="200px" speed="4s" />
        <SpinnerTarget size="60px" top="200px" left="200px" speed="1s" />
        <Tunnels tunnels={tunnelData} />
        <DynamicObstacle width={40} height={40} animationDuration={3} movementDistance={70} onCollision={handleObstacleCollision} />
        <MysteryTarget />
        <BottomRight>
          <LaneGuide />
          <Kickback />
          <Rollover />
          <DropTarget />
          <KickoutHole />
          <Magnet />
          <CaptiveBall />
          <Hole />
          <Multiball initialBallsCount={3} onBallLost={() => { }} onScore={() => { }} />
          <SkillShot />
          <BallLauncher onLaunch={handleLaunchBall} />
          <ComboMeter />
          <Ball position={currentBallPosition} radius={BALL_RADIUS} />
          <Blocks />
          <Bumper onCollision={() => scoreManager.awardPoints('bumperHit')} x={150} y={100} radius={30} />
        </BottomRight>
        <PinballTarget id="target1" size={50} initialTop={200} initialLeft={100} onClick={(id) => console.log(`Target ${id} clicked!`)} />
        <PinballTarget id="target2" size={40} initialTop={300} initialLeft={400} onClick={(id) => console.log(`Target ${id} clicked!`)} />
        <LaneChange onClick={handleLaneChange} />
        <Outlane onDrain={handleBallDrain} />
        <PopBumper top={150} left={300} />
        <MultiballLock top={100} left={500} />
        <SkillShotLane top={50} left={600} />
        <Scoreboard score={score} lives={lives} bonus={activeBonus} extraBalls={earnedExtraBalls} />
        <ScoreDisplay score={score} />
        {activeBonus > 1 && <BonusDisplay bonus={activeBonus} duration={3000} />}
        <ExtraBallIndicator earnedExtraBalls={earnedExtraBalls} />
        <LaunchPlunger onLaunch={handleBallLaunch} maxPull={75} />
        <FlipperCollisionDetector
          ballPosition={currentBallPosition}
          ballVelocity={ballVelocity}
          flipperPositions={[flipper1Position, flipper2Position]}
          onCollision={() => setBallVelocity((prevVelocity) => ({ x: -prevVelocity.x * 0.8, y: -prevVelocity.y * 1.2 }))}
        />
        <VerticalBallLauncher onLaunch={handleLaunch} />
        {isGameOver && <GameOverMessage score={score} />}
      </PinballGame>
    </Container>
  );
};

export default Pinball;