import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframes for the blinking animation
const blinkAnimation = keyframes`
  from { opacity: 1; }
  to { opacity: 0.5; }
`;

// Styled component for the Ball Save display container
const StyledBallSaveDisplay = styled.div`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 255, 0, 0.7); /* Green background */
  color: white;
  padding: 8px 15px;
  border-radius: 8px;
  font-size: 1.5em;
  font-weight: bold;
  z-index: 1000;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
  border: 2px solid #00aa00;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.7);
  /* Apply blinking animation only when 'active' prop is true */
  ${props => props.active && css`
    animation: ${blinkAnimation} 1s infinite alternate;
  `}
`;

/**
 * BallSaveDisplay Component
 *
 * Displays a visual indicator for the "Ball Save" feature, including a countdown timer.
 * It blinks when active to draw player attention.
 *
 * @param {object} props - Component props
 * @param {boolean} props.active - Whether the ball save is currently active.
 * @param {number} props.timer - The remaining time for ball save in milliseconds.
 */
const BallSaveDisplay = ({ active, timer }) => {
  // Only render the component if ball save is active
  if (!active) {
    return null;
  }

  // Calculate seconds remaining, rounding up
  const seconds = Math.ceil(timer / 1000);

  return (
    <StyledBallSaveDisplay active={active}>
      BALL SAVE! {seconds}s
    </StyledBallSaveDisplay>
  );
};

// PropTypes for type checking and documentation
BallSaveDisplay.propTypes = {
  active: PropTypes.bool.isRequired,
  timer: PropTypes.number.isRequired,
};

export default BallSaveDisplay;
