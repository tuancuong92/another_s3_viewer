import { Component, Show, createSignal, onMount } from 'solid-js';
import { Info, Calendar, Server, Database, Trash2, Globe, Lock, Loader2 } from 'lucide-solid';
import { Button } from '../ui/Button';
import { cn } from '../ui/Button';
import { isBucketPublic, setBucketPublic } from '../../services/s3';
import { connectionStore } from '../../store/connectionStore';

export interface BucketDetailsProps {
  bucketName: string;
  connectionName: string;
  endpoint: string;
  region: string;
  creationDate?: string;
  onDelete?: () => void;
}

export const BucketDetailsPanel: Component<BucketDetailsProps> = (props) => {
  const [isPublic, setIsPublic] = createSignal<boolean | null>(null);
  const [isLoadingAcl, setIsLoadingAcl] = createSignal(true);
  const [isTogglingAcl, setIsTogglingAcl] = createSignal(false);

  const findConnection = () => {
    return connectionStore.connections.find(c => c.name === props.connectionName);
  };

  const fetchAcl = async () => {
    setIsLoadingAcl(true);
    const conn = findConnection();
    if (!conn) {
      setIsLoadingAcl(false);
      return;
    }
    try {
      const isPublic = await isBucketPublic(conn, props.bucketName);
      setIsPublic(isPublic);
    } catch (e) {
      console.error('Failed to fetch bucket policy', e);
      setIsPublic(null);
    } finally {
      setIsLoadingAcl(false);
    }
  };

  const toggleAcl = async () => {
    const conn = findConnection();
    if (!conn) return;

    setIsTogglingAcl(true);
    const newValue = !isPublic();
    try {
      await setBucketPublic(conn, props.bucketName, newValue);
      setIsPublic(newValue);
    } catch (e) {
      console.error('Failed to update bucket policy', e);
      alert('Failed to update access control');
    } finally {
      setIsTogglingAcl(false);
    }
  };

  onMount(() => {
    fetchAcl();
  });

  return (
    <div class="flex flex-col h-full">
      {/* Header */}
      <div class="p-6 border-b border-slate-200 bg-slate-50">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Database size={20} />
            </div>
            <div>
              <h2 class="text-lg font-bold text-primary truncate max-w-[200px]" title={props.bucketName}>
                {props.bucketName}
              </h2>
              <p class="text-xs text-secondary mt-0.5">
                {props.connectionName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-y-auto p-6">
        <div class="space-y-6">
          {/* Section Title */}
          <div class="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
            <Info size={14} />
            <span>Information</span>
          </div>

          {/* Access Control Section */}
          <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div class="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
              <Globe size={14} />
              <span>Access Control</span>
            </div>
            <Show when={isLoadingAcl()}>
              <div class="flex items-center justify-center py-2">
                <Loader2 size={16} class="animate-spin text-secondary" />
              </div>
            </Show>
            <Show when={!isLoadingAcl() && isPublic() !== null}>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Show when={isPublic()} fallback={<Lock size={16} class="text-secondary" />}>
                    <Globe size={16} class="text-green-600" />
                  </Show>
                  <span class="text-sm font-medium text-primary">
                    {isPublic() ? 'Public' : 'Private'}
                  </span>
                </div>
                <button
                  onClick={toggleAcl}
                  disabled={isTogglingAcl()}
                  class={cn(
                    "px-3 py-1 rounded text-xs font-medium transition-all duration-200",
                    isTogglingAcl() ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90",
                    isPublic()
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  )}
                >
                  {isTogglingAcl() ? 'Updating...' : isPublic() ? 'Make Private' : 'Make Public'}
                </button>
              </div>
            </Show>
            <Show when={!isLoadingAcl() && isPublic() === null}>
              <span class="text-xs text-secondary italic">Unable to load access status.</span>
            </Show>
          </div>

          {/* Info Grid */}
          <div class="space-y-4">
            <div class="flex flex-col gap-1">
              <span class="text-xs text-secondary uppercase font-medium">Bucket Name</span>
              <span class="text-sm text-primary font-medium bg-white p-2 rounded-md border border-slate-200 truncate">
                {props.bucketName}
              </span>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs text-secondary uppercase font-medium">Created</span>
              <div class="flex items-center gap-2 bg-white p-2 rounded-md border border-slate-200">
                <Calendar size={14} class="text-secondary" />
                <span class="text-sm text-primary">
                  {props.creationDate ? new Date(props.creationDate).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs text-secondary uppercase font-medium">Connection</span>
              <span class="text-sm text-primary bg-white p-2 rounded-md border border-slate-200 truncate">
                {props.connectionName}
              </span>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs text-secondary uppercase font-medium">Endpoint</span>
              <div class="flex items-start gap-2 bg-white p-2 rounded-md border border-slate-200 break-all">
                <Server size={14} class="text-secondary shrink-0 mt-0.5" />
                <span class="text-sm text-primary font-mono">
                  {props.endpoint}
                </span>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs text-secondary uppercase font-medium">Region</span>
              <span class="text-sm text-primary bg-white p-2 rounded-md border border-slate-200 truncate">
                {props.region}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <Show when={props.onDelete}>
        <div class="p-6 border-t border-slate-200 bg-slate-50">
          <Button
            variant="ghost"
            class="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={props.onDelete}
          >
            <Trash2 size={16} class="mr-2" />
            Delete Bucket
          </Button>
        </div>
      </Show>
    </div>
  );
};
