import { supabase } from '@/integrations/supabase/client';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime?: Date;
}

/**
 * Check rate limit for login attempts (5 per 15 minutes per email)
 */
export const checkLoginRateLimit = async (email: string): Promise<RateLimitResult> => {
  try {
    const windowMinutes = 15;
    const maxAttempts = 5;
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    
    // Check existing rate limit using service role through edge function
    // For now, we'll implement basic client-side tracking with localStorage
    // In production, this should be enforced server-side
    
    const rateLimitKey = `login_attempts_${email}`;
    const storedData = localStorage.getItem(rateLimitKey);
    
    if (!storedData) {
      const newData = {
        attempts: 1,
        windowStart: Date.now(),
        resetTime: Date.now() + windowMinutes * 60 * 1000
      };
      localStorage.setItem(rateLimitKey, JSON.stringify(newData));
      return { allowed: true, remaining: maxAttempts - 1, resetTime: new Date(newData.resetTime) };
    }
    
    const data = JSON.parse(storedData);
    const currentTime = Date.now();
    
    // Reset if window expired
    if (currentTime > data.resetTime) {
      const newData = {
        attempts: 1,
        windowStart: currentTime,
        resetTime: currentTime + windowMinutes * 60 * 1000
      };
      localStorage.setItem(rateLimitKey, JSON.stringify(newData));
      return { allowed: true, remaining: maxAttempts - 1, resetTime: new Date(newData.resetTime) };
    }
    
    // Check if exceeded
    if (data.attempts >= maxAttempts) {
      return { 
        allowed: false, 
        remaining: 0,
        resetTime: new Date(data.resetTime)
      };
    }
    
    // Increment attempts
    data.attempts += 1;
    localStorage.setItem(rateLimitKey, JSON.stringify(data));
    
    return { 
      allowed: true, 
      remaining: maxAttempts - data.attempts,
      resetTime: new Date(data.resetTime)
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // On error, allow the request (fail open)
    return { allowed: true, remaining: 5 };
  }
};

/**
 * Clear rate limit for successful login
 */
export const clearLoginRateLimit = (email: string): void => {
  const rateLimitKey = `login_attempts_${email}`;
  localStorage.removeItem(rateLimitKey);
};

/**
 * Check print operation rate limit (100 per hour per user)
 */
export const checkPrintRateLimit = async (userId: string): Promise<RateLimitResult> => {
  try {
    const windowMinutes = 60;
    const maxAttempts = 100;
    
    const rateLimitKey = `print_attempts_${userId}`;
    const storedData = sessionStorage.getItem(rateLimitKey);
    
    if (!storedData) {
      const newData = {
        attempts: 1,
        windowStart: Date.now(),
        resetTime: Date.now() + windowMinutes * 60 * 1000
      };
      sessionStorage.setItem(rateLimitKey, JSON.stringify(newData));
      return { allowed: true, remaining: maxAttempts - 1, resetTime: new Date(newData.resetTime) };
    }
    
    const data = JSON.parse(storedData);
    const currentTime = Date.now();
    
    // Reset if window expired
    if (currentTime > data.resetTime) {
      const newData = {
        attempts: 1,
        windowStart: currentTime,
        resetTime: currentTime + windowMinutes * 60 * 1000
      };
      sessionStorage.setItem(rateLimitKey, JSON.stringify(newData));
      return { allowed: true, remaining: maxAttempts - 1, resetTime: new Date(newData.resetTime) };
    }
    
    // Check if exceeded
    if (data.attempts >= maxAttempts) {
      return { 
        allowed: false, 
        remaining: 0,
        resetTime: new Date(data.resetTime)
      };
    }
    
    // Increment attempts
    data.attempts += 1;
    sessionStorage.setItem(rateLimitKey, JSON.stringify(data));
    
    return { 
      allowed: true, 
      remaining: maxAttempts - data.attempts,
      resetTime: new Date(data.resetTime)
    };
  } catch (error) {
    console.error('Error checking print rate limit:', error);
    return { allowed: true, remaining: 100 };
  }
};
