import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import MysterySaucer from './components/MysterySaucer';

// Constants
const radius = 10;
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
const TARGET_BANK_BONUS_SCORE = 10000; // Bonus for completing the target bank
const TARGET_BANK_TIMEOUT = 10000; 
const MAX_BONUS_MULTIPLIER = 10;
const END_OF_BALL_BONUS_FACTOR = 100; 

const MYSTERY_PRIZES = {
    SCORE_SMALL: 5000,
    SCORE_MEDIUM: 15000,
    SCORE_LARGE: 50000,
    EXTRA_BALL: 'extraBall',
    ADVANCE_BONUS_MULTIPLIER: 'advanceBonusMultiplier', // Future enhancement
    LIGHT_KICKBACK: 'lightKickback', // Future enhancement
    POINTS_PENALTY: -2000, // Fun little penalty
};

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

const MultiplierDisplay = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #ffcc00;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;




const Pinball = () => {
  const [ballPosition, setBallPosition] = useState({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
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
  const [activeTargetInBank, setActiveTargetInBank] = useState(0);
  const [isBallCaptured, setIsBallCaptured] = useState(false);
const [bonusMultiplier, setBonusMultiplier] = useState(1);
  const [bonusScoreUnits, setBonusScoreUnits] = useState(0);
  const [tiltWarnings, setTiltWarnings] = useState(0); // <--- Add this line
  const [isTilted, setIsTilted] = useState(false);     // <--- Add this line

  // --- NEW NUDGE/TILT REF DECLARATIONS ---
  const tiltCooldownCounter = useRef(0); // <--- Add this line
  const nudgeInputX = useRef(0);         // <--- Add this line
  const nudgeInputY = useRef(0);         // <--- Add this line
  const nudgeResetCounter = useRef(0); 

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
  const variableTarget1Ref = useRef(null);
  const variableTarget2Ref = useRef(null);
  const variableTarget3Ref = useRef(null);
  const variableTarget4Ref = useRef(null);
  const targetBankTimeoutRef = useRef(null);
   const mysterySaucerRef = useRef(null);
  const ballCapturePosition = useRef({ x: 0, y: 0 });
 

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

        const ballCircle = { x: ballPosition.x, y: ballPosition.y, radius: radius };


  const handleOutOfBounds = (ballPosition, radius, velocity) => {
    // Note: The radius and velocity parameters are currently not explicitly used within handleOutOfBounds's
    // core logic (like checking for drain), but they are now correctly passed from the game loop,
    // maintaining consistency if you expand handleOutOfBounds later.


    if (ballPosition.y > PLAY_AREA_HEIGHT + radius * 2) { // Use 'radius' here
      // Logic for kickback check, ensuring currentBallPosition, BALL_RADIUS are available or handled
      // For kickbackLeftRef.current.handleCollision, it expects ballPosition and radius.
      if (kickbackLeftRef.current && ballPosition.x < PLAY_AREA_WIDTH * 0.2) { // Use ballPosition.x here
        const impulse = kickbackLeftRef.current.handleCollision(ballPosition, radius); // Pass ballPosition and radius
        if (impulse) {
          setBallVelocity(impulse);
          setBallLaunched(true);
          setBallPosition({ x: impulse.x > 0 ? (PLAY_AREA_WIDTH / 4) : (PLAY_AREA_WIDTH * 3 / 4), y: PLAY_AREA_HEIGHT - 100 });
          return; // Ball was saved, do not decrease life or reset
        }
      }

      setBallPosition({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
      setBallVelocity({ x: 0, y: 0 });
      setBallLaunched(false);
      setLives(prev => prev - 1);
      if (lives <= 0) {
        setGameOver(true);
      }
    } else if (ballPosition.y < -radius * 2) { // Use 'radius' here
      setBallVelocity(prev => ({ ...prev, y: -prev.y * 0.8 }));
    } else if (ballPosition.x < -radius * 2 || ballPosition.x > PLAY_AREA_WIDTH + radius * 2) { // Use 'radius' here
      setBallVelocity(prev => ({ ...prev, x: -prev.x * 0.8 }));
    }
  };


  // Main collision handler for all game elements
  // This function receives ballPosition, radius, and velocity from the game loop
  const handleCollision = (ballPosition, radius, velocity) => {
    const ballCircle = { x: ballPosition.x, y: ballPosition.y, radius: radius };

    // --- Bumper Collisions ---
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

    // --- Target Collisions ---
    const target1 = target1Ref.current;
    if (target1) {
      const targetRect = target1.getBoundingClientRect();
      if (targetRect && isCircleCollidingWithRectangle(ballCircle, targetRect)) {
        target1.handleCollision();
        setBallVelocity(prev => ({ ...prev, y: -prev.y * 0.7 }));
      }
    }

    const target2 = target2Ref.current;
    if (target2) {
      const targetRect = target2.getBoundingClientRect();
      if (targetRect && isCircleCollidingWithRectangle(ballCircle, targetRect)) {
        target2.handleCollision();
        setBallVelocity(prev => ({ ...prev, y: -prev.y * 0.7 }));
      }
    }

    // --- Slingshot Collisions ---
    const slingshotLeft = slingshotLeftRef.current;
    if (slingshotLeft) {
      const impulse = slingshotLeft.handleCollision(ballPosition, radius);
      if (impulse) {
        setBallVelocity(prev => ({ x: prev.x + impulse.x, y: prev.y + impulse.y }));
      }
    }

    const slingshotRight = slingshotRightRef.current;
    if (slingshotRight) {
      const impulse = slingshotRight.handleCollision(ballPosition, radius);
      if (impulse) {
        setBallVelocity(prev => ({ x: prev.x + impulse.x, y: prev.y + impulse.y }));
      }
    }

    // --- Spinner Collision ---
     const spinner = spinnerRef.current;
    if (spinner) {
      const spinnerRect = spinner.getBoundingClientRect();
      if (spinnerRect && isCircleCollidingWithRectangle(ballCircle, spinnerRect)) {
        const baseScore = spinner.handleCollision(velocity);
        const multipliedScore = applyBonusMultiplier(baseScore);
        setScore(prev => prev + multipliedScore);
        setBallVelocity(prev => ({ ...prev, x: -prev.x * 0.6, y: -prev.y * 0.6 }));
      }
    }
    // --- Kickback Collision ---
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

    // --- Skill Shot Lane Collision ---
    const skillShotLane = skillShotLaneRef.current;
    if (skillShotLane) {
      // SkillShotLane's handleCollision needs ballPosition and radius
      const score = skillShotLane.handleCollision(ballPosition, radius);
      if (score > 0) {
        setScore(prev => prev + score);
        setBallVelocity(prev => ({ ...prev, y: prev.y * 0.8 }));
      }
    }

    // --- Drop Target Collisions ---
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

    // --- Rollover Lane Collisions ---
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

    // --- Gate Collision ---
    const gate = gateRef.current;
    if (gate) {
      const gateRect = gate.getBoundingClientRect();
      if (gateRect && isCircleCollidingWithRectangle(ballCircle, gateRect)) {
        const currentIsOpen = gate.getIsOpen();
        const passageDirection = gate.props.passageDirection;

        let collisionHandled = false;

        if (currentIsOpen) {
          // If gate is open, allow passage in the designated direction
          // Ensure 'velocity' is correctly referenced here, as it's a parameter of handleCollision
          if (passageDirection === 'right' && velocity.x > 0) { collisionHandled = true; }
          else if (passageDirection === 'left' && velocity.x < 0) { collisionHandled = true; }
          else if (passageDirection === 'down' && velocity.y > 0) { collisionHandled = true; }
          else if (passageDirection === 'up' && velocity.y < 0) { collisionHandled = true; }

          // If trying to go against the open gate or other directions, treat as a normal wall bounce
          if (!collisionHandled) {
             setBallVelocity(prev => ({ x: -velocity.x * 0.7, y: -velocity.y * 0.7 })); // Use 'velocity' parameter
             collisionHandled = true;
          }
        } else { // Gate is closed
          // If gate is closed, block passage against its one-way nature
          // Ensure 'velocity' is correctly referenced here
          if (passageDirection === 'right' && velocity.x < 0) { // Trying to pass from right to left (blocked)
              setBallVelocity(prev => ({ x: -velocity.x * 0.7, y: velocity.y * 0.7 })); // Use 'velocity' parameter
              collisionHandled = true;
          } else if (passageDirection === 'left' && velocity.x > 0) { // Trying to pass from left to right (blocked)
              setBallVelocity(prev => ({ x: -velocity.x * 0.7, y: velocity.y * 0.7 })); // Use 'velocity' parameter
              collisionHandled = true;
          } else if (passageDirection === 'down' && velocity.y < 0) { // Trying to pass from bottom to top (blocked)
              setBallVelocity(prev => ({ x: velocity.x * 0.7, y: -velocity.y * 0.7 })); // Use 'velocity' parameter
              collisionHandled = true;
          } else if (passageDirection === 'up' && velocity.y > 0) { // Trying to pass from top to bottom (blocked)
              setBallVelocity(prev => ({ x: velocity.x * 0.7, y: -velocity.y * 0.7 })); // Use 'velocity' parameter
              collisionHandled = true;
          } else {
              // General bounce for all other cases when the gate is closed
              setBallVelocity(prev => ({ x: -velocity.x * 0.7, y: -velocity.y * 0.7 })); // Use 'velocity' parameter
              collisionHandled = true;
          }
        }
        // Important: Nudge the ball slightly out of the gate's collision area if it's blocking
        if (collisionHandled && !currentIsOpen) { // Only nudge if it acted as a blocker
            let nudgeX = 0;
            let nudgeY = 0;

            // Ensure 'ballPosition' and 'radius' are correctly referenced here
            if (ballPosition.x < gateRect.left + radius && velocity.x > 0) nudgeX = -(COLLISION_NUDGE + radius); // Nudge past the edge
            else if (ballPosition.x > gateRect.right - radius && velocity.x < 0) nudgeX = (COLLISION_NUDGE + radius);

            if (ballPosition.y < gateRect.top + radius && velocity.y > 0) nudgeY = -(COLLISION_NUDGE + radius);
            else if (ballPosition.y > gateRect.bottom - radius && velocity.y < 0) nudgeY = (COLLISION_NUDGE + radius);

            // If a nudge was calculated, apply it
            if (nudgeX !== 0 || nudgeY !== 0) {
              setBallPosition(prev => ({ x: prev.x + nudgeX, y: prev.y + nudgeY }));
            }
        }
      }

      const mysterySaucer = mysterySaucerRef.current;
    if (mysterySaucer && mysterySaucer.getIsLit() && !isBallCaptured) { // Only collide if lit and not already captured
      const saucerRect = mysterySaucer.getBoundingClientRect();
      if (saucerRect && isCircleCollidingWithRectangle(ballCircle, saucerRect)) {
        // If it was hit, let the saucer component handle its internal state and call onActivate
        const scoreAwarded = mysterySaucer.handleCollision();
        if (scoreAwarded > 0) {
          // The onActivateMystery callback will handle score and ball capture
          // No need to set score or velocity here directly, onActivateMystery does it
        }
        return; // Prevent other collisions while ball is captured
      }
    }

    // --- If ball is captured, prevent further collision logic ---
    if (isBallCaptured) {
        setBallPosition(ballCapturePosition.current); // Keep ball at capture point
        setBallVelocity({ x: 0, y: 0 }); // Keep ball still
        return; // Skip all other collision checks if ball is captured
    }
    }

    const variableTargetRefs = [
      variableTarget1Ref,
      variableTarget2Ref,
      variableTarget3Ref,
      variableTarget4Ref // Include if using 4th target
    ];
    variableTargetRefs.forEach(vtRef => {
      const variableTarget = vtRef.current;
      if (variableTarget) {
        const targetRect = variableTarget.getBoundingClientRect();
        if (targetRect && isCircleCollidingWithRectangle(ballCircle, targetRect)) {
          // Call the target's collision handler, which will internally check isHit state
          // and then call handleVariableTargetHit if not already hit.
          const scoreAwarded = variableTarget.handleCollision(); // handleCollision now returns score
          if (scoreAwarded > 0) {
            // No need to setScore here, handleVariableTargetHit already does
            // setScore(prev => prev + scoreAwarded);
            setBallVelocity(prev => ({ x: prev.x * 0.9, y: -prev.y * 0.8 })); // Bounce
          }
        }
      }
    });

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
      if (lives === 3 && kickbackLeftRef.current && ballPosition.x < PLAY_AREA_WIDTH * 0.2) {
        const impulse = kickbackLeftRef.current.handleCollision(ballPosition, radius);
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
      if (ballPosition.y <= tubeEntranceY - tubeHeight) { // Exit at the top
        setBallIsInTube(false);
        setBallPosition(prev => ({ ...prev, x: tubeEntranceX + tubeWidth / 2, y: tubeEntranceY - tubeHeight - radius * 2 }));
        setBallVelocity({ x: 5, y: 10 }); // Example exit velocity
      }
    } else if (ballLaunched && ballPosition.x >= tubeEntranceX && ballPosition.x <= tubeEntranceX + tubeWidth && ballPosition.y + radius >= tubeEntranceY && ballPosition.y - radius <= tubeEntranceY + tubeHeight / 2) {
      setBallIsInTube(true);
    }
  }, [ballLaunched, ballPosition, tubeEntranceX, tubeEntranceY, tubeWidth, tubeHeight, ballIsInTube]);

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
    target1Ref.current?.resetTarget(); // Regular targets
    target2Ref.current?.resetTarget(); // Regular targets
    skillShotLaneRef.current?.activateSkillShot();
    dropTarget1Ref.current?.resetTarget();
    dropTarget2Ref.current?.resetTarget();
    dropTarget3Ref.current?.resetTarget();
    setDroppedTargets({});
    rolloverARef.current?.resetLight();
    rolloverBRef.current?.resetLight();
    rolloverCRef.current?.resetLight();
    setLitRollovers({});
     mysterySaucerRef.current?.resetSaucer(); // Reset saucer at game start
    mysterySaucerRef.current?.lightSaucer();
    gateRef.current?.close();
    resetBonusMultiplier(); // Ensure reset at game start
    resetBonusScoreUnits(); // Ensure reset at game start
    mysterySaucerRef.current?.resetSaucer();
    mysterySaucerRef.current?.lightSaucer();
    resetVariableTargetBank();

    // Reset Tilt state on game start
    setTiltWarnings(0);
    setIsTilted(false);
    tiltCooldownCounter.current = 0;
    nudgeInputX.current = 0;
    nudgeInputY.current = 0;
    nudgeResetCounter.current = 0;
     resetBonusMultiplier();
    // Reset the variable target bank on game start
    resetVariableTargetBank();

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
          if (passageDirection === 'right' && ballVelocity.x > 0) {
            // Allow passage, no bounce
            collisionHandled = true;
          } else if (passageDirection === 'left' && ballVelocity.x < 0) {
            // Allow passage, no bounce
            collisionHandled = true;
          } else if (passageDirection === 'down' && ballVelocity.y > 0) {
            // Allow passage, no bounce
            collisionHandled = true;
          } else if (passageDirection === 'up' && ballVelocity.y < 0) {
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
          if (passageDirection === 'right' && ballVelocity.x < 0) { // Trying to pass from right to left
              setBallVelocity(prev => ({ x: -prev.x * 0.7, y: prev.y * 0.7 })); // Bounce horizontally
              collisionHandled = true;
          } else if (passageDirection === 'left' && ballVelocity.x > 0) { // Trying to pass from left to right
              setBallVelocity(prev => ({ x: -prev.x * 0.7, y: prev.y * 0.7 })); // Bounce horizontally
              collisionHandled = true;
          } else if (passageDirection === 'down' && ballVelocity.y < 0) { // Trying to pass from bottom to top
              setBallVelocity(prev => ({ x: prev.x * 0.7, y: -prev.y * 0.7 })); // Bounce vertically
              collisionHandled = true;
          } else if (passageDirection === 'up' && ballVelocity.y > 0) { // Trying to pass from top to bottom
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




   const resetVariableTargetBank = useCallback(() => {
    console.log("Resetting variable target bank.");
    clearTimeout(targetBankTimeoutRef.current); // Clear any existing timeout

    const targets = [
      variableTarget1Ref.current,
      variableTarget2Ref.current,
      variableTarget3Ref.current,
      variableTarget4Ref.current
    ].filter(Boolean);

    targets.forEach(target => target.dimTarget()); // Dim all targets
    setActiveTargetInBank(0); // Reset sequence to start

    // Light the first target to begin the sequence again
    if (targets[0]) {
      targets[0].lightTarget();
      setActiveTargetInBank(0); // Set first target as active
      // Start the timeout again
      targetBankTimeoutRef.current = setTimeout(resetVariableTargetBank, TARGET_BANK_TIMEOUT);
    }
  }, []); // No dependencies as it operates on refs

  // Effect to initialize the target bank when the game starts or component mounts
  useEffect(() => {
    // Only initialize if not already active
    if (!ballLaunched && !gameOver && activeTargetInBank === 0) {
      resetVariableTargetBank(); // This will light the first target and start the timer
    }

    // Cleanup function for the timeout
    return () => {
      clearTimeout(targetBankTimeoutRef.current);
    };
  }, [ballLaunched, gameOver, resetVariableTargetBank]); // Run when game starts/ends or reset callback changes


 useEffect(() => {
    let animationFrameId;
    const GRAVITY = 0.1;
    const FRICTION = 0.99;

    const gameLoop = () => {
      if (ballLaunched && !gameOver && !isBallCaptured) { // <-- Add !isBallCaptured here
        setBallPosition(prevPosition => {
          let newX = prevPosition.x + ballVelocity.x;
          let newY = prevPosition.y + ballVelocity.y;

          setBallVelocity(prevVelocity => {
            let vx = prevVelocity.x * FRICTION;
            let vy = prevVelocity.y * FRICTION + GRAVITY;
            if (Math.abs(vx) < 0.1) vx = 0;
            if (Math.abs(vy) < 0.1 && newY + radius >= PLAY_AREA_HEIGHT) vy = 0;
            return { x: vx, y: vy };
          });

          // ... (boundary collisions) ...

          handleCollision({ x: newX, y: newY }, radius, ballVelocity);
          handleOutOfBounds({ x: newX, y: newY }, radius, ballVelocity);

          if (bumper1HitCooldown.current > 0) bumper1HitCooldown.current -= 1;
          if (bumper2HitCooldown.current > 0) bumper2HitCooldown.current -= 1;

          return { x: newX, y: newY };
        });
      }
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [ballLaunched, gameOver, ballVelocity, tubeExitY, isBallCaptured]); // Add isBallCaptured to dependencies


const increaseBonusMultiplier = useCallback(() => {
    setBonusMultiplier(prev => Math.min(prev + 1, MAX_BONUS_MULTIPLIER));
  }, []);

  // Function to reset the bonus multiplier
  const resetBonusMultiplier = useCallback(() => {
    setBonusMultiplier(1); // Reset to 1x
  }, []);

  // Function to apply the bonus multiplier to a score
  const applyBonusMultiplier = useCallback((score) => {
    return score * bonusMultiplier;
  }, [bonusMultiplier]);


  const handleDropTargetHit = useCallback((id, score) => {
    const multipliedScore = applyBonusMultiplier(score);
    setScore(prev => prev + multipliedScore);
    console.log(`Drop Target ${id} hit! Score: ${multipliedScore}`);
    setDroppedTargets(prev => ({ ...prev, [id]: true }));
  }, [applyBonusMultiplier]);

  const handleRollover = useCallback((id, score) => {
    const multipliedScore = applyBonusMultiplier(score);
    setScore(prev => prev + multipliedScore);
    console.log(`Rollover ${id} activated! Score: ${multipliedScore}`);
    setLitRollovers(prev => ({ ...prev, [id]: true }));
  }, [applyBonusMultiplier]);

  const handleVariableTargetHit = useCallback((id, score) => {
    const multipliedScore = applyBonusMultiplier(score);
    setScore(prev => prev + multipliedScore);
    console.log(`Variable Target ${id} hit! Score: ${multipliedScore}`);

    // Logic to advance the bank sequence
    const targets = [
      variableTarget1Ref.current,
      variableTarget2Ref.current,
      variableTarget3Ref.current,
      variableTarget4Ref.current
    ].filter(Boolean);

    const hitIndex = targets.findIndex(target => target?.id === id);

    if (hitIndex !== -1) {
      if (hitIndex === activeTargetInBank) {
        // Correct target hit: advance the sequence
        if (targets[activeTargetInBank]) {
          targets[activeTargetInBank].dimTarget();
        }

        const nextActiveIndex = activeTargetInBank + 1;
        if (nextActiveIndex < targets.length) {
          targets[nextActiveIndex].lightTarget();
          setActiveTargetInBank(nextActiveIndex);
          clearTimeout(targetBankTimeoutRef.current);
          targetBankTimeoutRef.current = setTimeout(resetVariableTargetBank, TARGET_BANK_TIMEOUT);
        } else {
          // All targets in the bank completed!
          const bonusScore = applyBonusMultiplier(TARGET_BANK_BONUS_SCORE);
          setScore(prev => prev + bonusScore);
          console.log("Variable Target Bank completed! Awarding bonus and resetting.");
          resetVariableTargetBank(); // Reset after completion
          increaseBonusMultiplier(); // Award a multiplier increase for completing the bank
        }
      } else {
        // Wrong target hit or hit an already completed/unlit target in sequence
        console.log(`Incorrect target ${id} hit. Expected target ${targets[activeTargetInBank]?.id || 'N/A'}`);
        // Optional: reset the bank if an incorrect target is hit
        // resetVariableTargetBank();
      }
    }
  }, [activeTargetInBank, applyBonusMultiplier, increaseBonusMultiplier]);

  const onActivateMystery = useCallback((baseScore) => {
    const multipliedBaseScore = applyBonusMultiplier(baseScore);
    setScore(prev => prev + multipliedBaseScore); // Apply multiplier to base score

    // Capture the ball immediately
    setIsBallCaptured(true);
    ballCapturePosition.current = ballPosition;
    setBallVelocity({ x: 0, y: 0 });

    // Determine random prize
    const prizeKeys = Object.keys(MYSTERY_PRIZES);
    const randomPrizeKey = prizeKeys[Math.floor(Math.random() * prizeKeys.length)];
    const prize = MYSTERY_PRIZES[randomPrizeKey];

    console.log(`Mystery activated! You won: ${randomPrizeKey}`);

    let message = "Mystery Prize!"; // Display to user

    if (typeof prize === 'number') {
      const multipliedPrize = applyBonusMultiplier(prize);
      setScore(prev => prev + multipliedPrize);
      message = `+${multipliedPrize} Points!`;
    } else {
      switch (prize) {
        case 'extraBall':
          setEarnedExtraBalls(prev => prev + 1);
          setLives(prev => prev + 1); // Add a life for extra ball
          message = "Extra Ball!";
          break;
        case 'advanceBonusMultiplier':
          increaseBonusMultiplier(); // Award a multiplier increase
          message = "Bonus Multiplier Advanced!";
          break;
        case 'lightKickback':
          kickbackLeftRef.current?.lightKickback();
          message = "Kickback Lit!";
          break;
        default:
          message = "Nothing (for now)!";
          break;
      }
    }

    // Display a message (you might want a dedicated UI for this)
    alert(message); // Simple alert for now, replace with proper UI

    // After a short delay, release the ball
    setTimeout(() => {
      setIsBallCaptured(false);
      mysterySaucerRef.current?.resetSaucer(); // Allow saucer to be hit again
      // Eject the ball with some velocity
      setBallPosition(prev => ({ x: ballCapturePosition.current.x, y: ballCapturePosition.current.y - radius * 2 })); // Move slightly up
      setBallVelocity({ x: (Math.random() > 0.5 ? 1 : -1) * 5, y: -10 }); // Random left/right eject
    }, 2000); // Ball captured for 2 seconds
  }, [ballPosition, setScore, setEarnedExtraBalls, setLives, increaseBonusMultiplier, applyBonusMultiplier]);

 
  // Function to add units to the end-of-ball bonus
  const addBonusScoreUnits = useCallback((units) => {
    setBonusScoreUnits(prev => prev + units);
  }, []);

  // Function to reset the accumulated bonus units
  const resetBonusScoreUnits = useCallback(() => {
    setBonusScoreUnits(0);
  }, []);

  // Function to apply the bonus multiplier to a score
  


  // MODIFIED: handleOutOfBounds to calculate and award end-of-ball bonus

      // Reset bonus units and multiplier for the next ball
      resetBonusScoreUnits();
      resetBonusMultiplier(); // Typically multiplier resets per ball

      // ... (rest of your existing handleOutOfBounds logic for kickback and life loss) ...

      // For kickbackLeftRef.current.handleCollision, it expects ballPosition and radius.
      if (kickbackLeftRef.current && ballPosition.x < PLAY_AREA_WIDTH * 0.2) { // Use ballPosition.x here
        const impulse = kickbackLeftRef.current.handleCollision(ballPosition, radius); // Pass ballPosition and radius
        if (impulse) {
          setBallVelocity(impulse);
          setBallLaunched(true);
          setBallPosition({ x: impulse.x > 0 ? (PLAY_AREA_WIDTH / 4) : (PLAY_AREA_WIDTH * 3 / 4), y: PLAY_AREA_HEIGHT - 100 });
          return; // Ball was saved, do not decrease life or reset
        }
      }

      setBallPosition({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
      setBallVelocity({ x: 0, y: 0 });
      setBallLaunched(false);
      setLives(prev => prev - 1);
      if (lives <= 0) {
        setGameOver(true);
      }
    else if (ballPosition.x < -radius * 2 || ballPosition.x > PLAY_AREA_WIDTH + radius * 2) {
      setBallVelocity(prev => ({ ...prev, x: -prev.x * 0.8 }));
    }
  


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
          ref={variableTarget1Ref}
          id="VT1"
          size={40}
          initialTop={200}
          initialLeft={500}
          scoreValue={200}
          onHit={handleVariableTargetHit} // Use the new handler
          initialIsLit={false} // Will be lit by resetVariableTargetBank
        />
          <PinballTarget
          ref={variableTarget2Ref}
          id="VT2"
          size={40}
          initialTop={200}
          initialLeft={550}
          scoreValue={200}
          onHit={handleVariableTargetHit}
          initialIsLit={false}
          />

          <PinballTarget
          ref={variableTarget3Ref}
          id="VT3"
          size={40}
          initialTop={200}
          initialLeft={600}
          scoreValue={200}
          onHit={handleVariableTargetHit}
          initialIsLit={false}
        />
        {/* Optional: Add a fourth target */}
        <PinballTarget
          ref={variableTarget4Ref}
          id="VT4"
          size={40}
          initialTop={200}
          initialLeft={650}
          scoreValue={200}
          onHit={handleVariableTargetHit}
          initialIsLit={false}
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
          position={ballPosition}
          radius={radius}
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
        <Scoreboard score={score} lives={lives} bonus={activeBonus} extraBalls={earnedExtraBalls} top={20} left={20}>
          
          <div>
            <span>SCORE:</span>
            <span>{score}</span>
          </div>
          <div>
            <span>LIVES:</span>
            <span>{lives}</span>
          </div>
          <div>
            <span>BONUS MULT:</span>
            <span>{bonusMultiplier}x</span>
          </div>
          <div>
            <span>BONUS UNITS:</span>
            <span>{bonusScoreUnits}</span>
          </div>
        </Scoreboard>
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
        <MysterySaucer
          ref={mysterySaucerRef}
          top={80} // Adjust position as needed
          left={650} // Adjust position as needed
          size={50}
          onActivate={onActivateMystery} // The main callback
          initialIsLit={true} // Start lit, or activate via game logic later
          scoreValue={1000} // Base score for hitting it
        />
         <MultiplierDisplay>
          Bonus Multiplier: {bonusMultiplier}x
        </MultiplierDisplay>
        {gameOver && (
          <GameOverMessage>
            Game Over! Final Score: {score}
            <RestartButton onClick={handleGameStart}>Restart</RestartButton>
          </GameOverMessage>
        )}
        <NudgeDisplay
          currentWarnings={tiltWarnings}
          maxWarnings={MAX_TILT_WARNINGS}
        />

      </PinballGame>
    </Container>
  );
};

export default Pinball;