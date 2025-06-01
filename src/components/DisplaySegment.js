import React, { forwardRef, useState, useImperativeHandle } from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';

// Styled component for the DisplaySegment
const StyledDisplaySegment = styled.div`
  position: absolute;
  width: ${props => props.$orientation === 'horizontal' ? props.length : props.thickness}px;
  height: ${props => props.$orientation === 'vertical' ? props.length : props.thickness}px;
  background-color: ${props => props.$isOn ? props.$onColor : props.$offColor};
  border-radius: ${props => props.thickness / 2}px; /* Rounded ends */
  opacity: ${props => props.$isOn ? 1 : 0.15}; /* Dim when off */
  transition: background-color 0.05s linear, opacity 0.05s linear; /* Fast transition */
  z-index: 100; /* Low z-index, as it's part of a display, not on the playfield */
  
  /* Positioning based on props (top-left corner of the segment) */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  /* Optional: subtle glow when on */
  ${props => props.$isOn && css`
    box-shadow: 0 0 5px ${props => props.$onColor};
  `}
`;

/**
 * DisplaySegment Component
 *
 * Represents a single segment of a digital display (e.g., a 7-segment display).
 * It can be turned on or off to form characters or patterns.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the segment's top-left corner.
 * @param {number} props.left - The left position of the segment's top-left corner.
 * @param {string} props.id - A unique identifier for this segment instance.
 * @param {number} [props.length=20] - The length of the segment (long dimension).
 * @param {number} [props.thickness=5] - The thickness of the segment (short dimension).
 * @param {'horizontal'|'vertical'} [props.orientation='horizontal'] - The orientation of the segment.
 * @param {string} [props.onColor='#ff6600'] - The color of the segment when it's on.
 * @param {string} [props.offColor='#331a00'] - The color of the segment when it's off (dim).
 * @param {boolean} [props.initialIsOn=false] - If the segment starts in an 'on' state.
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const DisplaySegment = forwardRef(({
  top,
  left,
  id,
  length = 20,
  thickness = 5,
  orientation = 'horizontal', // 'horizontal' or 'vertical'
  onColor = '#ff6600', // Orange-red
  offColor = '#331a00', // Darker orange-red (ghosting)
  initialIsOn = false,
}, ref) => {
  const [isOn, setIsOn] = useState(initialIsOn);

  useImperativeHandle(ref, () => ({
    // Methods to control the segment state
    turnOn: () => setIsOn(true),
    turnOff: () => setIsOn(false),
    toggle: () => setIsOn(prev => !prev),
    getIsOn: () => isOn,
    // Reset method for game start or display clear
    resetSegment: () => setIsOn(initialIsOn),
  }));

  return (
    <StyledDisplaySegment
      ref={ref}
      top={top}
      left={left}
      length={length}
      thickness={thickness}
      $orientation={orientation}
      $onColor={onColor}
      $offColor={offColor}
      $isOn={isOn}
    />
  );
});

// PropTypes for type checking and documentation
DisplaySegment.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  length: PropTypes.number,
  thickness: PropTypes.number,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  onColor: PropTypes.string,
  offColor: PropTypes.string,
  initialIsOn: PropTypes.bool,
};

// Set a display name for easier debugging in React DevTools
DisplaySegment.displayName = 'DisplaySegment';

export default DisplaySegment;
