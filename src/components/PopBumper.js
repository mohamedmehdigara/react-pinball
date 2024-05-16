import React from 'react';
import styled from 'styled-components';

const PopBumperContainer = styled.div`
  position: absolute;
  /* Set top and left positions */
`;

const PopBumper = () => {
  return (
    <PopBumperContainer>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="50"
        viewBox="0 0 24 24"
      >
        <path d="M12 12c-1.657 0-3-1.343-3-3s1.343-3 3-3c1.656 0 3 1.343 3 3s-1.344 3-3 3zM12 8c-0.553 0-1 0.447-1 1s0.447 1 1 1c0.553 0 1-0.447 1-1s-0.447-1-1-1zM12 14c0.553 0 1-0.447 1-1s-0.447-1-1-1c-0.553 0-1 0.447-1 1s0.447 1 1 1zM3 6h2v1h-2v-1zM3 17h2v1h-2v-1zM3 20h2v1h-2v-1zM3 9h2v1h-2v-1zM3 12h2v1h-2v-1zM3 15h2v1h-2v-1zM19 6h2v1h-2v-1zM19 9h2v1h-2v-1zM19 12h2v1h-2v-1zM19 15h2v1h-2v-1zM19 18h2v1h-2v-1zM19 21h2v1h-2v-1zM3 3h2v1h-2v-1zM19 3h2v1h-2v-1zM10 3h4v1h-4v-1zM6 3h2v1h-2v-1zM15 3h2v1h-2v-1zM11 3h2v1h-2v-1z" />
      </svg>
    </PopBumperContainer>
  );
};

export default PopBumper;
