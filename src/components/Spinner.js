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
  background-color: #777; /* Darker color for the spinner */
  position: absolute;
  ${(props) => (props.type === 'left' ? 'left: 50px;' : 'right: 50px;')} /* Adjusted position */
  top: 50px; /* Adjusted position */
  border-radius: 50%;
  animation: ${rotate} 2s linear infinite; /* Apply the rotation animation */
`;

const Spinner = ({ type }) => {
  useEffect(() => {
    let rotationInterval;
    let rotationSpeed = 100; // Default rotation speed in milliseconds
    let rotationDirection = 1; // Default rotation direction (clockwise)
  
    const handleRotation = () => {
      // Implement rotation logic here
      // You can use CSS animations or JavaScript to rotate the spinner
      const spinner = document.getElementById('spinner'); // Assuming you have an element with id 'spinner'
      if (spinner) {
        const currentRotation = spinner.style.transform ? parseInt(spinner.style.transform.replace('rotate(', '').replace('deg)', '')) : 0;
        spinner.style.transform = `rotate(${currentRotation + rotationDirection}deg)`;
      }
    };
  
    // Start the rotation when the component mounts
    rotationInterval = setInterval(handleRotation, rotationSpeed);
  
    // Cleanup logic
    return () => {
      // Clear the rotation interval when the component unmounts
      clearInterval(rotationInterval);
    };
  }, []);
   

  return <SpinnerBase type={type} />;
};

export default Spinner;
