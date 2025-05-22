import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import Ball from './components/Ball';
import LeftFlipper from './components/LeftFlipper';
import RightFlipper from './components/RightFlipper';
import Bumper from './components/Bumper';
import PinballTarget from './components/PinballTarget';
import Slingshot from './components/Slingshot';
import Spinner from './components/Spinner';
import Ramp from './components/Ramp';
import LoopShot from './components/LoopShot';
import PopBumper from './components/PopBumper';
import DropTarget from './components/DropTarget';
import Magnet from './components/Magnet';
import Outlane from './components/Outlane';
import Kickback from './components/Kickback';
import LaneChange from './components/LaneChange';
import SkillShotLane from './components/SkillShotLane';
// Removed Scoreboard, ScoreDisplay, BonusDisplay, ExtraBallIndicator as they are consolidated/handled differently
import GameOverMessage from './components/GameOverMessage'; // This might be replaced by GameOverOverlay
import GameStartButton from './components/GameStartButton';
import BallLauncher from './components/BallLauncher';
import Tube from './components/Tube';
import Gate from './components/Gate';
import MysterySaucer from './components/MysterySaucer';
import NudgeDisplay from './components/NudgeDisplay';
import RestartButton from './components/RestartButton';
import Rollover from './components/Rollover'; // Ensure Rollover is imported

// Constants
const BALL_RADIUS = 10;
const PLAY_AREA_WIDTH = 800;
const PLAY_AREA_HEIGHT = 600;
const INITIAL_BALL_X = PLAY_AREA_WIDTH - 50;
const INITIAL_BALL_Y = PLAY_AREA_HEIGHT - 50;
const LANE_CHANGE_DISTANCE = 50;
const LANE_CHANGE_COOLDOWN = 1000;
const BUMPER_SCORE = 100; // Generic, individual bumpers have their own scoreValue
const TARGET_SCORE = 200; // Generic, individual targets have their own scoreValue
const FLIPPER_HEIGHT = 20; // Not directly used in collision, but for styling
const FLIPPER_WIDTH = 80; // Not directly used in collision, but for styling
const COLLISION_NUDGE = 5; // A small nudge to prevent sticking after collision
const BUMPER_COOLDOWN_FRAMES = 10;
const SKILL_SHOT_SCORE = 1000;
const DROP_TARGET_BONUS_SCORE = 5000;
const ROLLOVER_BANK_BONUS_SCORE = 2000;
const MAX_BONUS_MULTIPLIER = 10;
const END_OF_BALL_BONUS_FACTOR = 100;
const TARGET_BANK_TIMEOUT = 10000; // Time in ms to reset the variable target bank if not completed
const TARGET_BANK_BONUS_SCORE = 100;
// Mystery Prizes (Defined as a constant at the top level)
const MYSTERY_PRIZES = {
    SCORE_SMALL: 5000,
    SCORE_MEDIUM: 15000,
    SCORE_LARGE: 50000,
    EXTRA_BALL: 'extraBall',
    ADVANCE_BONUS_MULTIPLIER: 'advanceBonusMultiplier',
    LIGHT_KICKBACK: 'lightKickback', // Assuming kickback can be lit
    POINTS_PENALTY: -2000,
};

// Nudge/Tilt Constants
const MAX_TILT_WARNINGS = 2;
const NUDGE_IMPULSE_STRENGTH = 1.5;
const TILT_COOLDOWN_FRAMES = 60; // Frames to prevent rapid tilts (e.g., 1 second at 60fps)
const NUDGE_RESET_FRAMES = 180; // Frames after which warnings reset if no nudge occurs (e.g., 3 seconds at 60fps)
const WALL_BOUNCE_DAMPENING = 0.8;

// Physics Constants
const GRAVITY = 0.1;
const FRICTION = 0.99;

// Styled components
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #222;
  overflow: hidden;
`;

const PinballGame = styled.div`
  position: relative;
  width: ${PLAY_AREA_WIDTH}px;
  height: ${PLAY_AREA_HEIGHT}px;
  background-color: #444;
  border: 2px solid #222;
  overflow: hidden;
  touch-action: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  &:focus {
    outline: none;
  }
`;

// Consolidated Scoreboard
const ConsolidatedScoreboard = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 10px 15px;
  border-radius: 8px;
  font-family: 'Press Start 2P', cursive; /* Placeholder, ensure font is loaded */
  font-size: 1.2em;
  font-weight: bold;
  z-index: 1000;
  border: 2px solid #ffcc00;
  box-shadow: 0 0 15px rgba(255, 204, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 5px;

  div {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  span:first-child {
    color: #00ffff;
  }

  span:last-child {
    color: #ffffff;
  }
`;

// GameOverOverlay
const GameOverOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 2em;
  z-index: 2000;
`;


const Pinball = () => {
  // --- STATE FOR RENDERING (triggers re-renders) ---
  const [displayBallPosition, setDisplayBallPosition] = useState({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
  const [displayBallVelocity, setDisplayBallVelocity] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false); // Correctly declared
  const [ballLaunched, setBallLaunched] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [bonusMultiplier, setBonusMultiplier] = useState(1);
  const [bonusScoreUnits, setBonusScoreUnits] = useState(0);
  const [tiltWarnings, setTiltWarnings] = useState(0);
  const [isTilted, setIsTilted] = useState(false);
  const [isBallCaptured, setIsBallCaptured] = useState(false);
  const [activeTargetInBank, setActiveTargetInBank] = useState(0); // For Variable Target Bank
  const [droppedTargets, setDroppedTargets] = useState({}); // For Drop Target Bank
  const [litRollovers, setLitRollovers] = useState({}); // For Rollover Bank
  const [earnedExtraBalls, setEarnedExtraBalls] = useState(0); // Correctly declared
  const [leftFlipperAngle, setLeftFlipperAngle] = useState(0);   // Correctly declared
  const [rightFlipperAngle, setRightFlipperAngle] = useState(0);  // Correctly declared


  // --- REFS FOR GAME LOGIC (do NOT trigger re-renders by themselves) ---
  const ballPositionRef = useRef({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
  const ballVelocityRef = useRef({ x: 0, y: 0 });
  const tubeEntranceX = useRef(0);
  const tubeEntranceY = useRef(0);
  const tubeWidth = useRef(0);
  const tubeHeight = useRef(0);
  const ballCapturePosition = useRef({ x: 0, y: 0 });
  const bumper1HitCooldown = useRef(0);
  const bumper2HitCooldown = useRef(0);
  const tiltCooldownCounter = useRef(0);
  const nudgeInputX = useRef(0);
  const nudgeInputY = useRef(0);
  const nudgeResetCounter = useRef(0);
  const targetBankTimeoutRef = useRef(null);
  const ballRef = useRef(null); // Correctly declared here

  // Refs for interactive elements (DOM refs)
  const bumper1Ref = useRef(null);
  const bumper2Ref = useRef(null);
  const target1Ref = useRef(null);
  const target2Ref = useRef(null);
  const leftFlipperRef = useRef(null);
  const rightFlipperRef = useRef(null);
  const rampRef = useRef(null);
  const slingshotLeftRef = useRef(null);
  const slingshotRightRef = useRef(null);
  const spinnerRef = useRef(null);
  const outlaneLeftRef = useRef(null);
  const outlaneRightRef = useRef(null);
  const kickbackLeftRef = useRef(null);
  const skillShotLaneRef = useRef(null);
  const dropTarget1Ref = useRef(null);
  const dropTarget2Ref = useRef(null);
  const dropTarget3Ref = useRef(null);
  const rolloverARef = useRef(null);
  const rolloverBRef = useRef(null);
  const rolloverCRef = useRef(null);
  const gateRef = useRef(null);
  const mysterySaucerRef = useRef(null);
  const variableTarget1Ref = useRef(null);
  const variableTarget2Ref = useRef(null);
  const variableTarget3Ref = useRef(null);
  const variableTarget4Ref = useRef(null);


  // Derived state (from refs, so it's always up-to-date in logic)
  const tubeExitY = tubeEntranceY.current + tubeHeight.current;
  const isLaneChangeAllowed = true; // Not actively used in collision logic, but kept for future

  // --- Utility Functions ---
  const isCircleCollidingWithRectangle = useCallback((circle, rect) => {
    if (!rect || !circle) return false;
    const closestX = Math.max(rect.left, Math.min(circle.x, rect.right));
    const closestY = Math.max(rect.top, Math.min(circle.y, rect.bottom));
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared < (circle.radius * circle.radius);
  }, []);

  // --- Bonus Multiplier Callbacks ---
  const increaseBonusMultiplier = useCallback(() => {
    setBonusMultiplier(prev => Math.min(prev + 1, MAX_BONUS_MULTIPLIER));
  }, []);

  const resetBonusMultiplier = useCallback(() => {
    setBonusMultiplier(1);
  }, []);

  const addBonusScoreUnits = useCallback((units) => {
    setBonusScoreUnits(prev => prev + units);
  }, []);

  const resetBonusScoreUnits = useCallback(() => {
    setBonusScoreUnits(0);
  }, []);

  const applyBonusMultiplier = useCallback((score) => {
    return score * bonusMultiplier;
  }, [bonusMultiplier]);

  // --- Component-Specific Callbacks ---

  // Drop Target Bank Callbacks
  const handleDropTargetHit = useCallback((id, score) => {
    const multipliedScore = applyBonusMultiplier(score);
    setScore(prev => prev + multipliedScore);
    setDroppedTargets(prev => ({ ...prev, [id]: true }));
  }, [applyBonusMultiplier]);

  useEffect(() => {
    const allTargetsDropped =
      dropTarget1Ref.current?.getIsDropped() &&
      dropTarget2Ref.current?.getIsDropped() &&
      dropTarget3Ref.current?.getIsDropped();

    if (allTargetsDropped) {
      setScore(prev => prev + applyBonusMultiplier(DROP_TARGET_BONUS_SCORE));
      setTimeout(() => {
        dropTarget1Ref.current?.resetTarget();
        dropTarget2Ref.current?.resetTarget();
        dropTarget3Ref.current?.resetTarget();
        setDroppedTargets({});
      }, 500);
    }
  }, [droppedTargets, applyBonusMultiplier]);

  // Rollover Bank Callbacks
  const handleRollover = useCallback((id, score) => {
    const multipliedScore = applyBonusMultiplier(score);
    setScore(prev => prev + multipliedScore);
    setLitRollovers(prev => ({ ...prev, [id]: true }));
    addBonusScoreUnits(10); // Each rollover hit adds 10 bonus units
  }, [applyBonusMultiplier, addBonusScoreUnits]);

  useEffect(() => {
    const allRolloversLit =
      rolloverARef.current?.getIsLit() &&
      rolloverBRef.current?.getIsLit() &&
      rolloverCRef.current?.getIsLit();

    if (allRolloversLit) {
      setScore(prev => prev + applyBonusMultiplier(ROLLOVER_BANK_BONUS_SCORE));
      setTimeout(() => {
        rolloverARef.current?.resetLight();
        rolloverBRef.current?.resetLight();
        rolloverCRef.current?.resetLight();
        setLitRollovers({});
      }, 500);
    }
  }, [litRollovers, applyBonusMultiplier]);

  // Variable Target Bank Callbacks
  const handleVariableTargetHit = useCallback((id, score) => {
    const targets = [
      variableTarget1Ref.current,
      variableTarget2Ref.current,
      variableTarget3Ref.current,
      variableTarget4Ref.current
    ].filter(Boolean);

    const hitIndex = targets.findIndex(target => target?.id === id);

    if (hitIndex !== -1) {
      if (hitIndex === activeTargetInBank) {
        setScore(prev => prev + applyBonusMultiplier(score)); // Apply score for individual target
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
          setScore(prev => prev + applyBonusMultiplier(TARGET_BANK_BONUS_SCORE)); // Correctly defined
          resetVariableTargetBank();
          increaseBonusMultiplier(); // Award a multiplier increase for completing the bank
        }
      } else {
        // Incorrect target hit or hit an already completed/unlit target in sequence
        // Optional: reset the bank if an incorrect target is hit
        // resetVariableTargetBank();
      }
    }
  }, [activeTargetInBank, applyBonusMultiplier, increaseBonusMultiplier]);

  const resetVariableTargetBank = useCallback(() => {
    clearTimeout(targetBankTimeoutRef.current);
    const targets = [
      variableTarget1Ref.current,
      variableTarget2Ref.current,
      variableTarget3Ref.current,
      variableTarget4Ref.current
    ].filter(Boolean);

    targets.forEach(target => target.dimTarget());
    setActiveTargetInBank(0);

    if (targets[0]) {
      targets[0].lightTarget();
      setActiveTargetInBank(0);
      targetBankTimeoutRef.current = setTimeout(resetVariableTargetBank, TARGET_BANK_TIMEOUT);
    }
  }, []);

  useEffect(() => {
    if (!ballLaunched && !gameOver && activeTargetInBank === 0) {
      resetVariableTargetBank();
    }
    return () => {
      clearTimeout(targetBankTimeoutRef.current);
    };
  }, [ballLaunched, gameOver, resetVariableTargetBank]);

  // Mystery Saucer Callback
  const onActivateMystery = useCallback((baseScore) => {
    const multipliedBaseScore = applyBonusMultiplier(baseScore);
    setScore(prev => prev + multipliedBaseScore);

    setIsBallCaptured(true);
    ballCapturePosition.current = ballPositionRef.current; // Use ref for current position
    ballVelocityRef.current = { x: 0, y: 0 }; // Stop the ball
    setDisplayBallVelocity({ x: 0, y: 0 }); // Update display velocity

    const prizeKeys = Object.keys(MYSTERY_PRIZES); // Correctly defined
    const randomPrizeKey = prizeKeys[Math.floor(Math.random() * prizeKeys.length)];
    const prize = MYSTERY_PRIZES[randomPrizeKey]; // Correctly defined

    let message = "Mystery Prize!";

    if (typeof prize === 'number') {
      const multipliedPrize = applyBonusMultiplier(prize);
      setScore(prev => prev + multipliedPrize);
      message = `+${multipliedPrize} Points!`;
    } else {
      switch (prize) {
        case 'extraBall':
          setEarnedExtraBalls(prev => prev + 1); // Correctly using setter
          setLives(prev => prev + 1);
          message = "Extra Ball!";
          break;
        case 'advanceBonusMultiplier':
          increaseBonusMultiplier();
          message = "Bonus Multiplier Advanced!";
          break;
        case 'lightKickback':
          // Assuming Kickback has a lightKickback method
          // kickbackLeftRef.current?.lightKickback();
          message = "Kickback Lit!";
          break;
        default:
          message = "Nothing (for now)!";
          break;
      }
    }

    alert(message); // Replace with proper UI later

    setTimeout(() => {
      setIsBallCaptured(false);
      mysterySaucerRef.current?.resetSaucer();
      // Eject the ball with some velocity
      ballPositionRef.current = { x: ballCapturePosition.current.x, y: ballCapturePosition.current.y - BALL_RADIUS * 2 };
      ballVelocityRef.current = { x: (Math.random() > 0.5 ? 1 : -1) * 5, y: -10 };
      // Update display states to reflect changes
      setDisplayBallPosition(ballPositionRef.current);
      setDisplayBallVelocity(ballVelocityRef.current);
    }, 2000);
  }, [applyBonusMultiplier, increaseBonusMultiplier, setEarnedExtraBalls, setLives]); // Added setEarnedExtraBalls, setLives

  // --- Main Collision Handler ---
  const handleCollision = useCallback((ballPosition, radius, velocity) => {
    const ballCircle = { x: ballPosition.x, y: ballPosition.y, radius: radius };

    // If ball is captured, prevent further collision logic
    if (isBallCaptured) {
        ballPositionRef.current = ballCapturePosition.current;
        ballVelocityRef.current = { x: 0, y: 0 };
        return;
    }

    // Mystery Saucer Collision (only if lit and not captured)
    const mysterySaucer = mysterySaucerRef.current;
    if (mysterySaucer && mysterySaucer.getIsLit()) {
      const saucerRect = mysterySaucer.getBoundingClientRect();
      if (saucerRect && isCircleCollidingWithRectangle(ballCircle, saucerRect)) {
        mysterySaucer.handleCollision(); // Triggers onActivateMystery
        return; // Exit early to prevent other collisions while ball is captured
      }
    }

    // Bumper Collisions
    const bumper1 = bumper1Ref.current;
    if (bumper1) {
      const bumperRect = bumper1.getBoundingClientRect();
      if (bumperRect && isCircleCollidingWithRectangle(ballCircle, bumperRect) && bumper1HitCooldown.current <= 0) {
        bumper1.handleCollision();
        setScore(prev => prev + applyBonusMultiplier(bumper1.getScoreValue()));
        ballVelocityRef.current = { x: -velocity.x * WALL_BOUNCE_DAMPENING, y: -velocity.y * WALL_BOUNCE_DAMPENING };
        ballPositionRef.current = {
          x: ballPosition.x + (ballPosition.x < bumperRect.left ? -COLLISION_NUDGE : (ballPosition.x > bumperRect.right ? COLLISION_NUDGE : 0)),
          y: ballPosition.y + (ballPosition.y < bumperRect.top ? -COLLISION_NUDGE : (ballPosition.y > bumperRect.bottom ? COLLISION_NUDGE : 0)),
        };
        bumper1HitCooldown.current = BUMPER_COOLDOWN_FRAMES;
      }
    }

    const bumper2 = bumper2Ref.current;
    if (bumper2) {
      const bumperRect = bumper2.getBoundingClientRect();
      if (bumperRect && isCircleCollidingWithRectangle(ballCircle, bumperRect) && bumper2HitCooldown.current <= 0) {
        bumper2.handleCollision();
        setScore(prev => prev + applyBonusMultiplier(bumper2.getScoreValue()));
        ballVelocityRef.current = { x: -velocity.x * WALL_BOUNCE_DAMPENING, y: -velocity.y * WALL_BOUNCE_DAMPENING };
        ballPositionRef.current = {
          x: ballPosition.x + (ballPosition.x < bumperRect.left ? -COLLISION_NUDGE : (ballPosition.x > bumperRect.right ? COLLISION_NUDGE : 0)),
          y: ballPosition.y + (ballPosition.y < bumperRect.top ? -COLLISION_NUDGE : (ballPosition.y > bumperRect.bottom ? COLLISION_NUDGE : 0)),
        };
        bumper2HitCooldown.current = BUMPER_COOLDOWN_FRAMES;
      }
    }

    // Target Collisions
    const target1 = target1Ref.current;
    if (target1) {
      const targetRect = target1.getBoundingClientRect();
      if (targetRect && isCircleCollidingWithRectangle(ballCircle, targetRect)) {
        target1.handleCollision(); // This calls onHit which applies multiplier
        ballVelocityRef.current = { ...ballVelocityRef.current, y: -velocity.y * 0.7 };
      }
    }

    const target2 = target2Ref.current;
    if (target2) {
      const targetRect = target2.getBoundingClientRect();
      if (targetRect && isCircleCollidingWithRectangle(ballCircle, targetRect)) {
        target2.handleCollision(); // This calls onHit which applies multiplier
        ballVelocityRef.current = { ...ballVelocityRef.current, y: -velocity.y * 0.7 };
      }
    }

    // Slingshot Collisions
    const slingshotLeft = slingshotLeftRef.current;
    if (slingshotLeft) {
      const impulse = slingshotLeft.handleCollision(ballPosition, radius);
      if (impulse) {
        ballVelocityRef.current = { x: ballVelocityRef.current.x + impulse.x, y: ballVelocityRef.current.y + impulse.y };
        setScore(prev => prev + applyBonusMultiplier(50)); // Slingshot score
      }
    }

    const slingshotRight = slingshotRightRef.current;
    if (slingshotRight) {
      const impulse = slingshotRight.handleCollision(ballPosition, radius);
      if (impulse) {
        ballVelocityRef.current = { x: ballVelocityRef.current.x + impulse.x, y: ballVelocityRef.current.y + impulse.y };
        setScore(prev => prev + applyBonusMultiplier(50)); // Slingshot score
      }
    }

    // Spinner Collision
    const spinner = spinnerRef.current;
    if (spinner) {
      const spinnerRect = spinner.getBoundingClientRect();
      if (spinnerRect && isCircleCollidingWithRectangle(ballCircle, spinnerRect)) {
        const baseScore = spinner.handleCollision(velocity);
        setScore(prev => prev + applyBonusMultiplier(baseScore));
        ballVelocityRef.current = { x: -velocity.x * 0.6, y: -velocity.y * 0.6 };
      }
    }

    // Kickback Collision
    const kickbackLeft = kickbackLeftRef.current;
    if (kickbackLeft) {
      const kickbackRect = kickbackLeft.getBoundingClientRect();
      if (kickbackRect && isCircleCollidingWithRectangle(ballCircle, kickbackRect)) {
        const impulse = kickbackLeft.handleCollision(ballPosition, radius);
        if (impulse) {
          ballVelocityRef.current = impulse;
          setScore(prev => prev + applyBonusMultiplier(100)); // Kickback score
        }
      }
    }

    // Skill Shot Lane Collision
    const skillShotLane = skillShotLaneRef.current;
    if (skillShotLane) {
      const score = skillShotLane.handleCollision(ballPosition, radius);
      if (score > 0) {
        setScore(prev => prev + applyBonusMultiplier(score));
        ballVelocityRef.current = { ...ballVelocityRef.current, y: ballVelocityRef.current.y * 0.8 };
      }
    }

    // Drop Target Collisions
    const dropTargetRefs = [dropTarget1Ref, dropTarget2Ref, dropTarget3Ref];
    dropTargetRefs.forEach(dtRef => {
      const dropTarget = dtRef.current;
      if (dropTarget) {
        const dropTargetRect = dropTarget.getBoundingClientRect();
        if (dropTargetRect && isCircleCollidingWithRectangle(ballCircle, dropTargetRect)) {
          dropTarget.handleCollision(); // Calls onHit which applies multiplier
          ballVelocityRef.current = { x: ballVelocityRef.current.x * 0.9, y: -ballVelocityRef.current.y * 0.8 };
        }
      }
    });

    // Rollover Lane Collisions
    const rolloverRefs = [rolloverARef, rolloverBRef, rolloverCRef];
    rolloverRefs.forEach(rlRef => {
      const rollover = rlRef.current; // Corrected from rl to rlRef.current
      if (rollover) {
        const rolloverRect = rollover.getBoundingClientRect();
        if (rolloverRect && isCircleCollidingWithRectangle(ballCircle, rolloverRect)) {
          rollover.handleCollision(); // Calls onRollOver which applies multiplier
          ballVelocityRef.current = { x: ballVelocityRef.current.x * 0.9, y: ballVelocityRef.current.y * 0.9 };
        }
      }
    });

    // Gate Collision
    const gate = gateRef.current;
    if (gate) {
      const gateRect = gate.getBoundingClientRect();
      if (gateRect && isCircleCollidingWithRectangle(ballCircle, gateRect)) {
        const currentIsOpen = gate.getIsOpen();
        const passageDirection = gate.props.passageDirection;

        let collisionHandled = false;

        if (currentIsOpen) {
          if (passageDirection === 'right' && velocity.x > 0) { collisionHandled = true; }
          else if (passageDirection === 'left' && velocity.x < 0) { collisionHandled = true; }
          else if (passageDirection === 'down' && velocity.y > 0) { collisionHandled = true; }
          else if (passageDirection === 'up' && velocity.y < 0) { collisionHandled = true; }

          if (!collisionHandled) {
             ballVelocityRef.current = { x: -velocity.x * WALL_BOUNCE_DAMPENING, y: -velocity.y * WALL_BOUNCE_DAMPENING };
             collisionHandled = true;
          }
        } else { // Gate is closed
          if (passageDirection === 'right' && velocity.x < 0) {
              ballVelocityRef.current = { x: -velocity.x * WALL_BOUNCE_DAMPENING, y: velocity.y * WALL_BOUNCE_DAMPENING };
              collisionHandled = true;
          } else if (passageDirection === 'left' && velocity.x > 0) {
              ballVelocityRef.current = { x: -velocity.x * WALL_BOUNCE_DAMPENING, y: velocity.y * WALL_BOUNCE_DAMPENING };
              collisionHandled = true;
          } else if (passageDirection === 'down' && velocity.y < 0) {
              ballVelocityRef.current = { x: velocity.x * WALL_BOUNCE_DAMPENING, y: -velocity.y * WALL_BOUNCE_DAMPENING };
              collisionHandled = true;
          } else if (passageDirection === 'up' && velocity.y > 0) {
              ballVelocityRef.current = { x: velocity.x * WALL_BOUNCE_DAMPENING, y: -velocity.y * WALL_BOUNCE_DAMPENING };
              collisionHandled = true;
          } else {
              ballVelocityRef.current = { x: -velocity.x * WALL_BOUNCE_DAMPENING, y: -velocity.y * WALL_BOUNCE_DAMPENING };
              collisionHandled = true;
          }
        }
        if (collisionHandled && !currentIsOpen) {
            let nudgeX = 0;
            let nudgeY = 0;

            if (ballPosition.x < gateRect.left + radius && velocity.x > 0) nudgeX = -(COLLISION_NUDGE + radius);
            else if (ballPosition.x > gateRect.right - radius && velocity.x < 0) nudgeX = (COLLISION_NUDGE + radius);

            if (ballPosition.y < gateRect.top + radius && velocity.y > 0) nudgeY = -(COLLISION_NUDGE + radius);
            else if (ballPosition.y > gateRect.bottom - radius && velocity.y < 0) nudgeY = (COLLISION_NUDGE + radius);

            if (nudgeX !== 0 || nudgeY !== 0) {
              ballPositionRef.current = { x: ballPosition.x + nudgeX, y: ballPosition.y + nudgeY };
            }
        }
      }
    }

    // Variable Target Bank Collisions
    const variableTargetRefs = [
      variableTarget1Ref,
      variableTarget2Ref,
      variableTarget3Ref,
      variableTarget4Ref
    ];
    variableTargetRefs.forEach(vtRef => {
      const variableTarget = vtRef.current;
      if (variableTarget) {
        const targetRect = variableTarget.getBoundingClientRect();
        if (targetRect && isCircleCollidingWithRectangle(ballCircle, targetRect)) {
          const scoreAwarded = variableTarget.handleCollision();
          if (scoreAwarded > 0) {
            ballVelocityRef.current = { x: ballVelocityRef.current.x * 0.9, y: -ballVelocityRef.current.y * 0.8 };
          }
        }
      }
    });

  }, [isBallCaptured, applyBonusMultiplier, isCircleCollidingWithRectangle, mysterySaucerRef, bumper1Ref, bumper2Ref, target1Ref, target2Ref, slingshotLeftRef, slingshotRightRef, spinnerRef, kickbackLeftRef, skillShotLaneRef, dropTarget1Ref, dropTarget2Ref, dropTarget3Ref, rolloverARef, rolloverBRef, rolloverCRef, gateRef, variableTarget1Ref, variableTarget2Ref, variableTarget3Ref, variableTarget4Ref]); // Dependencies for useCallback

  // --- Handle Out of Bounds (Drain) ---
  const handleOutOfBounds = useCallback((ballPosition, radius, velocity) => {
    if (ballPosition.y > PLAY_AREA_HEIGHT + radius * 2) {
      const endOfBallBonus = bonusScoreUnits * END_OF_BALL_BONUS_FACTOR * bonusMultiplier;
      if (endOfBallBonus > 0) {
        setScore(prev => prev + endOfBallBonus);
        alert(`End-of-Ball Bonus: +${endOfBallBonus} points!`); // Simple display
      }

      resetBonusScoreUnits();
      resetBonusMultiplier();

      if (kickbackLeftRef.current && ballPosition.x < PLAY_AREA_WIDTH * 0.2) {
        const impulse = kickbackLeftRef.current.handleCollision(ballPosition, radius);
        if (impulse) {
          ballVelocityRef.current = impulse;
          setBallLaunched(true);
          ballPositionRef.current = { x: impulse.x > 0 ? (PLAY_AREA_WIDTH / 4) : (PLAY_AREA_WIDTH * 3 / 4), y: PLAY_AREA_HEIGHT - 100 };
          setDisplayBallPosition(ballPositionRef.current); // Update display state
          setDisplayBallVelocity(ballVelocityRef.current); // Update display state
          return;
        }
      }

      ballPositionRef.current = { x: INITIAL_BALL_X, y: INITIAL_BALL_Y };
      ballVelocityRef.current = { x: 0, y: 0 };
      setBallLaunched(false);
      setLives(prev => prev - 1);
      if (lives <= 0) {
        setGameOver(true);
      }
      setDisplayBallPosition(ballPositionRef.current); // Update display state
      setDisplayBallVelocity(ballVelocityRef.current); // Update display state
    } else if (ballPosition.y < -radius) {
      ballVelocityRef.current = { ...ballVelocityRef.current, y: -ballVelocityRef.current.y * WALL_BOUNCE_DAMPENING };
      ballPositionRef.current = { ...ballPositionRef.current, y: -radius + COLLISION_NUDGE };
    } else if (ballPosition.x < -radius || ballPosition.x > PLAY_AREA_WIDTH + radius) {
      ballVelocityRef.current = { ...ballVelocityRef.current, x: -ballVelocityRef.current.x * WALL_BOUNCE_DAMPENING };
      ballPositionRef.current = { ...ballPositionRef.current, x: ballPosition.x < -radius ? -radius : PLAY_AREA_WIDTH + radius }; // Nudge back
    }
  }, [bonusScoreUnits, bonusMultiplier, applyBonusMultiplier, resetBonusScoreUnits, resetBonusMultiplier, kickbackLeftRef, setScore, setBallLaunched, setLives, setGameOver]); // Dependencies for useCallback

  // --- Game Start/Reset Logic ---
  const handleGameStart = useCallback(() => {
    setGameOver(false);
    setScore(0);
    setLives(3);
    setBallLaunched(false);
    setIsTilted(false);
    setTiltWarnings(0);
    setIsBallCaptured(false);

    // Reset all refs to initial values
    ballPositionRef.current = { x: INITIAL_BALL_X, y: INITIAL_BALL_Y };
    ballVelocityRef.current = { x: 0, y: 0 };
    bumper1HitCooldown.current = 0;
    bumper2HitCooldown.current = 0;
    tiltCooldownCounter.current = 0;
    nudgeInputX.current = 0;
    nudgeInputY.current = 0;
    nudgeResetCounter.current = 0;
    clearTimeout(targetBankTimeoutRef.current); // Clear any active timeout

    // Update display states
    setDisplayBallPosition(ballPositionRef.current);
    setDisplayBallVelocity(ballVelocityRef.current);

    // Reset child components via refs
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
    gateRef.current?.close();
    mysterySaucerRef.current?.resetSaucer();
    mysterySaucerRef.current?.lightSaucer();
    resetVariableTargetBank(); // This will light the first target and start its timer
    resetBonusMultiplier();
    resetBonusScoreUnits();
  }, [resetVariableTargetBank, resetBonusMultiplier, resetBonusScoreUnits, setGameOver, setScore, setLives, setBallLaunched, setIsTilted, setTiltWarnings, setIsBallCaptured, setDisplayBallPosition, setDisplayBallVelocity, setDroppedTargets, setLitRollovers]); // Added all state setters as dependencies

  // --- Ball Launcher Logic ---
  const handlePlungerRelease = useCallback((launchPower) => {
    if (!ballLaunched && !isTilted && !gameOver) {
      const launchForce = launchPower * 15;
      ballVelocityRef.current = { x: -5, y: -launchForce };
      setBallLaunched(true);
      setDisplayBallVelocity(ballVelocityRef.current); // Update display state
      skillShotLaneRef.current?.activateSkillShot();
    }
  }, [ballLaunched, isTilted, gameOver, setBallLaunched, setDisplayBallVelocity]); // Added setters as dependencies


  // --- Flipper Action Handling ---
  const handleFlipperAction = useCallback((isLeft) => {
    if (isTilted || gameOver || !ballLaunched) return;

    if (isLeft) {
      setLeftFlipperAngle(-45); // Correctly using setter
      setTimeout(() => {
        setLeftFlipperAngle(0); // Correctly using setter
      }, 100);
    } else {
      setRightFlipperAngle(45); // Correctly using setter
      setTimeout(() => {
        setRightFlipperAngle(0); // Correctly using setter
      }, 100);
    }
  }, [isTilted, gameOver, ballLaunched, setLeftFlipperAngle, setRightFlipperAngle]); // Added setters as dependencies

  // --- Tube Entrance Logic ---
  const handleTubeEntrance = useCallback((entryX, entryY, width, height) => {
    tubeEntranceX.current = entryX;
    tubeEntranceY.current = entryY;
    tubeWidth.current = width;
    tubeHeight.current = height;
    setIsBallCaptured(true); // Treat tube entry as a capture for consistent physics
    ballPositionRef.current = { x: entryX + width / 2, y: entryY + height / 2 }; // Center in tube
    ballVelocityRef.current = { x: 0, y: 0 }; // Stop ball in tube
    setDisplayBallPosition(ballPositionRef.current);
    setDisplayBallVelocity(ballVelocityRef.current);
  }, [setIsBallCaptured, setDisplayBallPosition, setDisplayBallVelocity]); // Added setters as dependencies

  // Effect for ball movement inside the tube (if captured by tube)
  useEffect(() => {
    let interval;
    // Check if mysterySaucerRef.current is valid before accessing its method
    const isMysterySaucerLit = mysterySaucerRef.current?.getIsLit ? mysterySaucerRef.current.getIsLit() : false;

    if (isBallCaptured && !isMysterySaucerLit) { // Only move in tube if not mystery captured
      interval = setInterval(() => {
        if (ballPositionRef.current.y < tubeExitY) {
          ballPositionRef.current = { x: tubeEntranceX.current + tubeWidth.current / 2 - BALL_RADIUS, y: ballPositionRef.current.y + 5 };
          setDisplayBallPosition(ballPositionRef.current); // Update display
        } else {
          clearInterval(interval);
          setIsBallCaptured(false); // Release ball
          ballVelocityRef.current = { x: -10, y: -10 }; // Eject velocity
          setDisplayBallVelocity(ballVelocityRef.current); // Update display
        }
      }, 50); // Move every 50ms
    }
    return () => clearInterval(interval);
  }, [isBallCaptured, tubeExitY, setDisplayBallPosition, setDisplayBallVelocity]); // Added setters as dependencies


  // --- Nudge Logic (Moved to be declared earlier) ---
  const handleNudge = useCallback((direction) => {
    if (isTilted || gameOver || !ballLaunched) return; // Use 'gameOver' consistently

    setTiltWarnings(prev => {
      const newWarnings = prev + 1;
      if (newWarnings > MAX_TILT_WARNINGS) {
        setIsTilted(true);
        tiltCooldownCounter.current = TILT_COOLDOWN_FRAMES;
        ballVelocityRef.current = { x: 0, y: 0 };
        setDisplayBallVelocity(ballVelocityRef.current);
        return 0;
      }
      return newWarnings;
    });

    let impulseX = 0;
    let impulseY = 0;
    switch (direction) {
      case 'left': impulseX = -NUDGE_IMPULSE_STRENGTH; break;
      case 'right': impulseX = NUDGE_IMPULSE_STRENGTH; break;
      case 'up': impulseY = -NUDGE_IMPULSE_STRENGTH; break;
      case 'down': impulseY = NUDGE_IMPULSE_STRENGTH; break;
      default: break;
    }

    nudgeInputX.current += impulseX;
    nudgeInputY.current += impulseY;
    nudgeResetCounter.current = NUDGE_RESET_FRAMES;
  }, [isTilted, gameOver, ballLaunched, setTiltWarnings, setIsTilted, setDisplayBallVelocity]); // Use 'gameOver' consistently, added setters


  // --- Input Handling for Nudging and Flippers (Now handleNudge is defined) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver || isTilted || !ballLaunched) return; // Use 'gameOver' consistently

      // Flipper controls
      if (e.key === 'ArrowLeft') handleFlipperAction(true);
      if (e.key === 'ArrowRight') handleFlipperAction(false);

      // Nudge controls
      if (e.key === 'z') { handleNudge('left'); }
      if (e.key === 'x') { handleNudge('up'); }
      if (e.key === '/') { handleNudge('right'); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameOver, isTilted, ballLaunched, handleFlipperAction, handleNudge]); // Use 'gameOver' consistently


  // --- Main Game Loop (Physics and Updates) ---
  useEffect(() => {
    let animationFrameId;

    const gameLoop = () => {
      // Tilt Cooldown Management
      if (isTilted) {
        tiltCooldownCounter.current--;
        if (tiltCooldownCounter.current <= 0) {
          setIsTilted(false);
        }
      }

      // Nudge Warning Decay
      if (tiltWarnings > 0 && nudgeResetCounter.current > 0) {
        nudgeResetCounter.current--;
        if (nudgeResetCounter.current <= 0) {
          setTiltWarnings(0);
        }
      }

      // Only run physics if game is active, not over, not captured, and not tilted
      if (ballLaunched && !gameOver && !isBallCaptured && !isTilted) {
        ballVelocityRef.current.x *= FRICTION;
        ballVelocityRef.current.y = ballVelocityRef.current.y * FRICTION + GRAVITY;

        ballVelocityRef.current.x += nudgeInputX.current;
        ballVelocityRef.current.y += nudgeInputY.current;

        nudgeInputX.current = 0;
        nudgeInputY.current = 0;

        if (Math.abs(ballVelocityRef.current.x) < 0.1) ballVelocityRef.current.x = 0;
        if (Math.abs(ballVelocityRef.current.y) < 0.1 && ballPositionRef.current.y + BALL_RADIUS >= PLAY_AREA_HEIGHT - 5) {
          ballVelocityRef.current.y = 0;
        }

        ballPositionRef.current = {
          x: ballPositionRef.current.x + ballVelocityRef.current.x,
          y: ballPositionRef.current.y + ballVelocityRef.current.y,
        };

        // Boundary Collisions (Walls)
        if (ballPositionRef.current.x - BALL_RADIUS < 0) {
          ballVelocityRef.current.x = -ballVelocityRef.current.x * WALL_BOUNCE_DAMPENING;
          ballPositionRef.current.x = BALL_RADIUS;
        } else if (ballPositionRef.current.x + BALL_RADIUS > PLAY_AREA_WIDTH) {
          ballVelocityRef.current.x = -ballVelocityRef.current.x * WALL_BOUNCE_DAMPENING;
          ballPositionRef.current.x = PLAY_AREA_WIDTH - BALL_RADIUS;
        }

        if (ballPositionRef.current.y - BALL_RADIUS < 0) {
          ballVelocityRef.current.y = -ballVelocityRef.current.y * WALL_BOUNCE_DAMPENING;
          ballPositionRef.current.y = BALL_RADIUS;
        }

        handleCollision(ballPositionRef.current, BALL_RADIUS, ballVelocityRef.current);
        handleOutOfBounds(ballPositionRef.current, BALL_RADIUS, ballVelocityRef.current);

        if (bumper1HitCooldown.current > 0) bumper1HitCooldown.current -= 1;
        if (bumper2HitCooldown.current > 0) bumper2HitCooldown.current -= 1;

        setDisplayBallPosition({ ...ballPositionRef.current });
        setDisplayBallVelocity({ ...ballVelocityRef.current });
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [ballLaunched, gameOver, isBallCaptured, isTilted, tiltWarnings, handleCollision, handleOutOfBounds, setDisplayBallPosition, setDisplayBallVelocity]); // Added setters to dependencies

  return (
    <Container>
      <PinballGame tabIndex={0}>
        {/* Consolidated Scoreboard */}
        <ConsolidatedScoreboard>
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
        </ConsolidatedScoreboard>

        {/* Nudge/Tilt Warning Display */}
        <NudgeDisplay
          currentWarnings={tiltWarnings}
          maxWarnings={MAX_TILT_WARNINGS}
        />

        {/* Game Over Overlay */}
        {gameOver && (
          <GameOverOverlay>
            Game Over! Final Score: {score}
            <RestartButton onClick={handleGameStart}>Restart Game</RestartButton>
          </GameOverOverlay>
        )}

        {/* Bottom Right Launcher and Tube */}
        <BallLauncher onLaunch={handlePlungerRelease} right={20} bottom={20} />
        <Tube
          type="bottom"
          onEntrance={handleTubeEntrance}
          x={PLAY_AREA_WIDTH - 70}
          y={50}
          width={40}
          height={PLAY_AREA_HEIGHT - 120}
        />

        {/* Skill Shot Lane */}
        <SkillShotLane
          ref={skillShotLaneRef}
          top={PLAY_AREA_HEIGHT - 200}
          left={PLAY_AREA_WIDTH - 100}
          width={40}
          height={150}
          scoreValue={SKILL_SHOT_SCORE}
          onSkillShotHit={(score) => setScore(prev => prev + score)}
          isActiveInitially={false}
          deactivationDelay={2000}
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
          onHit={handleVariableTargetHit} // Changed to handleVariableTargetHit for consistency, assuming it handles generic targets too
          scoreValue={250}
          resetDelay={5000}
        />
        <PinballTarget
          ref={target2Ref}
          id="target2"
          size={40}
          initialTop={100}
          initialLeft={500}
          onHit={handleVariableTargetHit} // Changed to handleVariableTargetHit for consistency
          scoreValue={300}
          resetDelay={3000}
        />
        <Slingshot ref={slingshotLeftRef} top={400} left={100} armLength={70} angle={30} onCollision={(impulse) => setScore(prev => prev + applyBonusMultiplier(50))} />
        <Slingshot ref={slingshotRightRef} top={400} left={600} armLength={70} angle={-30} onCollision={(impulse) => setScore(prev => prev + applyBonusMultiplier(50))} />
        <Spinner ref={spinnerRef} top={200} left={350} type="left" scorePerRotation={75} />
        <Ramp ref={rampRef} width={180} height={50} top={300} left={50} angle={15} />
        <LoopShot size="50px" top="250px" left="650px" speed="2s" />
        <PopBumper top={250} left={400} />
        <DropTarget
          ref={dropTarget1Ref}
          id="DT1"
          top={150}
          left={650}
          width={30}
          height={50}
          scoreValue={200}
          onHit={handleDropTargetHit}
        />
        <DropTarget
          ref={dropTarget2Ref}
          id="DT2"
          top={150}
          left={685}
          width={30}
          height={50}
          scoreValue={200}
          onHit={handleDropTargetHit}
        />
        <DropTarget
          ref={dropTarget3Ref}
          id="DT3"
          top={150}
          left={720}
          width={30}
          height={50}
          scoreValue={200}
          onHit={handleDropTargetHit}
        />
        <Magnet top={100} left={150} />
        <Outlane onDrain={handleOutOfBounds} left={0} top={PLAY_AREA_HEIGHT - 80} width={100} height={80} ref={outlaneLeftRef} />
        <Outlane onDrain={handleOutOfBounds} right={0} top={PLAY_AREA_HEIGHT - 80} width={100} height={80} ref={outlaneRightRef} />
        <Kickback ref={kickbackLeftRef} bottom={PLAY_AREA_HEIGHT - 120} left={20} angle={30} onKickback={() => setScore(prev => prev + applyBonusMultiplier(100))} />
        <LaneChange onClick={() => console.log('Lane Change clicked')} left={120} top={PLAY_AREA_HEIGHT - 100} />
        <LaneChange onClick={() => console.log('Lane Change clicked')} left={580} top={PLAY_AREA_HEIGHT - 100} />
        <Rollover // Correctly imported and used
          ref={rolloverARef}
          id="A"
          top={50}
          left={200}
          width={60}
          height={20}
          scoreValue={50}
          onRollOver={handleRollover}
        />
        <Rollover // Correctly imported and used
          ref={rolloverBRef}
          id="B"
          top={50}
          left={300}
          width={60}
          height={20}
          scoreValue={50}
          onRollOver={handleRollover}
        />
        <Rollover // Correctly imported and used
          ref={rolloverCRef}
          id="C"
          top={50}
          left={400}
          width={60}
          height={20}
          scoreValue={50}
          onRollOver={handleRollover}
        />
        <Gate
          ref={gateRef}
          top={350}
          left={150}
          width={5}
          height={40}
          pivotX={0}
          pivotY={0}
          initialIsOpen={false}
          passageDirection="right"
        />
        <MysterySaucer
          ref={mysterySaucerRef}
          top={80}
          left={650}
          size={50}
          onActivate={onActivateMystery}
          initialIsLit={true}
          scoreValue={1000}
        />
        <PinballTarget
          ref={variableTarget1Ref}
          id="VT1"
          size={40}
          initialTop={200}
          initialLeft={500}
          scoreValue={200}
          onHit={handleVariableTargetHit}
          initialIsLit={false}
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

        {/* The Ball component now receives its position from displayBallPosition */}
        <Ball
          position={displayBallPosition}
          radius={BALL_RADIUS}
          ref={ballRef} // Correctly used here
        />

      </PinballGame>
    </Container>
  );
};

export default Pinball;
