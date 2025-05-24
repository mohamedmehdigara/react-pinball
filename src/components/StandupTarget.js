import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for the hit animation (flash)
const targetFlash = keyframes`
  0%, 100% { background-color: ${props => props.baseColor}; }
  50% { background-color: #ffffff; /* Bright flash */ }
`;

// Styled component for the Standup Target
const StyledStandupTarget = styled.div`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: ${props => props.baseColor};
  border: 2px solid ${props => props.borderColor};
  border-radius: 5px; /* Slightly rounded corners */
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
  z-index: 400; /* Below ball and flippers, above playfield */
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Press Start 2P', cursive;
  color: white;
  font-size: ${props => Math.min(props.width, props.height) / 4}px; /* Dynamic font size */
  text-align: center;
  user-select: none; /* Prevent text selection */
  
  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.isHit && css`
    animation: ${targetFlash} 0.2s ease-in-out;
  `}
`;

/**
 * StandupTarget Component
 *
 * Represents a fixed rectangular target on the pinball playfield that awards
 * points when hit by the ball.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the target.
 * @param {number} props.left - The left position of the target.
 * @param {string} props.id - A unique identifier for this StandupTarget instance.
 * @param {number} [props.width=30] - The width of the target.
 * @param {number} [props.height=50] - The height of the target.
 * @param {string} [props.baseColor='#ff00ff'] - The default background color of the target.
 * @param {string} [props.borderColor='#cc00cc'] - The border color of the target.
 * @param {number} [props.scoreValue=100] - The points awarded when the target is hit.
 * @param {number} [props.hitCooldown=200] - Cooldown in ms before target can be hit again.
 * @param {function} props.onHit - Callback function when the target is hit. Receives (id, scoreValue).
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const StandupTarget = forwardRef(({
  top,
  left,
  id,
  width = 30,
  height = 50,
  baseColor = '#ff00ff', // Magenta
  borderColor = '#cc00cc',
  scoreValue = 100,
  hitCooldown = 200,
  onHit,
}, ref) => {
  const [isHit, setIsHit] = useState(false);
  const cooldownActive = useRef(false);
  const hitTimeoutRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getBoundingClientRect: () => {
      // Return the current bounding box for collision detection.
      return {
        left: left,
        top: top,
        right: left + width,
        bottom: top + height,
        width: width,
        height: height,
        x: left,
        y: top,
      };
    },
    /**
     * Handles the collision of the ball with the Standup Target.
     * @returns {number} The score awarded, or 0 if on cooldown.
     */
    handleCollision: () => {
      if (cooldownActive.current) {
        return 0; // Target is on cooldown, do not activate
      }

      setIsHit(true); // Trigger visual hit animation
      cooldownActive.current = true; // Set cooldown

      onHit(id, scoreValue); // Notify parent of hit and score

      // Reset hit animation after a short duration
      clearTimeout(hitTimeoutRef.current);
      hitTimeoutRef.current = setTimeout(() => {
        setIsHit(false);
      }, 200); // Duration of flash animation

      // Apply hit cooldown
      setTimeout(() => {
        cooldownActive.current = false;
      }, hitCooldown);

      return scoreValue; // Return score awarded
    },
    // Optional: A method to reset the target's state if needed by the parent
    resetTarget: () => {
        setIsHit(false);
        cooldownActive.current = false;
        clearTimeout(hitTimeoutRef.current);
    }
  }));

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(hitTimeoutRef.current);
    };
  }, []);

  return (
    <StyledStandupTarget
      ref={ref}
      top={top}
      left={left}
      width={width}
      height={height}
      baseColor={baseColor}
      borderColor={borderColor}
      isHit={isHit}
    >
      {id}
    </StyledStandupTarget>
  );
});

// PropTypes for type checking and documentation
StandupTarget.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  baseColor: PropTypes.string,
  borderColor: PropTypes.string,
  scoreValue: PropTypes.number,
  hitCooldown: PropTypes.number,
  onHit: PropTypes.func.isRequired,
};

// Set a display name for easier debugging in React DevTools
StandupTarget.displayName = 'StandupTarget';

export default StandupTarget;
