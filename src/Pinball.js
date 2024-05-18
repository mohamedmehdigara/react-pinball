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

const ScoreMultiplier = 2;
// Constants
const BALL_RADIUS = 10; // Adjust the radius according to your ball size
const BUMPER_SCORE = 100; // Score awarded when hitting a bumper
const TARGET_SCORE = 200; // Score awarded when hitting a target
const PLAY_AREA_WIDTH = 800; // Width of the play area
const PLAY_AREA_HEIGHT = 600; // Height of the play area
const INITIAL_BALL_X = PLAY_AREA_WIDTH / 2; // Initial x-coordinate of the ball
const INITIAL_BALL_Y = PLAY_AREA_HEIGHT - 100; // Initial y-coordinate of the ball
const LANE_CHANGE_DISTANCE = 50; // Distance to move the ball during lane change
const LANE_CHANGE_COOLDOWN = 1000; // Cooldown period for lane changes (in milliseconds)

// Variables
let playerLives = 3; // Number of lives remaining for the player
let isLaneChangeAllowed = true; // Flag to prevent rapid lane changes


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
  const [ballPosition, setBallPosition] = useState({ x: 0, y: 0 });
  const [ballSpeed, setBallSpeed] = useState({ x: 0, y: -3 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [ballLaunched, setBallLaunched] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
const [remainingLives, setRemainingLives] = useState(3);
const [activeBonus, setActiveBonus] = useState(0);
const [earnedExtraBalls, setEarnedExtraBalls] = useState(0);



  // Add your event handlers here

  const handleCollision = (ballPosition, gameElements) => {
    // Ensure gameElements is iterable
    if (!gameElements || typeof gameElements[Symbol.iterator] !== 'function') {
      console.error('gameElements is not iterable');
      return;
    }
  
    // Loop through all game elements
    for (const element of gameElements) {
      // Calculate element's boundaries
      const elementBounds = {
        top: element.position.y,
        bottom: element.position.y + element.height,
        left: element.position.x,
        right: element.position.x + element.width,
      };
  
      // Calculate ball's boundaries
      const ballBounds = {
        top: ballPosition.y - BALL_RADIUS,
        bottom: ballPosition.y + BALL_RADIUS,
        left: ballPosition.x - BALL_RADIUS,
        right: ballPosition.x + BALL_RADIUS,
      };
  
      // Check for collision between ball and element
      if (
        ballBounds.right > elementBounds.left &&
        ballBounds.left < elementBounds.right &&
        ballBounds.bottom > elementBounds.top &&
        ballBounds.top < elementBounds.bottom
      ) {
        // Handle collision based on element type
        switch (element.type) {
          case 'bumper':
            score += BUMPER_SCORE;
            break;
          case 'target':
            score += TARGET_SCORE;
            break;
          // Add more cases for other element types
          default:
            break;
        }
      }
    }
  };
   
  // Handle out of bounds logic
  const handleOutOfBounds = (ballPosition) => {
    // Check if the ball is out of bounds
    if (
      ballPosition.x < 0 || ballPosition.x > PLAY_AREA_WIDTH ||
      ballPosition.y < 0 || ballPosition.y > PLAY_AREA_HEIGHT
    ) {
      // Reset ball position
      ballPosition.x = INITIAL_BALL_X;
      ballPosition.y = INITIAL_BALL_Y;
      
      // Deduct player lives or trigger other events
      playerLives--;
      if (playerLives <= 0) {
        gameOver = true;
      }
    }
  };
  
  const handleLaneChange = (direction) => {
    // Check if lane change is allowed
    if (!isLaneChangeAllowed) {
      return;
    }
  
    // Adjust ball's position based on lane change direction
    switch (direction) {
      case 'left':
        ballPosition.x -= LANE_CHANGE_DISTANCE;
        break;
      case 'right':
        ballPosition.x += LANE_CHANGE_DISTANCE;
        break;
      default:
        break;
    }
  
    // Prevent multiple lane changes in quick succession
    isLaneChangeAllowed = false;
    setTimeout(() => {
      isLaneChangeAllowed = true;
    }, LANE_CHANGE_COOLDOWN);
  };
  


  useEffect(() => {
    // Add your useEffect hooks here
  }, []);

  useEffect(() => {
    // Add your game loop logic here
  }, [ballPosition, ballSpeed, gameOver, score]);

  const launchBall = () => {
    // Set initial position of the ball and any other necessary properties
    setBallPosition({ x: 400, y: 550 });
  };
  const handleLaunchBall = () => {
    // Logic to launch the ball
    setBallLaunched(true);
  };

  const handleBallDrain = () => {
    // Decrement lives, check for game over, reset ball, etc.
  };
  


  return (
    <Container>
    <PinballGame>
      {/* Add your components here */}
      <LeftFlipper top={500} left={200} />
      <RightFlipper top={500} left={400} />
      <Tube type="top" />
      <Tube type="middle" />
      <Tube type="bottom" />
      <Spinner type="left" />
      <Spinner type="right" />
      <Ramp width={200} height={50} top={300} left={100} angle={30} />
      <Slingshot top={500} left={100} armLength={100} angle={45} />
      <LoopShot size="50px" top="200px" left="200px" speed="4s" />
      <SpinnerTarget size="60px" top="200px" left="200px" speed="1s" />
      <DynamicObstacle />
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
        <Multiball initialBallsCount={3} onBallLost={() => {}} onScore={() => {}} />
        <SkillShot />
        <BallLauncher />
        <ComboMeter />
        <Ball position={ballPosition} onCollision={handleCollision} onOutOfBounds={handleOutOfBounds} />
        <Blocks />
        <Bumper />
      </BottomRight>
      <PinballTarget id="target1" size={50} initialTop={200} initialLeft={100} onClick={(id) => console.log(`Target ${id} clicked!`)} />
      <PinballTarget id="target2" size={40} initialTop={300} initialLeft={400} onClick={(id) => console.log(`Target ${id} clicked!`)} />
      <LaneChange onClick={handleLaneChange} />
      <Outlane onDrain={() => handleBallDrain()} />

      <PopBumper top={150} left={300} />
      <MultiballLock top={100} left={500} />
      <SkillShotLane top={50} left={600} />
      <Scoreboard score={currentScore} lives={remainingLives} bonus={activeBonus} extraBalls={earnedExtraBalls} />
<ScoreDisplay/>
{activeBonus > 1 && (
  <BonusDisplay bonus={activeBonus} duration={3000} /> // Display bonus for 3 seconds
)}

    </PinballGame>
  </Container>


  );
};

export default Pinball;
