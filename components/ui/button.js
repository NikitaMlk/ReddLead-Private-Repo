import * as React from 'react';
import { cn } from '@/lib/utils/utils';

const Button = React.forwardRef(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-gradient-to-br from-[#c2410c] to-[#f97316] text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)]',
    outline: 'border border-[#27272a] bg-transparent hover:bg-[#18181b] text-white',
    ghost: 'hover:bg-[#18181b] text-white',
    destructive: 'bg-gradient-to-br from-red-700 to-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    secondary: 'bg-[#18181b] text-white hover:bg-[#27272a]',
    success: 'bg-gradient-to-br from-[#059669] to-[#10b981] text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]',
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export { Button };