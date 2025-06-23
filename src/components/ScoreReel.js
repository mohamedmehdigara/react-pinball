import React, { forwardRef, useState, useImperativeHandle } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

// Styled component for the Score Reel container
const StyledScoreReel = styled.div`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: ${props => props.backgroundColor}; /* Dark background for the reel */
  border: 2px solid #555;
  border-radius: 5px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.8); /* Inner shadow for depth */
  overflow: hidden; /* Ensures digit stays within bounds */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100; /* Low z-index, as part of display */
  font-family: 'Press Start 2P', cursive; /* Retro font */
  
  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;
`;

// Styled component for the digit itself
const DigitDisplay = styled.span`
  color: ${props => props.color}; /* Color of the digit */
  font-size: ${props => props.height * 0.7}px; /* Large digit, scales with height */
  font-weight: bold;
  text-shadow: 0 0 5px ${props => props.color}88; /* Subtle glow for the digit */
  user-select: none; /* Prevent text selection */
`;

/**
 * ScoreReel Component
 *
 * Represents a single digit of a mechanical score reel display.
 * It displays a number (0-9) with a retro aesthetic.
 *
 * @param {object} props - Component props
 * @param {number} props.digit - The current digit (0-9) to display on the reel.
 * @param {number} props.top - The top position of the reel.
 * @param {number} props.left - The left position of the reel.
 * @param {string} props.id - A unique identifier for this reel instance.
 * @param {number} [props.width=40] - The width of the reel.
 * @param {number} [props.height=60] - The height of the reel.
 * @param {string} [props.color='#FF0000'] - The color of the displayed digit.
 * @param {string} [props.backgroundColor='#222222'] - The background color of the reel.
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const ScoreReel = forwardRef(({
  digit,
  top,
  left,
  id,
  width = 40,
  height = 60,
  color = '#FF0000', // Classic red digit
  backgroundColor = '#222222', // Dark background
}, ref) => {
  // Use `useImperativeHandle` if you need to expose methods
  // For a simple display, it might not be strictly necessary,
  // but it's good practice if you anticipate future complex interactions
  // like triggering a specific "roll" animation via a parent call.
  useImperativeHandle(ref, () => ({
    // For now, no specific methods exposed as it's purely display.
    // If we add complex rolling animations, methods like `rollTo(newDigit)` would go here.
  }));

  return (
    <StyledScoreReel
      ref={ref}
      top={top}
      left={left}
      width={width}
      height={height}
      backgroundColor={backgroundColor}
    >
      <DigitDisplay color={color} height={height}>
        {digit}
      </DigitDisplay>
    </StyledScoreReel>
  );
});

// PropTypes for type checking and documentation
ScoreReel.propTypes = {
  digit: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  color: PropTypes.string,
  backgroundColor: PropTypes.string,
};

// Set a display name for easier debugging in React DevTools
ScoreReel.displayName = 'ScoreReel';

export default ScoreReel;
