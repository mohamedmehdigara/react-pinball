import { useGame } from './GameManager';
import { useCallback, useState } from 'react';

const ScoreManager = () => {
    const { updateScore } = useGame();

    // Define point values for different events
    const points = {
        bumperHit: 100,
        targetHit: 250,
        slingshotHit: 50,
        laneCompletion: 500,
        rampCompletion: 1000,
        spinnerSpin: 10, // Per spin unit
        dropTargetHit: 300,
        kickbackUsed: -50, // Optional: Penalize using kickback
        rolloverActivated: 150,
        holeActivated: 400,
        skillShotSuccess: 2000,
        // Add more scoring events as needed
    };

    // State to track combo multiplier
    const [comboMultiplier, setComboMultiplier] = useState(1);
    const [comboCounter, setComboCounter] = useState(0);
    const COMBO_THRESHOLD = 3; // Number of successful actions for a multiplier

    // Function to award points for a specific event
    const awardPoints = useCallback((event, multiplier = 1) => {
        if (points[event]) {
            updateScore(points[event] * comboMultiplier * multiplier);
            handleComboIncrease();
        } else {
            console.warn(`Scoring event "${event}" not defined.`);
        }
    }, [updateScore, comboMultiplier, handleComboIncrease, points]);

    // Function to handle combo increases
    const handleComboIncrease = useCallback(() => {
        setComboCounter(prevCounter => prevCounter + 1);
        if (comboCounter >= COMBO_THRESHOLD) {
            setComboMultiplier(prevMultiplier => prevMultiplier * 2);
            setComboCounter(0); // Reset counter after multiplier increase
            // Optionally trigger a visual or audio feedback for combo
        }
    }, [comboCounter]);

    // Function to reset the combo
    const resetCombo = useCallback(() => {
        setComboMultiplier(1);
        setComboCounter(0);
    }, []);

    // In your CollisionHandler or a component handling a specific game element
const handleBumperCollision = () => {
    ScoreManager.awardPoints('bumperHit');
    // ... other bumper collision logic
};

const handleTargetHit = () => {
    ScoreManager.awardPoints('targetHit', 2); // Award double points for this target
    // ... other target hit logic
};

const handleBallLost = () => {
    ScoreManager.resetCombo(); // Reset combo when a ball is lost
    // ... ball lost logic
};

    return {
        points,
        awardPoints,
        resetCombo,
        comboMultiplier, // Optionally expose the current multiplier
    };
};

export default ScoreManager;