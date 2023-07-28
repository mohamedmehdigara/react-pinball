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
function Pinball() {
  const [leftFlipperUp, setLeftFlipperUp] = useState(false);
  const [rightFlipperUp, setRightFlipperUp] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 780, y: 50 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

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

  useEffect(() => {
    const handleGameLoop = () => {
      if (gameOver) return;

      const newPosition = { x: ballPosition.x, y: ballPosition.y + (leftFlipperUp || rightFlipperUp ? -5 : 5) };

      // Check for collision with walls
      if (newPosition.x <= 30 || newPosition.x >= 770) {
        newPosition.x = ballPosition.x; // Prevent moving outside the game area
      }

      // Check for collision with flippers
      if (newPosition.y >= 570 && newPosition.x >= 200 && newPosition.x <= 600) {
        newPosition.y = 570;
        newPosition.x += leftFlipperUp ? -10 : 10;
      }

      // Check for collision with bumpers
      if (
        (newPosition.y >= 100 && newPosition.y <= 140 && newPosition.x >= 100 && newPosition.x <= 140) ||
        (newPosition.y >= 100 && newPosition.y <= 140 && newPosition.x >= 660 && newPosition.x <= 700) ||
        (newPosition.y >= 250 && newPosition.y <= 290 && newPosition.x >= 380 && newPosition.x <= 420)
      ) {
        setScore(score + 50);
      }

      // Check for collision with tube
      if (
        newPosition.x >= 740 &&
        newPosition.x <= 800 &&
        newPosition.y >= 100 &&
        newPosition.y <= 160 &&
        newPosition.y >= 340 &&
        newPosition.y <= 400
      ) {
        newPosition.y = 170;
        newPosition.x = 740;
      }

      // Check for game over
      if (newPosition.y > 580) {
        setGameOver(true);
        return;
      }

      setBallPosition(newPosition);
    };

    const interval = setInterval(handleGameLoop, 16);
    return () => {
      clearInterval(interval);
    };
  }, [ballPosition, leftFlipperUp, rightFlipperUp, gameOver, score]);

  useEffect(() => {
    if (gameOver) {
      setTimeout(() => {
        setGameOver(false);
        setBallPosition({ x: 780, y: 50 });
        setScore(0);
      }, 3000); // 3 seconds delay before resetting the game
    }
  }, [gameOver]);

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