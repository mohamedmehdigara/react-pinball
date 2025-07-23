import React, { forwardRef, useState, useImperativeHandle } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for a subtle glow when the light is active
const lightGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(255, 255, 0, 0.4); }
  50% { box-shadow: 0 0 15px rgba(255, 255, 0, 0.8); }
`;

// Styled component for the PlungerLaneLight
const StyledPlungerLaneLight = styled.div`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: ${props => props.$isLit ? props.$litColor : props.$dimColor};
  border: 1px solid ${props => props.$isLit ? props.$litColor : props.$dimColor};
  border-radius: 3px; /* Rectangular light */
  opacity: ${props => props.$isLit ? 1 : 0.4}; /* Dim opacity when off */
  transition: background-color 0.1s ease-in-out, opacity 0.1s ease-in-out;
  z-index: 300; /* Below interactive elements, above playfield graphic */
  
  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.$isLit && css`
    animation: ${lightGlow} 1.5s infinite alternate;
  `}
`;

/**
 * PlungerLaneLight Component
 *
 * Represents a light in the plunger lane, typically used to indicate
 * a skill shot opportunity or ball presence.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the light.
 * @param {number} props.left - The left position of the light.
 * @param {string} props.id - A unique identifier for this light instance.
 * @param {number} [props.width=20] - The width of the light.
 * @param {number} [props.height=10] - The height of the light.
 * @param {string} [props.litColor='#ffff00'] - The color of the light when it's on (yellow).
 * @param {string} [props.dimColor='#333300'] - The color of the light when it's off (dark yellow).
 * @param {boolean} [props.initialIsLit=false] - If the light starts in a lit state.
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const PlungerLaneLight = forwardRef(({
  top,
  left,
  id,
  width = 20,
  height = 10,
  litColor = '#ffff00', // Yellow
  dimColor = '#333300', // Darker yellow
  initialIsLit = false,
}, ref) => {
  const [isLit, setIsLit] = useState(initialIsLit);

  useImperativeHandle(ref, () => ({
    // Methods to control the light state
    lightOn: () => setIsLit(true),
    lightOff: () => setIsLit(false),
    toggleLight: () => setIsLit(prev => !prev),
    getIsLit: () => isLit,
    // Reset method for game start
    resetLight: () => setIsLit(initialIsLit),
  }));

  return (
    <StyledPlungerLaneLight
      ref={ref}
      top={top}
      left={left}
      width={width}
      height={height}
      $litColor={litColor}
      $dimColor={dimColor}
      $isLit={isLit}
    />
  );
});

// PropTypes for type checking and documentation
PlungerLaneLight.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  litColor: PropTypes.string,
  dimColor: PropTypes.string,
  initialIsLit: PropTypes.bool,
};

// Set a display name for easier debugging in React DevTools
PlungerLaneLight.displayName = 'PlungerLaneLight';

export default PlungerLaneLight;
