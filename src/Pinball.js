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

const ScoreMultiplier = 2;

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

const FlipperBase = styled.div`
  width: 160px;
  height: 20px;
  background-color: #777;
  position: absolute;
  bottom: 0;
`;









const TopTube = styled(Tube)`
  top: 50px;
  left: 300px;
`;

const MiddleTube = styled(Tube)`
  top: 200px;
  left: 600px;
`;

const BottomTube = styled(Tube)`
  top: 400px;
  left: 300px;
`;




const LeftBumper = styled(Bumper)`
  top: 100px;
  left: 200px;
`;

const RightBumper = styled(Bumper)`
  top: 300px;
  left: 500px;
`;


const SpinnerCenter = styled.div`
  width: 10px;
  height: 10px;
  background-color: #0f0;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
`;

const LeftSpinner = styled(Spinner)`
  top: 450px;
  left: 100px;
`;

const RightSpinner = styled(Spinner)`
  top: 150px;
  left: 700px;
`;


const Score = styled.div`
  font-size: 24px;
  color: white;
  position: absolute;
  top: 20px;
  left: 20px;
`;


const Pinball = () => {
  const [leftFlipperUp, setLeftFlipperUp] = useState(false);
  const [rightFlipperUp, setRightFlipperUp] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 0, y: 0 });

  const [ballSpeed, setBallSpeed] = useState({ x: 0, y: -3 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);


  const handleLaunch = () => {
    // Logic to launch the ball
    console.log('Ball launched!');
  };

  const handleGameLoop = () => {
    if (gameOver) return;

    rotateSpinner(LeftSpinner, 2);
    rotateSpinner(RightSpinner, -2);

    const newBallSpeed = { ...ballSpeed };
    const newBallPosition = { ...ballPosition };

    newBallSpeed.y += 0.1;

    newBallPosition.x += newBallSpeed.x;
    newBallPosition.y += newBallSpeed.y;

    if (newBallPosition.x < 10 || newBallPosition.x > 770) {
      newBallSpeed.x = -newBallSpeed.x;
    }

    if (
      newBallPosition.y > 540 &&
      newBallPosition.y < 560 &&
      ((newBallPosition.x > 50 && newBallPosition.x < 210) ||
        (newBallPosition.x > 590 && newBallPosition.x < 750))
    ) {
      newBallSpeed.y = -7;
    }

    checkCollisionWithTube(newBallPosition, TopTube, 50);
    checkCollisionWithTube(newBallPosition, MiddleTube, 50);
    checkCollisionWithTube(newBallPosition, BottomTube, 50);
    checkCollisionWithBlocks(newBallPosition, Blocks, 50);

    checkCollisionWithSpinner(newBallPosition, LeftSpinner, 30);
    checkCollisionWithSpinner(newBallPosition, RightSpinner, 30);

    setBallSpeed(newBallSpeed);
    setBallPosition(newBallPosition);
  };

  const checkCollisionWithTube = (ballPos, tube, radius) => {
    const tubeCenterX = tube.left + tube.width / 2;
    const tubeCenterY = tube.top + tube.height / 2;

    const distance = Math.sqrt((tubeCenterX - ballPos.x) ** 2 + (tubeCenterY - ballPos.y) ** 2);

    if (distance < radius + 10) {
      setScore(score + ScoreMultiplier);
      setBallSpeed({ x: -ballSpeed.x, y: -ballSpeed.y });
    }
  };

  const checkCollisionWithBlocks = (ballPos, blocks, radius) => {
    const blocksCenterX = blocks.left + blocks.width / 2;
    const blocksCenterY = blocks.top + blocks.height / 2;

    const distance = Math.sqrt((blocksCenterX - ballPos.x) ** 2 + (blocksCenterY - ballPos.y) ** 2);

    if (distance < radius + 10) {
      setScore(score + ScoreMultiplier);
      setBallSpeed({ x: -ballSpeed.x, y: -ballSpeed.y });
    }
  };

  const checkCollisionWithSpinner = (ballPos, spinner, radius) => {
    const spinnerCenterX = spinner.left + spinner.width / 2;
    const spinnerCenterY = spinner.top + spinner.height / 2;

    const distance = Math.sqrt((spinnerCenterX - ballPos.x) ** 2 + (spinnerCenterY - ballPos.y) ** 2);

    if (distance < radius + 10) {
      setScore(score + ScoreMultiplier);
      setBallSpeed({ x: -ballSpeed.x, y: -ballSpeed.y });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      setLeftFlipperUp(true);
    } else if (e.key === 'ArrowRight') {
      setRightFlipperUp(true);
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === 'ArrowLeft') {
      setLeftFlipperUp(false);
    } else if (e.key === 'ArrowRight') {
      setRightFlipperUp(false);
    }
  };

  const handleBlockCollision = () => {
    // Logic for handling block collision
    setScore(score + 10); // Update the score, adjust as needed
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const rotateSpinner = (spinner, speed) => {
    const newRotation = (spinner.rotation || 0) + speed;

    if (newRotation >= 360) {
      spinner.rotation = newRotation - 360;
    } else if (newRotation < 0) {
      spinner.rotation = newRotation + 360;
    } else {
      spinner.rotation = newRotation;
    }
  };

  useEffect(() => {
    const interval = setInterval(handleGameLoop, 16);
    return () => clearInterval(interval);
  }, [ballPosition, ballSpeed, gameOver, score]);

  

  const handleOutOfBounds = () => {
    // Logic for when the ball goes out of bounds
    setGameOver(true); // Set the game over state

    // You can add more specific logic here
    // For example, play a game over sound, display a game over animation, etc.
  };

  const handleBumperHit = (id) => {
    // Logic when a bumper is hit, e.g., increase score
    console.log(`Bumper ${id} hit!`);
  };

  const handleLaneGuideHit = (id) => {
    // Logic when a lane guide is hit, e.g., redirect the ball
    console.log(`Lane Guide ${id} hit!`);
  };
  const handleKickbackActivate = (id) => {
    // Logic when a kickback is activated, e.g., save the ball from falling
    console.log(`Kickback ${id} activated!`);
  };

  const handleRolloverRoll = (id) => {
    // Logic when a rollover is triggered, e.g., scoring points
    console.log(`Rollover ${id} triggered!`);
  };

  const handleDropTargetHit = (id) => {
    // Logic when a DropTarget is hit, e.g., revealing new paths or bonuses
    console.log(`DropTarget ${id} hit!`);
  };

  const handleKickout = (id) => {
    // Logic when a KickoutHole is triggered, e.g., shooting the ball back into play
    console.log(`KickoutHole ${id} triggered!`);
  };

  const handleMagnetize = (id, magneticForce) => {
    // Logic when a Magnet is triggered, e.g., attract or repel the ball
    console.log(`Magnet ${id} magnetized with force ${magneticForce}!`);
  };

  const handleRelease = (id) => {
    // Logic when a CaptiveBall is released, e.g., add to the score
    console.log(`Captive Ball ${id} released!`);
  };

  const handleEnterHole = (id) => {
    // Logic when the ball enters the hole, e.g., teleport the ball
    console.log(`Ball entered hole ${id}`);
  };

  const handleBallLost = () => {
    // Logic for when a ball is lost
    console.log('Ball Lost!');
  };

  const handleScore = (points) => {
    // Logic for updating the score
    console.log(`Scored ${points} points!`);
  };
  const handleCollision = () => {
    console.log('Ball collided!');
    // Your collision logic goes here
    console.log('Ball collided with dynamic obstacle!');

  };

  const handleSkillShot = () => {
    // Handle the logic when the player successfully hits the skill shot
    console.log('Skill Shot successful!');
    // You can add scoring logic or any other actions here
  };

  const Bumper = styled.div`
  width: 30px;
  height: 30px;
  background-color: #ff0; /* Yellow color for bumpers */
  position: absolute;
  border-radius: 50%;
`;

  return (
    <Container>
      <PinballGame>
        {/* Flippers */}
        <LeftFlipper up={leftFlipperUp} />
        <RightFlipper up={rightFlipperUp} />

        {/* Ball */}
        {ballPosition && (
        <Ball
            position={ballPosition}
            speed={ballSpeed}
            onCollision={handleCollision}
            onOutOfBounds={handleOutOfBounds}
          />
        )}

        {/* Tubes */}
        <Tube type="top" />
        <Tube type="middle" />
        <Tube type="bottom" />

        {/* Blocks */}
        <Blocks initialTop={300} initialLeft={100} ballPosition={ballPosition} onCollision={() => handleBlockCollision()} />

        {/* Spinners */}
        <Spinner type="left" />
        <Spinner type="right" />
        <BallLauncher onLaunch={handleLaunch} />


        {/* Score Display */}
        <ScoreDisplay score={score} />
        <Bumper id={1} size="30px" color="#ffcc00" top={100} left={200} onClick={handleBumperHit} />
<Bumper id={2} size="30px" color="#ffcc00" top={300} left={500} onClick={handleBumperHit} />

<LaneGuide id={1} width="20px" height="80px" color="#00ff00" top={100} left={200} onHit={handleLaneGuideHit} />
<LaneGuide id={2} width="20px" height="80px" color="#00ff00" top={300} left={500} onHit={handleLaneGuideHit} />
<Kickback id={1} width="20px" height="100px" top={50} left={10} onActivate={handleKickbackActivate} />
<Kickback id={2} width="20px" height="100px" top={50} left={770} onActivate={handleKickbackActivate} />
<Rollover id={1} width="30px" height="30px" top={100} left={200} onRoll={handleRolloverRoll} />
<Rollover id={2} width="30px" height="30px" top={300} left={400} onRoll={handleRolloverRoll} />
<DropTarget id={1} width="50px" height="30px" top={150} left={300} onHit={handleDropTargetHit} />
<DropTarget id={2} width="50px" height="30px" top={350} left={500} onHit={handleDropTargetHit} />
<KickoutHole id={1} diameter="40px" top={50} left={100} onKick={handleKickout} />
<KickoutHole id={2} diameter="40px" top={200} left={500} onKick={handleKickout} />
<Magnet id={1} size="30px" top={100} left={200} magneticForce={10} onMagnetize={handleMagnetize} />
<Magnet id={2} size="30px" top={300} left={500} magneticForce={-10} onMagnetize={handleMagnetize} />
<CaptiveBall id={1} size="20px" top={100} left={200} isReleased={false} onRelease={handleRelease} />
<CaptiveBall id={2} size="20px" top={300} left={500} isReleased={false} onRelease={handleRelease} />
<Hole id={1} size="30px" top={100} left={200} onEnter={handleEnterHole} />
<Hole id={2} size="30px" top={300} left={500} onEnter={handleEnterHole} />
<Multiball
        initialBallsCount={3}  // Adjust the number of initial balls as needed
        onBallLost={handleBallLost}
        onScore={handleScore}
      />

<SkillShot onSkillShot={handleSkillShot} />
<DynamicObstacle onCollision={handleCollision} />


        {/* Game Over Message */}
        {gameOver && <GameOverMessage>Game Over</GameOverMessage>}
      </PinballGame>
    </Container>
  );
};

export default Pinball;