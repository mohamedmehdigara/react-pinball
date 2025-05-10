import React from 'react';
import styled from 'styled-components';

const StartButton = styled.button`
  padding: 15px 30px;
  font-size: 1.2em;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5);
  }
`;

const GameStartButton = ({ onStartGame }) => {
  return (
    <StartButton onClick={onStartGame}>
      Start Game
    </StartButton>
  );
};

export default GameStartButton;