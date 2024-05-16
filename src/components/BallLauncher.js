import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const BallLauncher = ({ onLaunch }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.keyCode === 32) {
        // Spacebar key (keyCode 32) pressed
        // Call the onLaunch callback
        onLaunch();
      }
    };

    // Add event listener for keydown
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onLaunch]);

  return null; // The launcher itself doesn't need to render anything
};

BallLauncher.propTypes = {
  onLaunch: PropTypes.func.isRequired,
};

export default BallLauncher;
