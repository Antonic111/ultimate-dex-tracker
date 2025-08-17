import { useState, useCallback } from 'react';
import { validateContent, getRealTimeValidation } from '../../../shared/contentFilter';

export const useContentFilter = (configType = 'general', options = {}) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300
  } = options;

  const [validation, setValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Validate content immediately
  const validate = useCallback((text) => {
    const result = validateContent(text, configType);
    setValidation(result);
    return result;
  }, [configType]);

  // Get real-time validation with debouncing
  const validateRealTime = useCallback((text) => {
    if (!validateOnChange) return;
    
    setIsValidating(true);
    
    // Clear any existing timeout
    if (window.contentFilterTimeout) {
      clearTimeout(window.contentFilterTimeout);
    }
    
    // Set new timeout for debounced validation
    window.contentFilterTimeout = setTimeout(() => {
      const result = getRealTimeValidation(text, configType);
      setValidation(result);
      setIsValidating(false);
    }, debounceMs);
  }, [configType, validateOnChange, debounceMs]);

  // Handle input change
  const handleChange = useCallback((e) => {
    const text = e.target.value;
    
    if (validateOnChange) {
      validateRealTime(text);
    }
    
    return text;
  }, [validateOnChange, validateRealTime]);

  // Handle input blur
  const handleBlur = useCallback((text) => {
    if (validateOnBlur) {
      const result = validateContent(text, configType);
      setValidation(result);
      return result;
    }
  }, [configType, validateOnBlur]);

  // Clear validation
  const clearValidation = useCallback(() => {
    setValidation(null);
    setIsValidating(false);
  }, []);

  // Check if content is valid
  const isContentValid = useCallback((text) => {
    const result = validateContent(text, configType);
    return result.isValid;
  }, [configType]);

  return {
    validation,
    isValidating,
    validate,
    validateRealTime,
    handleChange,
    handleBlur,
    clearValidation,
    isContentValid
  };
};
