import { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../utils/api';

/**
 * Custom hook for checking username availability with debouncing
 */
export function useUsernameAvailability(username, currentUsername) {
  const [availability, setAvailability] = useState({
    status: 'idle', // 'idle', 'checking', 'available', 'taken', 'error'
    message: '',
    available: false
  });

  // Debounced check function
  const checkAvailability = useCallback(async (usernameToCheck) => {
    if (!usernameToCheck || usernameToCheck.trim() === '') {
      setAvailability({
        status: 'idle',
        message: '',
        available: false
      });
      return;
    }

    // Don't check if it's the same as current username
    if (usernameToCheck === currentUsername) {
      setAvailability({
        status: 'idle',
        message: 'Current username',
        available: false
      });
      return;
    }

    // Basic validation
    if (usernameToCheck.length < 3) {
      setAvailability({
        status: 'error',
        message: 'Username must be at least 3 characters',
        available: false
      });
      return;
    }

    if (usernameToCheck.length > 15) {
      setAvailability({
        status: 'error',
        message: 'Username must be no more than 15 characters',
        available: false
      });
      return;
    }

    setAvailability({
      status: 'checking',
      message: 'Checking availability...',
      available: false
    });

    try {
      const result = await userAPI.checkUsernameAvailability(usernameToCheck);
      
      setAvailability({
        status: result.available ? 'available' : 'taken',
        message: result.message,
        available: result.available
      });
    } catch (error) {
      setAvailability({
        status: 'error',
        message: error.userMessage || 'Error checking username',
        available: false
      });
    }
  }, [currentUsername]);

  // Debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkAvailability(username);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [username, checkAvailability]);

  return availability;
}
