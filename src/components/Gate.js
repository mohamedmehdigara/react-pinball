import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import PropTypes from 'prop-types';

const openAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(90deg); } /* Opens by rotating 90 degrees */
`;

const closeAnimation = keyframes`
  0% { transform: rotate(90deg); }
  100% { transform: rotate(0deg); } /* Closes back to original position */
`;

const GateElement = styled.div`
  position: absolute;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: #8B4513; /* Wood-like brown */
  border: 2px solid #5A2D0C;
  border-radius: 2px;
  transform-origin: ${props => props.pivotX}px ${props => props.pivotY}px; /* Dynamic pivot point */
  transform: rotate(${props => props.isOpen ? '90deg' : '0deg'}); /* Initial state based on prop */
  animation: ${props => props.isAnimatingOpen ? css`${openAnimation} 0.2s forwards` :
               props.isAnimatingClose ? css`${closeAnimation} 0.2s forwards` : 'none'};
  box-shadow: inset 0 0 5px rgba(0,0,0,0.3);
  z-index: 10; /* Ensure it's above the playfield */
`;

const Gate = React.forwardRef(({
  top,
  left,
  width = 5,
  height = 40,
  pivotX = 0,
  pivotY = 0,
  initialIsOpen = false,
  passageDirection = 'right'
}, ref) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isAnimatingOpen, setIsAnimatingOpen] = useState(false);
  const [isAnimatingClose, setIsAnimatingClose] = useState(false);

  const gateRef = useRef(null); // Internal ref for the DOM element

  // Function to open the gate
  const openGate = () => {
    if (!isOpen) {
      setIsAnimatingClose(false); // Stop closing animation if any
      setIsAnimatingOpen(true);
      setTimeout(() => {
        setIsOpen(true);
        setIsAnimatingOpen(false);
      }, 200); // Match animation duration
    }
  };

  // Function to close the gate
  const closeGate = () => {
    if (isOpen) {
      setIsAnimatingOpen(false); // Stop opening animation if any
      setIsAnimatingClose(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimatingClose(false);
      }, 200); // Match animation duration
    }
  };

  // Exposed methods via useImperativeHandle
  React.useImperativeHandle(ref, () => ({
    open: openGate,
    close: closeGate,
    getIsOpen: () => isOpen,
    getBoundingClientRect: () => {
      if (gateRef.current) {
        return gateRef.current.getBoundingClientRect();
      }
      // --- FIX: Return a default, non-colliding DOMRect when the ref is not attached ---
      // This ensures that getBoundingClientRect always returns a valid object,
      // preventing potential infinite loops if consumers expect a DOMRect.
      // Make sure its dimensions are small or outside the active playfield
      // if it's not meant to collide when not mounted.
      return {
        x: 0, y: 0, width: 0, height: 0,
        top: 0, right: 0, bottom: 0, left: 0 // Explicitly define all properties of a DOMRect
     };
    },
    // ... (other exposed methods) ...
  }));


  return (
    <GateElement
      ref={gateRef}
      top={top}
      left={left}
      width={width}
      height={height}
      pivotX={pivotX}
      pivotY={pivotY}
      isOpen={isOpen}
      isAnimatingOpen={isAnimatingOpen}
      isAnimatingClose={isAnimatingClose}
    />
  );
});

Gate.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  pivotX: PropTypes.number,
  pivotY: PropTypes.number,
  initialIsOpen: PropTypes.bool,
  passageDirection: PropTypes.oneOf(['up', 'down', 'left', 'right']).isRequired,
};

export default Gate;