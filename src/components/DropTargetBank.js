import React, { forwardRef, useState, useImperativeHandle, useRef, Children, cloneElement, useEffect, useCallback } from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';

// Keyframe for a subtle glow around the bank when active/lit
const bankGlow = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(255, 100, 0, 0.4); }
  50% { box-shadow: 0 0 20px rgba(255, 100, 0, 0.8); }
`;

// Styled component for the DropTargetBank container
const StyledDropTargetBank = styled.div`
  position: absolute;
  display: flex; /* Arrange children (drop targets) in a row */
  gap: ${props => props.gap}px; /* Space between targets */
  padding: 10px; /* Padding inside the bank border */
  border: 2px solid ${props => props.$isActive ? props.$activeBorderColor : props.$inactiveBorderColor};
  border-radius: 10px;
  background-color: ${props => props.$isActive ? props.$activeBgColor : props.$inactiveBgColor};
  transition: background-color 0.3s ease-in-out, border-color 0.3s ease-in-out;
  z-index: 200; /* Below individual drop targets, above playfield */

  /* Positioning based on props */
  top: ${props => props.top}px;
  left: ${props => props.left}px;

  ${props => props.$isActive && css`
    animation: ${bankGlow} 2s infinite alternate;
  `}
`;

/**
 * DropTargetBank Component
 *
 * A container component for a group of `DropTarget` components. It manages
 * their collective state (e.g., all dropped, all reset) and can trigger
 * a bonus when the entire bank is cleared.
 *
 * @param {object} props - Component props
 * @param {number} props.top - The top position of the bank container.
 * @param {number} props.left - The left position of the bank container.
 * @param {string} props.id - A unique identifier for this DropTargetBank instance.
 * @param {React.ReactNode} props.children - The `DropTarget` components to be rendered inside the bank.
 * @param {number} [props.gap=5] - The spacing between individual drop targets.
 * @param {string} [props.activeBgColor='rgba(255, 140, 0, 0.1)'] - Background color when active.
 * @param {string} [props.inactiveBgColor='rgba(0, 0, 0, 0.1)'] - Background color when inactive.
 * @param {string} [props.activeBorderColor='#ff8c00'] - Border color when active.
 * @param {string} [props.inactiveBorderColor='#555555'] - Border color when inactive.
 * @param {number} [props.bankClearBonus=5000] - Bonus points awarded when all targets in the bank are dropped.
 * @param {number} [props.resetDelay=500] - Delay in ms before the bank resets after being cleared.
 * @param {function} props.onBankCleared - Callback when all targets in the bank are dropped. Receives (id, bankClearBonus).
 * @param {boolean} [props.initialIsActive=false] - If the bank starts in an active/lit state.
 * @param {React.Ref} ref - Ref for accessing imperative handles.
 */
const DropTargetBank = forwardRef(({
  top,
  left,
  id,
  children,
  gap = 5,
  activeBgColor = 'rgba(255, 140, 0, 0.1)', // Orange tint
  inactiveBgColor = 'rgba(0, 0, 0, 0.1)',
  activeBorderColor = '#ff8c00', // Darker orange
  inactiveBorderColor = '#555555',
  bankClearBonus = 5000,
  resetDelay = 500,
  onBankCleared,
  initialIsActive = false,
}, ref) => {
  const [isActive, setIsActive] = useState(initialIsActive);
  const childRefs = useRef({}); // To hold refs to individual child DropTargets
  const [droppedStates, setDroppedStates] = useState({}); // Track state of individual children
  const resetTimeoutRef = useRef(null);

  // Function to get a ref to a child DropTarget by its ID
  const getChildRef = (childId) => {
    if (!childRefs.current[childId]) {
      childRefs.current[childId] = React.createRef();
    }
    return childRefs.current[childId];
  };

  // Callback for when an individual DropTarget is hit
  const handleChildDropTargetHit = useCallback((childId, score) => {
    // Update the local state for the hit target
    setDroppedStates(prev => {
      const newStates = { ...prev, [childId]: true };
      return newStates;
    });
    // The parent (Pinball.js) will handle the individual score for the DropTarget
  }, []);

  // Effect to check if all targets are dropped
  useEffect(() => {
    const allTargets = Children.toArray(children).map(child => child.props.id);
    const allDropped = allTargets.every(childId => droppedStates[childId]);

    if (allTargets.length > 0 && allDropped && Object.keys(droppedStates).length === allTargets.length) {
      // All targets are dropped, trigger bank clear bonus
      onBankCleared(id, bankClearBonus);
      setIsActive(true); // Visually activate the bank when cleared

      // Schedule reset after a delay
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = setTimeout(() => {
        // Reset all child targets
        Object.values(childRefs.current).forEach(childRef => {
          if (childRef.current && typeof childRef.current.resetTarget === 'function') {
            childRef.current.resetTarget();
          }
        });
        setDroppedStates({}); // Reset local dropped states
        setIsActive(initialIsActive); // Reset active state
      }, resetDelay);
    }
  }, [droppedStates, children, id, bankClearBonus, resetDelay, onBankCleared, initialIsActive]);

  useImperativeHandle(ref, () => ({
    /**
     * Resets all drop targets in the bank to their upright position.
     */
    resetBank: () => {
      Object.values(childRefs.current).forEach(childRef => {
        if (childRef.current && typeof childRef.current.resetTarget === 'function') {
          childRef.current.resetTarget();
        }
      });
      setDroppedStates({});
      setIsActive(initialIsActive);
      clearTimeout(resetTimeoutRef.current);
    },
    getIsActive: () => isActive,
    // Method to get a specific child DropTarget's ref
    getDropTargetRef: (childId) => childRefs.current[childId],
  }));

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  // Clone children to inject `ref` and `onHit` callback
  const childrenWithProps = Children.map(children, child => {
    if (React.isValidElement(child) && child.type.displayName === 'DropTarget') {
      return cloneElement(child, {
        ref: getChildRef(child.props.id),
        // Override or augment the child's onHit to also update bank's state
        onHit: (childId, score) => {
          handleChildDropTargetHit(childId, score);
          // Also call the original onHit if it exists
          if (child.props.onHit) {
            child.props.onHit(childId, score);
          }
        },
      });
    }
    return child;
  });

  return (
    <StyledDropTargetBank
      ref={ref}
      top={top}
      left={left}
      gap={gap}
      $isActive={isActive}
      $activeBgColor={activeBgColor}
      $inactiveBgColor={inactiveBgColor}
      $activeBorderColor={activeBorderColor}
      $inactiveBorderColor={inactiveBorderColor}
    >
      {childrenWithProps}
    </StyledDropTargetBank>
  );
});

// PropTypes for type checking and documentation
DropTargetBank.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired, // Expects DropTarget components as children
  gap: PropTypes.number,
  activeBgColor: PropTypes.string,
  inactiveBgColor: PropTypes.string,
  activeBorderColor: PropTypes.string,
  inactiveBorderColor: PropTypes.string,
  bankClearBonus: PropTypes.number,
  resetDelay: PropTypes.number,
  onBankCleared: PropTypes.func.isRequired,
  initialIsActive: PropTypes.bool,
};

// Set a display name for easier debugging in React DevTools
DropTargetBank.displayName = 'DropTargetBank';

export default DropTargetBank;
