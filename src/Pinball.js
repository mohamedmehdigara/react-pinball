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
import Gate from './components/Gate';

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
  const [droppedTargets, setDroppedTargets] = useState({}); // Track which targets are dropped { 'target1': true, 'target2': false, ...}
  const [litRollovers, setLitRollovers] = useState({});
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
  const slingshotLeftRef = useRef(null);
  const slingshotRightRef = useRef(null);
  const spinnerRef = useRef(null); // Ref for the spinner
  const outlaneLeftRef = useRef(null);
  const outlaneRightRef = useRef(null);
  const kickbackLeftRef = useRef(null);
    const kickbackRightRef = useRef(null);

  const skillShotLaneRef = useRef(null); // Ref for the Skill Shot Lane
  const dropTarget1Ref = useRef(null); // Ref for Drop Target 1
  const dropTarget2Ref = useRef(null); // Ref for Drop Target 2
  const dropTarget3Ref = useRef(null); // Ref for Drop Target 3
  const rolloverARef = useRef(null); // Ref for Rollover A
  const rolloverBRef = useRef(null); // Ref for Rollover B
  const rolloverCRef = useRef(null); // Ref for Rollover C
  const gateRef = useRef(null); // Ref for the Gate component


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
      if (bumperRect && isCircleCollidingWithRectangle(ballCircle, bumperRect) && bumper1HitCooldown.current <= 0) {
        bumper1.handleCollision();
        setScore(prev => prev + bumper1.getScoreValue());
        const newVelocity = { x: -velocity.x * 0.8, y: -velocity.y * 0.8 };
        setBallVelocity(newVelocity);
        const nudgeX = ballPosition.x < bumperRect.left ? -COLLISION_NUDGE : (ballPosition.x > bumperRect.right ? COLLISION_NUDGE : 0);
        const nudgeY = ballPosition.y < bumperRect.top ? -COLLISION_NUDGE : (ballPosition.y > bumperRect.bottom ? COLLISION_NUDGE : 0);
        const newPosition = { x: ballPosition.x + nudgeX, y: ballPosition.y + nudgeY };
        setBallPosition(newPosition);
        bumper1HitCooldown.current = BUMPER_COOLDOWN_FRAMES;
      }
    }
    // Collision with Bumper 2
    const bumper2 = bumper2Ref.current;
    if (bumper2) {
      const bumperRect = bumper2.getBoundingClientRect();
      if (bumperRect && isCircleCollidingWithRectangle(ballCircle, bumperRect) && bumper2HitCooldown.current <= 0) {
        bumper2.handleCollision();
        setScore(prev => prev + bumper2.getScoreValue());
        const newVelocity = { x: -velocity.x * 0.8, y: -velocity.y * 0.8 };
        setBallVelocity(newVelocity);
        const nudgeX = ballPosition.x < bumperRect.left ? -COLLISION_NUDGE : (ballPosition.x > bumperRect.right ? COLLISION_NUDGE : 0);
        const nudgeY = ballPosition.y < bumperRect.top ? -COLLISION_NUDGE : (ballPosition.y > bumperRect.bottom ? COLLISION_NUDGE : 0);
        const newPosition = { x: ballPosition.x + nudgeX, y: ballPosition.y + nudgeY };
        setBallPosition(newPosition);
        bumper2HitCooldown.current = BUMPER_COOLDOWN_FRAMES;
      }
    }
    // Collision with Targets
    const target1 = target1Ref.current;
    if (target1) {
      const targetRect = target1.getBoundingClientRect();
      if (targetRect && isCircleCollidingWithRectangle(ballCircle, targetRect)) {
        target1.handleCollision();
        setBallVelocity(prev => ({ ...prev, y: -prev.y * 0.7 }));
      }
    }
    // Collision with Target 2
    const target2 = target2Ref.current;
    if (target2) {
      const targetRect = target2.getBoundingClientRect();
      if (targetRect && isCircleCollidingWithRectangle(ballCircle, targetRect)) {
        target2.handleCollision();
        setBallVelocity(prev => ({ ...prev, y: -prev.y * 0.7 }));
      }
    }// Collision with Flipper

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
  const spinner = spinnerRef.current;
    if (spinner) {
      const spinnerRect = spinner.getBoundingClientRect();
      if (spinnerRect && isCircleCollidingWithRectangle(ballCircle, spinnerRect)) {
        const score = spinner.handleCollision(velocity);
        setScore(prev => prev + score);
        setBallVelocity(prev => ({ ...prev, x: -prev.x * 0.6, y: -prev.y * 0.6 }));
      }
    }
const kickbackLeft = kickbackLeftRef.current;
    if (kickbackLeft) {
      const kickbackRect = kickbackLeft.getBoundingClientRect();
      if (kickbackRect && isCircleCollidingWithRectangle(ballCircle, kickbackRect)) {
        // Kickback's handleCollision needs ballPosition and radius
        const impulse = kickbackLeft.handleCollision(ballPosition, radius);
        if (impulse) {
          setBallVelocity(impulse);
        }
      }
    }

    const skillShotLane = skillShotLaneRef.current;
    if (skillShotLane) {
      // SkillShotLane's handleCollision needs ballPosition and radius
      const score = skillShotLane.handleCollision(ballPosition, radius);
      if (score > 0) {
        setScore(prev => prev + score);
        setBallVelocity(prev => ({ ...prev, y: prev.y * 0.8 }));
      }
    }

     const dropTargetRefs = [dropTarget1Ref, dropTarget2Ref, dropTarget3Ref];
    dropTargetRefs.forEach(dtRef => {
      const dropTarget = dtRef.current;
      if (dropTarget) {
        const dropTargetRect = dropTarget.getBoundingClientRect();
        if (dropTargetRect && isCircleCollidingWithRectangle(ballCircle, dropTargetRect)) {
          // The handleCollision method on DropTarget will call onHit, which updates score and state
          dropTarget.handleCollision();
          setBallVelocity(prev => ({ x: prev.x * 0.9, y: -prev.y * 0.8 }));
        }
      }
    });

    const rolloverRefs = [rolloverARef, rolloverBRef, rolloverCRef];
    rolloverRefs.forEach(rlRef => {
      const rollover = rlRef.current;
      if (rollover) {
        const rolloverRect = rollover.getBoundingClientRect();
        if (rolloverRect && isCircleCollidingWithRectangle(ballCircle, rolloverRect)) {
          // The handleCollision method on Rollover will call onRollOver, which updates score and state
          rollover.handleCollision();
          setBallVelocity(prev => ({ x: prev.x * 0.9, y: prev.y * 0.9 })); // Slight dampening
        }
      }
    });

    const gate = gateRef.current;
    if (gate) {
      const gateRect = gate.getBoundingClientRect();
      if (gateRect && isCircleCollidingWithRectangle(ballCircle, gateRect)) {
        const currentIsOpen = gate.getIsOpen();
        const passageDirection = gate.props.passageDirection;

        let collisionHandled = false;

        if (currentIsOpen) {
          // If gate is open, allow passage in the designated direction
          if (passageDirection === 'right' && velocity.x > 0) { collisionHandled = true; }
          else if (passageDirection === 'left' && velocity.x < 0) { collisionHandled = true; }
          else if (passageDirection === 'down' && velocity.y > 0) { collisionHandled = true; }
          else if (passageDirection === 'up' && velocity.y < 0) { collisionHandled = true; }

          // If trying to go against the open gate or other directions, treat as a normal wall bounce
          if (!collisionHandled) {
             setBallVelocity(prev => ({ x: -prev.x * 0.7, y: -prev.y * 0.7 }));
             collisionHandled = true;
          }
        } else { // Gate is closed
          // If gate is closed, block passage against its one-way nature
          if (passageDirection === 'right' && velocity.x < 0) { // Trying to pass from right to left (blocked)
              setBallVelocity(prev => ({ x: -prev.x * 0.7, y: prev.y * 0.7 })); // Bounce horizontally
              collisionHandled = true;
          } else if (passageDirection === 'left' && velocity.x > 0) { // Trying to pass from left to right (blocked)
              setBallVelocity(prev => ({ x: -prev.x * 0.7, y: prev.y * 0.7 })); // Bounce horizontally
              collisionHandled = true;
          } else if (passageDirection === 'down' && velocity.y < 0) { // Trying to pass from bottom to top (blocked)
              setBallVelocity(prev => ({ x: prev.x * 0.7, y: -prev.y * 0.7 })); // Bounce vertically
              collisionHandled = true;
          } else if (passageDirection === 'up' && velocity.y > 0) { // Trying to pass from top to bottom (blocked)
              setBallVelocity(prev => ({ x: prev.x * 0.7, y: -prev.y * 0.7 })); // Bounce vertically
              collisionHandled = true;
          } else {
              // If moving in the allowed direction when closed (which shouldn't happen unless gate design is tricky),
              // or any other direction, it's a hard bounce as it's a blocking wall.
              setBallVelocity(prev => ({ x: -prev.x * 0.7, y: -prev.y * 0.7 })); // General bounce
              collisionHandled = true;
          }
        }
        // Important: Nudge the ball slightly out of the gate's collision area if it's blocking
        if (collisionHandled && !currentIsOpen) { // Only nudge if it acted as a blocker
            // Determine the direction of the nudge more accurately based on collision side
            let nudgeX = 0;
            let nudgeY = 0;

            if (ballPosition.x < gateRect.left + radius && velocity.x > 0) nudgeX = -COLLISION_NUDGE;
            else if (ballPosition.x > gateRect.right - radius && velocity.x < 0) nudgeX = COLLISION_NUDGE;

            if (ballPosition.y < gateRect.top + radius && velocity.y > 0) nudgeY = -COLLISION_NUDGE;
            else if (ballPosition.y > gateRect.bottom - radius && velocity.y < 0) nudgeY = COLLISION_NUDGE;

            // If a nudge was calculated, apply it
            if (nudgeX !== 0 || nudgeY !== 0) {
              setBallPosition(prev => ({ x: prev.x + nudgeX, y: prev.y + nudgeY }));
            }
        }
      }
    }
  

  }

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
    if (lives > 0) {
      // Check if kickback can save the ball (example: only on the first drain)
      if (lives === 3 && kickbackLeftRef.current && currentBallPosition.x < PLAY_AREA_WIDTH * 0.2) {
        const impulse = kickbackLeftRef.current.handleCollision(currentBallPosition, BALL_RADIUS);
        if (impulse) {
          setBallVelocity(impulse);
          setBallLaunched(true); // Ensure the game loop continues
          setLives(prev => prev); // Don't decrease life
          return; // Prevent standard ball drain
        }
      }
      // Standard ball drain logic
      setLives(prev => prev - 1);
      setBallLaunched(false);
      setBallVelocity({ x: 0, y: 0 });
      setBallPosition({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
      if (lives <= 0) {
        setGameOver(true);
      }
    }
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
    bumper1Ref.current?.resetHitCount();
    bumper2Ref.current?.resetHitCount();
    target1Ref.current?.resetTarget();
    target2Ref.current?.resetTarget();
    skillShotLaneRef.current?.activateSkillShot();
    dropTarget1Ref.current?.resetTarget();
    dropTarget2Ref.current?.resetTarget();
    dropTarget3Ref.current?.resetTarget();
    setDroppedTargets({});
    rolloverARef.current?.resetLight();
    rolloverBRef.current?.resetLight();
    rolloverCRef.current?.resetLight();
    setLitRollovers({});

    // Ensure gate is closed at the start of the game
    gateRef.current?.close();
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

   const gate = gateRef.current;
    if (gate) {
      const gateRect = gate.getBoundingClientRect();
      // Ensure gateRect is valid before proceeding
      if (gateRect && isCircleCollidingWithRectangle(ballCircle, gateRect)) {
        const currentIsOpen = gate.getIsOpen();
        const passageDirection = gate.props.passageDirection; // Access prop directly from ref.props

        let collisionHandled = false;

        if (currentIsOpen) {
          // If gate is open, allow passage in the designated direction
          // This typically means no collision response in the allowed direction,
          // but a bounce if trying to pass against the open gate.
          if (passageDirection === 'right' && velocity.x > 0) {
            // Allow passage, no bounce
            collisionHandled = true;
          } else if (passageDirection === 'left' && velocity.x < 0) {
            // Allow passage, no bounce
            collisionHandled = true;
          } else if (passageDirection === 'down' && velocity.y > 0) {
            // Allow passage, no bounce
            collisionHandled = true;
          } else if (passageDirection === 'up' && velocity.y < 0) {
            // Allow passage, no bounce
            collisionHandled = true;
          }
          // If trying to go against the open gate or other directions, treat as a normal wall bounce
          if (!collisionHandled) {
             setBallVelocity(prev => ({ x: -prev.x * 0.7, y: -prev.y * 0.7 }));
             collisionHandled = true;
          }
        } else { // Gate is closed
          // If gate is closed, allow passage only in the designated direction
          // Otherwise, it's a block/bounce
          if (passageDirection === 'right' && velocity.x < 0) { // Trying to pass from right to left
              setBallVelocity(prev => ({ x: -prev.x * 0.7, y: prev.y * 0.7 })); // Bounce horizontally
              collisionHandled = true;
          } else if (passageDirection === 'left' && velocity.x > 0) { // Trying to pass from left to right
              setBallVelocity(prev => ({ x: -prev.x * 0.7, y: prev.y * 0.7 })); // Bounce horizontally
              collisionHandled = true;
          } else if (passageDirection === 'down' && velocity.y < 0) { // Trying to pass from bottom to top
              setBallVelocity(prev => ({ x: prev.x * 0.7, y: -prev.y * 0.7 })); // Bounce vertically
              collisionHandled = true;
          } else if (passageDirection === 'up' && velocity.y > 0) { // Trying to pass from top to bottom
              setBallVelocity(prev => ({ x: prev.x * 0.7, y: -prev.y * 0.7 })); // Bounce vertically
              collisionHandled = true;
          } else {
              // If moving in the allowed direction when closed, or any other direction,
              // it's a hard bounce as it's a blocking wall.
              setBallVelocity(prev => ({ x: -prev.x * 0.7, y: -prev.y * 0.7 })); // General bounce
              collisionHandled = true;
          }
        }
        // Important: Nudge the ball slightly out of the gate's collision area if it's blocking
        if (collisionHandled && !currentIsOpen) { // Only nudge if it acted as a blocker
            const nudgeX = ballPosition.x < gateRect.left ? -COLLISION_NUDGE : (ballPosition.x > gateRect.right ? COLLISION_NUDGE : 0);
            const nudgeY = ballPosition.y < gateRect.top ? -COLLISION_NUDGE : (ballPosition.y > gateRect.bottom ? COLLISION_NUDGE : 0);
            setBallPosition(prev => ({ x: prev.x + nudgeX, y: prev.y + nudgeY }));
        }
      }
    }

    useEffect(() => {
    if (score >= 10000 && gateRef.current && !gateRef.current.getIsOpen()) {
      console.log("Score reached 10000, opening gate!");
      gateRef.current.open();
    } else if (score < 10000 && gateRef.current && gateRef.current.getIsOpen()) {
      // You might want to close it back if the score drops, or keep it open
      // For this example, let's keep it open once reached
      // gateRef.current.close();
    }
  }, [score]);


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
         <PinballTarget
          ref={target1Ref}
          id="target1"
          size={40}
          initialTop={100}
          initialLeft={300}
          onClick={(score) => setScore(prev => prev + score)} // Get score from target
          scoreValue={250} // Set a specific score value
          resetDelay={5000} // Reset after 5 seconds
        />
        <PinballTarget
          ref={target2Ref}
          id="target2"
          size={40}
          initialTop={100}
          initialLeft={500}
          onClick={(score) => setScore(prev => prev + score)} // Get score from target
          scoreValue={300} // Set a different score value
          resetDelay={3000} // Reset after 3 seconds
        />
        <Slingshot ref={slingshotLeftRef} top={400} left={100} armLength={70} angle={30} onCollision={(impulse) => setScore(prev => prev + 50)} />
        <Slingshot ref={slingshotRightRef} top={400} left={600} armLength={70} angle={-30} onCollision={(impulse) => setScore(prev => prev + 50)} />
      
        <Spinner ref={spinnerRef} top={200} left={350} type="left" scorePerRotation={75} />
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
        <Kickback ref={kickbackLeftRef} bottom={PLAY_AREA_HEIGHT - 120} left={20} angle={30} onKickback={() => setScore(prev => prev + 100)} />
        {/* You might have a kickback on the other side as well */}
         <Kickback ref={kickbackRightRef} bottom={PLAY_AREA_HEIGHT - 120} left={PLAY_AREA_WIDTH - 40} angle={-30} onKickback={() => setScore(prev => prev + 100)} />
          <Gate
          ref={gateRef}
          top={350} // Adjust position as needed
          left={150} // Adjust position as needed
          width={5} // Thin bar
          height={40} // Vertical bar
          pivotX={0} // Hinge at the left edge
          pivotY={0} // Hinge at the top
          initialIsOpen={false}
          passageDirection="right" // Ball can pass right-to-left when open, blocked otherwise
        />
      </PinballGame>
    </Container>
  );
};

export default Pinball;