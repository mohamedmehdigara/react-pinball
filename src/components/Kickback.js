import React, { useRef, useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import PropTypes from 'prop-types';

const kickAnimation = keyframes`
  0% { transform: translateX(0); }
  50% { transform: translateX(5px); }
  100% { transform: translateX(0); }
`;

const KickbackPad = styled.div`
  position: absolute;
  width: 20px;
  height: 40px;
  background-color: #4CAF50;
  bottom: ${props => props.bottom}px;
  left: ${props => props.left}px;
  border-radius: 0 5px 5px 0;
  transform-origin: center left;
  transform: rotate(${props => props.angle}deg);
  animation: ${props => props.isKicking ? `${kickAnimation} 0.1s ease-in-out` : 'none'};
`;

const Kickback = React.forwardRef(({ bottom, left, angle = 0, onKickback }, ref) => {
  const [isKicking, setIsKicking] = useState(false);
  const isCoolingDown = useRef(false);

  const handleCollision = (ballPosition, ballRadius) => {
    const kickbackRect = ref.current ? ref.current.getBoundingClientRect() : null;

    if (!kickbackRect || isCoolingDown.current) {
      return null;
    }

    // Basic AABB collision detection
    const kickLeft = kickbackRect.left;
    const kickRight = kickbackRect.right;
    const kickTop = kickbackRect.top;
    const kickBottom = kickbackRect.bottom;

    const ballLeft = ballPosition.x - ballRadius;
    const ballRight = ballPosition.x + ballRadius;
    const ballTop = ballPosition.y - ballRadius;
    const ballBottom = ballPosition.y + ballRadius;

    if (ballRight > kickLeft && ballLeft < kickRight && ballBottom > kickTop && ballTop < kickBottom) {
      setIsKicking(true);
      isCoolingDown.current = true;
      setTimeout(() => setIsKicking(false), 100);
      setTimeout(() => isCoolingDown.current = false, 500); // Cooldown period

      // Calculate a kickback impulse (simplified)
      const angleRad = angle * Math.PI / 180;
      const kickStrength = 18;
      const impulseX = kickStrength * Math.cos(angleRad); // Kick to the right/left
      const impulseY = -kickStrength * Math.sin(angleRad) - 5; // Kick upwards

      if (onKickback) {
        onKickback(); // Notify Pinball.js that a kickback occurred (for scoring, etc.)
      }
      return { x: impulseX, y: impulseY };
    }
    return null;
  };

  const getBoundingClientRect = () => {
    if (ref.current) {
      return ref.current.getBoundingClientRect();
    }
    return null;
  };

  React.useImperativeHandle(ref, () => ({
    handleCollision: handleCollision,
    getBoundingClientRect: getBoundingClientRect,
  }));

  return (
    <KickbackPad
      ref={ref}
      bottom={bottom}
      left={left}
      angle={angle}
      isKicking={isKicking}
    />
  );
});

Kickback.propTypes = {
  bottom: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  angle: PropTypes.number,
  onKickback: PropTypes.func,
};

export default Kickback;