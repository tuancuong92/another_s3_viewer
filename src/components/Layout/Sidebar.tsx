import { Component, Show } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { Database, HardDrive, LayoutDashboard, Settings } from 'lucide-solid';
import { cn } from '../ui/Button';
import { connectionStore } from '../../store/connectionStore';

const SidebarItem: Component<{ href: string; icon: any; label: string }> = (props) => {
  const location = useLocation();
  const isActive = () => location.pathname === props.href;

  return (
    <A
      href={props.href}
      class={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200',
        isActive()
          ? 'bg-primary text-white'
          : 'text-secondary hover:bg-slate-100 hover:text-primary'
      )}
    >
      <props.icon size={20} />
      <span class="font-medium">{props.label}</span>
    </A>
  );
};

export const Sidebar: Component = () => {
  return (
    <aside class="w-64 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0">
      <div class="p-6 border-b border-slate-100">
        <div class="flex items-center gap-2 text-primary">
            <Database size={28} />
            <span class="text-xl font-bold tracking-tight">S3 Manager</span>
        </div>
      </div>
      
      <nav class="flex-1 p-4 flex flex-col gap-2">
        <SidebarItem href="/" icon={LayoutDashboard} label="Dashboard" />
        <Show when={connectionStore.activeConnectionId}>
          <SidebarItem
            href={`/connections/${connectionStore.activeConnectionId}/buckets`}
            icon={HardDrive}
            label="Buckets"
          />
        </Show>
        <SidebarItem href="/connections" icon={Settings} label="Connections" />
      </nav>

    </aside>
  );
};
