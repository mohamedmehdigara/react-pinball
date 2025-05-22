import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

// Styled component for the Restart Button
const StyledButton = styled.button`
  /* Basic styling for the button */
  margin-top: 20px; /* Space from elements above */
  padding: 12px 25px; /* Padding inside the button */
  font-size: 1.1em; /* Slightly larger font size */
  font-weight: bold; /* Bold text */
  cursor: pointer; /* Indicate it's clickable */
  background-color: #4CAF50; /* Green background (common for "start" or "restart") */
  color: white; /* White text color */
  border: 2px solid #388E3C; /* Darker green border */
  border-radius: 8px; /* Rounded corners */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); /* Subtle shadow for depth */
  transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease; /* Smooth transitions */
  user-select: none; /* Prevent text selection */

  /* Hover effect */
  &:hover {
    background-color: #5cb85c; /* Lighter green on hover */
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.4); /* Slightly larger shadow */
    transform: translateY(-2px); /* Slight lift effect */
  }

  /* Active (pressed) effect */
  &:active {
    background-color: #3e8e41; /* Darker green when pressed */
    transform: translateY(0); /* Return to original position */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Smaller shadow */
  }

  /* Focus outline for accessibility */
  &:focus {
    outline: none;
    border-color: #00bcd4; /* Cyan border on focus */
    box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.5); /* Outer glow on focus */
  }
`;

/**
 * RestartButton Component
 *
 * A reusable button component specifically styled for restarting a game or similar actions.
 * It accepts an `onClick` handler and displays its children as text.
 *
 * @param {object} props - Component props
 * @param {function} props.onClick - Function to call when the button is clicked.
 * @param {React.ReactNode} props.children - The content to be displayed inside the button (e.g., "Restart Game").
 */
const RestartButton = ({ onClick, children }) => {
  return (
    <StyledButton onClick={onClick}>
      {children}
    </StyledButton>
  );
};

// PropTypes for type checking and documentation
RestartButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired, // Can be string, number, element, or array
};

export default RestartButton;
