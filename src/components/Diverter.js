import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for a subtle glow when the diverter is active/open
const diverterGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(255, 255, 0, 0.4); }
  50% { box-shadow: 0 0 15px rgba(255, 255, 0, 0.8); }
`;

// Styled component for the Diverter arm
const StyledDiverterArm = styled.div`
  position: absolute;
  width: ${props => props.length}px;
  height: ${props => props.thickness}px;
  background-color: #8B4513; /* SaddleBrown for a wood/metal look */
  border: 2px solid #5A2D0C; /* Darker brown border */
  border-radius: 3px;
  transform-origin: ${props => props.$pivotX}% ${props => props.$pivotY}%; /* Custom pivot point */
  transform: translate(${props => props.left}px, ${props => props.top}px) rotate(${props => props.angle}deg);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
  z-index: 600; /* Above playfield, potentially below ball depending on design */
  transition: transform 0.2s ease-out, background-color 0.2s ease-out; /* Smooth movement and color change */

  ${props => props.$isActive && css`
    background-color: #FFA500; /* Orange when active */
    animation: ${diverterGlow} 1.5s infinite alternate;
  `}
`;

/**
 * Diverter Component
 *
 * Represents a mechanical component on the pinball playfield that can be
 * toggled to change the ball's path, routing it to different areas.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the diverter's pivot point.
 * @param {number} props.left - The left position of the diverter's pivot point.
 * @param {string} props.id - A unique identifier for this Diverter instance.
 * @param {number} [props.length=60] - The length of the diverter arm.
 * @param {number} [props.thickness=8] - The thickness of the diverter arm.
 * @param {number} [props.initialAngle=0] - The initial rotation angle in degrees (when in 'closed' or default state).
 * @param {number} [props.activeAngle=45] - The rotation angle when the diverter is 'open' or active.
 * @param {number} [props.pivotX=0] - The X-coordinate of the rotation pivot (as percentage, e.g., 0 for left edge).
 * @param {number} [props.pivotY=50] - The Y-coordinate of the rotation pivot (as percentage, e.g., 50 for middle height).
 * @param {boolean} [props.initialIsOpen=false] - If the diverter starts in its active/open state.
 * @param {function} props.onToggle - Callback function when the diverter changes state. Receives (id, isOpen).
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const Diverter = forwardRef(({
  top,
  left,
  id,
  length = 60,
  thickness = 8,
  initialAngle = 0,
  activeAngle = 45,
  pivotX = 0, // 0% is left edge
  pivotY = 50, // 50% is middle height
  initialIsOpen = false,
  onToggle,
}, ref) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const currentAngle = isOpen ? activeAngle : initialAngle;

  useImperativeHandle(ref, () => ({
    getBoundingClientRect: () => {
      const diverterElement = ref.current;
      if (diverterElement) {
        // Return the actual bounding client rect, as its position changes with rotation
        return diverterElement.getBoundingClientRect();
      }
      return null;
    },
    /**
     * Toggles the diverter's state between open and closed.
     */
    toggleDiverter: () => {
      setIsOpen(prev => {
        const newState = !prev;
        onToggle(id, newState); // Notify parent of the state change
        return newState;
      });
    },
    /**
     * Opens the diverter.
     */
    openDiverter: () => {
      if (!isOpen) {
        setIsOpen(true);
        onToggle(id, true);
      }
    },
    /**
     * Closes the diverter.
     */
    closeDiverter: () => {
      if (isOpen) {
        setIsOpen(false);
        onToggle(id, false);
      }
    },
    getIsOpen: () => isOpen,
    // Reset method for game start
    resetDiverter: () => {
        setIsOpen(initialIsOpen);
        onToggle(id, initialIsOpen); // Ensure parent is aware of initial state
    }
  }));

  // Ensure onToggle is called with initial state on mount if it's not the default
  useEffect(() => {
    if (initialIsOpen) {
      onToggle(id, initialIsOpen);
    }
  }, [id, initialIsOpen, onToggle]);


  return (
    <StyledDiverterArm
      ref={ref}
      top={top}
      left={left}
      length={length}
      thickness={thickness}
      angle={currentAngle}
      $pivotX={pivotX}
      $pivotY={pivotY}
      $isActive={isOpen}
      // Position needs to be relative to the pivot point for transform-origin to work correctly
      // We pass top/left as the pivot coordinates directly to the styled component
      // and it applies the transform.
      style={{
          top: top,
          left: left,
      }}
    />
  );
});

// PropTypes for type checking and documentation
Diverter.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  length: PropTypes.number,
  thickness: PropTypes.number,
  initialAngle: PropTypes.number,
  activeAngle: PropTypes.number,
  pivotX: PropTypes.number,
  pivotY: PropTypes.number,
  initialIsOpen: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
};

// Set a display name for easier debugging in React DevTools
Diverter.displayName = 'Diverter';

export default Diverter;
