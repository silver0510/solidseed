/**
 * Password Validation Utilities for Korella CRM
 *
 * This module provides password validation functions and complexity rules
 * for user authentication and password management.
 *
 * Password Complexity Requirements:
 * - Minimum length: 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */

// =============================================================================
// Password Complexity Rules
// =============================================================================

/**
 * Password complexity requirements
 */
export const passwordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSymbol: true,
  // Common passwords to reject (basic list)
  commonPasswords: [
    'password',
    'password123',
    '12345678',
    'qwerty',
    'abc123',
    'monkey',
    'master',
    'dragon',
    'letmein',
    'login',
    'welcome',
    'football',
    'shadow',
    'superman',
    'iloveyou',
    'starwars',
    'password1',
  ],
  // Patterns that make passwords weak
  weakPatterns: [
    /(.)\1{2,}/, // Repeated characters (aaa, 111, etc.)
    /^(0123|1234|2345|3456|4567|5678|6789|7890)/, // Sequential numbers
    /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i, // Sequential letters
    /^(qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|kl|zxc|xcv|cvb|vbn|bnm)/i, // Keyboard patterns
  ],
} as const;

// =============================================================================
// Validation Result Types
// =============================================================================

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
  warnings: string[];
}

/**
 * Password strength score breakdown
 */
export interface PasswordStrength {
  score: number; // 0-4
  level: 'weak' | 'medium' | 'strong';
  feedback: string[];
}

// =============================================================================
// Password Validation Functions
// =============================================================================

/**
 * Validates a password against complexity requirements
 *
 * @param password - Password to validate
 * @param options - Optional validation options
 * @returns Validation result with errors and warnings
 */
export function validatePassword(
  password: string,
  options?: Partial<typeof passwordRequirements>
): PasswordValidationResult {
  const requirements = { ...passwordRequirements, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum length
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }

  // Check maximum length
  if (password.length > requirements.maxLength) {
    errors.push(`Password must not exceed ${requirements.maxLength} characters`);
  }

  // Check uppercase requirement
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check lowercase requirement
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check number requirement
  if (requirements.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check symbol requirement
  if (requirements.requireSymbol && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check common passwords
  const lowerPassword = password.toLowerCase();
  if ((requirements.commonPasswords as readonly string[]).includes(lowerPassword)) {
    errors.push('This is a commonly used password. Please choose a more secure password');
  }

  // Check weak patterns
  for (const pattern of requirements.weakPatterns) {
    if (pattern.test(password)) {
      warnings.push('Password contains predictable patterns. Consider using a more complex password');
      break;
    }
  }

  // Calculate strength
  const strength = calculatePasswordStrength(password);

  // Add strength warning
  if (strength.level === 'weak') {
    warnings.push('This password is weak. Consider adding more characters, numbers, or symbols');
  }

  return {
    valid: errors.length === 0,
    strength: strength.level,
    errors,
    warnings,
  };
}

/**
 * Calculates password strength based on entropy and complexity
 *
 * @param password - Password to analyze
 * @returns Password strength score and level
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];

  // Length scoring (0-2 points)
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length < 8) {
    feedback.push('Add more characters to increase strength');
  }

  // Character variety scoring (0-2 points)
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
  const varietyCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;

  if (varietyCount >= 2) score += 1;
  if (varietyCount >= 4) score += 1;
  if (varietyCount < 2) {
    feedback.push('Mix uppercase, lowercase, numbers, and symbols');
  }

  // Length bonus (0-2 points)
  if (password.length >= 16) score += 1;
  if (password.length >= 20) score += 1;

  // Determine strength level
  let level: 'weak' | 'medium' | 'strong';
  if (score <= 2) {
    level = 'weak';
    if (feedback.length === 0) {
      feedback.push('Consider a longer, more complex password');
    }
  } else if (score <= 4) {
    level = 'medium';
    if (feedback.length === 0) {
      feedback.push('Good password, but could be stronger');
    }
  } else {
    level = 'strong';
    feedback.push('Strong password!');
  }

  return { score, level, feedback };
}

/**
 * Checks if two passwords match
 *
 * @param password - First password
 * @param confirmPassword - Second password to compare
 * @returns True if passwords match
 */
export function doPasswordsMatch(
  password: string,
  confirmPassword: string
): boolean {
  return password === confirmPassword;
}

/**
 * Generates a random password
 *
 * @param length - Password length (default: 16)
 * @param options - Options for character sets
 * @returns Generated password
 */
export function generatePassword(
  length: number = 16,
  options?: {
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
  }
): string {
  const opts = {
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    ...options,
  };

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let chars = '';
  if (opts.includeUppercase) chars += uppercase;
  if (opts.includeLowercase) chars += lowercase;
  if (opts.includeNumbers) chars += numbers;
  if (opts.includeSymbols) chars += symbols;

  if (chars.length === 0) {
    throw new Error('At least one character type must be enabled');
  }

  // Ensure password includes at least one of each enabled type
  let password = '';
  const availableChars: string[] = [];

  if (opts.includeUppercase) {
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
  }
  if (opts.includeLowercase) {
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
  }
  if (opts.includeNumbers) {
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }
  if (opts.includeSymbols) {
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }

  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  // Shuffle password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Sanitizes password from logs and error messages
 *
 * @param message - Message that may contain password
 * @returns Sanitized message
 */
export function sanitizePassword(message: string): string {
  // Common patterns that might contain passwords
  const patterns = [
    /password["\s:=]+[^\s"]+/gi,
    /pwd["\s:=]+[^\s"]+/gi,
    /new_password["\s:=]+[^\s"]+/gi,
    /current_password["\s:=]+[^\s"]+/gi,
  ];

  let sanitized = message;
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, (match) => {
      const key = match.split(/[=\s:]+/)[0];
      return `${key}=***`;
    });
  }

  return sanitized;
}

// =============================================================================
// Password Policy Exports
// =============================================================================

/**
 * Default password validation function
 */
export const validateDefaultPassword = (password: string): PasswordValidationResult => {
  return validatePassword(password);
};

/**
 * Password requirements description for UI
 */
export const passwordRequirementsDescription = [
  `At least ${passwordRequirements.minLength} characters long`,
  'Contains at least one uppercase letter (A-Z)',
  'Contains at least one lowercase letter (a-z)',
  'Contains at least one number (0-9)',
  'Contains at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)',
] as const;
