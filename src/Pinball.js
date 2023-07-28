import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

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

  // Adjust the ball's movement to create bouncing effect
  useEffect(() => {
    const handleGameLoop = () => {
      if (gameOver) return;

      // Adjust ball's speed and position based on current state
      const newBallSpeed = { ...ballSpeed };
      const newBallPosition = { ...ballPosition };

      // Apply gravity effect
      newBallSpeed.y += 0.1;

      // Update ball's position
      newBallPosition.x += newBallSpeed.x;
      newBallPosition.y += newBallSpeed.y;

      // Check for collisions with walls
      if (newBallPosition.x < 10 || newBallPosition.x > 770) {
        newBallSpeed.x = -newBallSpeed.x;
      }

      // Check for collisions with flippers
      if (
        newBallPosition.y > 540 &&
        newBallPosition.y < 560 &&
        ((newBallPosition.x > 50 && newBallPosition.x < 210) || (newBallPosition.x > 590 && newBallPosition.x < 750))
      ) {
        newBallSpeed.y = -7; // Ball bounces up when hitting the flippers
      }

      // Check for collisions with tubes and blocks
      // (Add collision logic here based on your game design)

      // Check for game over condition
      if (newBallPosition.y > 590) {
        setGameOver(true);
      }

      setBallSpeed(newBallSpeed);
      setBallPosition(newBallPosition);
    };

    const interval = setInterval(handleGameLoop, 16);
    return () => clearInterval(interval);
  }, [ballPosition, ballSpeed, gameOver]);

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

        {/* Score */}
        <Score>Score: {score}</Score>

        {/* Game Over Message */}
        {gameOver && <GameOverMessage>Game Over</GameOverMessage>}
      </PinballGame>
    </Container>
  );
};

export default Pinball;
