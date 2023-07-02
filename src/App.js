import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Pinball from './Pinball';
import Home from './Home';
import NotFound from './NotFound';

const App = () => {
  return (
    <div className="App">
      <Routes>
        <Route exact path="/" element={<Home/>} />
        <Route path="/pinball" element={<Pinball/>} />
        <Route element={<NotFound/>} />
      </Routes>
    </div>
  );
};

export default App;


