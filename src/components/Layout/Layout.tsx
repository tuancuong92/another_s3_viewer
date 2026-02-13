import { Component, JSX } from 'solid-js';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';
import { uiStore } from '../../store/uiStore';
import { cn } from '../ui/Button';

interface LayoutProps {
  children: JSX.Element;
}

export const Layout: Component<LayoutProps> = (props) => {
  return (
    <div class="min-h-screen bg-slate-50 flex relative">
      <Sidebar />
      <main class={cn(
        "flex-1 ml-64 p-8 min-h-screen transition-all duration-300 ease-in-out",
        uiStore.isOpen && "mr-80"
      )}>
        <div class="max-w-7xl mx-auto">
             {props.children}
        </div>
      </main>
      <RightPanel />
    </div>
  );
};
