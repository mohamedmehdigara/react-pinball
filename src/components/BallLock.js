// src/components/BallLock.js
import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for a pulsating glow when a ball is locked or ready
const lockGlow = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 255, 0.4); }
  50% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.8); }
`;

// Styled component for the BallLock container
const StyledBallLock = styled.div`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: #2a2a2a; /* Dark background for the lock area */
  border: 3px solid #00cccc; /* Teal border */
  border-radius: 8px;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-family: 'Press Start 2P', cursive;
  color: #00ffff; /* Cyan text */
  font-size: ${props => Math.min(props.width / 4, props.height / 5)}px;
  text-align: center;
  z-index: 650;
  
  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.$isLit && css`
    animation: ${lockGlow} 1.5s infinite alternate;
  `}
`;

const LockCount = styled.div`
  margin-top: 5px;
  font-size: ${props => Math.min(props.width / 5, props.height / 6)}px;
  color: white;
  text-shadow: 0 0 5px #00ffff;
`;

const LockedBallPlaceholder = styled.div`
  width: ${props => props.$ballRadius * 2}px;
  height: ${props => props.$ballRadius * 2}px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fff, #bbb, #555);
  border: 1px solid #333;
  margin: 2px;
  display: inline-block;
  opacity: ${props => props.$visible ? 1 : 0.2}; /* Dim if not present */
  transition: opacity 0.2s ease-in-out;
`;

/**
 * BallLock Component
 *
 * Represents a mechanism on the pinball playfield that captures and holds
 * balls, often for a multiball feature.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the BallLock container.
 * @param {number} props.left - The left position of the BallLock container.
 * @param {string} props.id - A unique identifier for this BallLock instance.
 * @param {number} [props.width=100] - The width of the BallLock area.
 * @param {number} [props.height=80] - The height of the BallLock area.
 * @param {number} [props.capacity=2] - The maximum number of balls this lock can hold.
 * @param {number} [props.ballRadius=10] - The radius of the main ball, used for visual placeholders.
 * @param {number} [props.scoreValue=1000] - The points awarded per ball locked.
 * @param {number} [props.captureDelay=100] - Delay in ms before ball is considered locked.
 * @param {function} props.onBallLocked - Callback when a ball is successfully locked. Receives (id, lockedCount, scoreAwarded).
 * @param {function} props.onAllBallsLocked - Callback when the lock capacity is reached. Receives (id).
 * @param {function} props.onBallsReleased - Callback when balls are released. Receives (id, releasedCount, releasePositions, releaseVelocities).
 * @param {boolean} [props.initialIsLit=false] - If the lock starts in a lit state (e.g., ready for first lock).
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const BallLock = forwardRef(({
  top,
  left,
  id,
  width = 100,
  height = 80,
  capacity = 2,
  ballRadius = 10,
  scoreValue = 1000,
  captureDelay = 100,
  onBallLocked,
  onAllBallsLocked,
  onBallsReleased,
  initialIsLit = false,
}, ref) => {
  const [lockedBallCount, setLockedBallCount] = useState(0);
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
     * Handles the collision of the ball with the Ball Lock.
     * @returns {number} The score awarded, or 0 if no ball was locked.
     */
    handleCollision: () => {
      if (cooldownActive.current || lockedBallCount >= capacity) {
        return 0; // Lock is on cooldown or full
      }

      cooldownActive.current = true; // Set cooldown
      setIsLit(true); // Temporarily light up

      // Clear any existing timeout
      clearTimeout(captureTimeoutRef.current);

      captureTimeoutRef.current = setTimeout(() => {
        setLockedBallCount(prevCount => {
          const newCount = prevCount + 1;
          const awardedScore = scoreValue; // Score per ball locked

          onBallLocked(id, newCount, awardedScore); // Notify parent

          if (newCount >= capacity) {
            onAllBallsLocked(id); // Notify parent that lock is full
            setIsLit(true); // Keep lit if full, or change color
          } else {
            setIsLit(initialIsLit); // Reset lit state if not full yet
          }
          return newCount;
        });

        // Reset cooldown after a short delay
        setTimeout(() => {
          cooldownActive.current = false;
        }, 500); // Cooldown for subsequent hits
      }, captureDelay);

      return scoreValue; // Award score immediately upon hit
    },
    /**
     * Releases one or all locked balls.
     * @param {number} [countToRelease=0] - Number of balls to release (0 for all).
     */
    releaseBalls: (countToRelease = 0) => {
      if (lockedBallCount === 0) return;

      const numToRelease = countToRelease === 0 ? lockedBallCount : Math.min(countToRelease, lockedBallCount);
      const releasedPositions = [];
      const releasedVelocities = [];

      for (let i = 0; i < numToRelease; i++) {
        // Calculate unique positions and velocities for each released ball
        // Simple example: eject from center with slight randomness
        releasedPositions.push({
          x: left + width / 2 + (Math.random() - 0.5) * (width / 4),
          y: top + height / 2 + (Math.random() - 0.5) * (height / 4) - ballRadius * 2, // Slightly above center
        });
        releasedVelocities.push({
          x: (Math.random() - 0.5) * 5, // Random horizontal
          y: -10 + (Math.random() * 2 - 1), // Upward kick
        });
      }

      setLockedBallCount(prevCount => prevCount - numToRelease);
      onBallsReleased(id, numToRelease, releasedPositions, releasedVelocities);
      setIsLit(initialIsLit); // Reset lighting after release
    },
    getLockedBallCount: () => lockedBallCount,
    getCapacity: () => capacity,
    // Methods to control lighting
    lightLock: () => setIsLit(true),
    dimLock: () => setIsLit(false),
    getIsLit: () => isLit,
    // Reset method for game start
    resetBallLock: () => {
        setLockedBallCount(0);
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

  // Generate placeholders for locked balls
  const ballPlaceholders = Array.from({ length: capacity }).map((_, index) => (
    <LockedBallPlaceholder key={index} $ballRadius={ballRadius} $visible={index < lockedBallCount} />
  ));

  return (
    <StyledBallLock
      ref={ref}
      top={top}
      left={left}
      width={width}
      height={height}
      $isLit={isLit || (lockedBallCount > 0 && lockedBallCount < capacity) || (lockedBallCount === capacity)}
    >
      LOCK ({lockedBallCount}/{capacity})
      <div>{ballPlaceholders}</div>
    </StyledBallLock>
  );
});

// PropTypes for type checking and documentation
BallLock.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  capacity: PropTypes.number,
  ballRadius: PropTypes.number,
  scoreValue: PropTypes.number,
  captureDelay: PropTypes.number,
  onBallLocked: PropTypes.func.isRequired,
  onAllBallsLocked: PropTypes.func.isRequired,
  onBallsReleased: PropTypes.func.isRequired,
  initialIsLit: PropTypes.bool,
};

// Set a display name for easier debugging in React DevTools
BallLock.displayName = 'BallLock';

export default BallLock;
