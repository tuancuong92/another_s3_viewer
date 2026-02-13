import { Component, JSX, splitProps } from 'solid-js';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: Component<ButtonProps> = (props) => {
  const [local, others] = splitProps(props, ['variant', 'size', 'class', 'children']);

  const variants = {
    primary: 'bg-cta text-white hover:bg-opacity-90',
    secondary: 'bg-transparent border-2 border-primary text-primary hover:bg-gray-50',
    ghost: 'bg-transparent text-primary hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      class={cn(
        'rounded-lg font-semibold transition-all duration-200 ease-out flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variants[local.variant || 'primary'],
        sizes[local.size || 'md'],
        local.class
      )}
      {...others}
    >
      {local.children}
    </button>
  );
};
