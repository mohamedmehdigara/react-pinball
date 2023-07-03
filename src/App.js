import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Pinball from './Pinball';


const App = () => {
  return (
    <div className="App">
      <Routes>
        
        <Route path="/pinball" element={<Pinball/>} />
        
      </Routes>
    </div>
  );
};

export default App;
