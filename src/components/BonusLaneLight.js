// src/components/BonusLaneLight.js
import React, { forwardRef, useState, useImperativeHandle } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for a pulsating glow when the light is active
const lightPulse = keyframes`
  0% { box-shadow: 0 0 5px ${props => props.$litColor}33, 0 0 10px ${props => props.$litColor}22; }
  50% { box-shadow: 0 0 15px ${props => props.$litColor}66, 0 0 25px ${props => props.$litColor}55; }
  100% { box-shadow: 0 0 5px ${props => props.$litColor}33, 0 0 10px ${props => props.$litColor}22; }
`;

// Styled component for the BonusLaneLight
const StyledBonusLaneLight = styled.div`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background-color: ${props => props.$isLit ? props.$litColor : props.$dimColor};
  border: 1px solid ${props => props.$isLit ? props.$litColor : props.$dimColor};
  border-radius: 50%; /* Circular light */
  opacity: ${props => props.$isLit ? 1 : 0.6}; /* Dim opacity when off */
  transition: background-color 0.1s ease-in-out, opacity 0.1s ease-in-out;
  z-index: 300; /* Below interactive elements, above playfield graphic */
  
  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.$isLit && props.canPulse && css`
    animation: ${lightPulse} 1.5s infinite ease-in-out;
  `}
`;

/**
 * BonusLaneLight Component
 *
 * Represents a simple light on the pinball playfield that can be
 * toggled on/off to indicate game state (e.g., a bonus lane is active).
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the light's center.
 * @param {number} props.left - The left position of the light's center.
 * @param {string} props.id - A unique identifier for this light instance.
 * @param {number} [props.size=15] - The diameter of the light.
 * @param {string} [props.litColor='#ff00ff'] - The color of the light when it's on.
 * @param {string} [props.dimColor='#330033'] - The color of the light when it's off (dim).
 * @param {boolean} [props.initialIsLit=false] - If the light starts in a lit state.
 * @param {boolean} [props.canPulse=true] - If the light should pulsate when lit.
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const BonusLaneLight = forwardRef(({
  top,
  left,
  id,
  size = 15,
  litColor = '#ff00ff', // Magenta
  dimColor = '#330033', // Darker magenta
  initialIsLit = false,
  canPulse = true,
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
    <StyledBonusLaneLight
      ref={ref}
      top={top - size / 2} /* Adjust to center based on top/left props */
      left={left - size / 2} /* Adjust to center based on top/left props */
      size={size}
      $litColor={litColor}
      $dimColor={dimColor}
      $isLit={isLit}
      canPulse={canPulse}
    />
  );
});

// PropTypes for type checking and documentation
BonusLaneLight.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  size: PropTypes.number,
  litColor: PropTypes.string,
  dimColor: PropTypes.string,
  initialIsLit: PropTypes.bool,
  canPulse: PropTypes.bool,
};

// Set a display name for easier debugging in React DevTools
BonusLaneLight.displayName = 'BonusLaneLight';

export default BonusLaneLight;
