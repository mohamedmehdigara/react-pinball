import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled, { keyframes } from 'styled-components';

const shine = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.1);
  }
  50% {
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  }
  100% {
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.1);
  }
`;

const StyledBall = styled.div`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  width: ${props => props.radius * 2}px;
  height: ${props => props.radius * 2}px;
  border-radius: 50%;
  background-image: radial-gradient(circle at 40% 40%, #eee, #bbb 60%, #888);
  box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.5);
  transition: transform 0.05s linear;
  animation: ${shine} 2s infinite alternate;

  &::before {
    content: '';
    position: absolute;
    top: 15%;
    left: 15%;
    width: 25%;
    height: 25%;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    filter: blur(2px);
  }
`;

const Ball = React.forwardRef(({ position, velocity, radius, updateBallPosition, onCollision, playAreaWidth, playAreaHeight, friction = 0.01, gravity = 0.1 }, ref) => {
  const ballRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    let currentVelocity = { ...velocity };
    let currentPosition = { ...position };

    const gameLoop = () => {
      if (!ballRef.current) return;

      currentVelocity.y += gravity;

      const speed = Math.sqrt(currentVelocity.x ** 2 + currentVelocity.y ** 2);
      if (speed > 0.1) { // Reduced threshold for stopping
        currentVelocity.x *= (1 - friction);
        currentVelocity.y *= (1 - friction);
      } else {
        currentVelocity.x = 0;
        currentVelocity.y = 0;
      }

      const newPosition = {
        x: currentPosition.x + currentVelocity.x,
        y: currentPosition.y + currentVelocity.y,
      };

      const COR = 0.8;

      if (newPosition.y - radius < 0) {
        newPosition.y = radius;
        currentVelocity.y *= -COR;
      } else if (newPosition.y + radius > playAreaHeight) {
        newPosition.y = playAreaHeight - radius;
        currentVelocity.y *= -COR;
      }

      if (newPosition.x - radius < 0) {
        newPosition.x = radius;
        currentVelocity.x *= -COR;
      } else if (newPosition.x + radius > playAreaWidth) {
        newPosition.x = playAreaWidth - radius;
        currentVelocity.x *= -COR;
      }

      currentPosition = newPosition;
      updateBallPosition(currentPosition);

      if (onCollision) {
        onCollision(currentPosition, radius, currentVelocity);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [position, velocity, radius, updateBallPosition, onCollision, playAreaWidth, playAreaHeight, friction, gravity]);

  return (
    <StyledBall
      ref={ballRef}
      x={position.x - radius}
      y={position.y - radius}
      radius={radius}
    />
  );
});

Ball.propTypes = {
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  velocity: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  radius: PropTypes.number.isRequired,
  updateBallPosition: PropTypes.func.isRequired,
  onCollision: PropTypes.func,
  playAreaWidth: PropTypes.number.isRequired,
  playAreaHeight: PropTypes.number.isRequired,
  friction: PropTypes.number,
  gravity: PropTypes.number,
};

export default Ball;