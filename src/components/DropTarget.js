import React, { useState } from 'react';
import styled from 'styled-components';

const DropTargetContainer = styled.div`
  position: absolute;
`;

const DropTargetStyled = styled.div`
  width: ${(props) => props.width || '50px'};
  height: ${(props) => props.height || '30px'};
  background-color: ${(props) => (props.active ? '#ff0000' : '#990000')};
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  cursor: pointer;
  transition: background-color 0.5s ease;

  &:hover {
    background-color: #cc0000; /* Change color on hover */
  }
`;

const DropTarget = ({ id, width, height, top, left, onHit }) => {
  const [active, setActive] = useState(true);

  const handleHit = () => {
    setActive(false);
    onHit && onHit(id);
    // You can add more logic here if needed
  };

  return active ? (
    <DropTargetContainer>
      <DropTargetStyled
        width={width}
        height={height}
        top={top}
        left={left}
        active={active}
        onClick={handleHit}
      />
    </DropTargetContainer>
  ) : null;
};

export default DropTarget;
