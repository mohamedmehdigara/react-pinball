import React from 'react';
import styled from 'styled-components';

const LauncherButton = styled.button`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  width: 50px; // Set a width for the button
  height: 100px;
`;

const BallLauncher = ({ onClick }) => {
  return <LauncherButton onClick={onClick}>Launch Ball</LauncherButton>;
};

export default BallLauncher;

