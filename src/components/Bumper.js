import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// --- Animation Enhancements ---
const pop = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
    filter: brightness(100%);
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
    filter: brightness(150%);
  }
  100% {
    transform: scale(1);
    opacity: 1;
    filter: brightness(100%);
  }
`;

const glow = keyframes`
  0% {
    box-shadow: 0 0 10px #ffaa00;
  }
  50% {
    box-shadow: 0 0 20px #ffcc00;
  }
  100% {
    box-shadow: 0 0 10px #ffaa00;
  }
`;

// --- Styling Enhancements ---
const BumperCircle = styled.div`
  position: absolute;
  left: ${props => props.x - props.radius}px;
  top: ${props => props.y - props.radius}px;
  width: ${props => props.radius * 2}px;
  height: ${props => props.radius * 2}px;
  border-radius: 50%;
  background-color: ${props => props.color}; /* Dynamic color */
  box-shadow: 0 0 10px ${props => props.glowColor}; /* Dynamic glow color */
  display: flex;
  justify-content: center;
  align-items: center;
  color: #333;
  font-weight: bold;
  font-size: ${props => props.radius * 0.8}px; /* Size based on radius */
  animation: ${props => props.isHit ? pop : 'none'} 0.1s ease-in-out,
             ${glow} 2s infinite alternate; /* Persistent glow */
  cursor: default; /* Indicate it's interactive (though interaction is via collision) */
  user-select: none; /* Prevent text selection on click/drag */
`;

const Bumper = React.forwardRef(({ x, y, radius, onCollision, color = '#ffdd00', glowColor = '#ffaa00', scoreValue = 100 }, ref) => {
  const [isHit, setIsHit] = useState(false);
  const isCoolingDown = useRef(false);
  const [hitCount, setHitCount] = useState(0);
  const [currentScoreValue, setCurrentScoreValue] = useState(scoreValue);
  const bumperRef = useRef(null); // Internal ref to the div

  // --- Visual Feedback Enhancements ---
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (isHit) {
      setPulse(true);
      setTimeout(() => {
        setPulse(false);
      }, 200); // Short pulse duration
    }
  }, [isHit]);

  const pulseAnimation = keyframes`
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  `;

  const PulsingBumperCircle = styled(BumperCircle)`
    animation: ${props => props.pulse ? pulseAnimation : 'none'} 0.2s ease-in-out;
  `;

  // --- Score Tracking and Dynamic Scoring ---
  useEffect(() => {
    // Example: Increase score value after a certain number of hits
    if (hitCount > 5) {
      setCurrentScoreValue(scoreValue * 2); // Double the score
    } else if (hitCount > 10) {
      setCurrentScoreValue(scoreValue * 3); // Triple the score
    }
  }, [hitCount, scoreValue]);

  const handleCollision = () => {
    if (!isCoolingDown.current) {
      setIsHit(true);
      isCoolingDown.current = true;
      setHitCount(prevCount => prevCount + 1);
      if (onCollision) {
        onCollision(currentScoreValue); // Pass the dynamic score value
      }
      // Reset the hit state and cooldown after a short delay
      setTimeout(() => {
        setIsHit(false);
        isCoolingDown.current = false;
      }, 100); // Slightly longer delay for visual effect
    }
  };

  // Make the collision handler and score accessible via ref
  React.useImperativeHandle(ref, () => ({
    handleCollision: handleCollision,
    getBoundingClientRect: () => {
      if (bumperRef.current) { // Use the internal ref
        return bumperRef.current.getBoundingClientRect();
      }
      // If the internal ref is null, return a consistent null or undefined
      return null; // Or undefined
    },
    getScoreValue: () => currentScoreValue, // Expose the current score value
    getHitCount: () => hitCount, // Expose the hit count
    resetHitCount: () => setHitCount(0), // Method to reset the hit count
  }));

  return (
    <PulsingBumperCircle
      ref={bumperRef} // Attach the internal ref to the div
      x={x}
      y={y}
      radius={radius}
      isHit={isHit}
      color={color}
      glowColor={glowColor}
      pulse={pulse}
    >
      {/* Optional: Display score value on the bumper */}
      {/* {currentScoreValue} */}
    </PulsingBumperCircle>
  );
});

Bumper.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  radius: PropTypes.number.isRequired,
  onCollision: PropTypes.func,
  color: PropTypes.string,
  glowColor: PropTypes.string,
  scoreValue: PropTypes.number,
};

export default Bumper;