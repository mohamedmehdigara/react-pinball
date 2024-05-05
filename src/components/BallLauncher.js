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
        top: 'calc(100% - 80px)', // Adjust the distance from the bottom
        right: '10px', // Adjust the distance from the right side
        transform: 'translateY(-50%)',
        cursor: 'pointer',
        zIndex: '999', // Ensure the launcher is on top
      }}
    >
      <div
        style={{
          width: '50px',
          height: '50px',
          backgroundColor: isCharged ? '#4CAF50' : '#FF5733', // Green when charged, red when not
          borderRadius: '50%',
          border: '2px solid #333',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '18px',
          color: '#fff',
          fontWeight: 'bold',
          userSelect: 'none', // Prevent text selection
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)', // Add a subtle shadow
          transition: 'background-color 0.3s ease, transform 0.3s ease', // Smooth transitions for color and scale
        }}
      >
        {isCharged ? 'READY' : 'CHARGE'}
      </div>
    </div>
  );
};

export default BallLauncher;
