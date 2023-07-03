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
  width: 800px;
  height: 600px;
  background-color: #444;
  position: relative;
`;

const FlipperContainer = styled.div`
  display: flex;
  justify-content: space-between;
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
`;

const Flipper = styled.div`
  width: 120px;
  height: 20px;
  background-color: #777;
  position: relative;
  transform-origin: bottom ${(props) => (props.right ? 'right' : 'left')};
  transform: ${(props) => (props.up ? 'rotate(-45deg)' : 'none')};
`;

const Ball = styled.div`
  width: 20px;
  height: 20px;
  background-color: #f00;
  border-radius: 50%;
  position: absolute;
  top: ${(props) => props.position.y}px;
  left: ${(props) => props.position.x}px;
  transition: top 0.3s ease;
`;

function Pinball() {
  const [leftFlipperUp, setLeftFlipperUp] = useState(false);
  const [rightFlipperUp, setRightFlipperUp] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 390, y: 580 });
  const [ballDirection, setBallDirection] = useState(-1);

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
      setBallPosition((prevPosition) => ({
        x: prevPosition.x,
        y: prevPosition.y + ballDirection * 2,
      }));

      if (ballPosition.y <= 10 || ballPosition.y >= 570) {
        setBallDirection(-ballDirection);
      }
    };

    const interval = setInterval(handleGameLoop, 16);
    return () => {
      clearInterval(interval);
    };
  }, [ballPosition, ballDirection]);

  useEffect(() => {
    const checkCollision = () => {
      const leftFlipperPosition = leftFlipperUp ? 330 : 210;
      const rightFlipperPosition = rightFlipperUp ? 470 : 590;

      if (
        ballPosition.y >= 530 &&
        ballPosition.x >= leftFlipperPosition &&
        ballPosition.x <= rightFlipperPosition
      ) {
        setBallDirection(-1);
      }
    };

    checkCollision();
  }, [ballPosition, leftFlipperUp, rightFlipperUp]);

  return (
    <Container>
      <PinballGame>
        <FlipperContainer>
          <Flipper up={leftFlipperUp} />
          <Flipper up={rightFlipperUp} right />
        </FlipperContainer>
        <Ball position={ballPosition} />
      </PinballGame>
    </Container>
  );
}

export default Pinball;
