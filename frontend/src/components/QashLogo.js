/**
 * Qash Logo Component
 * Based on the provided Qash branding
 */

import React from 'react';

const QashLogo = ({ size = 40, color = '#2563eb' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle */}
      <circle cx="50" cy="50" r="45" fill={color} fillOpacity="0.1"/>
      
      {/* Q Shape with tail */}
      <path 
        d="M50 20C33.43 20 20 33.43 20 50C20 66.57 33.43 80 50 80C58.28 80 65.68 76.54 70.82 70.82L65.46 65.46C61.74 69.18 56.14 71.5 50 71.5C38.13 71.5 28.5 61.87 28.5 50C28.5 38.13 38.13 28.5 50 28.5C61.87 28.5 71.5 38.13 71.5 50C71.5 52.76 71.06 55.41 70.24 57.89L77.67 65.32C79.19 61.39 80 57.04 80 50C80 33.43 66.57 20 50 20Z"
        fill={color}
      />
      
      {/* Tail extension */}
      <path
        d="M65 65L80 80L85 75L70 60Z"
        fill={color}
      />
      
      {/* Inner decoration */}
      <circle cx="50" cy="50" r="8" fill={color} fillOpacity="0.3"/>
    </svg>
  );
};

export default QashLogo;