import React from 'react';
import styled from 'styled-components';

const OutlaneContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%; /* Adjust height to cover the desired outlane area */
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black */
  z-index: 1; /* Ensure the outlane is behind other elements */
`;

const Outlane = ({ onDrain }) => {
  return (
    <OutlaneContainer onMouseDown={onDrain} />
  );
};

export default Outlane;
