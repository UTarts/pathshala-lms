'use client';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  isLoading?: boolean;
}

export function Button({ className, variant = 'primary', isLoading, children, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-primary text-primary-foreground shadow-md hover:opacity-90',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10',
    ghost: 'hover:bg-secondary text-foreground',
    danger: 'bg-destructive text-destructive-foreground',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-3 font-medium transition-colors disabled:opacity-50',
        variants[variant],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </motion.button>
  );
}