import React, { useState } from 'react';
import styled from 'styled-components';

const LauncherContainer = styled.div`
  position: absolute;
  bottom: 20px; /* Adjust the distance from the bottom */
  right: 20px; /* Adjust the distance from the right */
`;

const LauncherButton = styled.button`
  width: 60px;
  height: 60px;
  background-color: #f00; /* Red color for the button */
  border: none;
  border-radius: 50%;
  cursor: pointer;
  outline: none;
  transition: transform 0.1s ease; /* Add smooth transition */
  
  &:active {
    transform: scale(0.95); /* Add a slight scale effect when clicked */
  }
`;

const BallLauncher = ({ onLaunch }) => {
  const handleLaunch = () => {
    // Call the onLaunch function to trigger the launch action
    onLaunch();
  };

  return (
    <LauncherContainer>
      <LauncherButton onClick={handleLaunch} />
    </LauncherContainer>
  );
};

export default BallLauncher;
