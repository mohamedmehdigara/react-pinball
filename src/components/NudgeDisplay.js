// src/components/NudgeDisplay.js
import React from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';

// Styled component for the main container of the nudge display
const NudgeDisplayContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px; /* Position it in the top-right corner */
  background-color: rgba(0, 0, 0, 0.7); /* Semi-transparent dark background */
  color: #fff; /* White text color */
  padding: 5px 10px; /* Padding around content */
  border-radius: 5px; /* Rounded corners */
  font-size: 14px; /* Font size for text */
  font-weight: bold; /* Bold text */
  z-index: 1000; /* Ensure it's on top of other elements */
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8); /* Subtle text shadow */
  display: flex; /* Use flexbox for layout */
  align-items: center; /* Vertically align items in the center */
  gap: 5px; /* Space between text and warning lights */
`;

// Styled component for individual warning lights
const WarningLight = styled.div`
  width: 15px; /* Size of the circular light */
  height: 15px;
  border-radius: 50%; /* Make it circular */
  background-color: #555; /* Default color when off */
  border: 1px solid #333; /* Border for definition */
  transition: background-color 0.3s ease, box-shadow 0.3s ease; /* Smooth transition for visual changes */

  /* Conditional styling when the light is active */
  ${props => props.active && css`
    /* Color changes based on whether it's the critical (last) warning */
    background-color: ${props.isCritical ? '#ff0000' : '#ffaa00'}; /* Red for critical, orange for others */
    /* Add a glow effect when active */
    box-shadow: 0 0 8px ${props.isCritical ? '#ff0000' : '#ffaa00'};
  `}
`;

/**
 * NudgeDisplay Component
 *
 * Displays the current number of tilt warnings to the player.
 * Shows a series of lights that illuminate as warnings accumulate.
 * The last light turns red when the critical warning level is reached.
 *
 * @param {object} props - Component props
 * @param {number} props.currentWarnings - The current number of tilt warnings (0 to maxWarnings)
 * @param {number} props.maxWarnings - The maximum number of warnings before a tilt occurs
 */
const NudgeDisplay = ({ currentWarnings, maxWarnings }) => {
  // Create an array to map over and render the warning lights
  // The length of the array is equal to maxWarnings
  const warnings = Array.from({ length: maxWarnings }, (_, i) => i + 1);

  return (
    <NudgeDisplayContainer>
      <span>TILT WARNINGS:</span>
      {warnings.map(warningNum => (
        <WarningLight
          key={warningNum} /* Unique key for each light in the list */
          active={warningNum <= currentWarnings} /* Light is active if its number is less than or equal to currentWarnings */
          isCritical={currentWarnings === maxWarnings && warningNum === maxWarnings} /* Last light is critical when max warnings reached */
        />
      ))}
    </NudgeDisplayContainer>
  );
};

// PropTypes for type checking and documentation
NudgeDisplay.propTypes = {
  currentWarnings: PropTypes.number.isRequired,
  maxWarnings: PropTypes.number.isRequired,
};

export default NudgeDisplay;