import { useState, useEffect, useRef } from 'react';
import { userAPI } from '../utils/api';

/**
 * Custom hook for checking username change cooldown with live countdown
 */
export function useUsernameCooldown() {
  const [cooldown, setCooldown] = useState({
    canChange: true,
    cooldownRemaining: 0,
    message: '',
    loading: true
  });
  const intervalRef = useRef(null);

  const checkCooldown = async () => {
    try {
      setCooldown(prev => ({ ...prev, loading: true }));
      const result = await userAPI.checkUsernameCooldown();
      setCooldown({
        canChange: result.canChange,
        cooldownRemaining: result.cooldownRemaining,
        message: result.message,
        loading: false
      });
    } catch (error) {
      console.error('Error checking username cooldown:', error);
      setCooldown({
        canChange: true, // Default to allowing change on error
        cooldownRemaining: 0,
        message: 'Unable to check cooldown status',
        loading: false
      });
    }
  };

  const updateCountdown = () => {
    setCooldown(prev => {
      if (prev.canChange || prev.cooldownRemaining <= 0) {
        return {
          ...prev,
          canChange: true,
          cooldownRemaining: 0,
          message: 'Username can be changed'
        };
      }
      
      // Decrease by 1 minute (1/60 of an hour)
      const newRemaining = Math.max(0, prev.cooldownRemaining - (1/60));
      const hours = Math.ceil(newRemaining);
      
      return {
        ...prev,
        cooldownRemaining: newRemaining,
        message: newRemaining > 0 ? `On cooldown for ${hours}h` : 'Username can be changed',
        canChange: newRemaining === 0
      };
    });
  };

  useEffect(() => {
    checkCooldown();
  }, []);

  // Set up countdown timer
  useEffect(() => {
    if (cooldown.cooldownRemaining > 0 && !cooldown.canChange) {
      // Update every minute (60000ms) for more responsive countdown
      intervalRef.current = setInterval(updateCountdown, 60000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [cooldown.cooldownRemaining, cooldown.canChange]);

  return {
    ...cooldown,
    refreshCooldown: checkCooldown
  };
}
