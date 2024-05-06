import React, { useState } from 'react';
import styled from 'styled-components';

const ComboMeterContainer = styled.div`
  width: 200px;
  height: 20px;
  border: 1px solid #ccc;
`;

const ComboMeterFill = styled.div`
  height: 100%;
  background-color: #00cc00; /* Green color */
  transition: width 0.3s ease;
`;

const ComboMeter = () => {
  const [comboProgress, setComboProgress] = useState(0);

  // Function to simulate combo progress
  const incrementComboProgress = () => {
    setComboProgress((prevProgress) => Math.min(prevProgress + 10, 100)); // Increment combo progress by 10%
  };

  // Reset combo progress
  const resetComboProgress = () => {
    setComboProgress(0);
  };

  return (
    <ComboMeterContainer>
      <ComboMeterFill style={{ width: `${comboProgress}%` }} />
    </ComboMeterContainer>
  );
};

export default ComboMeter;
