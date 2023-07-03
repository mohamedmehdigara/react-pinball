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
  position: relative;
  width: 800px;
  height: 600px;
  background-color: #444;
`;

const Flipper = styled.div`
  width: 120px;
  height: 20px;
  background-color: #777;
  position: absolute;
  bottom: 20px;
  left: ${(props) => (props.right ? 'calc(100% - 120px)' : '0')};
  transform: ${(props) => (props.up ? 'rotate(45deg)' : 'rotate(0)')};
  transform-origin: ${(props) => (props.right ? '100% 100%' : '0% 100%')};
  transition: transform 0.2s ease;
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

function Pinball() {
  const [leftFlipperUp, setLeftFlipperUp] = useState(false);
  const [rightFlipperUp, setRightFlipperUp] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 400, y: 580 });
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

      const newPosition = { x: ballPosition.x, y: ballPosition.y + (leftFlipperUp || rightFlipperUp ? -5 : 5) };

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
  }, [ballPosition, leftFlipperUp, rightFlipperUp, gameOver]);

  return (
    <Container>
      <PinballGame>
        <Flipper up={leftFlipperUp} />
        <Flipper up={rightFlipperUp} right />
        <Ball position={ballPosition} />
        {gameOver && <h1>Game Over</h1>}
      </PinballGame>
    </Container>
  );
}

export default Pinball;
