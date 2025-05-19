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
import BallLauncher from './components/BallLauncher';
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
const INITIAL_BALL_X = PLAY_AREA_WIDTH * 0.75;
const INITIAL_BALL_Y = PLAY_AREA_HEIGHT - 50;
const LANE_CHANGE_DISTANCE = 50;
const LANE_CHANGE_COOLDOWN = 1000;
const BUMPER_SCORE = 100;
const TARGET_SCORE = 200;
const FLIPPER_HEIGHT = 20;
const FLIPPER_WIDTH = 80;

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
  const ballRef = useRef(null);
  const [leftFlipperAngle, setLeftFlipperAngle] = useState(0);
  const [rightFlipperAngle, setRightFlipperAngle] = useState(0);
  const [isLeftFlipperActive, setIsLeftFlipperActive] = useState(false);
  const [isRightFlipperActive, setIsRightFlipperActive] = useState(false);
  const [ballIsInTube, setBallIsInTube] = useState(false);

  // Refs for interactive elements
  const bumper1Ref = useRef(null);
  const bumper2Ref = useRef(null);
  const target1Ref = useRef(null);
  const target2Ref = useRef(null);
  const leftFlipperRef = useRef(null);
  const rightFlipperRef = useRef(null);
  const rampRef = useRef(null);

  const tubeExitY = tubeEntranceY + tubeHeight;
  const isLaneChangeAllowed = true;

  const isCircleCollidingWithRectangle = (circle, rect) => {
    const closestX = Math.max(rect.left, Math.min(circle.x, rect.right));
    const closestY = Math.max(rect.top, Math.min(circle.y, rect.bottom));
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared < (circle.radius * circle.radius);
  };

  const handleCollision = (ballPosition, radius, velocity) => {
    const ballCircle = { x: ballPosition.x, y: ballPosition.y, radius: radius };

    // Collision with Bumpers
    if (bumper1Ref.current) {
      const bumperRect = bumper1Ref.current.getBoundingClientRect();
      if (isCircleCollidingWithRectangle(ballCircle, bumperRect)) {
        setScore(prev => prev + BUMPER_SCORE);
        setBallVelocity({ x: -velocity.x * 0.8, y: -velocity.y * 0.8 });
      }
    }
    if (bumper2Ref.current) {
      const bumperRect = bumper2Ref.current.getBoundingClientRect();
      if (isCircleCollidingWithRectangle(ballCircle, bumperRect)) {
        setScore(prev => prev + BUMPER_SCORE);
        setBallVelocity({ x: -velocity.x * 0.8, y: -velocity.y * 0.8 });
      }
    }

    // Collision with Targets
    if (target1Ref.current) {
      const targetRect = target1Ref.current.getBoundingClientRect();
      if (isCircleCollidingWithRectangle(ballCircle, targetRect)) {
        setScore(prev => prev + TARGET_SCORE);
        target1Ref.current.style.opacity = 0.5;
        setBallVelocity(prev => ({ ...prev, y: -prev.y * 0.7 }));
      }
    }
    if (target2Ref.current) {
      const targetRect = target2Ref.current.getBoundingClientRect();
      if (isCircleCollidingWithRectangle(ballCircle, targetRect)) {
        setScore(prev => prev + TARGET_SCORE);
        target2Ref.current.style.opacity = 0.5;
        setBallVelocity(prev => ({ ...prev, y: -prev.y * 0.7 }));
      }
    }

    // Collision with Flipper
    if (leftFlipperRef.current) {
      const flipperRect = {
        left: leftFlipperRef.current.getBoundingClientRect().left,
        top: leftFlipperRef.current.getBoundingClientRect().top,
        right: leftFlipperRef.current.getBoundingClientRect().right,
        bottom: leftFlipperRef.current.getBoundingClientRect().bottom,
      };
      if (isCircleCollidingWithRectangle(ballCircle, flipperRect) && isLeftFlipperActive) {
        setBallVelocity({ x: Math.abs(velocity.x) + 5, y: -Math.abs(velocity.y) - 10 });
      }
    }
    if (rightFlipperRef.current) {
      const flipperRect = {
        left: rightFlipperRef.current.getBoundingClientRect().left,
        top: rightFlipperRef.current.getBoundingClientRect().top,
        right: rightFlipperRef.current.getBoundingClientRect().right,
        bottom: rightFlipperRef.current.getBoundingClientRect().bottom,
      };
      if (isCircleCollidingWithRectangle(ballCircle, flipperRect) && isRightFlipperActive) {
        setBallVelocity({ x: -Math.abs(velocity.x) - 5, y: -Math.abs(velocity.y) - 10 });
      }
    }

    // Collision with Ramp (Basic - needs more detailed geometry)
    if (rampRef.current) {
      const rampRect = rampRef.current.getBoundingClientRect();
      if (isCircleCollidingWithRectangle(ballCircle, rampRect) && velocity.y > 0) {
        // Simulate going up the ramp - adjust velocity and maybe position
        setBallVelocity({ x: velocity.x * 0.7, y: -Math.abs(velocity.y) * 0.5 });
        setBallPosition(prev => ({ ...prev, y: prev.y - 5 })); // Move up slightly
        // Potentially trigger a state change or score increase for ramp entry
      }
    }
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
      setBallVelocity({ x: -5, y: -launchForce });
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
    setBallIsInTube(true);
  };

  useEffect(() => {
    if (ballLaunched && ballIsInTube) {
      setBallPosition(prev => ({ ...prev, y: prev.y - 5 }));
      if (currentBallPosition.y <= tubeEntranceY - tubeHeight) { // Exit at the top
        setBallIsInTube(false);
        setBallPosition(prev => ({ ...prev, x: tubeEntranceX + tubeWidth / 2, y: tubeEntranceY - tubeHeight - BALL_RADIUS * 2 }));
        setBallVelocity({ x: 5, y: 10 }); // Example exit velocity
      }
    } else if (ballLaunched && currentBallPosition.x >= tubeEntranceX && currentBallPosition.x <= tubeEntranceX + tubeWidth && currentBallPosition.y + BALL_RADIUS >= tubeEntranceY && currentBallPosition.y - BALL_RADIUS <= tubeEntranceY + tubeHeight / 2) {
      setBallIsInTube(true);
    }
  }, [ballLaunched, currentBallPosition, tubeEntranceX, tubeEntranceY, tubeWidth, tubeHeight, ballIsInTube]);

  const handleGameStart = () => {
    console.log('Game started!');
    setGameOver(false);
    setScore(0);
    setLives(3);
    setBallLaunched(false);
    setBallPosition({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
    setBallVelocity({ x: 0, y: 0 });
  };

  const handleFlipperAction = (isLeft) => {
    const angleSpeed = 20;
    const targetAngle = -45;

    if (isLeft) {
      setIsLeftFlipperActive(true);
      if (leftFlipperAngle > targetAngle) {
        setLeftFlipperAngle(targetAngle);
        setTimeout(() => setIsLeftFlipperActive(false), 100);
      }
    } else {
      setIsRightFlipperActive(true);
      if (rightFlipperAngle < -targetAngle) {
        setRightFlipperAngle(-targetAngle);
        setTimeout(() => setIsRightFlipperActive(false), 100);
      }
    }
  };

  useEffect(() => {
    if (!isLeftFlipperActive && leftFlipperAngle < 0) {
      setLeftFlipperAngle(prev => Math.min(0, prev + 5));
    }
  }, [isLeftFlipperActive, leftFlipperAngle]);

  useEffect(() => {
    if (!isRightFlipperActive && rightFlipperAngle > 0) {
      setRightFlipperAngle(prev => Math.max(0, prev - 5));
    }
  }, [isRightFlipperActive, rightFlipperAngle]);

  return (
    <Container>
      <PinballGame onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') handleFlipperAction(true);
        if (e.key === 'ArrowRight') handleFlipperAction(false);
      }} tabIndex={0}> {/* Added tabIndex for focus */}
        {/* Bottom Right Launcher and Tube */}
        <BallLauncher onLaunch={handlePlungerRelease} right={20} bottom={20} />
        <Tube
  type="bottom" // Assuming the entrance is at the bottom near the launcher
  onEntrance={handleTubeEntrance}
  x={PLAY_AREA_WIDTH - 70} // Adjust x for alignment
  y={50} // Position the top of the tube closer to the top (adjust as needed)
  width={40} // Adjust width
  height={PLAY_AREA_HEIGHT - 220} // Make it extend towards the bottom
/>
        {/* Middle Area Components with refs */}
        <LeftFlipper ref={leftFlipperRef} top={450} left={150} angle={leftFlipperAngle} />
        <RightFlipper ref={rightFlipperRef} top={450} left={400} angle={rightFlipperAngle} />
        <Bumper ref={bumper1Ref} onCollision={() => {}} x={250} y={150} radius={30} />
        <Bumper ref={bumper2Ref} onCollision={() => {}} x={550} y={150} radius={30} />
        <PinballTarget ref={target1Ref} id="target1" size={40} initialTop={100} initialLeft={300} onClick={() => {}} />
        <PinballTarget ref={target2Ref} id="target2" size={40} initialTop={100} initialLeft={500} onClick={() => {}} />
        <Slingshot top={400} left={100} armLength={70} angle={30} />
        <Slingshot top={400} left={600} armLength={70} angle={-30} />
        <Spinner type="left" top={200} left={350} />
        <Ramp ref={rampRef} width={180} height={50} top={300} left={50} angle={15} />
        <LoopShot size="50px" top="250px" left="650px" speed="2s" />
        <PopBumper top={250} left={400} />
        <DropTarget top={150} left={650} />
        <Magnet top={100} left={150} />
        <Outlane onDrain={handleBallDrain} left={0} top={PLAY_AREA_HEIGHT -80} width={100} height={80} />
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
      </PinballGame>
    </Container>
  );
};

export default Pinball;