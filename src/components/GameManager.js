// components/GameManager.js
import React, { createContext, useState, useContext } from 'react';

const GameContext = createContext();

export const useGame = () => {
  return useContext(GameContext);
};

export const GameManager = ({ children }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setGameOver] = useState(false);

  const updateScore = (points) => {
    setScore((prevScore) => prevScore + points);
  };

  const decreaseLives = () => {
    setLives((prevLives) => prevLives - 1);
    // Add game over logic here if lives reach 0
  };

  return (
    <GameContext.Provider value={{ score, lives, isGameOver, updateScore, decreaseLives }}>
      {children}
    </GameContext.Provider>
  );
};