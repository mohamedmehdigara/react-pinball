import React from 'react';
import styled from 'styled-components';

// Styled component for the lane change mechanism
const LaneChangeContainer = styled.div`
  position: absolute;
  bottom: 10px; /* Adjust the distance from the bottom */
  left: 50%; /* Position it horizontally in the middle */
  transform: translateX(-50%); /* Center it horizontally */
`;

const LaneChangeButton = styled.button`
  width: 40px;
  height: 40px;
  background-color: #00FF00; /* Green color for the button */
  border: none;
  border-radius: 50%; /* Rounded shape for the button */
  outline: none;
  cursor: pointer;
`;

const LaneChange = ({ onClick }) => {
  return (
    <LaneChangeContainer>
      <LaneChangeButton onClick={onClick}>LC</LaneChangeButton>
    </LaneChangeContainer>
  );
};

export default LaneChange;
