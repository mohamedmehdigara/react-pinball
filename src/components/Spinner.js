import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Define a rotation animation for the spinner
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Styled components for the Spinner
const SpinnerContainer = styled.div`
  position: absolute;
`;

const SpinnerStyled = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #fff;
  border-top: 4px solid #ff0000; /* Red color for the spinner */
  border-radius: 50%;
  animation: ${rotate} 2s linear infinite; /* Apply the rotation animation */
  position: absolute;
  top: ${(props) => `${props.top}px` || '0'};
  left: ${(props) => `${props.left}px` || '0'};
`;

const Spinner = ({ top, left }) => {
  return (
    <SpinnerContainer>
      <SpinnerStyled top={top} left={left} />
    </SpinnerContainer>
  );
};

export default Spinner;
