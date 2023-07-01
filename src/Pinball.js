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

const Score = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  color: #fff;
  font-size: 20px;
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
        const leftFlipperVelocity = leftFlipperUp ? -8 : 0;
        const rightFlipperVelocity = rightFlipperUp ? 8 : 0;
  
        const newBallPosition = {
          x: ballPosition.x + ballVelocity.x,
          y: ballPosition.y + ballVelocity.y,
        };
  
        const friction = 0.985;
        const newBallVelocity = {
          x: ballVelocity.x * friction + leftFlipperVelocity + rightFlipperVelocity,
          y: ballVelocity.y * friction + 0.5,
        };
  
        // Handle collisions with walls
        const wallBounceFactor = 0.6;
        if (newBallPosition.x <= 10 || newBallPosition.x >= 370) {
          newBallVelocity.x = -newBallVelocity.x * wallBounceFactor;
        }
        if (newBallPosition.y <= 10) {
          newBallVelocity.y = -newBallVelocity.y * wallBounceFactor;
        }
  
        // Handle collisions with flippers
        const flipperWidth = 80;
        const flipperHeight = 20;
        const flipperTop = 570;
  
        const leftFlipperLeft = 60;
        const leftFlipperRight = leftFlipperLeft + flipperWidth;
        const leftFlipperColliding =
          newBallPosition.x + 10 >= leftFlipperLeft &&
          newBallPosition.x <= leftFlipperRight &&
          newBallPosition.y + 10 >= flipperTop &&
          newBallPosition.y <= flipperTop + flipperHeight;
  
        if (leftFlipperColliding && newBallVelocity.y >= 0) {
          newBallVelocity.y = -newBallVelocity.y * 1.1;
          setScore(score + 100);
        }
  
        const rightFlipperLeft = 260;
        const rightFlipperRight = rightFlipperLeft + flipperWidth;
        const rightFlipperColliding =
          newBallPosition.x + 10 >= rightFlipperLeft &&
          newBallPosition.x <= rightFlipperRight &&
          newBallPosition.y + 10 >= flipperTop &&
          newBallPosition.y <= flipperTop + flipperHeight;
  
        if (rightFlipperColliding && newBallVelocity.y >= 0) {
          newBallVelocity.y = -newBallVelocity.y * 1.1;
          setScore(score + 100);
        }
  
        setBallPosition(newBallPosition);
        setBallVelocity(newBallVelocity);
  
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
          <Score>{score}</Score>
        </PinballGame>
      </Container>
    );
  }
    
  
export default Pinball;
