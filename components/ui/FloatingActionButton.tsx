'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
}

export function FloatingActionButton({ onClick, className }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'flex items-center justify-center',
        'h-14 w-14',
        'bg-primary text-primary-foreground',
        'rounded-full shadow-lg',
        'hover:shadow-xl hover:scale-105',
        'active:scale-95',
        'transition-all duration-200',
        'md:hidden', // Only show on mobile
        className
      )}
      aria-label="Quick add deal"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
