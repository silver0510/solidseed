'use client';

/**
 * Form Input Component
 *
 * Extends shadcn Input with label and error handling for auth forms
 */

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormInputProps extends ComponentPropsWithoutRef<typeof Input> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, required, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <Label htmlFor={id} className="text-slate-900 dark:text-slate-100">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Input
          ref={ref}
          id={id}
          className={cn(
            'min-h-input text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
            error && 'border-red-500 focus-visible:border-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
