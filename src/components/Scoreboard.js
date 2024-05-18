import React from 'react';
import styled from 'styled-components';

const ScoreboardContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.7); /* Semi-transparent black */
  color: white;
  font-family: sans-serif;
  font-weight: bold;
  border: 2px solid white;
  border-radius: 5px;
`;

const ScoreItem = styled.div`
  margin-bottom: 5px;
`;

const Scoreboard = ({ score, lives, bonus = 0, extraBalls = 0 }) => {
  return (
    <ScoreboardContainer>
      <ScoreItem>Score: {score}</ScoreItem>
      <ScoreItem>Lives: {lives}</ScoreItem>
      {bonus > 0 && <ScoreItem>Bonus: {bonus}x</ScoreItem>}
      {extraBalls > 0 && <ScoreItem>Extra Balls: {extraBalls}</ScoreItem>}
    </ScoreboardContainer>
  );
};

export default Scoreboard;
