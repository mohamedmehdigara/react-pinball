import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const BonusDisplayContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* Center the component */
  font-size: 3em;
  color: yellow;
  text-shadow: 0 0 5px rgba(255, 255, 0, 0.8); /* Text shadow effect */
  animation: vanish 2s ease-in-out forwards; /* Animation for fading out */

  @keyframes vanish {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;

const BonusDisplay = ({ bonus, duration = 2000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timeoutId); // Cleanup function to clear timeout
  }, [bonus, duration]); // Re-run effect when bonus or duration changes

  return (
    <BonusDisplayContainer style={{ visibility: visible ? 'visible' : 'hidden' }}>
      {bonus}x
    </BonusDisplayContainer>
  );
};

export default BonusDisplay;
