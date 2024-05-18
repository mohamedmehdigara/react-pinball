import React from 'react';
import styled from 'styled-components';

const ExtraBallContainer = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  color: white;
`;

const ExtraBallIcon = styled.div`
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background-color: red;
  margin-right: 5px;
`;

const ExtraBallIndicator = ({ earnedExtraBalls }) => {
    const balls = [];
    for (let i = 0; i < earnedExtraBalls; i++) {
      balls.push(<ExtraBallIcon key={i} />);
    }
    return <ExtraBallContainer>{balls}</ExtraBallContainer>;
  };
  

export default ExtraBallIndicator;
