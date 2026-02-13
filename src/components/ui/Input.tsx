import { Component, JSX, splitProps } from 'solid-js';
import { cn } from './Button';

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: Component<InputProps> = (props) => {
  const [local, others] = splitProps(props, ['label', 'error', 'class', 'id']);
  const id = local.id || Math.random().toString(36).substr(2, 9);

  return (
    <div class="flex flex-col gap-1.5">
      {local.label && (
        <label for={id} class="text-sm font-medium text-secondary">
          {local.label}
        </label>
      )}
      <input
        id={id}
        class={cn(
          'px-4 py-2 border border-slate-200 rounded-lg transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-gray-900/10',
          local.error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : '',
          local.class
        )}
        {...others}
      />
      {local.error && <span class="text-xs text-red-500">{local.error}</span>}
    </div>
  );
};
