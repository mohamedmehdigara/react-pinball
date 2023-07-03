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

const Road = styled.div`
  width: 80px;
  height: 600px;
  background-color: #333;
  position: absolute;
  left: 160px;
`;

const Flipper = styled.div`
  width: 20px;
  height: 100px;
  background-color: #777;
  position: absolute;
  bottom: 0;
  ${(props) => (props.side === 'left' ? 'left' : 'right')}: 0;
  transform-origin: bottom center;
  transform: ${(props) => (props.up ? 'rotate(-45deg)' : 'none')};
`;

const Block = styled.div`
  width: 40px;
  height: 20px;
  background-color: #999;
  position: absolute;
  top: ${(props) => props.position.y}px;
  left: ${(props) => props.position.x}px;
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

      setBallPosition((prevPosition) => ({
        x: prevPosition.x,
        y: prevPosition.y + 2,
      }));
    };

    const interval = setInterval(handleGameLoop, 16);
    return () => {
      clearInterval(interval);
    };
  }, [gameOver]);

  useEffect(() => {
    const checkCollision = () => {
      const ballCenterX = ballPosition.x + 10;
      const leftFlipperX = 0;
      const rightFlipperX = 380;

      if (
        ballPosition.y >= 530 &&
        ((ballCenterX >= leftFlipperX && ballCenterX <= leftFlipperX + 20) ||
          (ballCenterX >= rightFlipperX && ballCenterX <= rightFlipperX + 20))
      ) {
        setScore((prevScore) => prevScore + 10);
      }

      if (ballPosition.y >= 590) {
        setGameOver(true);
      }
    };

    checkCollision();
  }, [ballPosition]);

  return (
    <Container>
      <PinballGame>
        <Road />
        <Flipper side="left" up={leftFlipperUp} />
        <Flipper side="right" up={rightFlipperUp} />
        <Ball position={ballPosition} />
        <Block position={{ x: 160, y: 450 }} />
        <Block position={{ x: 200, y: 400 }} />
        <Block position={{ x: 240, y: 450 }} />
      </PinballGame>
      <div>Score: {score}</div>
      {gameOver && <div>Game Over</div>}
    </Container>
  );
}

export default Pinball;


