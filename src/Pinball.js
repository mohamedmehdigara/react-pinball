import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #222;
`;

const PinballGame = styled.div`
  width: 400px;
  height: 600px;
  background-color: #444;
  position: relative;
`;

const FlippersContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 20px;
`;

const FlipperBase = styled.div`
  width: 80px;
  height: 20px;
  background-color: #777;
  position: absolute;
  bottom: 0;
`;

const LeftFlipper = styled(FlipperBase)`
  transform-origin: right center;
  transform: rotate(${(props) => (props.up ? '-45deg' : '0deg')});
`;

const RightFlipper = styled(FlipperBase)`
  transform-origin: left center;
  transform: rotate(${(props) => (props.up ? '45deg' : '0deg')});
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

function Pinball() {
  const [leftFlipperUp, setLeftFlipperUp] = useState(false);
  const [rightFlipperUp, setRightFlipperUp] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 190, y: 550 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

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

      const newBallPosition = {
        x: ballPosition.x,
        y: ballPosition.y + 2,
      };

      // Check for collision with flippers
      const ballCenterX = newBallPosition.x + 10;
      const leftFlipperX = 120;
      const rightFlipperX = 200;

      if (
        newBallPosition.y >= 530 &&
        ((ballCenterX >= leftFlipperX && ballCenterX <= leftFlipperX + 80) ||
          (ballCenterX >= rightFlipperX && ballCenterX <= rightFlipperX + 80))
      ) {
        // Ball hits a flipper, increase score
        setScore(score + 10);
      }

      // Check for game over condition (ball falls off the bottom)
      if (newBallPosition.y >= 590) {
        setGameOver(true);
      }

      setBallPosition(newBallPosition);
    };

    const interval = setInterval(handleGameLoop, 16);
    return () => {
      clearInterval(interval);
    };
  }, [ballPosition, gameOver]);

  return (
    <Container>
      <PinballGame>
        <FlippersContainer>
          <LeftFlipper up={leftFlipperUp} />
          <RightFlipper up={rightFlipperUp} />
        </FlippersContainer>
        <Ball position={ballPosition} />
      </PinballGame>
      <div>Score: {score}</div>
      {gameOver && <div>Game Over</div>}
    </Container>
  );
}

export default Pinball;
