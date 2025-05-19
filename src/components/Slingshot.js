import React, { useRef, useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import PropTypes from 'prop-types';

const armSqueeze = keyframes`
  0% { transform: scale(1, 1); }
  50% { transform: scale(0.8, 1.2); }
  100% { transform: scale(1, 1); }
`;

const SlingshotArm = styled.div`
  position: absolute;
  width: 10px;
  height: ${props => props.armLength}px;
  background-color: #cc3300;
  border-radius: 5px;
  transform-origin: top center;
  transform: rotate(${props => props.angle}deg);
  top: ${props => props.top}px;
  left: ${props => props.left - 5}px;
  animation: ${props => props.isHit ? armSqueeze : 'none'} 0.1s ease-in-out;
`;

const Slingshot = React.forwardRef(({ top, left, armLength, angle, onCollision }, ref) => {
  const armRef = useRef(null);
  const [isHit, setIsHit] = useState(false);

  const handleCollision = (ballPosition, ballRadius) => {
    const armRect = armRef.current ? armRef.current.getBoundingClientRect() : null;

    if (!armRect) {
      return null;
    }

    // Simple AABB (Axis-Aligned Bounding Box) collision for the arm
    const armLeft = armRect.left;
    const armRight = armRect.right;
    const armTop = armRect.top;
    const armBottom = armRect.bottom;

    const ballLeft = ballPosition.x - ballRadius;
    const ballRight = ballPosition.x + ballRadius;
    const ballTop = ballPosition.y - ballRadius;
    const ballBottom = ballPosition.y + ballRadius;

    if (ballRight > armLeft && ballLeft < armRight && ballBottom > armTop && ballTop < armBottom) {
      setIsHit(true);
      setTimeout(() => setIsHit(false), 100);

      // Calculate impulse vector (simplified based on arm angle)
      const angleRad = angle * Math.PI / 180;
      const impulseStrength = 15; // Adjust for force
      const impulseX = impulseStrength * Math.sin(angleRad);
      const impulseY = -impulseStrength * Math.cos(angleRad); // Negative Y for upward direction

      if (onCollision) {
        onCollision({ x: impulseX, y: impulseY });
      }
      return { x: impulseX, y: impulseY }; // Return the impulse to Pinball.js
    }
    return null;
  };

  React.useImperativeHandle(ref, () => ({
    handleCollision: handleCollision,
  }));

  return (
    <>
      <SlingshotArm
        ref={armRef}
        top={top}
        left={left}
        armLength={armLength}
        angle={angle}
        isHit={isHit}
      />
    </>
  );
});

Slingshot.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  armLength: PropTypes.number.isRequired,
  angle: PropTypes.number.isRequired,
  onCollision: PropTypes.func,
};

export default Slingshot;