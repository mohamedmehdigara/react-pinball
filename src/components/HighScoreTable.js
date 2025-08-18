import React from 'react';
import styled from 'styled-components';

// Container for the high score table
const TableContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #0d1a26;
  border: 4px solid #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  z-index: 4000;
  font-family: 'Press Start 2P', cursive;
  color: #fff;
`;

// Title for the table
const TableTitle = styled.h2`
  font-size: 2em;
  margin-bottom: 20px;
  color: #ffde54;
`;

// Ordered list for scores, with no default list styling
const ScoreList = styled.ol`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

// Individual list item for each score
const ScoreItem = styled.li`
  display: flex;
  justify-content: space-between;
  font-size: 1.2em;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  
  &:last-child {
    border-bottom: none;
  }
`;

// Styling for the rank number
const ScoreRank = styled.span`
  font-weight: bold;
  margin-right: 15px;
  color: #fff;
`;

// Styling for the player's name, taking up available space
const ScoreName = styled.span`
  flex-grow: 1;
  text-align: left;
  color: #fff;
`;

// Styling for the score value
const ScoreValue = styled.span`
  color: #ffde54;
`;

/**
 * HighScoreTable Component
 * @param {object} props - The component props.
 * @param {Array<Object>} props.scores - An array of high score objects, e.g., [{ name: 'KJS', score: 150000 }]
 */
const HighScoreTable = ({ scores }) => {
  return (
    <TableContainer>
      <TableTitle>HIGH SCORES</TableTitle>
      <ScoreList>
        {scores.map((score, index) => (
          <ScoreItem key={index}>
            <ScoreRank>{index + 1}.</ScoreRank>
            <ScoreName>{score.name}</ScoreName>
            <ScoreValue>{score.score}</ScoreValue>
          </ScoreItem>
        ))}
      </ScoreList>
    </TableContainer>
  );
};

export default HighScoreTable;
