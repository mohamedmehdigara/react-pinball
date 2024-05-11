import React from 'react';
import styled from 'styled-components';

// Styled component for the hole
const HoleContainer = styled.div`
  position: absolute;
  width: ${(props) => props.size || '50px'};
  height: ${(props) => props.size || '50px'};
  background-color: #000;
  border-radius: 50%;
  box-shadow: inset 0 0 10px #000;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
`;

const Hole = ({ size, top, left }) => {
  return <HoleContainer size={size} top={top} left={left} />;
};

export default Hole;
