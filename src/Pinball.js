import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #4c4c4c;
`;

const PinballGame = styled.div`
  width: 400px;
  height: 600px;
  background-color: #5c5c5c;
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
  background-color: #aaa;
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

const Bumper = styled.div`
  width: 40px;
  height: 40px;
  background-color: #aaa;
  border-radius: 50%;
  position: absolute;
`;

const Score = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  font-family: Arial, sans-serif;
  color: #fff;
  font-size: 16px;
`;

function Pinball() {
  const [leftFlipperUp, setLeftFlipperUp] = useState(false);
  const [rightFlipperUp, setRightFlipperUp] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 190, y: 550 });
  const [ballVelocity, setBallVelocity] = useState({ x: 0, y: 0 });
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
      const { x, y } = ballPosition;
      const { x: vx, y: vy } = ballVelocity;
      const newBallPosition = {
        x: x + vx,
        y: y + vy,
      };

      // Handle ball collisions with walls
      if (newBallPosition.x <= 0 || newBallPosition.x >= 380) {
        setBallVelocity({ ...ballVelocity, x: -vx });
      }
      if (newBallPosition.y <= 0) {
        setBallVelocity({ ...ballVelocity, y: -vy });
      }

      // Handle ball collisions with flippers
      const leftFlipperLeft = 70;
      const leftFlipperRight = 150;
      const rightFlipperLeft = 250;
      const rightFlipperRight = 330;
      const flipperTop = 540;
      const flipperHeight = 20;

      const leftFlipperColliding =
        newBallPosition.x >= leftFlipperLeft &&
        newBallPosition.x + 20 <= leftFlipperRight &&
        newBallPosition.y + 20 >= flipperTop &&
        newBallPosition.y <= flipperTop + flipperHeight;

      if (leftFlipperColliding && vy >= 0) {
        setBallVelocity({ ...ballVelocity, y: -vy * 1.2 });
        setScore(score + 100);
      }

      const rightFlipperColliding =
        newBallPosition.x + 20 >= rightFlipperLeft &&
        newBallPosition.x <= rightFlipperRight &&
        newBallPosition.y + 20 >= flipperTop &&
        newBallPosition.y <= flipperTop + flipperHeight;

      if (rightFlipperColliding && vy >= 0) {
        setBallVelocity({ ...ballVelocity, y: -vy * 1.2 });
        setScore(score + 100);
      }

      setBallPosition(newBallPosition);

      // Handle ball falling out
      if (newBallPosition.y >= 590) {
        setBallPosition({ x: 190, y: 550 });
        setBallVelocity({ x: 0, y: 0 });
        setScore(0);
      }
    };

    const interval = setInterval(handleGameLoop, 16);
    return () => {
      clearInterval(interval);
    };
  }, [ballPosition, ballVelocity, leftFlipperUp, rightFlipperUp, score]);

  return (
    <Container>
      <PinballGame>
        <FlippersContainer>
          <LeftFlipper up={leftFlipperUp} />
          <RightFlipper up={rightFlipperUp} />
        </FlippersContainer>
        <Ball position={ballPosition} />
        <Bumper style={{ top: 160, left: 120 }} />
        <Bumper style={{ top: 160, left: 240 }} />
        <Bumper style={{ top: 160, right: 120 }} />
        <Bumper style={{ top: 160, right: 240 }} />
        <Bumper style={{ top: 320, left: 70 }} />
        <Bumper style={{ top: 320, right: 330 }} />
        <Bumper style={{ top: 460, left: 120 }} />
        <Bumper style={{ top: 460, right: 240 }} />
        <Score>Score: {score}</Score>
      </PinballGame>
    </Container>
  );
}

export default Pinball;
