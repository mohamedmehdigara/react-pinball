import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h1>Welcome to Pinball Game!</h1>
      <p>Click the button below to start the game.</p>
      <Link to="/pinball" className="button">
        Start Game
      </Link>
    </div>
  );
};

export default Home;
