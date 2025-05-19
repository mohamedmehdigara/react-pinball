import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import PropTypes from 'prop-types';

const targetHitAnimation = keyframes`
  0% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(5px); opacity: 0.8; }
  100% { transform: translateY(0); opacity: 1; }
`;

const TargetShape = styled.div`
  position: absolute;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background-color: #007bff;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  opacity: ${props => props.isHit ? 0.5 : 1};
  animation: ${props => props.isHit ? `${targetHitAnimation} 0.2s ease-in-out` : 'none'};
  cursor: pointer; /* Indicate it's interactive */
  user-select: none;
`;

const PinballTarget = React.forwardRef(({ id, size = 40, initialTop, initialLeft, onClick, scoreValue = 200, resetDelay = 3000 }, ref) => {
  const [top, setTop] = useState(initialTop);
  const [left, setLeft] = useState(initialLeft);
  const [isHit, setIsHit] = useState(false);
  const [hitTime, setHitTime] = useState(null);

  const handleCollision = () => {
    if (!isHit) {
      setIsHit(true);
      setHitTime(Date.now());
      if (onClick) {
        onClick(scoreValue); // Pass the score value on click/collision
      }
    }
  };

  useEffect(() => {
    if (isHit && hitTime && resetDelay > 0) {
      const resetTimer = setTimeout(() => {
        setIsHit(false);
        setHitTime(null);
      }, resetDelay);
      return () => clearTimeout(resetTimer); // Cleanup on unmount or dependency change
    }
  }, [isHit, hitTime, resetDelay]);

  const getBoundingClientRect = () => {
    return {
      left: left,
      top: top,
      right: left + size,
      bottom: top + size,
      width: size,
      height: size,
    };
  };

  React.useImperativeHandle(ref, () => ({
    handleCollision: handleCollision,
    getBoundingClientRect: getBoundingClientRect,
    resetTarget: () => {
      setIsHit(false);
      setHitTime(null);
    },
  }));

  return (
    <TargetShape
      ref={ref} // Forward the ref to the styled component
      top={top}
      left={left}
      size={size}
      isHit={isHit}
      onClick={() => handleCollision()} // Optional click handler for testing
    >
      {id} {/* Display the ID for identification */}
    </TargetShape>
  );
});

PinballTarget.propTypes = {
  id: PropTypes.string.isRequired,
  size: PropTypes.number,
  initialTop: PropTypes.number.isRequired,
  initialLeft: PropTypes.number.isRequired,
  onClick: PropTypes.func,
  scoreValue: PropTypes.number,
  resetDelay: PropTypes.number,
};

export default PinballTarget;