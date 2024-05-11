import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Styled components for the Multiball
const MultiballContainer = styled.div`
  position: absolute;
`;

const MultiballStyled = styled.div`
  width: ${(props) => props.size || '20px'};
  height: ${(props) => props.size || '20px'};
  background-color: #fff; /* White color for the multiball */
  border-radius: 50%; /* Rounded shape for multiball */
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.5); /* Add box shadow for depth */
`;

const Multiball = ({ size, top, left }) => {
  return (
    <MultiballContainer>
      <MultiballStyled size={size} top={top} left={left} />
    </MultiballContainer>
  );
};

export default Multiball;
