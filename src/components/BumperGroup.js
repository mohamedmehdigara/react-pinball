import React, { forwardRef, useState, useImperativeHandle, useRef, Children, cloneElement } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for a subtle glow around the group when active
const groupGlow = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(255, 0, 255, 0.4); }
  50% { box-shadow: 0 0 20px rgba(255, 0, 255, 0.8); }
`;

// Styled component for the BumperGroup container
const StyledBumperGroup = styled.div`
  position: absolute;
  /* Width and height should be calculated by parent based on children positions,
     or set explicitly if it's a fixed visual area. For now, let's assume
     it's a flexible container for its children. */
  display: flex; /* Or grid, depending on desired layout */
  flex-wrap: wrap; /* Allow bumpers to wrap if too wide */
  justify-content: center;
  align-items: center;
  padding: 10px; /* Padding inside the group border */
  border: 2px dashed ${props => props.$isActive ? props.$activeBorderColor : props.$inactiveBorderColor};
  border-radius: 15px;
  background-color: ${props => props.$isActive ? props.$activeBgColor : props.$inactiveBgColor};
  transition: background-color 0.3s ease-in-out, border-color 0.3s ease-in-out;
  z-index: 200; /* Below individual bumpers, above playfield */

  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.$isActive && css`
    animation: ${groupGlow} 2s infinite alternate;
  `}
`;

/**
 * BumperGroup Component
 *
 * A container component that visually groups multiple `Bumper` components.
 * It can manage a collective state (e.g., activate all bumpers' lights)
 * and provide a single point of reference for parent components to interact
 * with the group.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the group container.
 * @param {number} props.left - The left position of the group container.
 * @param {string} props.id - A unique identifier for this BumperGroup instance.
 * @param {React.ReactNode} props.children - The Bumper components to be rendered inside the group.
 * @param {string} [props.activeBgColor='rgba(255, 0, 255, 0.1)'] - Background color when active.
 * @param {string} [props.inactiveBgColor='rgba(0, 0, 0, 0.1)'] - Background color when inactive.
 * @param {string} [props.activeBorderColor='#ff00ff'] - Border color when active.
 * @param {string} [props.inactiveBorderColor='#555555'] - Border color when inactive.
 * @param {boolean} [props.initialIsActive=false] - If the group starts in an active state.
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const BumperGroup = forwardRef(({
  top,
  left,
  id,
  children,
  activeBgColor = 'rgba(255, 0, 255, 0.1)', // Light purple/magenta tint
  inactiveBgColor = 'rgba(0, 0, 0, 0.1)',
  activeBorderColor = '#ff00ff', // Bright magenta
  inactiveBorderColor = '#555555',
  initialIsActive = false,
}, ref) => {
  const [isActive, setIsActive] = useState(initialIsActive);
  const childRefs = useRef({}); // To hold refs to individual child bumpers

  // Function to get a ref to a child bumper by its ID
  const getChildRef = (childId) => {
    if (!childRefs.current[childId]) {
      childRefs.current[childId] = React.createRef();
    }
    return childRefs.current[childId];
  };

  useImperativeHandle(ref, () => ({
    /**
     * Activates the entire bumper group (e.g., lights up all contained bumpers).
     */
    activateGroup: () => {
      setIsActive(true);
      // Call a method on each child bumper (e.g., light up)
      Object.values(childRefs.current).forEach(childRef => {
        if (childRef.current && typeof childRef.current.lightOn === 'function') {
          childRef.current.lightOn();
        }
      });
    },
    /**
     * Deactivates the entire bumper group.
     */
    deactivateGroup: () => {
      setIsActive(false);
      // Call a method on each child bumper (e.g., dim)
      Object.values(childRefs.current).forEach(childRef => {
        if (childRef.current && typeof childRef.current.lightOff === 'function') {
          childRef.current.lightOff();
        }
      });
    },
    getIsActive: () => isActive,
    // Method to get a specific child bumper's ref
    getBumperRef: (childId) => childRefs.current[childId],
    // Reset method for game start
    resetGroup: () => {
        setIsActive(initialIsActive);
        // Also reset all child bumpers
        Object.values(childRefs.current).forEach(childRef => {
            if (childRef.current && typeof childRef.current.resetHitCount === 'function') {
                childRef.current.resetHitCount(); // Assuming Bumper has this method
            }
            if (childRef.current && typeof childRef.current.lightOff === 'function') {
                childRef.current.lightOff(); // Ensure lights are off unless initialIsActive is true
            }
        });
    }
  }));

  // Clone children to inject `ref` and potentially other props
  const childrenWithProps = Children.map(children, child => {
    // Ensure the child is a valid React element
    if (React.isValidElement(child)) {
      return cloneElement(child, {
        ref: getChildRef(child.props.id), // Pass ref to child using its ID
        // You can also pass down group-specific props if needed, e.g.,
        // groupActive: isActive,
      });
    }
    return child;
  });

  return (
    <StyledBumperGroup
      ref={ref}
      top={top}
      left={left}
      $isActive={isActive}
      $activeBgColor={activeBgColor}
      $inactiveBgColor={inactiveBgColor}
      $activeBorderColor={activeBorderColor}
      $inactiveBorderColor={inactiveBorderColor}
    >
      {childrenWithProps}
    </StyledBumperGroup>
  );
});

// PropTypes for type checking and documentation
BumperGroup.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired, // Expects Bumper components as children
  activeBgColor: PropTypes.string,
  inactiveBgColor: PropTypes.string,
  activeBorderColor: PropTypes.string,
  inactiveBorderColor: PropTypes.string,
  initialIsActive: PropTypes.bool,
};

// Set a display name for easier debugging in React DevTools
BumperGroup.displayName = 'BumperGroup';

export default BumperGroup;
