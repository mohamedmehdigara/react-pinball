import React, { forwardRef, useState, useImperativeHandle } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for a pulsating glow when the light is active
const lightPulse = keyframes`
  0%, 100% { box-shadow: 0 0 8px ${props => props.$litColor}44, 0 0 15px ${props => props.$litColor}33; }
  50% { box-shadow: 0 0 20px ${props => props.$litColor}88, 0 0 30px ${props => props.$litColor}77; }
`;

// Styled component for the FeatureLight
const StyledFeatureLight = styled.div`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background-color: ${props => props.$isLit ? props.$litColor : props.$dimColor};
  border: 1px solid ${props => props.$isLit ? props.$litColor : props.$dimColor};
  border-radius: 50%; /* Circular light */
  opacity: ${props => props.$isLit ? 1 : 0.3}; /* Dim opacity when off */
  transition: background-color 0.1s ease-in-out, opacity 0.1s ease-in-out;
  z-index: 300; /* Below interactive elements, above playfield graphic */
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Press Start 2P', cursive;
  color: white;
  font-size: ${props => props.size / 4.5}px;
  text-align: center;
  line-height: 1.2;
  user-select: none;
  
  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.$isLit && props.canPulse && css`
    animation: ${lightPulse} 1.5s infinite alternate;
  `}
`;

const LightLabel = styled.div`
  color: inherit;
  text-shadow: 0 0 5px ${props => props.$isLit ? props.$litColor : 'none'};
`;

/**
 * FeatureLight Component
 *
 * Represents a general-purpose light on the pinball playfield for indicating
 * specific game features, modes, or status (e.g., "Multiball Ready", "Extra Ball Lit").
 * It can be turned on/off and display a customizable label.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the light's center.
 * @param {number} props.left - The left position of the light's center.
 * @param {string} props.id - A unique identifier for this light instance.
 * @param {string} props.labelText - The text label to display on the light.
 * @param {number} [props.size=25] - The diameter of the light.
 * @param {string} [props.litColor='#00ff00'] - The color of the light when it's on.
 * @param {string} [props.dimColor='#003300'] - The color of the light when it's off (dim).
 * @param {boolean} [props.initialIsLit=false] - If the light starts in a lit state.
 * @param {boolean} [props.canPulse=true] - If the light should pulsate when lit.
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const FeatureLight = forwardRef(({
  top,
  left,
  id,
  labelText,
  size = 25,
  litColor = '#00ff00', // Green
  dimColor = '#003300', // Darker green
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
    <StyledFeatureLight
      ref={ref}
      top={top - size / 2} /* Adjust to center based on top/left props */
      left={left - size / 2} /* Adjust to center based on top/left props */
      size={size}
      $litColor={litColor}
      $dimColor={dimColor}
      $isLit={isLit}
      canPulse={canPulse}
    >
      <LightLabel $isLit={isLit} $litColor={litColor}>{labelText}</LightLabel>
    </StyledFeatureLight>
  );
});

// PropTypes for type checking and documentation
FeatureLight.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  labelText: PropTypes.string.isRequired,
  size: PropTypes.number,
  litColor: PropTypes.string,
  dimColor: PropTypes.string,
  initialIsLit: PropTypes.bool,
  canPulse: PropTypes.bool,
};

// Set a display name for easier debugging in React DevTools
FeatureLight.displayName = 'FeatureLight';

export default FeatureLight;
