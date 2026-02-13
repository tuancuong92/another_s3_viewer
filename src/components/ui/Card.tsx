import { Component, JSX, splitProps } from 'solid-js';
import { cn } from './Button';

interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: Component<CardProps> = (props) => {
  const [local, others] = splitProps(props, ['class', 'hover', 'children']);

  return (
    <div
      class={cn(
        'bg-white rounded-xl p-6 shadow-sm border border-slate-100 transition-all duration-200',
        local.hover ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : '',
        local.class
      )}
      {...others}
    >
      {local.children}
    </div>
  );
};
