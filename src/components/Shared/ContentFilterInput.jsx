import React, { useState, useEffect, useCallback } from 'react';
import { validateContent, getRealTimeValidation, getCharacterInfo } from '../../../shared/contentFilter.js';
import './ContentFilterInput.css';

const ContentFilterInput = ({
  type = 'text',
  value = '',
  onChange,
  onValidationChange,
  configType = 'general',
  placeholder = '',
  className = '',
  disabled = false,
  required = false,
  showCharacterCount = true,
  showRealTimeValidation = true,
  debounceMs = 300,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [validation, setValidation] = useState(() => {
    // Initialize with a default validation state to prevent null access errors
    const charInfo = getCharacterInfo(value || '', configType);
    return {
      isValid: true,
      error: null,
      warning: null,
      charInfo
    };
  });
  const [isFocused, setIsFocused] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Initialize validation when component mounts or value changes
  useEffect(() => {
    // Always initialize validation to prevent null access errors
    const charInfo = getCharacterInfo(value || '', configType);
    const initialValidation = {
      isValid: true,
      error: null,
      warning: null,
      charInfo
    };
    setValidation(initialValidation);
    
    // Only call onValidationChange if real-time validation is enabled
    if (showRealTimeValidation) {
      onValidationChange?.(initialValidation);
    }
  }, [value, configType, showRealTimeValidation, onValidationChange]);

  // Debounced validation
  const debouncedValidation = useCallback((text) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      if (showRealTimeValidation) {
        const realTimeValidation = getRealTimeValidation(text, configType);
        setValidation(realTimeValidation);
        onValidationChange?.(realTimeValidation);
      }
    }, debounceMs);
    
    setDebounceTimer(timer);
  }, [debounceTimer, debounceMs, showRealTimeValidation, configType, onValidationChange]);

  // Handle input change (do not block typing; validation handled on save)
  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (showRealTimeValidation) {
      const charInfo = getCharacterInfo(newValue, configType);
      const immediateValidation = {
        ...getRealTimeValidation(newValue, configType),
        charInfo
      };
      setValidation(immediateValidation);
      onValidationChange?.(immediateValidation);
    }

    debouncedValidation(newValue);
    onChange?.(e);
  };

  // Handle blur - do final validation
  const handleBlur = (e) => {
    setIsFocused(false);
    const finalValidation = validateContent(localValue, configType);
    setValidation({
      isValid: finalValidation.isValid,
      error: finalValidation.error,
      warning: null,
      charInfo: getCharacterInfo(localValue, configType)
    });
    onValidationChange?.({
      isValid: finalValidation.isValid,
      error: finalValidation.error,
      warning: null,
      charInfo: getCharacterInfo(localValue, configType)
    });
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // If no validation or character count is needed, render just the input
  if (!showRealTimeValidation && !showCharacterCount) {
    const inputProps = {
      type,
      value: localValue,
      onChange: handleChange,
      onBlur: handleBlur,
      onFocus: handleFocus,
      placeholder,
      disabled,
      required,
      className,
      ...props
    };

    if (type === "textarea") {
      return (
        <textarea
          {...inputProps}
          style={{ resize: "none" }}
        />
      );
    }
    return <input {...inputProps} />;
  }

  // Determine input styling based on validation state
  const getInputClassName = () => {
    const baseClass = className || '';
    
    // If validation is disabled or not yet initialized, don't add any validation styling
    if (!showRealTimeValidation || !validation) {
      return baseClass;
    }
    
    // Only apply validation styling when validation is enabled and initialized
    if (validation.isValid === false) {
      return `${baseClass} content-filter-input-invalid`.trim();
    } else if (validation.isValid === true) {
      return `${baseClass} content-filter-input-valid`.trim();
    }
    
    return baseClass;
  };

  const renderInput = () => {
    const inputProps = {
      type,
      value: localValue,
      onChange: handleChange,
      onBlur: handleBlur,
      onFocus: handleFocus,
      placeholder,
      disabled,
      required,
      ...props
    };

    if (type === "textarea") {
      return (
        <textarea
          {...inputProps}
          className={getInputClassName()}
          style={{ resize: "none" }}
        />
      );
    }
    return <input {...inputProps} className={getInputClassName()} />;
  };

  // Get character count color
  const getCharacterCountColor = () => {
    if (!validation?.charInfo) return '';
    
    const { percentage, isOverLimit } = validation.charInfo;
    
    if (isOverLimit) return 'error';
    if (percentage >= 90) return 'warning';
    if (percentage >= 75) return 'info';
    return 'normal';
  };

  return (
    <div className={`content-filter-wrapper ${isFocused ? 'is-focused' : ''}`}>
      {renderInput()}
      
      {/* Validation messages */}
      {validation && (
        <div className="validation-messages">
          {validation.error && (
            <div className="validation-error">
              ❌ {validation.error}
            </div>
          )}
          {validation.warning && !validation.error && (
            <div className="validation-warning">
              ⚠️ {validation.warning}
            </div>
          )}
        </div>
      )}
      
      {/* Character count */}
      {showCharacterCount && validation?.charInfo && (
        <div className={`character-count ${getCharacterCountColor()}`}>
          {validation.charInfo.current}/{validation.charInfo.max}
          {validation.charInfo.remaining > 0 && (
            <span className="remaining"> ({validation.charInfo.remaining} remaining)</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentFilterInput;
