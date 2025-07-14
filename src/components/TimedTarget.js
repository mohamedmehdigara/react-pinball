// src/components/TimedTarget.js
import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect, useCallback } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for a pulsating glow when active
const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(255, 200, 0, 0.6); }
  50% { box-shadow: 0 0 25px rgba(255, 200, 0, 1); }
`;

// Keyframe for a warning flash when time is running out
const warningFlash = keyframes`
  0%, 100% { background-color: #ffcc00; }
  50% { background-color: #ff0000; }
`;

// Styled component for the Timed Target
const StyledTimedTarget = styled.div`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background-color: ${props => props.$isActive ? props.activeColor : props.inactiveColor};
  border: 2px solid ${props => props.$isActive ? props.activeBorderColor : props.inactiveBorderColor};
  border-radius: 50%; /* Circular shape */
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
  z-index: 400; /* Below ball and flippers, above playfield */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-family: 'Press Start 2P', cursive;
  color: white;
  font-size: ${props => props.size / 4}px;
  text-align: center;
  user-select: none;
  overflow: hidden;
  
  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.$isActive && css`
    animation: ${pulseGlow} 1.5s infinite alternate;
  `}

  ${props => props.$isWarning && css`
    animation: ${warningFlash} 0.5s infinite alternate;
  `}
`;

const TimerText = styled.div`
  font-size: ${props => props.$size / 5}px;
  margin-top: 5px;
  color: ${props => props.$isWarning ? '#fff' : '#eee'};
  text-shadow: 0 0 5px ${props => props.$isWarning ? '#fff' : '#eee'};
`;

/**
 * TimedTarget Component
 *
 * Represents a target that becomes active for a limited time,
 * offering points when hit within that window.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the target.
 * @param {number} props.left - The left position of the target.
 * @param {string} props.id - A unique identifier for this TimedTarget instance.
 * @param {number} [props.size=50] - The diameter of the target.
 * @param {string} [props.activeColor='#ffcc00'] - Color when active.
 * @param {string} [props.inactiveColor='#332200'] - Color when inactive.
 * @param {string} [props.activeBorderColor='#cc9900'] - Border color when active.
 * @param {string} [props.inactiveBorderColor='#1a1100'] - Border color when inactive.
 * @param {number} [props.baseScoreValue=200] - Base points awarded when hit.
 * @param {number} [props.timeLimitMs=5000] - How long the target stays active in milliseconds.
 * @param {number} [props.warningTimeMs=2000] - Time remaining to trigger warning flash.
 * @param {number} [props.hitCooldown=100] - Cooldown in ms after hit.
 * @param {function} props.onHit - Callback when the target is hit while active. Receives (id, scoreValue).
 * @param {function} props.onTimerEnd - Callback when the timer runs out. Receives (id).
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const TimedTarget = forwardRef(({
  top,
  left,
  id,
  size = 50,
  activeColor = '#ffcc00', // Gold-yellow
  inactiveColor = '#332200', // Dark brown-gold
  activeBorderColor = '#cc9900',
  inactiveBorderColor = '#1a1100',
  baseScoreValue = 200,
  timeLimitMs = 5000,
  warningTimeMs = 2000,
  hitCooldown = 100,
  onHit,
  onTimerEnd,
}, ref) => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const hitCooldownActive = useRef(false);
  const timerIntervalRef = useRef(null);
  const hitTimeoutRef = useRef(null);

  const isWarning = isActive && timeLeft <= warningTimeMs && timeLeft > 0;

  const startTimer = useCallback(() => {
    setIsActive(true);
    setTimeLeft(timeLimitMs);

    clearInterval(timerIntervalRef.current); // Clear any existing timer
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 100;
        if (newTime <= 0) {
          clearInterval(timerIntervalRef.current);
          setIsActive(false);
          onTimerEnd(id); // Notify parent that timer ended
          return 0;
        }
        return newTime;
      });
    }, 100); // Update every 100ms for smoother countdown
  }, [id, timeLimitMs, onTimerEnd]);

  const stopTimer = useCallback(() => {
    clearInterval(timerIntervalRef.current);
    setIsActive(false);
    setTimeLeft(0);
  }, []);

  useImperativeHandle(ref, () => ({
    getBoundingClientRect: () => {
      return {
        left: left,
        top: top,
        right: left + size,
        bottom: top + size,
        width: size,
        height: size,
        x: left,
        y: top,
      };
    },
    /**
     * Handles the collision of the ball with the Timed Target.
     * @returns {number} The score awarded, or 0 if not active or on cooldown.
     */
    handleCollision: () => {
      if (!isActive || hitCooldownActive.current) {
        return 0; // Not active or on cooldown
      }

      hitCooldownActive.current = true;
      onHit(id, baseScoreValue); // Notify parent of hit and score

      stopTimer(); // Stop the timer immediately on hit

      clearTimeout(hitTimeoutRef.current);
      hitTimeoutRef.current = setTimeout(() => {
        hitCooldownActive.current = false;
      }, hitCooldown);

      return baseScoreValue;
    },
    // Methods for parent to control the target
    activate: startTimer,
    deactivate: stopTimer,
    getIsActive: () => isActive,
    getTimeLeft: () => timeLeft,
    // Reset method for game start
    resetTarget: () => {
        stopTimer(); // Ensure timer is stopped
        setIsActive(false);
        setTimeLeft(0);
        hitCooldownActive.current = false;
        clearTimeout(hitTimeoutRef.current);
    }
  }));

  // Cleanup intervals/timeouts on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerIntervalRef.current);
      clearTimeout(hitTimeoutRef.current);
    };
  }, []);

  return (
    <StyledTimedTarget
      ref={ref}
      top={top}
      left={left}
      size={size}
      activeColor={activeColor}
      inactiveColor={inactiveColor}
      activeBorderColor={activeBorderColor}
      inactiveBorderColor={inactiveBorderColor}
      $isActive={isActive}
      $isWarning={isWarning}
    >
      TIMED
      {isActive && <TimerText $size={size} $isWarning={isWarning}>{(timeLeft / 1000).toFixed(1)}s</TimerText>}
    </StyledTimedTarget>
  );
});

// PropTypes for type checking and documentation
TimedTarget.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  size: PropTypes.number,
  activeColor: PropTypes.string,
  inactiveColor: PropTypes.string,
  activeBorderColor: PropTypes.string,
  inactiveBorderColor: PropTypes.string,
  baseScoreValue: PropTypes.number,
  timeLimitMs: PropTypes.number,
  warningTimeMs: PropTypes.number,
  hitCooldown: PropTypes.number,
  onHit: PropTypes.func.isRequired,
  onTimerEnd: PropTypes.func.isRequired,
};

// Set a display name for easier debugging in React DevTools
TimedTarget.displayName = 'TimedTarget';

export default TimedTarget;
