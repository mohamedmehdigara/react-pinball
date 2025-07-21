import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect, useCallback } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for the gate opening/closing animation
const spinOpen = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(90deg); } /* Opens to 90 degrees */
`;

const spinClose = keyframes`
  from { transform: rotate(90deg); }
  to { transform: rotate(0deg); }
`;

// Keyframe for a subtle glow when the gate is active/lit
const gateGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(0, 255, 0, 0.4); }
  50% { box-shadow: 0 0 15px rgba(0, 255, 0, 0.8); }
`;

// Styled component for the SpinnerGate arm
const StyledSpinnerGate = styled.div`
  position: absolute;
  width: ${props => props.length}px;
  height: ${props => props.thickness}px;
  background-color: #555; /* Dark grey for a metal gate */
  border: 2px solid #333;
  border-radius: 3px;
  transform-origin: ${props => props.$pivotX}% ${props => props.$pivotY}%; /* Custom pivot point */
  transform: translate(${props => props.left}px, ${props => props.top}px) rotate(${props => props.$currentAngle}deg);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
  z-index: 600; /* Above playfield, below ball */
  transition: transform 0.3s ease-out; /* Smooth rotation transition */

  ${props => props.$isLit && css`
    background-color: #00cc00; /* Green when lit */
    animation: ${gateGlow} 1.5s infinite alternate;
  `}

  ${props => props.$isOpening && css`
    animation: ${spinOpen} 0.3s ease-out forwards;
  `}
  ${props => props.$isClosing && css`
    animation: ${spinClose} 0.3s ease-out forwards;
  `}
`;

/**
 * SpinnerGate Component
 *
 * Represents a gate that can spin open or closed when activated,
 * potentially awarding points or opening new paths.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the gate's pivot point.
 * @param {number} props.left - The left position of the gate's pivot point.
 * @param {string} props.id - A unique identifier for this SpinnerGate instance.
 * @param {number} [props.length=50] - The length of the gate arm.
 * @param {number} [props.thickness=5] - The thickness of the gate arm.
 * @param {number} [props.closedAngle=0] - The rotation angle when the gate is 'closed'.
 * @param {number} [props.openAngle=90] - The rotation angle when the gate is 'open'.
 * @param {number} [props.pivotX=0] - The X-coordinate of the rotation pivot (as percentage, e.g., 0 for left edge).
 * @param {number} [props.pivotY=50] - The Y-coordinate of the rotation pivot (as percentage, e.g., 50 for middle height).
 * @param {boolean} [props.initialIsOpen=false] - If the gate starts in its open state.
 * @param {number} [props.scoreValue=100] - The points awarded when the gate is hit/toggled.
 * @param {number} [props.hitCooldown=300] - Cooldown in ms after hit.
 * @param {function} props.onToggle - Callback function when the gate changes state. Receives (id, isOpen, scoreAwarded).
 * @param {boolean} [props.initialIsLit=false] - If the gate starts in a lit state.
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const SpinnerGate = forwardRef(({
  top,
  left,
  id,
  length = 50,
  thickness = 5,
  closedAngle = 0,
  openAngle = 90,
  pivotX = 0, // 0% is left edge
  pivotY = 50, // 50% is middle height
  initialIsOpen = false,
  scoreValue = 100,
  hitCooldown = 300,
  onToggle,
  initialIsLit = false,
}, ref) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isLit, setIsLit] = useState(initialIsLit);
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const hitCooldownActive = useRef(false);
  const animationTimeoutRef = useRef(null);

  const currentAngle = isOpen ? openAngle : closedAngle;

  const toggleGate = useCallback((awardScore = true) => {
    if (hitCooldownActive.current) return; // Prevent rapid toggling

    hitCooldownActive.current = true;
    const newState = !isOpen;
    setIsOpen(newState);

    if (newState) {
      setIsOpening(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      setIsOpening(false);
    }

    // Reset animation state after it completes
    clearTimeout(animationTimeoutRef.current);
    animationTimeoutRef.current = setTimeout(() => {
      setIsOpening(false);
      setIsClosing(false);
    }, 300); // Match animation duration

    if (awardScore) {
      onToggle(id, newState, scoreValue);
    } else {
      onToggle(id, newState, 0); // No score if not awarded
    }

    // Apply cooldown
    setTimeout(() => {
      hitCooldownActive.current = false;
    }, hitCooldown);
  }, [id, isOpen, onToggle, scoreValue, hitCooldown]);

  useImperativeHandle(ref, () => ({
    getBoundingClientRect: () => {
      const gateElement = ref.current;
      if (gateElement) {
        return gateElement.getBoundingClientRect();
      }
      return null;
    },
    /**
     * Handles the collision of the ball with the Spinner Gate.
     * This will toggle the gate's state.
     * @returns {number} The score awarded, or 0 if on cooldown.
     */
    handleCollision: () => {
      if (hitCooldownActive.current) {
        return 0;
      }
      toggleGate(true); // Toggle and award score
      return scoreValue;
    },
    openGate: () => {
      if (!isOpen) toggleGate(false); // Don't award score if opened by external logic
    },
    closeGate: () => {
      if (isOpen) toggleGate(false); // Don't award score if closed by external logic
    },
    getIsOpen: () => isOpen,
    // Methods to control lighting
    lightGate: () => setIsLit(true),
    dimGate: () => setIsLit(false),
    getIsLit: () => isLit,
    // Reset method for game start
    resetGate: () => {
        setIsOpen(initialIsOpen);
        setIsLit(initialIsLit);
        setIsOpening(false);
        setIsClosing(false);
        hitCooldownActive.current = false;
        clearTimeout(animationTimeoutRef.current);
        onToggle(id, initialIsOpen, 0); // Notify parent of reset state
    }
  }));

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  return (
    <StyledSpinnerGate
      ref={ref}
      top={top}
      left={left}
      length={length}
      thickness={thickness}
      $pivotX={pivotX}
      $pivotY={pivotY}
      $currentAngle={currentAngle}
      $isLit={isLit}
      $isOpening={isOpening}
      $isClosing={isClosing}
      style={{
          top: top,
          left: left,
      }}
    />
  );
});

// PropTypes for type checking and documentation
SpinnerGate.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  length: PropTypes.number,
  thickness: PropTypes.number,
  closedAngle: PropTypes.number,
  openAngle: PropTypes.number,
  pivotX: PropTypes.number,
  pivotY: PropTypes.number,
  initialIsOpen: PropTypes.bool,
  scoreValue: PropTypes.number,
  hitCooldown: PropTypes.number,
  onToggle: PropTypes.func.isRequired,
  initialIsLit: PropTypes.bool,
};

// Set a display name for easier debugging in React DevTools
SpinnerGate.displayName = 'SpinnerGate';

export default SpinnerGate;
