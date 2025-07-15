import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle, useCallback } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for the movement along the track
const moveTrack = (start, end, direction) => keyframes`
  0% { transform: ${direction === 'horizontal' ? `translateX(${start}px)` : `translateY(${start}px)`}; }
  100% { transform: ${direction === 'horizontal' ? `translateX(${end}px)` : `translateY(${end}px)`}; }
`;

// Keyframe for the hit animation (flash)
const hitFlash = keyframes`
  0%, 100% { background-color: ${props => props.$baseColor}; }
  50% { background-color: #ffffff; /* Bright flash */ }
`;

// Styled component for the Moving Target container (track)
const MovingTargetTrack = styled.div`
  position: absolute;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  width: ${props => props.$direction === 'horizontal' ? props.$trackLength + props.size : props.size}px;
  height: ${props => props.$direction === 'vertical' ? props.$trackLength + props.size : props.size}px;
  background-color: rgba(0, 0, 0, 0.2); /* Transparent track background */
  border: 1px dashed #555; /* Dashed border for the track */
  border-radius: 5px;
  display: flex;
  justify-content: ${props => props.$direction === 'horizontal' ? 'flex-start' : 'center'};
  align-items: ${props => props.$direction === 'vertical' ? 'flex-start' : 'center'};
  overflow: hidden;
  z-index: 350; /* Below the target itself */
`;

// Styled component for the Moving Target (the actual target element)
const StyledMovingTarget = styled.div`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background-color: ${props => props.$baseColor};
  border: 2px solid ${props => props.$borderColor};
  border-radius: 50%; /* Circular target */
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
  z-index: 400; /* Above the track */
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Press Start 2P', cursive;
  color: white;
  font-size: ${props => props.size / 3.5}px;
  user-select: none;

  ${props => props.$isMoving && css`
    animation: ${moveTrack(0, props.$trackLength, props.$direction)} ${props.$moveDuration}s linear infinite alternate;
  `}

  ${props => props.$isHit && css`
    animation: ${hitFlash} 0.2s ease-in-out;
  `}
`;

/**
 * MovingTarget Component
 *
 * Represents a target that moves along a defined track (horizontal or vertical).
 * It scores points when hit.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the track's top-left corner.
 * @param {number} props.left - The left position of the track's top-left corner.
 * @param {string} props.id - A unique identifier for this MovingTarget instance.
 * @param {number} [props.size=30] - The diameter of the circular target.
 * @param {'horizontal'|'vertical'} [props.direction='horizontal'] - The direction of movement.
 * @param {number} [props.trackLength=100] - The length of the track the target moves along.
 * @param {number} [props.moveDuration=3] - The time in seconds for one full traverse of the track.
 * @param {string} [props.baseColor='#00ff00'] - The default background color of the target.
 * @param {string} [props.borderColor='#00cc00'] - The border color of the target.
 * @param {number} [props.scoreValue=150] - The points awarded when the target is hit.
 * @param {number} [props.hitCooldown=100] - Cooldown in ms after target can be hit again.
 * @param {function} props.onHit - Callback when the target is hit. Receives (id, scoreValue).
 * @param {boolean} [props.initialIsMoving=true] - If the target starts moving immediately.
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const MovingTarget = forwardRef(({
  top,
  left,
  id,
  size = 30,
  direction = 'horizontal',
  trackLength = 100,
  moveDuration = 3,
  baseColor = '#00ff00', // Green
  borderColor = '#00cc00',
  scoreValue = 150,
  hitCooldown = 100,
  onHit,
  initialIsMoving = true,
}, ref) => {
  const [isMoving, setIsMoving] = useState(initialIsMoving);
  const [isHit, setIsHit] = useState(false);
  const hitCooldownActive = useRef(false);
  const hitTimeoutRef = useRef(null);
  const targetElementRef = useRef(null); // Ref to the actual StyledMovingTarget DOM element

  // Calculate the current position of the moving target within its track
  // This is a simplified approach. For precise collision, you'd need to
  // read the actual computed transform value or use a physics engine.
  // For now, we return the track's bounding box and let Pinball.js handle
  // the collision with the overall area.
  const getDynamicBoundingClientRect = useCallback(() => {
    if (targetElementRef.current) {
      return targetElementRef.current.getBoundingClientRect();
    }
    return null;
  }, []);

  useImperativeHandle(ref, () => ({
    getBoundingClientRect: getDynamicBoundingClientRect,
    /**
     * Handles the collision of the ball with the Moving Target.
     * @returns {number} The score awarded, or 0 if on cooldown.
     */
    handleCollision: () => {
      if (hitCooldownActive.current) {
        return 0; // Target is on cooldown, do not activate
      }

      setIsHit(true); // Trigger visual hit animation
      hitCooldownActive.current = true; // Set cooldown

      onHit(id, scoreValue); // Notify parent of hit and score

      // Reset hit animation after a short duration
      clearTimeout(hitTimeoutRef.current);
      hitTimeoutRef.current = setTimeout(() => {
        setIsHit(false);
      }, 200); // Duration of flash animation

      // Apply hit cooldown
      setTimeout(() => {
        hitCooldownActive.current = false;
      }, hitCooldown);

      return scoreValue; // Return score awarded
    },
    // Methods to control movement
    startMoving: () => setIsMoving(true),
    stopMoving: () => setIsMoving(false),
    getIsMoving: () => isMoving,
    // Reset method for game start
    resetTarget: () => {
        setIsMoving(initialIsMoving);
        setIsHit(false);
        hitCooldownActive.current = false;
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
    <MovingTargetTrack
      top={top}
      left={left}
      $direction={direction}
      $trackLength={trackLength}
      size={size}
    >
      <StyledMovingTarget
        ref={targetElementRef} // Assign ref to the actual moving element
        size={size}
        $direction={direction}
        $trackLength={trackLength}
        $moveDuration={moveDuration}
        $baseColor={baseColor}
        $borderColor={borderColor}
        $isMoving={isMoving}
        $isHit={isHit}
        style={{
          // This ensures the target starts at the beginning of the track
          // and the animation handles its movement.
          // The `translate` in the keyframes will be relative to its initial position within the track.
          position: 'relative', // Important for translateX/Y to work relative to parent (track)
        }}
      >
        {id}
      </StyledMovingTarget>
    </MovingTargetTrack>
  );
});

// PropTypes for type checking and documentation
MovingTarget.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  size: PropTypes.number,
  direction: PropTypes.oneOf(['horizontal', 'vertical']),
  trackLength: PropTypes.number,
  moveDuration: PropTypes.number,
  baseColor: PropTypes.string,
  borderColor: PropTypes.string,
  scoreValue: PropTypes.number,
  hitCooldown: PropTypes.number,
  onHit: PropTypes.func.isRequired,
  initialIsMoving: PropTypes.bool,
};

// Set a display name for easier debugging in React DevTools
MovingTarget.displayName = 'MovingTarget';

export default MovingTarget;
