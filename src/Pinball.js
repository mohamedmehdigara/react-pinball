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
`;

const SideWall = styled.div`
  width: 10px;
  height: 600px;
  background-color: #333;
  position: absolute;
  top: 0;
  left: ${(props) => (props.right ? 'calc(100% - 10px)' : '0')};
`;

const FlipperContainer = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
`;

const bounceAnimation = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const Flipper = styled.div`
  width: 120px;
  height: 20px;
  background-color: #777;
  position: absolute;
  bottom: 0;
  left: ${(props) => (props.right ? 'calc(100% - 120px)' : '0')};
  transform: ${(props) => (props.up ? 'rotate(-45deg)' : 'rotate(0)')};
  transform-origin: ${(props) => (props.right ? '100% 100%' : '0% 100%')};
  transition: transform 0.2s ease;
  animation: ${(props) => props.up && bounceAnimation} 0.2s;
`;

const Ball = styled.div`
  width: 20px;
  height: 20px;
  background-color: #f00;
  border-radius: 50%;
  position: absolute;
  top: ${(props) => props.position.y}px;
  left: ${(props) => props.position.x}px;
  transition: top 0.2s ease;
`;

const Bumper = styled.div`
  width: 40px;
  height: 40px;
  background-color: #555;
  border-radius: 50%;
  position: absolute;
  top: ${(props) => props.position.y}px;
  left: ${(props) => props.position.x}px;
`;

const Wall = styled.div`
  width: 30px;
  height: 200px;
  background-color: #999;
  position: absolute;
  top: ${(props) => props.position.y}px;
  left: ${(props) => props.position.x}px;
`;

function Pinball() {
  const [leftFlipperUp, setLeftFlipperUp] = useState(false);
  const [rightFlipperUp, setRightFlipperUp] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 400, y: 580 });
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
        setBallPosition({ x: 400, y: 580 });
        setScore(0);
      }, 3000); // 3 seconds delay before resetting the game
    }
  }, [gameOver]);

  return (
    <Container>
      <PinballGame>
        <FlipperContainer>
          <Flipper up={leftFlipperUp} />
          <Flipper up={rightFlipperUp} right />
        </FlipperContainer>
        <SideWall />
        <SideWall right />
        <Bumper position={{ x: 120, y: 120 }} />
        <Bumper position={{ x: 680, y: 120 }} />
        <Bumper position={{ x: 400, y: 270 }} />
        <Wall position={{ x: 200, y: 350 }} />
        <Wall position={{ x: 600, y: 350 }} />
        <Ball position={ballPosition} />
        {gameOver && <h1>Game Over</h1>}
        <h2>Score: {score}</h2>
      </PinballGame>
    </Container>
  );
}

export default Pinball;
