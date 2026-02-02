'use client';

/**
 * Auth Button Component
 *
 * Extends shadcn Button with loading state for auth forms
 */

import { forwardRef } from 'react';
import { Loader2Icon } from 'lucide-react';
import {
  Button as ShadcnButton,
  type ButtonProps as ShadcnButtonProps,
} from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ShadcnButtonProps {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, isLoading, disabled, className, ...props }, ref) => {
    return (
      <ShadcnButton
        ref={ref}
        disabled={disabled || isLoading}
        className={cn('min-h-button', className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          children
        )}
      </ShadcnButton>
    );
  }
);

Button.displayName = 'Button';
