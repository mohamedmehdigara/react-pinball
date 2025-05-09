// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Pinball from './Pinball';
import { GameManager } from './components/GameManager';

function App() {
  return (
    <Router>
      <GameManager>
        <Routes>
          <Route path="/pinball" element={<Pinball />} />
          {/* Other routes */}
        </Routes>
      </GameManager>
    </Router>
  );
}

export default App;