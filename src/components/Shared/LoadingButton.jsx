import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import './LoadingButton.css';

const LoadingButton = ({
  children,
  loading = false,
  loadingText = 'Loading...',
  disabled = false,
  variant = 'primary',
  size = 'medium',
  className = '',
  spinnerSize = 'small',
  spinnerVariant = 'spinner',
  spinnerColor = 'white',
  ...props
}) => {
  const buttonClasses = [
    'loading-button',
    `loading-button--${variant}`,
    `loading-button--${size}`,
    loading && 'loading-button--loading',
    disabled && 'loading-button--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <LoadingSpinner
          size={spinnerSize}
          variant={spinnerVariant}
          color={spinnerColor}
          className="loading-button__spinner"
        />
      )}
      <span className="loading-button__content">
        {loading ? loadingText : children}
      </span>
    </button>
  );
};

export default LoadingButton;
