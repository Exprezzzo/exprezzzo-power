'use client';

import { cn } from '@/lib/utils';

interface TouchButtonProps {
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

export function TouchButton({ 
  onClick, 
  children, 
  variant = 'primary', 
  disabled = false,
  className = '',
  type = 'button',
  style
}: TouchButtonProps) {
  const variants = {
    'primary': 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg',
    'secondary': 'bg-gray-800 text-gray-100 hover:bg-gray-700 border border-gray-700',
    'ghost': 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Touch-optimized base classes
        "touch-button touch-feedback rounded-xl",
        
        // Remove duplicate classes (now in CSS)
        // "min-h-[44px] min-w-[44px] px-4 py-3",
        // "touch-action-manipulation select-none",
        // "-webkit-tap-highlight-color: transparent",
        // "transition-all duration-150 ease-out",
        // "active:scale-95 active:transition-none",
        
        // Focus states for accessibility
        "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-gray-900",
        
        // Disabled states
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        
        // Variant styles
        variants[variant],
        
        // Custom className override
        className
      )}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        ...style
      }}
    >
      {children}
    </button>
  );
}