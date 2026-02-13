import { Component, Show } from 'solid-js';
import { X } from 'lucide-solid';
import { closePanel, uiStore } from '../../store/uiStore';
import { BucketDetailsPanel } from './BucketDetailsPanel';
import { ObjectDetailsPanel } from './ObjectDetailsPanel';
import { cn } from '../ui/Button';

export const RightPanel: Component = () => {
  return (
    <aside
      class={cn(
        "fixed top-0 right-0 h-full bg-white border-l border-slate-200 shadow-lg z-40 transition-all duration-300 ease-in-out",
        uiStore.isOpen ? "w-80 translate-x-0" : "w-80 translate-x-full"
      )}
    >
      <div class="flex flex-col h-full">
        {/* Close Button */}
        <button
          onClick={closePanel}
          class="absolute top-4 right-4 p-2 rounded-md hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors z-10"
          title="Close Panel"
        >
          <X size={18} />
        </button>

        {/* Panel Content */}
        <Show
          when={uiStore.viewType === 'BUCKET_DETAILS' && uiStore.data}
          fallback={
            <Show
              when={uiStore.viewType === 'OBJECT_DETAILS' && uiStore.data}
              fallback={
                <div class="p-8 text-center text-secondary">
                  <p>No details available</p>
                </div>
              }
            >
              <ObjectDetailsPanel
                bucketName={uiStore.data?.bucketName || ''}
                objectKey={uiStore.data?.objectKey || ''}
                objectSize={uiStore.data?.objectSize}
                lastModified={uiStore.data?.lastModified}
                connectionName={uiStore.data?.connectionName || ''}
              />
            </Show>
          }
        >
          <BucketDetailsPanel
            bucketName={uiStore.data?.bucketName || ''}
            connectionName={uiStore.data?.connectionName || ''}
            endpoint={uiStore.data?.endpoint || ''}
            region={uiStore.data?.region || ''}
            creationDate={uiStore.data?.creationDate}
            onDelete={() => {
              // Placeholder for delete action. 
              // This would typically be passed from the parent or handled via a global event.
              // For now, we just alert.
              alert('Delete action triggered. Connect this to a delete handler.');
            }}
          />
        </Show>
      </div>
    </aside>
  );
};
