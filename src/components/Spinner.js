import React, { useRef, useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import PropTypes from 'prop-types';

const rotateLeft = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
`;

const rotateRight = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SpinnerBlade = styled.div`
  position: absolute;
  width: 5px;
  height: 30px;
  background-color: #ff9900;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  transform-origin: center center;
  animation: ${props => props.isSpinning ? (props.type === 'left' ? rotateLeft : rotateRight) : 'none'}
             ${props => props.spinDuration}s linear infinite;
`;

const Spinner = React.forwardRef(({ top, left, type = 'right', scorePerRotation = 50 }, ref) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [lastHitTime, setLastHitTime] = useState(0);
  const spinDurationRef = useRef(0.5); // Initial spin duration in seconds

  const handleCollision = (ballVelocity) => {
    const currentTime = Date.now();
    // Prevent rapid triggering from the same hit
    if (currentTime - lastHitTime > 100) {
      setIsSpinning(true);
      setSpinCount(prevCount => prevCount + 1);
      setLastHitTime(currentTime);

      // Adjust spin duration based on ball velocity (simplified)
      const speed = Math.sqrt(ballVelocity.x * ballVelocity.x + ballVelocity.y * ballVelocity.y);
      spinDurationRef.current = Math.max(0.2, 1 / (speed * 0.01)); // Faster ball = faster spin

      // Stop spinning after a short duration (can be adjusted)
      setTimeout(() => {
        setIsSpinning(false);
      }, 500); // 0.5 seconds of spinning

      return scorePerRotation; // Return the score for this hit
    }
    return 0;
  };

  const getBoundingClientRect = () => {
    return {
      left: left - 10, // Approximate bounding box
      top: top - 15,
      right: left + 15,
      bottom: top + 15,
      width: 25,
      height: 30,
    };
  };

  React.useImperativeHandle(ref, () => ({
    handleCollision: handleCollision,
    getBoundingClientRect: getBoundingClientRect,
  }));

  return (
    <SpinnerBlade
      ref={ref}
      top={top}
      left={left}
      type={type}
      isSpinning={isSpinning}
      spinDuration={spinDurationRef.current}
    />
  );
});

Spinner.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  type: PropTypes.oneOf(['left', 'right']),
  scorePerRotation: PropTypes.number,
};

export default Spinner;