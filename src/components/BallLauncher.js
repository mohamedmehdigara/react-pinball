// BallLauncher.js
import React, { useState, useEffect } from 'react';

const BallLauncher = ({ onLaunch }) => {
  const [isCharged, setIsCharged] = useState(false);

  useEffect(() => {
    const handleMouseDown = () => {
      setIsCharged(true);
    };

    const handleMouseUp = () => {
      if (isCharged) {
        onLaunch(); // Trigger the launch action
        setIsCharged(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isCharged, onLaunch]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        right: '10px', // Adjust the distance from the right side
        transform: 'translateY(-50%)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: '50px',
          height: '50px',
          backgroundColor: isCharged ? 'green' : 'red',
          borderRadius: '50%',
          border: '2px solid #333',
        }}
      ></div>
    </div>
  );
};

export default BallLauncher;
