import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Define a rotation animation
const rotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerBase = styled.div`
  width: 30px;
  height: 30px;
  background-color: #555;
  position: absolute;
  ${(props) => (props.type === 'left' ? 'left: 100px;' : 'right: 100px;')}
  animation: ${rotate} 2s linear infinite; /* Apply the rotation animation */
`;

const Spinner = ({ type }) => {
  useEffect(() => {
    // You can add spinner rotation logic here
    // For example, you might want to adjust the rotation speed based on some condition
    // or trigger a different animation when the component mounts

    // Cleanup logic if needed
    return () => {
      // Cleanup logic if needed
    };
  }, []);

  return <SpinnerBase type={type} />;
};

export default Spinner;
