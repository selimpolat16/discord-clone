import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App; 