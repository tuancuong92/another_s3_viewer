import { Component, createSignal, onMount, Show } from 'solid-js';
import { Calendar, Check, Copy, FileText, Globe, HardDrive, Info, Loader2, Lock } from 'lucide-solid';
import { cn } from '../ui/Button';
import { isObjectPublic, setObjectPublic } from '../../services/s3_objects';
import { connectionStore } from '../../store/connectionStore';

export interface ObjectDetailsProps {
  bucketName: string;
  objectKey: string;
  objectSize?: number;
  lastModified?: string;
  connectionName: string;
}

export const ObjectDetailsPanel: Component<ObjectDetailsProps> = (props) => {
  const [isPublic, setIsPublic] = createSignal<boolean | null>(null);
  const [isLoadingAcl, setIsLoadingAcl] = createSignal(true);
  const [isTogglingAcl, setIsTogglingAcl] = createSignal(false);
  const [copied, setCopied] = createSignal(false);

  const findConnection = () => {
    return connectionStore.connections.find(c => c.name === props.connectionName);
  };

  const getPublicUrl = (): string => {
    const conn = findConnection();
    if (!conn) return '';

    try {
      const url = new URL(conn.endpoint);
      // Remove trailing slash from pathname
      const basePath = url.pathname.replace(/\/$/, '');
      // Construct the public URL: endpoint/bucketName/objectKey
      return `${url.protocol}//${url.host}${basePath}/${props.bucketName}/${props.objectKey}`;
    } catch {
      return '';
    }
  };

  const copyPublicUrl = async () => {
    const url = getPublicUrl();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
  };

  const fetchAcl = async () => {
    setIsLoadingAcl(true);
    const conn = findConnection();
    if (!conn) {
      setIsLoadingAcl(false);
      return;
    }
    try {
      const publicStatus = await isObjectPublic(conn, props.bucketName, props.objectKey);
      setIsPublic(publicStatus);
    } catch (e) {
      console.error('Failed to fetch object public status', e);
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
      await setObjectPublic(conn, props.bucketName, props.objectKey, newValue);
      setIsPublic(newValue);
    } catch (e) {
      console.error('Failed to update object access control', e);
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
        <div class="flex items-start gap-3">
          <div class="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <FileText size={20} />
          </div>
          <div class="min-w-0">
            <h2 class="text-lg font-bold text-primary truncate" title={props.objectKey}>
              {props.objectKey.split('/').pop() || props.objectKey}
            </h2>
            <p class="text-xs text-secondary mt-0.5 truncate" title={props.objectKey}>
              {props.objectKey}
            </p>
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

            {/* Public Link Section - Only shows when object is public */}
            <Show when={isPublic() === true && !isLoadingAcl()}>
              <div class="mt-3 pt-3 border-t border-slate-200">
                <span class="text-xs text-secondary uppercase font-medium mb-2 block">Public Link</span>
                <div class="flex items-center gap-2">
                  <div class="flex-1 bg-white p-2 rounded-md border border-slate-200 overflow-hidden">
                    <p class="text-xs text-primary font-mono truncate" title={getPublicUrl()}>
                      {getPublicUrl()}
                    </p>
                  </div>
                  <button
                    onClick={copyPublicUrl}
                    class={cn(
                      "p-2 rounded-md transition-all duration-200",
                      copied()
                        ? "bg-green-50 text-green-600"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                    title={copied() ? 'Copied!' : 'Copy link'}
                  >
                    <Show when={copied()} fallback={<Copy size={16} />}>
                      <Check size={16} />
                    </Show>
                  </button>
                </div>
              </div>
            </Show>
            <Show when={!isLoadingAcl() && isPublic() === null}>
              <span class="text-xs text-secondary italic">Unable to load access status.</span>
            </Show>
          </div>

          {/* Info Grid */}
          <div class="space-y-4">
            <div class="flex flex-col gap-1">
              <span class="text-xs text-secondary uppercase font-medium">File Name</span>
              <span class="text-sm text-primary font-medium bg-white p-2 rounded-md border border-slate-200 truncate">
                {props.objectKey.split('/').pop() || props.objectKey}
              </span>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs text-secondary uppercase font-medium">Size</span>
              <div class="flex items-center gap-2 bg-white p-2 rounded-md border border-slate-200">
                <HardDrive size={14} class="text-secondary" />
                <span class="text-sm text-primary">
                  {props.objectSize !== undefined ? `${(props.objectSize / 1024).toFixed(2)} KB` : 'Unknown'}
                </span>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs text-secondary uppercase font-medium">Last Modified</span>
              <div class="flex items-center gap-2 bg-white p-2 rounded-md border border-slate-200">
                <Calendar size={14} class="text-secondary" />
                <span class="text-sm text-primary">
                  {props.lastModified ? new Date(props.lastModified).toLocaleString() : 'Unknown'}
                </span>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs text-secondary uppercase font-medium">Key</span>
              <span class="text-sm text-primary font-mono bg-white p-2 rounded-md border border-slate-200 break-all text-xs">
                {props.objectKey}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
