import React from 'react';
import './LoadingSpinner.css';

const SkeletonLoader = ({ 
  type = 'text', 
  lines = 1, 
  width = '100%', 
  height = '1em',
  className = '',
  style = {}
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="skeleton"
            style={{
              width: index === lines - 1 ? width : '100%',
              height: height,
              marginBottom: index < lines - 1 ? '0.5em' : 0
            }}
          />
        ));
      
      case 'avatar':
        return (
          <div
            className="skeleton"
            style={{
              width: width,
              height: height,
              borderRadius: '50%'
            }}
          />
        );
      
      case 'card':
        return (
          <div
            className="skeleton"
            style={{
              width: width,
              height: height,
              borderRadius: '8px'
            }}
          />
        );
      
      case 'button':
        return (
          <div
            className="skeleton"
            style={{
              width: width,
              height: height,
              borderRadius: '6px'
            }}
          />
        );
      
      case 'image':
        return (
          <div
            className="skeleton"
            style={{
              width: width,
              height: height,
              borderRadius: '4px'
            }}
          />
        );
      
      default:
        return (
          <div
            className="skeleton"
            style={{
              width: width,
              height: height
            }}
          />
        );
    }
  };

  return (
    <div className={`skeleton-loader ${className}`} style={style}>
      {renderSkeleton()}
    </div>
  );
};

export default SkeletonLoader;
