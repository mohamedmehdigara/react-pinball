import React from 'react';
import styled from 'styled-components';

const LaneGuideContainer = styled.div`
  position: absolute;
  top: 100px;
  left: 100px;
  width: 20px;
  height: 400px;
  background-color: #ffffff;
`;

const LaneGuide = () => {
  return <LaneGuideContainer />;
};

export default LaneGuide;
