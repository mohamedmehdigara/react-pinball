import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
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
import GameStartButton from './components/GameStartButton';
import BallLauncher from './components/BallLauncher';
import Tube from './components/Tube';
import Gate from './components/Gate';
import MysterySaucer from './components/MysterySaucer';
import NudgeDisplay from './components/NudgeDisplay';
import RestartButton from './components/RestartButton';
import Rollover from './components/Rollover';
import BallSaveDisplay from './components/BallSaveDisplay';
import GameOverOverlay from './components/GameOverMessage';
import VUK from './components/VUK';
import Scoop from './components/Scoop';
import StandupTarget from './components/StandupTarget';
import Rotor from './components/Rotor';
import SubwayEntrance from './components/SubwayEntrance';
import SubwayExit from './components/SubwayExit';
import BallLock from './components/BallLock';
import BonusLaneLight from './components/BonusLaneLight';
import DisplaySegment from './components/DisplaySegment';
import Diverter from './components/Diverter';
import PopUpPost from './components/PopUpPost';
import ScoreReel from './components/ScoreReel';



// Firebase Imports (REMOVED)
// import { initializeApp } from 'firebase/app';
// import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
// import { getFirestore, collection, query, orderBy, limit, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';


// Constants
const BALL_RADIUS = 10;
const PLAY_AREA_WIDTH = 800;
const PLAY_AREA_HEIGHT = 600;
const INITIAL_BALL_X = PLAY_AREA_WIDTH - 50;
const INITIAL_BALL_Y = PLAY_AREA_HEIGHT - 50;
const LANE_CHANGE_DISTANCE = 50;
const LANE_CHANGE_COOLDOWN = 1000;
const BUMPER_SCORE = 100;
const TARGET_SCORE = 200;
const FLIPPER_HEIGHT = 20;
const FLIPPER_WIDTH = 80;
const COLLISION_NUDGE = 5;
const BUMPER_COOLDOWN_FRAMES = 10;
const SKILL_SHOT_SCORE = 1000;
const DROP_TARGET_BONUS_SCORE = 5000;
const ROLLOVER_BANK_BONUS_SCORE = 2000;
const MAX_BONUS_MULTIPLIER = 10;
const END_OF_BALL_BONUS_FACTOR = 100;
const TARGET_BANK_TIMEOUT = 10000;
const TARGET_BANK_BONUS_SCORE = 100;

// Mystery Prizes
const MYSTERY_PRIZES = {
    SCORE_SMALL: 5000,
    SCORE_MEDIUM: 15000,
    SCORE_LARGE: 50000,
    EXTRA_BALL: 'extraBall',
    ADVANCE_BONUS_MULTIPLIER: 'advanceBonusMultiplier',
    LIGHT_KICKBACK: 'lightKickback',
    POINTS_PENALTY: -2000,
};

// Nudge/Tilt Constants
const MAX_TILT_WARNINGS = 2;
const NUDGE_IMPULSE_STRENGTH = 1.5;
const TILT_COOLDOWN_FRAMES = 60;
const NUDGE_RESET_FRAMES = 180;
const WALL_BOUNCE_DAMPENING = 0.8;

// Ball Save Constants
const BALL_SAVE_DURATION = 5000; // 5 seconds in milliseconds
const BALL_SAVE_RETURN_VELOCITY_Y = -15; // How fast the ball is shot back up
const BALL_SAVE_RETURN_VELOCITY_X = 0; // No horizontal push, or slight random

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

const ConsolidatedScoreboard = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 10px 15px;
  border-radius: 8px;
  font-family: 'Press Start 2P', cursive;
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


const Pinball = () => {
  // --- STATE FOR RENDERING (triggers re-renders) ---
  const [displayBallPosition, setDisplayBallPosition] = useState({ x: INITIAL_BALL_X, y: INITIAL_BALL_Y });
  const [displayBallVelocity, setDisplayBallVelocity] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [ballLaunched, setBallLaunched] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [bonusMultiplier, setBonusMultiplier] = useState(1);
  const [bonusScoreUnits, setBonusScoreUnits] = useState(0);
  const [tiltWarnings, setTiltWarnings] = useState(0);
  const [isTilted, setIsTilted] = useState(false);
  const [isBallCaptured, setIsBallCaptured] = useState(false);
  const [activeTargetInBank, setActiveTargetInBank] = useState(0);
  const [droppedTargets, setDroppedTargets] = useState({});
  const [litRollovers, setLitRollovers] = useState({});
  const [earnedExtraBalls, setEarnedExtraBalls] = useState(0);
  const [leftFlipperAngle, setLeftFlipperAngle] = useState(0);
  const [rightFlipperAngle, setRightFlipperAngle] = useState(0);
  const [ballSaveActive, setBallSaveActive] = useState(false);
  const [ballSaveTimer, setBallSaveTimer] = useState(0);
  // const [highScores, setHighScores] = useState([]); // REMOVED: Firebase related state
  // const [userId, setUserId] = useState(null); // REMOVED: Firebase related state
  // const [isAuthReady, setIsAuthReady] = useState(false); // REMOVED: Firebase related state


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
  const ballRef = useRef(null);
  const ballSaveIntervalRef = useRef(null);

  // Firebase Refs (REMOVED)
  // const dbRef = useRef(null);
  // const authRef = useRef(null);
  // const appRef = useRef(null);

  const vukRef = useRef(null);


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
  const scoopRef = useRef(null);
  const standupTargetRef = useRef(null);
  const rotorRef = useRef(null);
  const subwayEntranceRef = useRef(null);
  const subwayExitRef = useRef(null);
  const ballLockRef = useRef(null);
  const bonusLaneLight1Ref = useRef(null);
  const bonusLaneLight2Ref = useRef(null);
  const bonusLaneLight3Ref = useRef(null);
  const segmentARef = useRef(null);
  const segmentBRef = useRef(null);
  const segmentCRef = useRef(null);
  const segmentDRef = useRef(null);
  const segmentERef = useRef(null);
  const segmentFRef = useRef(null);
  const segmentGRef = useRef(null);
  const diverterRef = useRef(null);
  const popUpPostRef = useRef(null);
  const scoreReel1Ref = useRef(null); // Hundreds of thousands
  const scoreReel2Ref = useRef(null); // Tens of thousands
  const scoreReel3Ref = useRef(null); // Thousands
  const scoreReel4Ref = useRef(null); // Hundreds
  const scoreReel5Ref = useRef(null); // Tens
  const scoreReel6Ref = useRef(null); // Units












  // Derived state (from refs, so it's always up-to-date in logic)
  const tubeExitY = tubeEntranceY.current + tubeHeight.current;
  const isLaneChangeAllowed = true;

  // --- Firebase Initialization and Auth (REMOVED) ---
  // useEffect(() => {
  //   const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  //   const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
  //   const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

  //   if (!firebaseConfig) {
  //     console.error("Firebase config is not available. High scores will not be saved.");
  //     setIsAuthReady(true);
  //     return;
  //   }

  //   const app = initializeApp(firebaseConfig);
  //   appRef.current = app;
  //   dbRef.current = getFirestore(app);
  //   authRef.current = getAuth(app);

  //   const authenticate = async () => {
  //     try {
  //       if (initialAuthToken) {
  //         await signInWithCustomToken(authRef.current, initialAuthToken);
  //       } else {
  //         await signInAnonymously(authRef.current);
  //       }
  //     } catch (error) {
  //       console.error("Firebase authentication failed:", error);
  //     } finally {
  //       setIsAuthReady(true);
  //     }
  //   };

  //   const unsubscribe = onAuthStateChanged(authRef.current, (user) => {
  //     if (user) {
  //       setUserId(user.uid);
  //     } else {
  //       setUserId(crypto.randomUUID());
  //     }
  //     setIsAuthReady(true);
  //   });

  //   authenticate();
  //   return () => unsubscribe();
  // }, []);

  // --- High Score Fetching (REMOVED) ---
  // useEffect(() => {
  //   if (!isAuthReady || !dbRef.current || !userId) {
  //     return;
  //   }

  //   const highScoresCollectionRef = collection(dbRef.current, `artifacts/${__app_id}/public/data/highscores`);
  //   const q = query(highScoresCollectionRef, orderBy("score", "desc"), limit(10));

  //   const unsubscribe = onSnapshot(q, (snapshot) => {
  //     const scores = snapshot.docs.map(doc => ({
  //       id: doc.id,
  //       ...doc.data()
  //     }));
  //     setHighScores(scores);
  //   }, (error) => {
  //     console.error("Error fetching high scores:", error);
  //   });

  //   return () => unsubscribe();
  // }, [isAuthReady, userId]);

  // --- Submit High Score (REMOVED) ---
  // const submitHighScore = useCallback(async (playerName) => {
  //   if (!dbRef.current || !userId || score === 0) {
  //     console.error("Cannot submit high score: Firebase not ready, no user ID, or score is zero.");
  //     return;
  //   }

  //   try {
  //     const highScoresCollectionRef = collection(dbRef.current, `artifacts/${__app_id}/public/data/highscores`);
  //     await addDoc(highScoresCollectionRef, {
  //       name: playerName,
  //       score: score,
  //       timestamp: serverTimestamp(),
  //       userId: userId
  //     });
  //     console.log("High score submitted successfully!");
  //   } catch (error) {
  //     console.error("Error submitting high score:", error);
  //   }
  // }, [score, userId]);


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

  // --- Ball Save Activation ---
  const activateBallSave = useCallback(() => {
    setBallSaveActive(true);
    setBallSaveTimer(BALL_SAVE_DURATION);
    if (ballSaveIntervalRef.current) {
      clearInterval(ballSaveIntervalRef.current);
    }
    ballSaveIntervalRef.current = setInterval(() => {
      setBallSaveTimer(prev => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(ballSaveIntervalRef.current);
          setBallSaveActive(false);
          return 0;
        }
        return newTime;
      });
    }, 1000);
  }, []);

  // VUK Callbacks
  const handleVUKCapture = useCallback((vukId) => {
    setIsBallCaptured(true);
    ballCapturePosition.current = { ...ballPositionRef.current }; // Store current ball position
    ballVelocityRef.current = { x: 0, y: 0 }; // Stop the ball
    setDisplayBallVelocity({ x: 0, y: 0 }); // Update display velocity
    setScore(prev => prev + applyBonusMultiplier(500)); // Example score for VUK capture
  }, [applyBonusMultiplier, setIsBallCaptured, setDisplayBallVelocity, setScore]);

  const handleVUKEject = useCallback((vukId, newBallPosition, newBallVelocity) => {
    setIsBallCaptured(false);
    ballPositionRef.current = newBallPosition;
    ballVelocityRef.current = newBallVelocity;
    setDisplayBallPosition(newBallPosition);
    setDisplayBallVelocity(newBallVelocity);
    setBallLaunched(true); // Ensure ball is considered launched after eject
  }, [setIsBallCaptured, setDisplayBallPosition, setDisplayBallVelocity, setBallLaunched]);


  // --- Component-Specific Callbacks ---

  // Drop Target Bank Callbacks
  const handleDropTargetHit = useCallback((id, score) => {
    const multipliedScore = applyBonusMultiplier(score);
    setScore(prev => prev + multipliedScore);
    setDroppedTargets(prev => ({ ...prev, [id]: true }));
  }, [applyBonusMultiplier]);

   const handleRotorSpin = useCallback((id, score) => {
    const multipliedScore = applyBonusMultiplier(score);
    setScore(prev => prev + multipliedScore);
    addBonusScoreUnits(15); // Example: add more bonus units for hitting a rotor
  }, [applyBonusMultiplier, setScore, addBonusScoreUnits]);

  const handleBallLocked = useCallback((id, lockedCount, scoreAwarded) => {
    setScore(prev => prev + applyBonusMultiplier(scoreAwarded));
    setIsBallCaptured(true); // Ball is captured when locked
    ballVelocityRef.current = { x: 0, y: 0 }; // Stop the ball
    setDisplayBallVelocity({ x: 0, y: 0 }); // Update display
    // You might want to move the ball visually to the lock position here
    // ballPositionRef.current = { x: ballLockRef.current.getBoundingClientRect().left + ballLockRef.current.getBoundingClientRect().width / 2, y: ballLockRef.current.getBoundingClientRect().top + ballLockRef.current.getBoundingClientRect().height / 2 };
    // setDisplayBallPosition(ballPositionRef.current);
    console.log(`Ball ${lockedCount} locked in ${id}! Score: ${scoreAwarded}`);
  }, [applyBonusMultiplier, setScore, setIsBallCaptured, setDisplayBallVelocity]);

  const handleAllBallsLocked = useCallback((id) => {
    console.log(`All balls locked in ${id}! Multiball ready!`);
    // Here you would typically trigger a multiball mode, e.g.,
    // setTimeout(() => {
    //   ballLockRef.current?.releaseBalls(); // Release balls for multiball
    // }, 1000);
  }, []);

  const handleBallsReleased = useCallback((id, releasedCount, releasePositions, releaseVelocities) => {
    console.log(`${releasedCount} balls released from ${id}!`);
    // If releasing multiple balls, you'd need to manage them as an array of balls
    // For now, assuming only one ball is released at a time, or the game handles multiple balls.
    if (releasedCount > 0) {
        setIsBallCaptured(false); // Release the primary ball
        ballPositionRef.current = releasePositions[0]; // Set primary ball to first released position
        ballVelocityRef.current = releaseVelocities[0]; // Set primary ball to first released velocity
        setDisplayBallPosition(releasePositions[0]);
        setDisplayBallVelocity(releaseVelocities[0]);
        setBallLaunched(true);
    }
  }, [setIsBallCaptured, setDisplayBallPosition, setDisplayBallVelocity, setBallLaunched]);

   const handlePopUp = useCallback((id) => {
    console.log(`PopUpPost ${id} popped up!`);
  }, []);

  const handlePopDown = useCallback((id) => {
    console.log(`PopUpPost ${id} popped down!`);
  }, []);

  const handlePopUpHit = useCallback((id, score) => {
    const multipliedScore = applyBonusMultiplier(score);
    setScore(prev => prev + multipliedScore);
    addBonusScoreUnits(20); // Example: high bonus units for hitting a pop-up post
    console.log(`PopUpPost ${id} hit for ${score} points!`);
  }, [applyBonusMultiplier, setScore, addBonusScoreUnits]);



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
    addBonusScoreUnits(10);
  }, [applyBonusMultiplier, addBonusScoreUnits]);

  const handleScoopCapture = useCallback((scoopId) => {
    setIsBallCaptured(true);
    ballCapturePosition.current = { ...ballPositionRef.current };
    ballVelocityRef.current = { x: 0, y: 0 };
    setDisplayBallVelocity({ x: 0, y: 0 });
    setScore(prev => prev + applyBonusMultiplier(750)); // Example score for Scoop capture
  }, [applyBonusMultiplier, setIsBallCaptured, setDisplayBallVelocity, setScore]);

  const handleScoopEject = useCallback((scoopId, newBallPosition, newBallVelocity) => {
    setIsBallCaptured(false);
    ballPositionRef.current = newBallPosition;
    ballVelocityRef.current = newBallVelocity;
    setDisplayBallPosition(newBallPosition);
    setDisplayBallVelocity(newBallVelocity);
    setBallLaunched(true);
  }, [setIsBallCaptured, setDisplayBallPosition, setDisplayBallVelocity, setBallLaunched]);

  const handleStandupTargetHit = useCallback((id, score) => {
    const multipliedScore = applyBonusMultiplier(score);
    setScore(prev => prev + multipliedScore);
    addBonusScoreUnits(5); // Example: add bonus units for hitting a standup target
  }, [applyBonusMultiplier, setScore, addBonusScoreUnits]);



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
        setScore(prev => prev + applyBonusMultiplier(score));
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
          setScore(prev => prev + applyBonusMultiplier(TARGET_BANK_BONUS_SCORE));
          resetVariableTargetBank();
          increaseBonusMultiplier();
        }
      } else {
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
    ballCapturePosition.current = ballPositionRef.current;
    ballVelocityRef.current = { x: 0, y: 0 };
    setDisplayBallVelocity({ x: 0, y: 0 });

    const prizeKeys = Object.keys(MYSTERY_PRIZES);
    const randomPrizeKey = prizeKeys[Math.floor(Math.random() * prizeKeys.length)];
    const prize = MYSTERY_PRIZES[randomPrizeKey];

    let message = "Mystery Prize!";

    if (typeof prize === 'number') {
      const multipliedPrize = applyBonusMultiplier(prize);
      setScore(prev => prev + multipliedPrize);
      message = `+${multipliedPrize} Points!`;
    } else {
      switch (prize) {
        case 'extraBall':
          setEarnedExtraBalls(prev => prev + 1);
          setLives(prev => prev + 1);
          message = "Extra Ball!";
          break;
        case 'advanceBonusMultiplier':
          increaseBonusMultiplier();
          message = "Bonus Multiplier Advanced!";
          break;
        case 'lightKickback':
          // kickbackLeftRef.current?.lightKickback();
          message = "Kickback Lit!";
          break;
        case 'ballSave':
          activateBallSave();
          message = "Ball Save Activated!";
          break;
        default:
          message = "Nothing (for now)!";
          break;
      }
    }

    alert(message);

    setTimeout(() => {
      setIsBallCaptured(false);
      mysterySaucerRef.current?.resetSaucer();
      ballPositionRef.current = { x: ballCapturePosition.current.x, y: ballCapturePosition.current.y - BALL_RADIUS * 2 };
      ballVelocityRef.current = { x: (Math.random() > 0.5 ? 1 : -1) * 5, y: -10 };
      setDisplayBallPosition(ballPositionRef.current);
      setDisplayBallVelocity(ballVelocityRef.current);
    }, 2000);
  }, [applyBonusMultiplier, increaseBonusMultiplier, setEarnedExtraBalls, setLives, activateBallSave]);

  // --- Main Collision Handler ---
  const handleCollision = useCallback((ballPosition, radius, velocity) => {

    const popUpPost = popUpPostRef.current;
    if (popUpPost) {
      const postRect = popUpPost.getBoundingClientRect();
      if (postRect && postRect.height > 0 && isCircleCollidingWithRectangle(ballCircle, postRect)) {
        const scoreAwarded = popUpPost.handleCollision();
        if (scoreAwarded > 0) {
          // Score is handled by PopUpPost's handleCollision, which calls onHit
        }
        // Apply a bounce effect
        ballVelocityRef.current = { x: -velocity.x * 0.9, y: -velocity.y * 0.9 };
        return; // Prevent further collisions this frame if hit
      }
    }

    const diverter = diverterRef.current;
    if (diverter) {
      const diverterRect = diverter.getBoundingClientRect();
      if (diverterRect && isCircleCollidingWithRectangle(ballCircle, diverterRect)) {
        // Diverter logic: if hit, it might toggle or just deflect.
        // For simplicity, let's say hitting it just deflects the ball and we don't call toggleDiverter here.
        // The toggle action would likely be triggered by a specific target or button elsewhere.
        // If you want hitting it to toggle, you'd call diverter.toggleDiverter() here.
        ballVelocityRef.current = { x: -velocity.x * 0.8, y: -velocity.y * 0.8 }; // Simple bounce
        return; // Prevent further collisions this frame
      }
    }

    const ballCircle = { x: ballPosition.x, y: ballPosition.y, radius: radius };

    if (isBallCaptured) {
        ballPositionRef.current = ballCapturePosition.current;
        ballVelocityRef.current = { x: 0, y: 0 };
        return;
    }

    // VUK Collision
    const vuk = vukRef.current;
    if (vuk) {
      const vukRect = vuk.getBoundingClientRect();
      if (vukRect && isCircleCollidingWithRectangle(ballCircle, vukRect)) {
        const scoreAwarded = vuk.handleCollision(ballPosition, radius);
        if (scoreAwarded > 0) {
          // Score is handled by VUK's handleCollision, which calls onCapture
          // No direct velocity change here, as VUK will handle ejection
        }
        return; // Ball is captured, prevent further collisions this frame
      }
    }

    const mysterySaucer = mysterySaucerRef.current;
    if (mysterySaucer && mysterySaucer.getIsLit()) {
      const saucerRect = mysterySaucer.getBoundingClientRect();
      if (saucerRect && isCircleCollidingWithRectangle(ballCircle, saucerRect)) {
        mysterySaucer.handleCollision();
        return;
      }
    }

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

    const target1 = target1Ref.current;
    if (target1) {
      const targetRect = target1.getBoundingClientRect();
      if (targetRect && isCircleCollidingWithRectangle(ballCircle, targetRect)) {
        target1.handleCollision();
        ballVelocityRef.current = { ...ballVelocityRef.current, y: -velocity.y * 0.7 };
      }
    }

    const target2 = target2Ref.current;
    if (target2) {
      const targetRect = target2.getBoundingClientRect();
      if (targetRect && isCircleCollidingWithRectangle(ballCircle, targetRect)) {
        target2.handleCollision();
        ballVelocityRef.current = { ...ballVelocityRef.current, y: -velocity.y * 0.7 };
      }
    }

    const slingshotLeft = slingshotLeftRef.current;
    if (slingshotLeft) {
      const impulse = slingshotLeft.handleCollision(ballPosition, radius);
      if (impulse) {
        ballVelocityRef.current = { x: ballVelocityRef.current.x + impulse.x, y: ballVelocityRef.current.y + impulse.y };
        setScore(prev => prev + applyBonusMultiplier(50));
      }
    }

    const slingshotRight = slingshotRightRef.current;
    if (slingshotRight) {
      const impulse = slingshotRight.handleCollision(ballPosition, radius);
      if (impulse) {
        ballVelocityRef.current = { x: ballVelocityRef.current.x + impulse.x, y: ballVelocityRef.current.y + impulse.y };
        setScore(prev => prev + applyBonusMultiplier(50));
      }
    }

    const spinner = spinnerRef.current;
    if (spinner) {
      const spinnerRect = spinner.getBoundingClientRect();
      if (spinnerRect && isCircleCollidingWithRectangle(ballCircle, spinnerRect)) {
        const baseScore = spinner.handleCollision(velocity);
        setScore(prev => prev + applyBonusMultiplier(baseScore));
        ballVelocityRef.current = { x: -velocity.x * 0.6, y: -velocity.y * 0.6 };
      }
    }

    const kickbackLeft = kickbackLeftRef.current;
    if (kickbackLeft) {
      const kickbackRect = kickbackLeft.getBoundingClientRect();
      if (kickbackRect && isCircleCollidingWithRectangle(ballCircle, kickbackRect)) {
        const impulse = kickbackLeft.handleCollision(ballPosition, radius);
        if (impulse) {
          ballVelocityRef.current = impulse;
          setScore(prev => prev + applyBonusMultiplier(100));
        }
      }
    }

    const skillShotLane = skillShotLaneRef.current;
    if (skillShotLane) {
      const score = skillShotLane.handleCollision(ballPosition, radius);
      if (score > 0) {
        setScore(prev => prev + applyBonusMultiplier(score));
        ballVelocityRef.current = { ...ballVelocityRef.current, y: ballVelocityRef.current.y * 0.8 };
      }
    }

    const dropTargetRefs = [dropTarget1Ref, dropTarget2Ref, dropTarget3Ref];
    dropTargetRefs.forEach(dtRef => {
      const dropTarget = dtRef.current;
      if (dropTarget) {
        const dropTargetRect = dropTarget.getBoundingClientRect();
        if (dropTargetRect && isCircleCollidingWithRectangle(ballCircle, dropTargetRect)) {
          dropTarget.handleCollision();
          ballVelocityRef.current = { x: ballVelocityRef.current.x * 0.9, y: -ballVelocityRef.current.y * 0.8 };
        }
      }
    });

    const rolloverRefs = [rolloverARef, rolloverBRef, rolloverCRef];
    rolloverRefs.forEach(rlRef => {
      const rollover = rlRef.current;
      if (rollover) {
        const rolloverRect = rollover.getBoundingClientRect();
        if (rolloverRect && isCircleCollidingWithRectangle(ballCircle, rolloverRect)) {
          rollover.handleCollision();
          ballVelocityRef.current = { x: ballVelocityRef.current.x * 0.9, y: ballVelocityRef.current.y * 0.9 };
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
          if (passageDirection === 'right' && velocity.x > 0) { collisionHandled = true; }
          else if (passageDirection === 'left' && velocity.x < 0) { collisionHandled = true; }
          else if (passageDirection === 'down' && velocity.y > 0) { collisionHandled = true; }
          else if (passageDirection === 'up' && velocity.y < 0) { collisionHandled = true; }

          if (!collisionHandled) {
             ballVelocityRef.current = { x: -velocity.x * WALL_BOUNCE_DAMPENING, y: -velocity.y * WALL_BOUNCE_DAMPENING };
             collisionHandled = true;
          }
        } else {
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

      const scoop = scoopRef.current;
    if (scoop) {
      const scoopRect = scoop.getBoundingClientRect();
      if (scoopRect && isCircleCollidingWithRectangle(ballCircle, scoopRect)) {
        const scoreAwarded = scoop.handleCollision(ballPosition, radius);
        if (scoreAwarded > 0) {
          // Score is handled by Scoop's handleCollision, which calls onCapture
          // No direct velocity change here, as Scoop will handle ejection
        }
        return; // Ball is captured, prevent further collisions this frame
      }
    }

// ... (inside handleGameStart function)


    const standupTarget = standupTargetRef.current;
    if (standupTarget) {
      const standupTargetRect = standupTarget.getBoundingClientRect();
      if (standupTargetRect && isCircleCollidingWithRectangle(ballCircle, standupTargetRect)) {
        const scoreAwarded = standupTarget.handleCollision();
        if (scoreAwarded > 0) {
          // Score is handled by StandupTarget's handleCollision, which calls onHit
          // No direct velocity change here, as it's a static target
        }
        // Apply a small bounce effect
        ballVelocityRef.current = { x: -velocity.x * 0.7, y: -velocity.y * 0.7 };
        return; // Prevent further collisions this frame if hit
      }
    }

 const rotor = rotorRef.current;
    if (rotor) {
      const rotorRect = rotor.getBoundingClientRect();
      if (rotorRect && isCircleCollidingWithRectangle(ballCircle, rotorRect)) {
        const scoreAwarded = rotor.handleCollision();
        if (scoreAwarded > 0) {
          // Score is handled by Rotor's handleCollision, which calls onSpin
        }
        // Apply a bounce effect suitable for a spinning object
        ballVelocityRef.current = { x: -velocity.x * 0.8, y: -velocity.y * 0.8 };
        return; // Prevent further collisions this frame if hit
      }
    }


    const subwayEntrance = subwayEntranceRef.current;
    if (subwayEntrance) {
      const entranceRect = subwayEntrance.getBoundingClientRect();
      if (entranceRect && isCircleCollidingWithRectangle(ballCircle, entranceRect)) {
        const scoreAwarded = subwayEntrance.handleCollision();
        if (scoreAwarded > 0) {
          // Score and ball capture handled by subwayEntrance.handleCollision, which calls onEnter
        }
        return; // Ball is captured, prevent further collisions this frame
      }
    }

   
const ballLock = ballLockRef.current;
    if (ballLock) {
      const lockRect = ballLock.getBoundingClientRect();
      if (lockRect && isCircleCollidingWithRectangle(ballCircle, lockRect)) {
        const scoreAwarded = ballLock.handleCollision();
        if (scoreAwarded > 0) {
          // Score and ball capture handled by ballLock.handleCollision, which calls onBallLocked
        }
        return; // Ball is captured, prevent further collisions this frame
      }
    }


    }

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

  }, [isBallCaptured, applyBonusMultiplier, isCircleCollidingWithRectangle, mysterySaucerRef, bumper1Ref, bumper2Ref, target1Ref, target2Ref, slingshotLeftRef, slingshotRightRef, spinnerRef, kickbackLeftRef, skillShotLaneRef, dropTarget1Ref, dropTarget2Ref, dropTarget3Ref, rolloverARef, rolloverBRef, rolloverCRef, gateRef, variableTarget1Ref, variableTarget2Ref, variableTarget3Ref, variableTarget4Ref, vukRef]);





  // --- Handle Out of Bounds (Drain) ---
  const handleOutOfBounds = useCallback((ballPosition, radius, velocity) => {
    if (ballPosition.y > PLAY_AREA_HEIGHT + radius * 2) {
      if (ballSaveActive) {
        alert("BALL SAVED!");
        setBallSaveActive(false);
        clearInterval(ballSaveIntervalRef.current);
        setBallSaveTimer(0);

        ballPositionRef.current = { x: PLAY_AREA_WIDTH / 2, y: PLAY_AREA_HEIGHT - 100 };
        ballVelocityRef.current = { x: BALL_SAVE_RETURN_VELOCITY_X, y: BALL_SAVE_RETURN_VELOCITY_Y };
        setDisplayBallPosition(ballPositionRef.current);
        setDisplayBallVelocity(ballVelocityRef.current);
        setBallLaunched(true);
        return;
      }

      const endOfBallBonus = bonusScoreUnits * END_OF_BALL_BONUS_FACTOR * bonusMultiplier;
      if (endOfBallBonus > 0) {
        setScore(prev => prev + endOfBallBonus);
        alert(`End-of-Ball Bonus: +${endOfBallBonus} points!`);
      }

      resetBonusScoreUnits();
      resetBonusMultiplier();

      if (kickbackLeftRef.current && ballPosition.x < PLAY_AREA_WIDTH * 0.2) {
        const impulse = kickbackLeftRef.current.handleCollision(ballPosition, radius);
        if (impulse) {
          ballVelocityRef.current = impulse;
          setBallLaunched(true);
          ballPositionRef.current = { x: impulse.x > 0 ? (PLAY_AREA_WIDTH / 4) : (PLAY_AREA_WIDTH * 3 / 4), y: PLAY_AREA_HEIGHT - 100 };
          setDisplayBallPosition(ballPositionRef.current);
          setDisplayBallVelocity(ballVelocityRef.current);
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
      setDisplayBallPosition(ballPositionRef.current);
      setDisplayBallVelocity(ballVelocityRef.current);
    } else if (ballPosition.y < -radius) {
      ballVelocityRef.current = { ...ballVelocityRef.current, y: -ballVelocityRef.current.y * WALL_BOUNCE_DAMPENING };
      ballPositionRef.current = { ...ballPositionRef.current, y: -radius + COLLISION_NUDGE };
    } else if (ballPosition.x < -radius || ballPosition.x > PLAY_AREA_WIDTH + radius) {
      ballVelocityRef.current = { ...ballVelocityRef.current, x: -ballVelocityRef.current.x * WALL_BOUNCE_DAMPENING };
      ballPositionRef.current = { ...ballPositionRef.current, x: ballPosition.x < -radius ? -radius : PLAY_AREA_WIDTH + radius };
    }
  }, [ballSaveActive, bonusScoreUnits, bonusMultiplier, applyBonusMultiplier, resetBonusScoreUnits, resetBonusMultiplier, kickbackLeftRef, setScore, setBallLaunched, setLives, setGameOver, setBallSaveActive, setBallSaveTimer, setDisplayBallPosition, setDisplayBallVelocity]);

 const handleSubwayEntrance = useCallback((id, score) => {
    setIsBallCaptured(true); // Capture the ball
    ballCapturePosition.current = { ...ballPositionRef.current }; // Store current position
    ballVelocityRef.current = { x: 0, y: 0 }; // Stop the ball
    setDisplayBallVelocity({ x: 0, y: 0 }); // Update display
    setScore(prev => prev + applyBonusMultiplier(score)); // Award score
    // In a full game, you'd likely then move the ball to a SubwayExit after a delay
    // or trigger a mode. For now, it just stops.
  }, [applyBonusMultiplier, setIsBallCaptured, setDisplayBallVelocity, setScore]);


  // --- Game Start/Reset Logic ---
  const handleGameStart = useCallback(() => {
    setGameOver(false);
    setScore(0);
    setLives(3);
    setBallLaunched(false);
    setIsTilted(false);
    setTiltWarnings(0);
    setIsBallCaptured(false);
    setBallSaveActive(false);
    setBallSaveTimer(0);
    clearInterval(ballSaveIntervalRef.current);

    // Reset all refs to initial values
    ballPositionRef.current = { x: INITIAL_BALL_X, y: INITIAL_BALL_Y };
    ballVelocityRef.current = { x: 0, y: 0 };
    bumper1HitCooldown.current = 0;
    bumper2HitCooldown.current = 0;
    tiltCooldownCounter.current = 0;
    nudgeInputX.current = 0;
    nudgeInputY.current = 0;
    nudgeResetCounter.current = 0;
    clearTimeout(targetBankTimeoutRef.current);

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
    vukRef.current?.resetVUK(); // Reset VUK state

    standupTargetRef.current?.resetTarget(); // NEW: Reset StandupTarget state
    rotorRef.current?.resetRotor(); // NEW: Reset Rotor state
    scoopRef.current?.resetScoop(); // NEW: Reset Scoop state
    subwayEntranceRef.current?.resetEntrance(); // NEW: Reset SubwayEntrance state
    subwayExitRef.current?.resetExit(); // NEW: Reset SubwayExit state
    ballLockRef.current?.resetBallLock(); // NEW: Reset BallLock state
    bonusLaneLight1Ref.current?.resetLight(); // NEW: Reset BonusLaneLight state
    bonusLaneLight2Ref.current?.resetLight();
    bonusLaneLight3Ref.current?.resetLight();
    segmentARef.current?.resetSegment(); // NEW: Reset DisplaySegment states
    segmentBRef.current?.resetSegment();
    segmentCRef.current?.resetSegment();
    segmentDRef.current?.resetSegment();
    segmentERef.current?.resetSegment();
    segmentFRef.current?.resetSegment();
    segmentGRef.current?.resetSegment();
    diverterRef.current?.resetDiverter(); // NEW: Reset Diverter state
    popUpPostRef.current?.resetPost(); // NEW: Reset PopUpPost state
    scoreReel1Ref.current?.resetReel();
    scoreReel2Ref.current?.resetReel();
    scoreReel3Ref.current?.resetReel();
    scoreReel4Ref.current?.resetReel();
    scoreReel5Ref.current?.resetReel();
    scoreReel6Ref.current?.resetReel();





    resetVariableTargetBank();
    resetBonusMultiplier();
    resetBonusScoreUnits();

    activateBallSave(); // Activate ball save at the start of a new game/ball
  }, [resetVariableTargetBank, resetBonusMultiplier, resetBonusScoreUnits, setGameOver, setScore, setLives, setBallLaunched, setIsTilted, setTiltWarnings, setIsBallCaptured, setDisplayBallPosition, setDisplayBallVelocity, setDroppedTargets, setLitRollovers, activateBallSave, vukRef]);

  // --- Ball Launcher Logic ---
  const handlePlungerRelease = useCallback((launchPower) => {
    if (!ballLaunched && !isTilted && !gameOver) {
      const launchForce = launchPower * 15;
      ballVelocityRef.current = { x: -5, y: -launchForce };
      setBallLaunched(true);
      setDisplayBallVelocity(ballVelocityRef.current);
      skillShotLaneRef.current?.activateSkillShot();
    }
  }, [ballLaunched, isTilted, gameOver, setBallLaunched, setDisplayBallVelocity]);


  // --- Flipper Action Handling ---
  const handleFlipperAction = useCallback((isLeft) => {
    if (isTilted || gameOver || !ballLaunched) return;

    if (isLeft) {
      setLeftFlipperAngle(-45);
      setTimeout(() => {
        setLeftFlipperAngle(0);
      }, 100);
    } else {
      setRightFlipperAngle(45);
      setTimeout(() => {
        setRightFlipperAngle(0);
      }, 100);
    }
  }, [isTilted, gameOver, ballLaunched, setLeftFlipperAngle, setRightFlipperAngle]);

  // --- Tube Entrance Logic ---
  const handleTubeEntrance = useCallback((entryX, entryY, width, height) => {
    tubeEntranceX.current = entryX;
    tubeEntranceY.current = entryY;
    tubeWidth.current = width;
    tubeHeight.current = height;
    setIsBallCaptured(true);
    ballPositionRef.current = { x: entryX + width / 2, y: entryY + height / 2 };
    ballVelocityRef.current = { x: 0, y: 0 };
    setDisplayBallPosition(ballPositionRef.current);
    setDisplayBallVelocity(ballVelocityRef.current);
  }, [setIsBallCaptured, setDisplayBallPosition, setDisplayBallVelocity]);

  // Effect for ball movement inside the tube (if captured by tube)
  useEffect(() => {
    let interval;
    const isMysterySaucerLit = mysterySaucerRef.current?.getIsLit ? mysterySaucerRef.current.getIsLit() : false;

    if (isBallCaptured && !isMysterySaucerLit) {
      interval = setInterval(() => {
        if (ballPositionRef.current.y < tubeExitY) {
          ballPositionRef.current = { x: tubeEntranceX.current + tubeWidth.current / 2 - BALL_RADIUS, y: ballPositionRef.current.y + 5 };
          setDisplayBallPosition(ballPositionRef.current);
        } else {
          clearInterval(interval);
          setIsBallCaptured(false);
          ballVelocityRef.current = { x: -10, y: -10 };
          setDisplayBallVelocity(ballVelocityRef.current);
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isBallCaptured, tubeExitY, setDisplayBallPosition, setDisplayBallVelocity]);


  // --- Nudge Logic ---
  const handleNudge = useCallback((direction) => {
    if (isTilted || gameOver || !ballLaunched) return;

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
  }, [isTilted, gameOver, ballLaunched, setTiltWarnings, setIsTilted, setDisplayBallVelocity]);


  // --- Input Handling for Nudging and Flippers ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver || isTilted || !ballLaunched) return;

      if (e.key === 'ArrowLeft') handleFlipperAction(true);
      if (e.key === 'ArrowRight') handleFlipperAction(false);

      if (e.key === 'z') { handleNudge('left'); }
      if (e.key === 'x') { handleNudge('up'); }
      if (e.key === '/') { handleNudge('right'); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameOver, isTilted, ballLaunched, handleFlipperAction, handleNudge]);

  const handleSubwayExit = useCallback((id, newBallPosition, newBallVelocity) => {
    setIsBallCaptured(false); // Release the ball
    ballPositionRef.current = newBallPosition;
    ballVelocityRef.current = newBallVelocity;
    setDisplayBallPosition(newBallPosition);
    setDisplayBallVelocity(newBallVelocity);
    setBallLaunched(true); // Ensure ball is considered launched after eject
  }, [setIsBallCaptured, setDisplayBallPosition, setDisplayBallVelocity, setBallLaunched]);



  // --- Main Game Loop (Physics and Updates) ---
  useEffect(() => {
    let animationFrameId;

    const gameLoop = () => {
      if (isTilted) {
        tiltCooldownCounter.current--;
        if (tiltCooldownCounter.current <= 0) {
          setIsTilted(false);
        }
      }

      if (tiltWarnings > 0 && nudgeResetCounter.current > 0) {
        nudgeResetCounter.current--;
        if (nudgeResetCounter.current <= 0) {
          setTiltWarnings(0);
        }
      }

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
  }, [ballLaunched, gameOver, isBallCaptured, isTilted, tiltWarnings, handleCollision, handleOutOfBounds, setDisplayBallPosition, setDisplayBallVelocity]);

const handleDiverterToggle = useCallback((id, isOpen) => {
    console.log(`Diverter ${id} is now ${isOpen ? 'OPEN' : 'CLOSED'}`);
    // You might add score or game logic here based on diverter state
  }, []);


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
          {/* userId display REMOVED */}
          {/* {userId && (
            <div>
              <span>USER ID:</span>
              <span>{userId}</span>
            </div>
          )} */}
        </ConsolidatedScoreboard>

        {/* Nudge/Tilt Warning Display */}
        <NudgeDisplay
          currentWarnings={tiltWarnings}
          maxWarnings={MAX_TILT_WARNINGS}
        />

        {/* Ball Save Display */}
        <BallSaveDisplay active={ballSaveActive} timer={ballSaveTimer} />

        {/* Game Over Overlay (now handles high score input and display) */}
        {gameOver && (
          <GameOverOverlay
            finalScore={score}
            // highScores={highScores} // REMOVED: Firebase related prop
            // onSubmitHighScore={submitHighScore} // REMOVED: Firebase related prop
            onRestartGame={handleGameStart}
          />
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

        {/* VUK Component */}
        <VUK
          ref={vukRef}
          id="vuk1"
          top={100}
          left={100}
          size={50}
          ejectStrength={15}
          captureDelay={500}
          scoreValue={500}
          onCapture={handleVUKCapture}
          onEject={handleVUKEject}
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
          onHit={handleVariableTargetHit}
          scoreValue={250}
          resetDelay={5000}
        />
        <PinballTarget
          ref={target2Ref}
          id="target2"
          size={40}
          initialTop={100}
          initialLeft={500}
          onHit={handleVariableTargetHit}
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
        <Rollover
          ref={rolloverARef}
          id="A"
          top={50}
          left={200}
          width={60}
          height={20}
          scoreValue={50}
          onRollOver={handleRollover}
        />
        <Rollover
          ref={rolloverBRef}
          id="B"
          top={50}
          left={300}
          width={60}
          height={20}
          scoreValue={50}
          onRollOver={handleRollover}
        />
        <Rollover
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

        <Ball
          position={displayBallPosition}
          radius={BALL_RADIUS}
          ref={ballRef}
        />

        <Scoop
          ref={scoopRef}
          id="scoop1"
          top={300}
          left={350}
          size={60}
          ejectStrength={10}
          captureDelay={700}
          scoreValue={750}
          onCapture={handleScoopCapture}
          onEject={handleVUKEject} // Re-using handleVUKEject as it has similar signature
          initialIsLit={false}
        />

        <StandupTarget
          ref={standupTargetRef}
          id="ST1"
          top={250}
          left={200}
          width={30}
          height={50}
          baseColor="#ff00ff"
          borderColor="#cc00cc"
          scoreValue={100}
          hitCooldown={200}
          onHit={handleStandupTargetHit}
        />
        <Rotor
          ref={rotorRef}
          id="rotor1"
          top={200}
          left={250}
          size={70}
          scoreValue={250}
          spinDuration={0.5}
          spinCooldown={500}
          onSpin={handleRotorSpin}
        />

        <SubwayEntrance
          ref={subwayEntranceRef}
          id="subway1"
          top={50}
          left={500}
          width={60}
          height={30}
          scoreValue={500}
          captureDelay={100}
          onEnter={handleSubwayEntrance}
          initialIsLit={false}
        />

         <SubwayExit
          ref={subwayExitRef}
          id="subwayExit1"
          top={400}
          left={650}
          width={60}
          height={30}
          ejectStrength={12}
          ejectDirection="up"
          onEject={handleSubwayExit}
          initialIsLit={false}
        />

        <BallLock
          ref={ballLockRef}
          id="ballLock1"
          top={300}
          left={50}
          width={100}
          height={80}
          capacity={2}
          ballRadius={BALL_RADIUS} // Use the global BALL_RADIUS
          scoreValue={1000}
          captureDelay={100}
          onBallLocked={handleBallLocked}
          onAllBallsLocked={handleAllBallsLocked}
          onBallsReleased={handleBallsReleased}
          initialIsLit={false}
        />

        <BonusLaneLight
          ref={bonusLaneLight1Ref}
          id="bonusLightA"
          top={80}
          left={200}
          size={15}
          litColor="#00ff00" // Green light
          dimColor="#003300"
          initialIsLit={false}
        />
        <BonusLaneLight
          ref={bonusLaneLight2Ref}
          id="bonusLightB"
          top={80}
          left={220}
          size={15}
          litColor="#00ff00"
          dimColor="#003300"
          initialIsLit={false}
        />
        <BonusLaneLight
          ref={bonusLaneLight3Ref}
          id="bonusLightC"
          top={80}
          left={240}
          size={15}
          litColor="#00ff00"
          dimColor="#003300"
          initialIsLit={false}
        />

        <div style={{ position: 'absolute', top: 20, right: 100, zIndex: 100 }}>
          {/* Segment A (top horizontal) */}
          <DisplaySegment ref={segmentARef} id="segA" top={0} left={5} length={30} thickness={5} orientation="horizontal" onColor="#ff6600" offColor="#331a00" />
          {/* Segment B (top right vertical) */}
          <DisplaySegment ref={segmentBRef} id="segB" top={5} left={35} length={30} thickness={5} orientation="vertical" onColor="#ff6600" offColor="#331a00" />
          {/* Segment C (bottom right vertical) */}
          <DisplaySegment ref={segmentCRef} id="segC" top={40} left={35} length={30} thickness={5} orientation="vertical" onColor="#ff6600" offColor="#331a00" />
          {/* Segment D (bottom horizontal) */}
          <DisplaySegment ref={segmentDRef} id="segD" top={70} left={5} length={30} thickness={5} orientation="horizontal" onColor="#ff6600" offColor="#331a00" />
          {/* Segment E (bottom left vertical) */}
          <DisplaySegment ref={segmentERef} id="segE" top={40} left={0} length={30} thickness={5} orientation="vertical" onColor="#ff6600" offColor="#331a00" />
          {/* Segment F (top left vertical) */}
          <DisplaySegment ref={segmentFRef} id="segF" top={5} left={0} length={30} thickness={5} orientation="vertical" onColor="#ff6600" offColor="#331a00" />
          {/* Segment G (middle horizontal) */}
          <DisplaySegment ref={segmentGRef} id="segG" top={35} left={5} length={30} thickness={5} orientation="horizontal" onColor="#ff6600" offColor="#331a00" />
          <Diverter
          ref={diverterRef}
          id="diverter1"
          top={350}
          left={200}
          length={60}
          thickness={8}
          initialAngle={0}
          activeAngle={45} // Opens to 45 degrees
          pivotX={0} // Rotates from its left edge
          pivotY={50} // Rotates from its vertical center
          initialIsOpen={false}
          onToggle={handleDiverterToggle}
        />

        <PopUpPost
          ref={popUpPostRef}
          id="post1"
          top={PLAY_AREA_HEIGHT - 200}
          left={PLAY_AREA_WIDTH / 2 - 10}
          size={20}
          scoreValue={50}
          hitCooldown={100}
          onPopUp={handlePopUp}
          onPopDown={handlePopDown}
          onHit={handlePopUpHit}
          initialIsUp={false} // Starts hidden
        />

        <DisplaySegment ref={segmentARef} id="segA" top={0} left={5} length={30} thickness={5} orientation="horizontal" onColor="#ff6600" offColor="#331a00" />
          <DisplaySegment ref={segmentBRef} id="segB" top={5} left={35} length={30} thickness={5} orientation="vertical" onColor="#ff6600" offColor="#331a00" />
          <DisplaySegment ref={segmentCRef} id="segC" top={40} left={35} length={30} thickness={5} orientation="vertical" onColor="#ff6600" offColor="#331a00" />
          <DisplaySegment ref={segmentDRef} id="segD" top={70} left={5} length={30} thickness={5} orientation="horizontal" onColor="#ff6600" offColor="#331a00" />
          <DisplaySegment ref={segmentERef} id="segE" top={40} left={0} length={30} thickness={5} orientation="vertical" onColor="#ff6600" offColor="#331a00" />
          <DisplaySegment ref={segmentFRef} id="segF" top={5} left={0} length={30} thickness={5} orientation="vertical" onColor="#ff6600" offColor="#331a00" />
          <DisplaySegment ref={segmentGRef} id="segG" top={35} left={5} length={30} thickness={5} orientation="horizontal" onColor="#ff6600" offColor="#331a00" />
        </div>

      </PinballGame>
    </Container>
  );
};

export default Pinball;
