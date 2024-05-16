import React from 'react';
import styled from 'styled-components';

const MultiballLockContainer = styled.div`
  position: absolute;
  /* Set top and left positions */
`;

const MultiballLock = () => {
  return (
    <MultiballLockContainer>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="50"
        viewBox="0 0 24 24"
      >
        <path d="M12 15c-0.553 0-1 0.447-1 1s0.447 1 1 1 1-0.447 1-1-0.447-1-1-1zM12 11c-0.553 0-1 0.447-1 1s0.447 1 1 1 1-0.447 1-1-0.447-1-1-1zM12 7c-0.553 0-1 0.447-1 1s0.447 1 1 1 1-0.447 1-1-0.447-1-1-1zM12 3c-5.514 0-10 4.486-10 10s4.486 10 10 10 10-4.486 10-10-4.486-10-10-10zM12 21c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zM13 13h-2v-4h2v4z" />
      </svg>
    </MultiballLockContainer>
  );
};

export default MultiballLock;
