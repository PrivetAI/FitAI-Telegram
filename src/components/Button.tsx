import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', fullWidth = false, children, className = '', ...props }: ButtonProps) {
  const base = 'rounded-xl font-semibold text-base py-3.5 px-6 transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-accent text-black hover:bg-accent-dim',
    secondary: 'bg-surface-lighter text-text-primary border border-border hover:bg-surface-light',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
  };

  return (
    <button className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`} {...props}>
      {children}
    </button>
  );
}
