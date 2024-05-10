import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  position: absolute;
  bottom: 20px; /* Adjust the distance from the bottom */
  right: 20px; /* Adjust the distance from the right side */
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const Label = styled.div`
  font-size: 18px;
  color: white;
  margin-bottom: 5px;
`;

const MeterContainer = styled.div`
  width: 100px;
  height: 20px;
  background-color: #333;
  border-radius: 10px;
  overflow: hidden;
`;

const MeterFill = styled.div`
  width: ${(props) => props.fillPercentage}%;
  height: 100%;
  background-color: #00ff00; /* Green color for filled portion */
  transition: width 0.5s ease; /* Smooth transition for filling animation */
`;

const ComboMeter = ({ label, fillPercentage }) => {
  return (
    <Container>
      <Label>{label}</Label>
      <MeterContainer>
        <MeterFill fillPercentage={fillPercentage} />
      </MeterContainer>
    </Container>
  );
};

export default ComboMeter;
