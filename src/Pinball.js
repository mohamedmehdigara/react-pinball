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
const COLLISION_NUDGE = 5;
const BUMPER_COOLDOWN_FRAMES = 10;

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
  const bumper1HitCooldown = useRef(0);
  const bumper2HitCooldown = useRef(0);

  // Refs for interactive elements
const bumper1Ref = useRef(null);
  const bumper2Ref = useRef(null);
  const target1Ref = useRef(null);
  const target2Ref = useRef(null);
  const leftFlipperRef = useRef(null);
  const rightFlipperRef = useRef(null);
  const rampRef = useRef(null);
  const slingshotLeftRef = useRef(null); // Ref for the left slingshot
  const slingshotRightRef = useRef(null);
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

     const slingshotLeft = slingshotLeftRef.current;
    if (slingshotLeft) {
      const impulse = slingshotLeft.handleCollision(ballPosition, radius);
      if (impulse) {
        setBallVelocity(prev => ({ x: prev.x + impulse.x, y: prev.y + impulse.y }));
      }
    }

    // Collision with Right Slingshot
    const slingshotRight = slingshotRightRef.current;
    if (slingshotRight) {
      const impulse = slingshotRight.handleCollision(ballPosition, radius);
      if (impulse) {
        setBallVelocity(prev => ({ x: prev.x + impulse.x, y: prev.y + impulse.y }));
      }
    }

    // Collision with Bumper 1
    const bumper1 = bumper1Ref.current;
    if (bumper1) {
      const bumperRect = bumper1.getBoundingClientRect();
      if (isCircleCollidingWithRectangle(ballCircle, bumperRect) && bumper1HitCooldown.current <= 0) {
        bumper1.handleCollision();
        setScore(prev => prev + bumper1.getScoreValue());
        setBallVelocity({ x: -velocity.x * 0.8, y: -velocity.y * 0.8 });
        setBallPosition(prev => ({
          x: prev.x + (prev.x < bumperRect.left ? -COLLISION_NUDGE : (prev.x > bumperRect.right ? COLLISION_NUDGE : 0)),
          y: prev.y + (prev.y < bumperRect.top ? -COLLISION_NUDGE : (prev.y > bumperRect.bottom ? COLLISION_NUDGE : 0)),
        }));
        bumper1HitCooldown.current = BUMPER_COOLDOWN_FRAMES;
      }
    }

    // Collision with Bumper 2
    const bumper2 = bumper2Ref.current;
    if (bumper2) {
      const bumperRect = bumper2.getBoundingClientRect();
      if (isCircleCollidingWithRectangle(ballCircle, bumperRect) && bumper2HitCooldown.current <= 0) {
        bumper2.handleCollision();
        setScore(prev => prev + bumper2.getScoreValue());
        setBallVelocity({ x: -velocity.x * 0.8, y: -velocity.y * 0.8 });
        setBallPosition(prev => ({
          x: prev.x + (prev.x < bumperRect.left ? -COLLISION_NUDGE : (prev.x > bumperRect.right ? COLLISION_NUDGE : 0)),
          y: prev.y + (prev.y < bumperRect.top ? -COLLISION_NUDGE : (prev.y > bumperRect.bottom ? COLLISION_NUDGE : 0)),
        }));
        bumper2HitCooldown.current = BUMPER_COOLDOWN_FRAMES;
      }
    }

    // Collision with Targets
    const target1 = target1Ref.current;
    if (target1) {
      const targetRect = target1.getBoundingClientRect();
      if (isCircleCollidingWithRectangle(ballCircle, targetRect)) {
        setScore(prev => prev + TARGET_SCORE);
        target1.style.opacity = 0.5;
        setBallVelocity(prev => ({ ...prev, y: -prev.y * 0.7 }));
      }
    }

    const target2 = target2Ref.current;
    if (target2) {
      const targetRect = target2.getBoundingClientRect();
      if (isCircleCollidingWithRectangle(ballCircle, targetRect)) {
        setScore(prev => prev + TARGET_SCORE);
        target2.style.opacity = 0.5;
        setBallVelocity(prev => ({ ...prev, y: -prev.y * 0.7 }));
      }
    }

    // Collision with Flipper
    const leftFlipper = leftFlipperRef.current;
    if (leftFlipper) {
      const flipperRect = leftFlipper.getBoundingClientRect();
      if (isCircleCollidingWithRectangle(ballCircle, flipperRect) && isLeftFlipperActive) {
        setBallVelocity({ x: Math.abs(velocity.x) + 5, y: -Math.abs(velocity.y) - 10 });
      }
    }

    const rightFlipper = rightFlipperRef.current;
    if (rightFlipper) {
      const flipperRect = rightFlipper.getBoundingClientRect();
      if (isCircleCollidingWithRectangle(ballCircle, flipperRect) && isRightFlipperActive) {
        setBallVelocity({ x: -Math.abs(velocity.x) - 5, y: -Math.abs(velocity.y) - 10 });
      }
    }

    // Collision with Ramp (Basic - needs more detailed geometry)
    const ramp = rampRef.current;
    if (ramp) {
      const rampRect = ramp.getBoundingClientRect();
      if (isCircleCollidingWithRectangle(ballCircle, rampRect) && velocity.y > 0) {
        setBallVelocity({ x: velocity.x * 0.7, y: -Math.abs(velocity.y) * 0.5 });
        setBallPosition(prev => ({ ...prev, y: prev.y - 5 }));
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
        // Decrement bumper cooldowns on each frame
        if (bumper1HitCooldown.current > 0) {
          bumper1HitCooldown.current -= 1;
        }
        if (bumper2HitCooldown.current > 0) {
          bumper2HitCooldown.current -= 1;
        }
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
    bumper1Ref.current?.resetHitCount(); // Reset bumper 1 hit count on game start
    bumper2Ref.current?.resetHitCount(); // Reset bumper 2 hit count on game start
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
          type="bottom"
          onEntrance={handleTubeEntrance}
          x={PLAY_AREA_WIDTH - 70}
          y={50}
          width={40}
          height={PLAY_AREA_HEIGHT - 220}
        />

        {/* Middle Area Components with refs */}
        <LeftFlipper ref={leftFlipperRef} top={450} left={150} angle={leftFlipperAngle} />
        <RightFlipper ref={rightFlipperRef} top={450} left={400} angle={rightFlipperAngle} />
        <Bumper
          ref={bumper1Ref}
          x={250}
          y={150}
          radius={30}
          color="#00ffcc"
          glowColor="#00aacc"
          scoreValue={150}
        />
        <Bumper
          ref={bumper2Ref}
          x={550}
          y={150}
          radius={30}
          color="#ff6699"
          glowColor="#cc3366"
          scoreValue={200}
        />
        <PinballTarget ref={target1Ref} id="target1" size={40} initialTop={100} initialLeft={300} onClick={() => {}} />
        <PinballTarget ref={target2Ref} id="target2" size={40} initialTop={100} initialLeft={500} onClick={() => {}} />
         <Slingshot ref={slingshotLeftRef} top={400} left={100} armLength={70} angle={30} onCollision={(impulse) => setScore(prev => prev + 50)} />
        <Slingshot ref={slingshotRightRef} top={400} left={600} armLength={70} angle={-30} onCollision={(impulse) => setScore(prev => prev + 50)} />
      
        <Spinner type="left" top={200} left={350} />
        <Ramp ref={rampRef} width={180} height={50} top={300} left={50} angle={15} />
        <LoopShot size="50px" top="250px" left="650px" speed="2s" />
        <PopBumper top={250} left={400} />
        <DropTarget top={150} left={650} />
        <Magnet top={100} left={150} />
        <Outlane onDrain={handleBallDrain} left={0} top={PLAY_AREA_HEIGHT - 80} width={100} height={80} />
        <Outlane onDrain={handleBallDrain} right={0} top={PLAY_AREA_HEIGHT - 80} width={100} height={80} />
        <LaneChange onClick={() => handleLaneChange('left')} left={120} top={PLAY_AREA_HEIGHT - 100} />
        <LaneChange onClick={() => handleLaneChange('right')} left={580} top={PLAY_AREA_HEIGHT - 100} />

        <Ball
          position={currentBallPosition}
          radius={BALL_RADIUS}
          ref={ballRef}
          velocity={ballVelocity}
          updateBallPosition={setBallPosition}
          onCollision={handleCollision}
          playAreaWidth={PLAY_AREA_WIDTH}
          playAreaHeight={PLAY_AREA_HEIGHT}
          friction={0.01}
          gravity={0.1}
        />

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