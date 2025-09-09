/**
 * Client-side input sanitization utility
 * Provides basic sanitization for form inputs before submission
 */

// Basic HTML sanitization (remove tags)
export function sanitizeHtml(input) {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embed tags
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '') // Remove link tags
    .replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, '') // Remove meta tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '') // Remove form tags
    .replace(/<input\b[^<]*(?:(?!<\/input>)<[^<]*)*<\/input>/gi, '') // Remove input tags
    .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '') // Remove button tags
    .replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, '') // Remove select tags
    .replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, '') // Remove textarea tags
    .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

// Basic XSS prevention
export function preventXSS(input) {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/<script/gi, '&lt;script')
    .replace(/<\/script>/gi, '&lt;/script&gt;')
    .replace(/<iframe/gi, '&lt;iframe')
    .replace(/<\/iframe>/gi, '&lt;/iframe&gt;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// Sanitize text input
export function sanitizeText(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input
    .trim()
    .normalize('NFC'); // Normalize unicode
  
  // Remove HTML tags
  sanitized = sanitizeHtml(sanitized);
  
  // Prevent XSS
  sanitized = preventXSS(sanitized);
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

// Sanitize username
export function sanitizeUsername(input) {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .normalize('NFC')
    .replace(/[^a-zA-Z0-9_\-\.\,\~\* ]/g, '') // Only allow safe characters
    .substring(0, 15); // Username limit
}

// Sanitize email
export function sanitizeEmail(input) {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^a-zA-Z0-9@._\-+]/g, '') // Only allow safe email characters
    .substring(0, 254); // Email length limit
}

// Sanitize bio
export function sanitizeBio(input) {
  if (!input || typeof input !== 'string') return '';
  
  return sanitizeText(input, 500);
}

// Sanitize location
export function sanitizeLocation(input) {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .normalize('NFC')
    .replace(/[^a-zA-Z0-9\s.,\-'()]/g, '') // Only allow safe location characters
    .substring(0, 100); // Location limit
}

// Sanitize notes
export function sanitizeNotes(input) {
  if (!input || typeof input !== 'string') return '';
  
  return sanitizeText(input, 200);
}

// Sanitize form data before submission
export function sanitizeFormData(formData, fieldTypes = {}) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(formData)) {
    const fieldType = fieldTypes[key] || 'text';
    
    switch (fieldType) {
      case 'username':
        sanitized[key] = sanitizeUsername(value);
        break;
      case 'email':
        sanitized[key] = sanitizeEmail(value);
        break;
      case 'bio':
        sanitized[key] = sanitizeBio(value);
        break;
      case 'location':
        sanitized[key] = sanitizeLocation(value);
        break;
      case 'notes':
        sanitized[key] = sanitizeNotes(value);
        break;
      default:
        sanitized[key] = sanitizeText(value);
    }
  }
  
  return sanitized;
}
