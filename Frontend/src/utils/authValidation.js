/**
 * Authentication Form Validation & Password Security Utilities
 * Factual, client-side UX validation designed to guide users without leaking sensitive data.
 */

// RFC 5322 compliant standard email regex pattern
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateEmail(email) {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email address is required.' };
  }
  const trimmed = email.trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }
  return { isValid: true, error: '' };
}

export function checkPasswordStrength(password = '') {
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const metCount = Object.values(rules).filter(Boolean).length;

  let strength = 'Weak';
  let score = 1; // 1-4
  if (metCount >= 5 && password.length >= 10) {
    strength = 'Strong';
    score = 4;
  } else if (metCount >= 4) {
    strength = 'Good';
    score = 3;
  } else if (metCount >= 3) {
    strength = 'Fair';
    score = 2;
  } else {
    strength = 'Weak';
    score = 1;
  }

  const isValid = rules.length && rules.uppercase && rules.lowercase && rules.number && rules.special;

  return {
    rules,
    strength,
    score,
    isValid,
    metCount,
  };
}

export function getFriendlyErrorMessage(err) {
  if (!err) return '';
  const msg = err.message || String(err);

  // Network offline or failed connection
  if (
    typeof navigator !== 'undefined' &&
    (!navigator.onLine || msg.includes('Failed to fetch') || msg.includes('NetworkError'))
  ) {
    return "We couldn't connect to the server. Check your connection and try again.";
  }

  // Server 500 error
  if (msg.includes('500') || msg.includes('Internal Server Error')) {
    return "We couldn't sign you in right now. Please try again shortly.";
  }

  // Account enumeration & credential errors
  if (msg.includes('Invalid email or password') || msg.includes('Email or password is incorrect')) {
    return 'Email or password is incorrect.';
  }

  if (msg.includes('already exists')) {
    return 'An account may already exist with this email. Try signing in or resetting your password.';
  }

  return msg;
}
