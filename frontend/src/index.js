import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import App from './App';
import Landing from './components/Landing';
import ProtectedRoute from './components/ProtectedRoute';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Redirect old login/signup routes to landing page */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<Navigate to="/" replace />} />
        
        {/* Protected dashboard route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          } 
        />
        
        {/* Landing page with integrated auth */}
        <Route path="/" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
