import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for a subtle light pulse when active/lit
const entrancePulse = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(0, 200, 255, 0.4); }
  50% { box-shadow: 0 0 20px rgba(0, 200, 255, 0.8); }
`;

// Styled component for the MiniPlayfieldEntrance
const StyledMiniPlayfieldEntrance = styled.div`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: #333; /* Dark background for the entrance */
  border: 3px solid #00c8ff; /* Bright blue border */
  border-radius: 10px; /* Rounded corners for a softer look */
  box-sizing: border-box;
  overflow: hidden;
  z-index: 700; /* High z-index to ensure ball disappears beneath */
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Press Start 2P', cursive;
  color: #e0f7fa; /* Light blue text */
  font-size: ${props => Math.min(props.width / 5, props.height / 3)}px;
  text-align: center;
  line-height: 1.2;
  user-select: none;
  
  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.$isLit && css`
    animation: ${entrancePulse} 1.5s infinite alternate;
    background-color: #444; /* Slightly lighter when lit */
  `}
`;

const EntranceLabel = styled.div`
  color: inherit; /* Inherit color from parent StyledMiniPlayfieldEntrance */
  text-shadow: 0 0 5px ${props => props.$isLit ? '#e0f7fa' : 'none'};
`;

/**
 * MiniPlayfieldEntrance Component
 *
 * Represents an entry point to a raised or "mini" playfield area.
 * When the ball enters, it is "captured" and conceptually moved to the mini-playfield.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the entrance.
 * @param {number} props.left - The left position of the entrance.
 * @param {string} props.id - A unique identifier for this MiniPlayfieldEntrance instance.
 * @param {number} [props.width=80] - The width of the entrance.
 * @param {number} [props.height=40] - The height of the entrance.
 * @param {boolean} [props.initialIsLit=false] - If the entrance starts in a lit state.
 * @param {number} [props.scoreValue=1000] - The points awarded when the ball enters.
 * @param {number} [props.captureDelay=100] - Short delay for the ball to visually "disappear".
 * @param {function} props.onEnter - Callback when the ball successfully enters. Receives (id, scoreValue).
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const MiniPlayfieldEntrance = forwardRef(({
  top,
  left,
  id,
  width = 80,
  height = 40,
  initialIsLit = false,
  scoreValue = 1000,
  captureDelay = 100,
  onEnter,
}, ref) => {
  const [isLit, setIsLit] = useState(initialIsLit);
  const cooldownActive = useRef(false);
  const captureTimeoutRef = useRef(null);

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
     * Handles the collision of the ball with the MiniPlayfieldEntrance.
     * @returns {number} The score awarded, or 0 if on cooldown.
     */
    handleCollision: () => {
      if (cooldownActive.current) {
        return 0;
      }

      cooldownActive.current = true;
      setIsLit(true); // Visually light up on entry

      // Clear any existing timeout
      clearTimeout(captureTimeoutRef.current);

      captureTimeoutRef.current = setTimeout(() => {
        onEnter(id, scoreValue); // Notify parent that ball entered
        // The parent is responsible for stopping the ball's movement
        // and conceptually moving it to the mini-playfield.

        // After a short visual capture, dim the light again if it's not permanently lit
        if (!initialIsLit) {
            setIsLit(false);
        }
        // Small cooldown to prevent immediate re-triggering
        setTimeout(() => {
            cooldownActive.current = false;
        }, 500);
      }, captureDelay);

      return scoreValue;
    },
    // Methods to control lighting
    lightEntrance: () => setIsLit(true),
    dimEntrance: () => setIsLit(false),
    getIsLit: () => isLit,
    // Reset method for game start
    resetEntrance: () => {
        setIsLit(initialIsLit);
        cooldownActive.current = false;
        clearTimeout(captureTimeoutRef.current);
    }
  }));

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(captureTimeoutRef.current);
    };
  }, []);

  return (
    <StyledMiniPlayfieldEntrance
      ref={ref}
      top={top}
      left={left}
      width={width}
      height={height}
      $isLit={isLit}
    >
      <EntranceLabel $isLit={isLit}>MINI-FIELD</EntranceLabel>
    </StyledMiniPlayfieldEntrance>
  );
});

// PropTypes for type checking and documentation
MiniPlayfieldEntrance.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  initialIsLit: PropTypes.bool,
  scoreValue: PropTypes.number,
  captureDelay: PropTypes.number,
  onEnter: PropTypes.func.isRequired,
};

// Set a display name for easier debugging in React DevTools
MiniPlayfieldEntrance.displayName = 'MiniPlayfieldEntrance';

export default MiniPlayfieldEntrance;
