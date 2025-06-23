import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframes for pop-up/pop-down animation
const popUp = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
`;

const popDown = keyframes`
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
`;

// Styled component for the PopUpPost
const StyledPopUpPost = styled.div`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background-color: #777; /* Grey for a metal post */
  border: 2px solid #555;
  border-radius: 50%; /* Circular post */
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  z-index: 600; /* Above playfield, below ball when up */
  overflow: hidden; /* Hide the part that's "underground" */
  
  /* Initial position: fully hidden below its container */
  transform: translateY(100%);
  transform-origin: bottom center; /* Pop up from the bottom */
  
  /* Positioning based on props for the *container* of the post */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.$isUp && css`
    animation: ${popUp} 0.2s ease-out forwards;
  `}
  ${props => !props.$isUp && props.$hasBeenUp && css` /* Only animate down if it was previously up */
    animation: ${popDown} 0.2s ease-in forwards;
  `}
`;

/**
 * PopUpPost Component
 *
 * Represents a post that can dynamically emerge from or retract into the
 * playfield, acting as a temporary barrier or target.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the post's base (where it emerges from).
 * @param {number} props.left - The left position of the post's base.
 * @param {string} props.id - A unique identifier for this PopUpPost instance.
 * @param {number} [props.size=20] - The diameter of the circular post.
 * @param {number} [props.scoreValue=50] - The points awarded if the post is hit while up.
 * @param {number} [props.hitCooldown=100] - Cooldown in ms after hit.
 * @param {function} props.onPopUp - Callback when the post pops up. Receives (id).
 * @param {function} props.onPopDown - Callback when the post pops down. Receives (id).
 * @param {function} props.onHit - Callback when the post is hit while up. Receives (id, scoreValue).
 * @param {boolean} [props.initialIsUp=false] - If the post starts in the 'up' position.
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const PopUpPost = forwardRef(({
  top,
  left,
  id,
  size = 20,
  scoreValue = 50,
  hitCooldown = 100,
  onPopUp,
  onPopDown,
  onHit,
  initialIsUp = false,
}, ref) => {
  const [isUp, setIsUp] = useState(initialIsUp);
  const [hasBeenUp, setHasBeenUp] = useState(initialIsUp); // To trigger popDown animation only if it was up
  const hitCooldownActive = useRef(false);
  const hitTimeoutRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getBoundingClientRect: () => {
      // Return the current bounding box for collision detection.
      // This is dynamic based on if the post is currently 'up'.
      if (isUp && ref.current) {
        // Return the actual DOM rect if the element is visible
        return ref.current.getBoundingClientRect();
      }
      // If the post is down, return a rect with zero height or
      // a position far away to prevent collisions.
      return { left: left, top: top + size, right: left + size, bottom: top + size, width: size, height: 0, x: left, y: top + size };
    },
    /**
     * Pops the post up.
     */
    popUp: () => {
      if (!isUp) {
        setIsUp(true);
        setHasBeenUp(true); // Mark that it has been up at least once
        onPopUp(id);
      }
    },
    /**
     * Pops the post down.
     */
    popDown: () => {
      if (isUp) {
        setIsUp(false);
        onPopDown(id);
      }
    },
    getIsUp: () => isUp,
    /**
     * Handles the collision of the ball with the PopUpPost.
     * Only registers a hit if the post is currently up.
     * @returns {number} The score awarded, or 0 if not up or on cooldown.
     */
    handleCollision: () => {
      if (!isUp || hitCooldownActive.current) {
        return 0; // Not up or on cooldown
      }

      hitCooldownActive.current = true;
      onHit(id, scoreValue);

      clearTimeout(hitTimeoutRef.current);
      hitTimeoutRef.current = setTimeout(() => {
        hitCooldownActive.current = false;
      }, hitCooldown);

      return scoreValue;
    },
    // Reset method for game start
    resetPost: () => {
        setIsUp(initialIsUp);
        setHasBeenUp(initialIsUp); // Reset this too
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
    <StyledPopUpPost
      ref={ref}
      top={top}
      left={left}
      size={size}
      $isUp={isUp}
      $hasBeenUp={hasBeenUp}
      style={{
          // For positioning, top and left refer to the container for the post
          // The post itself translates within this container.
          // This specific setup requires the parent to render a "hole" or
          // a covering at `top`, `left` coordinates.
          // For simplicity, `top` and `left` are directly passed as component's absolute position.
      }}
    />
  );
});

// PropTypes for type checking and documentation
PopUpPost.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  size: PropTypes.number,
  scoreValue: PropTypes.number,
  hitCooldown: PropTypes.number,
  onPopUp: PropTypes.func.isRequired,
  onPopDown: PropTypes.func.isRequired,
  onHit: PropTypes.func.isRequired,
  initialIsUp: PropTypes.bool,
};

// Set a display name for easier debugging in React DevTools
PopUpPost.displayName = 'PopUpPost';

export default PopUpPost;
