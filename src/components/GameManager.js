import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import styled from 'styled-components';

const GameOverOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const GameOverTitle = styled.h2`
  font-size: 4rem;
  font-weight: bold;
  color: white;
  margin-bottom: 2rem;
`;

const GameOverScore = styled.p`
  font-size: 1.5rem;
  color: #ddd;
  margin-bottom: 1rem;
`;

const PlayAgainButton = styled.button`
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #45a049;
  }
`;

const StartGameOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const StartGameTitle = styled.h2`
  font-size: 4rem;
  font-weight: bold;
  color: white;
  margin-bottom: 2rem;
`;

const StartGameButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

const GameContext = createContext(undefined);

function GameManager({ children }) {
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [isGameOver, setIsGameOver] = useState(false);
    const [highScore, setHighScore] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedHighScore = localStorage.getItem('highScore');
            if (savedHighScore) {
                setHighScore(parseInt(savedHighScore, 10) || 0);
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('highScore', String(highScore));
        }
    }, [highScore]);

    const updateScore = useCallback((points) => {
        setScore(prevScore => prevScore + points);
    }, []);

    const decreaseLives = useCallback(() => {
        setLives(prevLives => {
            if (prevLives > 1) {
                return prevLives - 1;
            } else {
                setIsGameOver(true);
                return 0;
            }
        });
    }, []);

    const resetGame = useCallback(() => {
        setScore(0);
        setLives(3);
        setIsGameOver(false);
        setGameStarted(true);
    }, []);

    useEffect(() => {
        if (isGameOver && score > highScore) {
            setHighScore(score);
        }
    }, [isGameOver, score, highScore]);

    const startGame = () => {
        setGameStarted(true);
    };

    const gameContextValue = {
        score,
        lives,
        isGameOver,
        updateScore,
        decreaseLives,
        resetGame,
        highScore,
        gameStarted,
        startGame
    };

    return (
        <GameContext.Provider value={gameContextValue}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {children}
                {isGameOver && (
                    <GameOverOverlay>
                        <GameOverTitle>Game Over</GameOverTitle>
                        <GameOverScore>Your Score: {score}</GameOverScore>
                        <GameOverScore>High Score: {highScore}</GameOverScore>
                        <PlayAgainButton onClick={resetGame}>Play Again</PlayAgainButton>
                    </GameOverOverlay>
                )}
                {!gameStarted && (
                    <StartGameOverlay>
                        <StartGameTitle>Press Start</StartGameTitle>
                        <StartGameButton onClick={startGame}>Start Game</StartGameButton>
                    </StartGameOverlay>
                )}
            </div>
        </GameContext.Provider>
    );
}

function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameManagerProvider');
    }
    return context;
}

export { GameManager, useGame };