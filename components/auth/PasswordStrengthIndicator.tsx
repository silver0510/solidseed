'use client';

/**
 * Password Strength Indicator Component
 *
 * Displays real-time password strength with visual indicator and criteria checklist
 */

import { useMemo, useEffect, useState } from 'react';
import { calculatePasswordStrength, type PasswordStrength } from '@/lib/password-validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  onChange?: (strength: PasswordStrength) => void;
  showCriteria?: boolean;
  debounceMs?: number;
}

interface Criterion {
  label: string;
  met: boolean;
}

export function PasswordStrengthIndicator({
  password,
  onChange,
  showCriteria = true,
  debounceMs = 200,
}: PasswordStrengthIndicatorProps) {
  const [debouncedStrength, setDebouncedStrength] = useState<PasswordStrength>({
    score: 0,
    level: 'weak',
    feedback: [],
  });

  // Calculate password criteria
  const criteria = useMemo<Criterion[]>(() => {
    return [
      {
        label: 'At least 8 characters',
        met: password.length >= 8,
      },
      {
        label: 'Contains uppercase letter',
        met: /[A-Z]/.test(password),
      },
      {
        label: 'Contains lowercase letter',
        met: /[a-z]/.test(password),
      },
      {
        label: 'Contains number',
        met: /[0-9]/.test(password),
      },
      {
        label: 'Contains special character',
        met: /[^A-Za-z0-9]/.test(password),
      },
    ];
  }, [password]);

  // Debounce strength calculation
  useEffect(() => {
    const handler = setTimeout(() => {
      const strength = calculatePasswordStrength(password);
      setDebouncedStrength(strength);
      onChange?.(strength);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [password, debounceMs, onChange]);

  // Get strength colors and labels
  const strengthConfig = {
    weak: {
      color: 'bg-red-500',
      textColor: 'text-red-600',
      label: 'Weak',
      width: '33%',
    },
    medium: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      label: 'Medium',
      width: '66%',
    },
    strong: {
      color: 'bg-green-500',
      textColor: 'text-green-600',
      label: 'Strong',
      width: '100%',
    },
  };

  const config = strengthConfig[debouncedStrength.level];

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Password Strength</span>
          <span className={`text-sm font-semibold ${config.textColor}`}>
            {config.label}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full transition-all duration-300 ease-out ${config.color}`}
            style={{ width: config.width }}
          />
        </div>
      </div>

      {/* Criteria Checklist */}
      {showCriteria && password.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 uppercase">
            Requirements
          </p>
          <div className="space-y-1.5">
            {criteria.map((criterion, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full ${
                    criterion.met
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                >
                  {criterion.met && (
                    <svg
                      className="h-2.5 w-2.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    criterion.met
                      ? 'text-green-700'
                      : 'text-gray-500'
                  }`}
                >
                  {criterion.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Message */}
      {debouncedStrength.feedback.length > 0 && password.length > 0 && (
        <p className="text-xs text-gray-600">
          {debouncedStrength.feedback[0]}
        </p>
      )}
    </div>
  );
}
