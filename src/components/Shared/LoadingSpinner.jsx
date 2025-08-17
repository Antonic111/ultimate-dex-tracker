import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  variant = 'spinner', 
  color = 'accent',
  text = '',
  fullScreen = false,
  overlay = false 
}) => {
  const sizeClass = `loading-${size}`;
  const variantClass = `loading-${variant}`;
  const colorClass = `loading-${color}`;

  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className={`loading-spinner ${sizeClass} ${variantClass} ${colorClass}`}>
          {variant === 'spinner' && <div className="spinner-ring"></div>}
          {variant === 'dots' && (
            <div className="dots-container">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
          {variant === 'pulse' && <div className="pulse-circle"></div>}
          {variant === 'bars' && (
            <div className="bars-container">
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          )}
        </div>
        {text && <div className="loading-text">{text}</div>}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="loading-overlay">
        <div className={`loading-spinner ${sizeClass} ${variantClass} ${colorClass}`}>
          {variant === 'spinner' && <div className="spinner-ring"></div>}
          {variant === 'dots' && (
            <div className="dots-container">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
          {variant === 'pulse' && <div className="pulse-circle"></div>}
          {variant === 'bars' && (
            <div className="bars-container">
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          )}
        </div>
        {text && <div className="loading-text">{text}</div>}
      </div>
    );
  }

  return (
    <div className={`loading-spinner ${sizeClass} ${variantClass} ${colorClass}`}>
      {variant === 'spinner' && <div className="spinner-ring"></div>}
      {variant === 'dots' && (
        <div className="dots-container">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      )}
      {variant === 'pulse' && <div className="pulse-circle"></div>}
      {variant === 'bars' && (
        <div className="bars-container">
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
      )}
      {text && <div className="loading-text">{text}</div>}
    </div>
  );
};

export default LoadingSpinner;
