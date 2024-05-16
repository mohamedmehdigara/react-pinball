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
`;

const BallLauncher = ({ onClick }) => {
  return <LauncherButton onClick={onClick}>Launch Ball</LauncherButton>;
};

export default BallLauncher;

