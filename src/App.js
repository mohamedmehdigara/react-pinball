import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Pinball from './Pinball';
import { GameManager, useGame } from './components/GameManager';



const App = () => {
  return (
    <div className="App">
      <GameManager>

      <Routes>
        
        <Route path="/pinball" element={<Pinball/>} />
        
      </Routes>
      </GameManager>
    </div>
  );
};

export default App;
