// src/components/PinballTarget.js
import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import PropTypes from 'prop-types';

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 5px rgba(255, 255, 0, 0.7); }
  50% { box-shadow: 0 0 15px rgba(255, 255, 0, 1); }
  100% { box-shadow: 0 0 5px rgba(255, 255, 0, 0.7); }
`;

const TargetElement = styled.div`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%; /* Make it round */
  background-color: ${props => props.isHit ? '#ff0000' : (props.isLit ? '#ffcc00' : '#888')};
  border: 2px solid ${props => props.isHit ? '#cc0000' : (props.isLit ? '#ffaa00' : '#555')};
  top: ${props => props.currentTop}px;
  left: ${props => props.currentLeft}px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 14px;
  color: ${props => props.isHit ? '#fff' : (props.isLit ? '#333' : '#bbb')};
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  box-shadow: ${props => props.isLit ? css`${pulseGlow} 1s infinite alternate` : 'none'};
  user-select: none;
`;

const PinballTarget = React.forwardRef(({
  id,
  size = 50,
  initialTop,
  initialLeft,
  scoreValue = 100,
  resetDelay = 3000,
  onClick, // For potential click interaction in dev, not directly for ball
  onHit,   // New: Callback when hit by ball (replaces onClick for ball interaction)
  onLight, // New: Callback when target *lights up*
  initialIsLit = false // New: Prop to set initial lit state
}, ref) => {
  const [isHit, setIsHit] = useState(false);
  const [currentTop, setCurrentTop] = useState(initialTop);
  const [currentLeft, setCurrentLeft] = useState(initialLeft);
  const [isLit, setIsLit] = useState(initialIsLit); // New state for lighting

  const targetRef = useRef(null);
  const cooldownRef = useRef(false); // Cooldown to prevent multiple hits per frame

  const handleCollision = () => {
    if (!isHit && !cooldownRef.current) {
      setIsHit(true); // Mark as hit
      cooldownRef.current = true; // Activate cooldown

      if (onHit) {
        onHit(id, scoreValue); // Notify parent of the hit
      }

      // Reset target visually and internally after a delay
      setTimeout(() => {
        setIsHit(false);
        cooldownRef.current = false;
        // The lit state should be managed by the parent for a bank
        // setIsLit(false); // Don't reset lit state here, parent will do it
      }, resetDelay);
      return scoreValue;
    }
    return 0;
  };

  // Exposed method to reset the target's hit state (for bank reset)
  const resetTarget = () => {
    setIsHit(false);
    cooldownRef.current = false;
    // setIsLit(false); // Don't reset lit state here, parent will do it
  };

  // New exposed methods for lighting
  const lightTarget = () => {
    if (!isLit) {
      setIsLit(true);
      if (onLight) {
        onLight(id); // Notify parent when this target lights up
      }
    }
  };

  const dimTarget = () => {
    setIsLit(false);
  };

  const getIsLit = () => isLit; // New: Exposed method to check lit status

  // Expose methods and properties via ref
  React.useImperativeHandle(ref, () => ({
    handleCollision: handleCollision,
    resetTarget: resetTarget,
    getBoundingClientRect: () => {
      if (targetRef.current) {
        return targetRef.current.getBoundingClientRect();
      }
      // Fallback if ref not attached, similar to Gate.js
      return { x: initialLeft, y: initialTop, width: size, height: size,
               top: initialTop, right: initialLeft + size, bottom: initialTop + size, left: initialLeft };
    },
    getIsHit: () => isHit, // Expose hit status
    lightTarget: lightTarget, // Expose light control
    dimTarget: dimTarget,     // Expose dim control
    getIsLit: getIsLit,       // Expose lit status
    id: id // Expose ID for parent to identify
  }));

  return (
    <TargetElement
      ref={targetRef}
      size={size}
      currentTop={currentTop}
      currentLeft={currentLeft}
      isHit={isHit}
      isLit={isLit} // Pass isLit prop
      onClick={() => onClick && onClick(scoreValue)} // Keep for dev convenience
    >
      {id}
    </TargetElement>
  );
});

PinballTarget.propTypes = {
  id: PropTypes.string.isRequired,
  size: PropTypes.number,
  initialTop: PropTypes.number.isRequired,
  initialLeft: PropTypes.number.isRequired,
  scoreValue: PropTypes.number,
  resetDelay: PropTypes.number,
  onClick: PropTypes.func,
  onHit: PropTypes.func,
  onLight: PropTypes.func,
  initialIsLit: PropTypes.bool
};

export default PinballTarget;