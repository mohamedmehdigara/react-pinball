import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

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

const LeftFlipper = styled(FlipperBase)`
  transform-origin: left center;
  transform: rotate(${(props) => (props.up ? '-30deg' : '0deg')});
  left: 50px;
`;

const RightFlipper = styled(FlipperBase)`
  transform-origin: right center;
  transform: rotate(${(props) => (props.up ? '30deg' : '0deg')});
  right: 50px;
`;

const Ball = styled.div`
  width: 20px;
  height: 20px;
  background-color: #f00;
  border-radius: 50%;
  position: absolute;
  top: ${(props) => props.position.y}px;
  left: ${(props) => props.position.x}px;
`;

const Tube = styled.div`
  width: 100px;
  height: 100px;
  background-color: #777;
  position: absolute;
  border-radius: 50%;
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

const Blocks = styled.div`
  width: 200px;
  height: 50px;
  background-color: #777;
  position: absolute;
  top: 300px;
  left: 100px;
`;

const Bumper = styled.div`
  width: 30px;
  height: 30px;
  background-color: #ff0; /* Yellow color for bumpers */
  position: absolute;
  border-radius: 50%;
`;

const LeftBumper = styled(Bumper)`
  top: 100px;
  left: 200px;
`;

const RightBumper = styled(Bumper)`
  top: 300px;
  left: 500px;
`;

const Spinner = styled.div`
  width: 60px;
  height: 60px;
  border: 2px solid #0f0; /* Green color for spinner */
  position: absolute;
  border-radius: 50%;
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

const GameOverMessage = styled.div`
  font-size: 48px;
  color: white;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
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
  const [ballPosition, setBallPosition] = useState({ x: 390, y: 550 });
  const [ballSpeed, setBallSpeed] = useState({ x: 0, y: -3 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

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
  

  return (
    <Container>
      <PinballGame>
        {/* Flippers */}
        <LeftFlipper up={leftFlipperUp} />
        <RightFlipper up={rightFlipperUp} />

        {/* Ball */}
        <Ball position={ballPosition} />

        {/* Tubes */}
        <TopTube />
        <MiddleTube />
        <BottomTube />

        {/* Blocks */}
        <Blocks />

        {/* Bumpers */}
        <LeftBumper />
        <RightBumper />

        {/* Spinners */}
        <LeftSpinner>
          <SpinnerCenter />
        </LeftSpinner>
        <RightSpinner>
          <SpinnerCenter />
        </RightSpinner>

        {/* Score */}
        <Score>Score: {score}</Score>

        {/* Game Over Message */}
        {gameOver && <GameOverMessage>Game Over</GameOverMessage>}
      </PinballGame>
    </Container>
  );
};

export default Pinball;
