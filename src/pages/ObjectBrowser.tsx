import { Component, createEffect, createResource, createSignal, For, Show } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { connectionStore, setActiveConnection } from '../store/connectionStore';
import { closePanel, openPanel, uiStore } from '../store/uiStore';
import { deleteObject, deleteObjects, getObjectUrl, getPublicObjects, listObjects, moveObject, uploadObject } from '../services/s3_objects';
import { isBucketPublic } from '../services/s3';
import { Layout } from '../components/Layout/Layout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ArrowUp, Check, CheckCircle2, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, Copy, Download, Eye, File, Folder, FolderPlus, GripVertical, Info, Loader2, Lock, Move, Trash2, Unlock, Upload, X } from 'lucide-solid';
import { FilePreviewDialog } from '../components/FilePreviewDialog';
import { getFileIcon, getFileType } from '../utils/fileTypeUtils';

interface UploadProgress {
    fileName: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
}

const ObjectBrowser: Component = () => {
  const params = useParams();
  const connection = () => connectionStore.connections.find(c => c.id === params.id);
  const bucketName = () => params.bucketName;

  createEffect(() => {
    if (params.id) {
      setActiveConnection(params.id);
    }
  });
  const [prefix, setPrefix] = createSignal('');
  const [isDragging, setIsDragging] = createSignal(false);
  const [uploads, setUploads] = createSignal<UploadProgress[]>([]);
  const [selectedItems, setSelectedItems] = createSignal<string[]>([]);
  const [showCreateFolder, setShowCreateFolder] = createSignal(false);
  const [newFolderName, setNewFolderName] = createSignal('');
  const [showMoveDialog, setShowMoveDialog] = createSignal(false);
  const [destinationPath, setDestinationPath] = createSignal('');
  const [draggedItem, setDraggedItem] = createSignal<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = createSignal<string | null>(null);
  const [moveBrowserPath, setMoveBrowserPath] = createSignal('');
  const [previewFile, setPreviewFile] = createSignal<string | null>(null);
  const [publicKeys, setPublicKeys] = createSignal<Set<string>>(new Set());
  const [copiedLink, setCopiedLink] = createSignal<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = createSignal(1);
  const [pageSize, setPageSize] = createSignal(25);
  
  // Sorting state
  type SortField = 'name' | 'size' | 'lastModified';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = createSignal<SortField>('name');
  const [sortDirection, setSortDirection] = createSignal<SortDirection>('asc');

  // Resource to fetch objects
  const [data, { refetch }] = createResource(
    () => ({ conn: connection(), bucket: bucketName(), prefix: prefix() }),
    async ({ conn, bucket, prefix }) => {
      if (!conn || !bucket) return { objects: [], folders: [] };
      try {
        setSelectedItems([]); // Clear selection on navigate
        const result = await listObjects(conn, bucket, prefix);
        // Fetch public objects state
        try {
          const keys = await getPublicObjects(conn, bucket);
          setPublicKeys(keys);
        } catch (e) {
          console.error('Failed to fetch public objects:', e);
          setPublicKeys(new Set<string>());
        }
        return result;
      } catch (e) {
        console.error(e);
        return { objects: [], folders: [] };
      }
    }
  );

  // Resource for move dialog browser
  const [moveBrowserData] = createResource(
    () => showMoveDialog() ? { conn: connection(), bucket: bucketName(), prefix: moveBrowserPath() } : null,
    async ({ conn, bucket, prefix }) => {
      if (!conn || !bucket) return { objects: [], folders: [] };
      try {
        return await listObjects(conn, bucket, prefix);
      } catch (e) {
        console.error(e);
        return { objects: [], folders: [] };
      }
    }
  );

  // Resource for bucket visibility
  const [bucketPublic] = createResource(
    () => ({ conn: connection(), bucket: bucketName() }),
    async ({ conn, bucket }) => {
      if (!conn || !bucket) return false;
      try {
        return await isBucketPublic(conn, bucket);
      } catch (e) {
        console.error('Failed to fetch bucket visibility:', e);
        return false;
      }
    }
  );

  const uploadFiles = async (files: FileList | File[]) => {
    const conn = connection();
    const bucket = bucketName();
    if (!conn || !bucket) return;

    const fileList = Array.from(files);
    
    // Initialize upload status
    const newUploads = fileList.map(file => ({
        fileName: file.name,
        progress: 0,
        status: 'uploading' as const
    }));
    setUploads(prev => [...prev, ...newUploads]);

    const uploadPromises = fileList.map(async (file) => {
        const key = prefix() + file.name;
        try {
            await uploadObject(conn, bucket, key, file);
            setUploads(prev => prev.map(u =>
                u.fileName === file.name && u.status === 'uploading'
                ? { ...u, progress: 100, status: 'completed' }
                : u
            ));
        } catch (e) {
            console.error(`Failed to upload ${file.name}`, e);
            setUploads(prev => prev.map(u =>
                u.fileName === file.name && u.status === 'uploading'
                ? { ...u, status: 'error', error: 'Upload failed' }
                : u
            ));
        }
    });

    await Promise.all(uploadPromises);
    refetch();
    
    // Clear completed/error uploads after some time
    setTimeout(() => {
        setUploads(prev => prev.filter(u => u.status === 'uploading'));
    }, 5000);
  };

  const handleUpload = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    
    await uploadFiles(input.files);
    input.value = '';
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only show full-screen upload overlay if dragging external files
    if (e.dataTransfer?.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only show full-screen upload overlay if dragging external files
    if (e.dataTransfer?.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const targetKey = dragOverTarget();
    setDragOverTarget(null);

    // Handle file uploads from OS - check this first since OS files don't have our custom data
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
      return;
    }

    // Check for internal drag (moving items within S3)
    const jsonDragData = e.dataTransfer?.getData('application/json');
    if (jsonDragData) {
      try {
        const dragData = JSON.parse(jsonDragData);
        const items = dragData.items as string[];
        
        if (!targetKey || items.length === 0) return;

        const conn = connection();
        const bucket = bucketName();
        if (!conn || !bucket) return;

        // Move each item to the target location
        const movePromises = items.map(async (sourceKey) => {
          // Skip if target is a prefix of the source (prevents moving folder into itself)
          if (targetKey && sourceKey.startsWith(targetKey)) return;
          
          const fileName = sourceKey.split('/').filter(Boolean).pop();
          const newKey = targetKey + (fileName || '') + (sourceKey.endsWith('/') ? '/' : '');

          if (newKey === sourceKey) return;

          return moveObject(conn, bucket, sourceKey, newKey);
        });

        await Promise.all(movePromises);
        
        // Clear selection after successful bulk move
        if (dragData.type === 'bulk') {
          setSelectedItems([]);
        }
        
        refetch();
      } catch (err) {
        console.error('Failed to move items:', err);
        alert('Failed to move items');
      }
      return;
    }

    // Fallback for legacy text/plain drag format (backward compatibility)
    const draggedData = e.dataTransfer?.getData('text/plain');
    if (draggedData && draggedData.startsWith('s3://')) {
      const sourceKey = draggedData.replace('s3://', '');
      
      if (!targetKey || sourceKey === targetKey) return;

      const conn = connection();
      const bucket = bucketName();
      if (!conn || !bucket) return;

      try {
        const fileName = sourceKey.split('/').filter(Boolean).pop();
        const newKey = targetKey + (fileName || '') + (sourceKey.endsWith('/') ? '/' : '');

        if (newKey === sourceKey) return;

        await moveObject(conn, bucket, sourceKey, newKey);
        refetch();
      } catch (err) {
        console.error('Failed to move item:', err);
        alert('Failed to move item');
      }
    }
  };

  const handleDelete = async (key: string) => {
      if(!confirm(`Delete ${key}?`)) return;
      const conn = connection();
      const bucket = bucketName();
      if(!conn || !bucket) return;
      
      try {
          await deleteObject(conn, bucket, key);
          refetch();
      } catch (e) {
          alert('Delete failed');
          console.error(e);
      }
  }

  const handleBulkDelete = async () => {
      const items = selectedItems();
      if (items.length === 0) return;
      if (!confirm(`Delete ${items.length} selected items?`)) return;

      const conn = connection();
      const bucket = bucketName();
      if (!conn || !bucket) return;

      try {
          await deleteObjects(conn, bucket, items);
          setSelectedItems([]);
          refetch();
      } catch (e) {
          alert('Bulk delete failed');
          console.error(e);
      }
  };

  const onDragStart = (key: string) => (e: DragEvent) => {
    const selected = selectedItems();
    const isItemSelected = selected.includes(key);

    // If the dragged item is selected and there are multiple selections, drag all
    if (isItemSelected && selected.length > 1) {
      // Bulk move: store JSON array of all selected items
      setDraggedItem(key);
      if (e.dataTransfer) {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'bulk', items: selected }));
        e.dataTransfer.setData('text/plain', `s3://bulk:${selected.length}`);
        e.dataTransfer.effectAllowed = 'move';
      }
    } else {
      // Single item drag
      setDraggedItem(key);
      if (e.dataTransfer) {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'single', items: [key] }));
        e.dataTransfer.setData('text/plain', `s3://${key}`);
        e.dataTransfer.effectAllowed = 'move';
      }
    }
  };

  const onDragEnd = () => {
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  const onRowDragOver = (folderKey: string) => (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only allow dropping on folders
    const dragged = draggedItem();
    if (!dragged || (folderKey !== dragged && !folderKey.startsWith(dragged))) {
      setDragOverTarget(folderKey);
    }
  };

  const onRowDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Clear drag over state when leaving the row
    const target = e.target as HTMLElement;
    if (!target.closest('tr')) {
      setDragOverTarget(null);
    }
  };

  const onRowDrop = (folderKey: string) => (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(folderKey);
    onDrop(e);
  };

  const getBreadcrumbPath = (index: number) => {
    const parts = prefix().split('/').filter(Boolean);
    if (index === -1) return ''; // Root
    return parts.slice(0, index + 1).join('/') + '/';
  };

  const onBreadcrumbDragOver = (index: number) => (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(getBreadcrumbPath(index));
  };

  const onBreadcrumbDrop = (index: number) => async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const targetPath = getBreadcrumbPath(index);
    setDragOverTarget(null);

    // Handle file uploads from OS
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
      return;
    }

    // Check for internal drag with JSON data format (bulk or single)
    const jsonDragData = e.dataTransfer?.getData('application/json');
    if (jsonDragData) {
      try {
        const dragData = JSON.parse(jsonDragData);
        const items = dragData.items as string[];
        
        if (!targetPath || items.length === 0) return;

        const conn = connection();
        const bucket = bucketName();
        if (!conn || !bucket) return;

        // Move each item to the target location
        const movePromises = items.map(async (sourceKey) => {
          // Skip if target is a prefix of the source
          if (targetPath && sourceKey.startsWith(targetPath)) return;
          
          const fileName = sourceKey.split('/').filter(Boolean).pop();
          const newKey = targetPath + (fileName || '') + (sourceKey.endsWith('/') ? '/' : '');

          if (newKey === sourceKey) return;

          return moveObject(conn, bucket, sourceKey, newKey);
        });

        await Promise.all(movePromises);
        
        // Clear selection after successful bulk move
        if (dragData.type === 'bulk') {
          setSelectedItems([]);
        }
        
        refetch();
      } catch (err) {
        console.error('Failed to move items:', err);
        alert('Failed to move items');
      }
      return;
    }

    // Fallback for legacy text/plain drag format (backward compatibility)
    const draggedData = e.dataTransfer?.getData('text/plain');
    if (draggedData && draggedData.startsWith('s3://')) {
      const sourceKey = draggedData.replace('s3://', '');
      if (!targetPath || sourceKey === targetPath) return;

      const conn = connection();
      const bucket = bucketName();
      if (!conn || !bucket) return;

      try {
        const fileName = sourceKey.split('/').filter(Boolean).pop();
        const newKey = targetPath + (fileName || '') + (sourceKey.endsWith('/') ? '/' : '');

        if (newKey === sourceKey) return;

        await moveObject(conn, bucket, sourceKey, newKey);
        refetch();
      } catch (err) {
        console.error('Failed to move item:', err);
        alert('Failed to move item');
      }
    }
  };

  const handleCreateFolder = async () => {
      const name = newFolderName().trim();
      if (!name) return;

      const conn = connection();
      const bucket = bucketName();
      if (!conn || !bucket) return;

      try {
          // S3 folder is just a 0-byte object with a trailing slash
          const key = prefix() + name + (name.endsWith('/') ? '' : '/');
          await uploadObject(conn, bucket, key, new Blob([], { type: 'application/x-directory' }));
          setNewFolderName('');
          setShowCreateFolder(false);
          refetch();
      } catch (e) {
          alert('Failed to create folder');
          console.error(e);
      }
  };

  const handleMove = async () => {
      const items = selectedItems();
      let dest = destinationPath().trim();
      if (items.length === 0) return;
      
      // Ensure destination ends with slash if not root
      if (dest && !dest.endsWith('/')) dest += '/';

      const conn = connection();
      const bucket = bucketName();
      if (!conn || !bucket) return;

      try {
          for (const key of items) {
              const fileName = key.split('/').filter(Boolean).pop();
              const newKey = dest + fileName + (key.endsWith('/') ? '/' : '');
              
              if (newKey === key) continue;

              await moveObject(conn, bucket, key, newKey);
          }
          setSelectedItems([]);
          setShowMoveDialog(false);
          setDestinationPath('');
          refetch();
      } catch (e) {
          alert('Failed to move items');
          console.error(e);
      }
  };
  
  const handleDownload = async (key: string) => {
      const conn = connection();
      const bucket = bucketName();
      if(!conn || !bucket) return;
      try {
          const url = await getObjectUrl(conn, bucket, key);
          window.open(url, '_blank');
      } catch (e) {
          alert('Failed to get download URL');
          console.error(e);
      }
  }

  // Helper function to check if an object is public
  const isObjectPublic = (key: string | undefined): boolean => {
    if (!key) return false;
    const keys = publicKeys();
    
    // Check exact match
    if (keys.has(key)) return true;
    
    // Check if any prefix pattern matches
    for (const pattern of keys) {
      if (pattern.endsWith('/*')) {
        const prefix = pattern.slice(0, -2);
        if (key.startsWith(prefix)) return true;
      }
    }
    
    return false;
  };

  // Helper function to get public URL for an object
  const getPublicUrl = (key: string): string => {
    const conn = connection();
    if (!conn) return '';
    const bucket = bucketName();
    if (!bucket) return '';

    try {
      const url = new URL(conn.endpoint);
      const basePath = url.pathname.replace(/\/$/, '');
      return `${url.protocol}//${url.host}${basePath}/${bucket}/${key}`;
    } catch {
      return '';
    }
  };

  const handleCopyPublicLink = async (key: string) => {
    const url = getPublicUrl(key);
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(key);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
  };

  const handleShowBucketDetails = () => {
      const conn = connection();
      if (!conn) return;

      // In ObjectBrowser, we don't necessarily have the bucket creation date loaded
      // We can open the panel with what we have.
      const isOpen = uiStore.isOpen && uiStore.viewType === 'BUCKET_DETAILS';

      if (isOpen && uiStore.data?.bucketName === bucketName()) {
          // Toggle off if already showing this bucket
          closePanel();
      } else {
          openPanel('BUCKET_DETAILS', {
              bucketName: bucketName(),
              connectionName: conn.name,
              endpoint: conn.endpoint,
              region: conn.region,
              creationDate: undefined, // Not available in this context
          });
      }
  }

  const handleShowObjectDetails = (key: string, size?: number, lastModified?: Date) => {
      const conn = connection();
      if (!conn) return;

      const isOpen = uiStore.isOpen && uiStore.viewType === 'OBJECT_DETAILS';

      if (isOpen && uiStore.data?.objectKey === key) {
          closePanel();
      } else {
          openPanel('OBJECT_DETAILS', {
              bucketName: bucketName(),
              connectionName: conn.name,
              objectKey: key,
              objectSize: size,
              lastModified: lastModified ? lastModified.toISOString() : undefined,
          });
      }
  }

  const navigateToFolder = (folderPrefix: string) => {
      setPrefix(folderPrefix);
  }

  const navigateUp = () => {
      const p = prefix();
      if (!p) return;
      const parts = p.split('/').filter(Boolean);
      parts.pop();
      setPrefix(parts.length ? parts.join('/') + '/' : '');
  }

  const moveBrowserUp = () => {
      const p = moveBrowserPath();
      if (!p) return;
      const parts = p.split('/').filter(Boolean);
      parts.pop();
      const newPath = parts.length ? parts.join('/') + '/' : '';
      setMoveBrowserPath(newPath);
      setDestinationPath(newPath);
  }

  const toggleSelect = (key: string) => {
      setSelectedItems(prev => 
          prev.includes(key) 
          ? prev.filter(k => k !== key) 
          : [...prev, key]
      );
  }

  const getFilteredObjects = () => {
    return data()?.objects.filter(obj => {
      // Filter out the folder object itself (matches prefix)
      if (obj.Key === prefix()) return false;
      // Filter out 0-byte objects with empty names (ghost rows)
      const name = obj.Key?.split('/').pop();
      if (!name && obj.Size === 0) return false;
      return true;
    }) || [];
  };

  // Sorting function
  const sortItems = <T extends { Key?: string; Prefix?: string; Size?: number; LastModified?: Date }>(items: T[]): T[] => {
    const field = sortField();
    const direction = sortDirection();
    
    return [...items].sort((a, b) => {
      let valueA: string | number | Date;
      let valueB: string | number | Date;

      if (field === 'name') {
        valueA = a.Key || a.Prefix || '';
        valueB = b.Key || b.Prefix || '';
      } else if (field === 'size') {
        valueA = a.Size || 0;
        valueB = b.Size || 0;
      } else if (field === 'lastModified') {
        valueA = a.LastModified || new Date(0);
        valueB = b.LastModified || new Date(0);
      } else {
        valueA = '';
        valueB = '';
      }

      // For folders, treat size and lastModified as -1 to sort them before files
      if (a.Prefix && (field === 'size' || field === 'lastModified')) {
        valueA = -1;
      }
      if (b.Prefix && (field === 'size' || field === 'lastModified')) {
        valueB = -1;
      }

      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Get sorted and paginated items
  const getPaginatedItems = () => {
    const allFolders = (data()?.folders || []).filter(f => f.Prefix).map(f => ({
      ...f,
      displayName: f.Prefix!.split('/').filter(Boolean).slice(-1)[0] || f.Prefix!
    }));
    
    const allObjects = getFilteredObjects();
    
    // Combine folders and objects, folders always first
    const allItems = [...allFolders, ...allObjects];
    
    // Sort all items
    const sortedItems = sortItems(allItems);
    
    // Pagination
    const page = currentPage();
    const size = pageSize();
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    
    return {
      items: sortedItems.slice(startIndex, endIndex),
      totalItems: sortedItems.length,
      totalPages: Math.ceil(sortedItems.length / size)
    };
  };

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortField() === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const toggleSelectAll = () => {
      const { items } = getPaginatedItems();
      const allKeys = items.map(item => (item as { Key?: string; Prefix?: string }).Key || (item as { Prefix?: string }).Prefix).filter(Boolean) as string[];

      if (allKeys.length > 0 && allKeys.every(key => selectedItems().includes(key))) {
          setSelectedItems(prev => prev.filter(k => !allKeys.includes(k)));
      } else {
          setSelectedItems(prev => {
              const newSelection = [...prev];
              for (const key of allKeys) {
                  if (!newSelection.includes(key)) {
                      newSelection.push(key);
                  }
              }
              return newSelection;
          });
      }
  }

  return (
    <div
      class="min-h-full"
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <Layout>
        <Show when={previewFile() && connection() && bucketName()}>
            <FilePreviewDialog
                isOpen={!!previewFile()}
                onClose={() => setPreviewFile(null)}
                connection={connection()!}
                bucketName={bucketName()!}
                fileKey={previewFile()!}
            />
        </Show>

        {/* Create Folder Dialog */}
        <Show when={showCreateFolder()}>
            <div class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                <Card class="w-full max-w-md p-6">
                    <h2 class="text-xl font-bold mb-4">Create New Folder</h2>
                    <Input 
                        placeholder="Folder name" 
                        value={newFolderName()} 
                        onInput={(e) => setNewFolderName(e.currentTarget.value)}
                        autofocus
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    />
                    <div class="flex justify-end gap-2 mt-6">
                        <Button variant="ghost" onClick={() => setShowCreateFolder(false)}>Cancel</Button>
                        <Button onClick={handleCreateFolder} disabled={!newFolderName().trim()}>Create</Button>
                    </div>
                </Card>
            </div>
        </Show>

        {/* Move Dialog */}
        <Show when={showMoveDialog()}>
            <div class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                <Card class="w-full max-w-md p-6">
                    <h2 class="text-xl font-bold mb-4">Move {selectedItems().length} items</h2>
                    <p class="text-sm text-secondary mb-2">Destination path (empty for root):</p>
                    <Input 
                        placeholder="e.g. documents/reports/" 
                        value={destinationPath()} 
                        onInput={(e) => setDestinationPath(e.currentTarget.value)}
                        autofocus
                        onKeyDown={(e) => e.key === 'Enter' && handleMove()}
                    />
                    
                    <div class="mt-4 border border-slate-200 rounded-md overflow-hidden">
                        <div class="bg-slate-50 p-2 border-b border-slate-200 flex items-center gap-2">
                            <Button variant="ghost" size="sm" disabled={!moveBrowserPath()} onClick={moveBrowserUp} class="h-8 w-8 p-0">
                                <ArrowUp size={16} />
                            </Button>
                            <span class="text-xs text-secondary truncate flex-1 font-mono" title={moveBrowserPath() || 'Root'}>
                                {moveBrowserPath() || '/'}
                            </span>
                        </div>
                        <div class="h-48 overflow-y-auto p-1 bg-white">
                            <Show when={moveBrowserData.loading}>
                                <div class="flex justify-center p-4"><Loader2 class="animate-spin text-primary" /></div>
                            </Show>
                            <Show when={!moveBrowserData.loading}>
                                <For each={moveBrowserData()?.folders}>
                                    {(folder) => (
                                        <div 
                                            class="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors"
                                            onClick={() => {
                                                setMoveBrowserPath(folder.Prefix!);
                                                setDestinationPath(folder.Prefix!);
                                            }}
                                        >
                                            <Folder size={16} class="text-yellow-500 shrink-0" />
                                            <span class="text-sm truncate text-primary">{folder.Prefix?.split('/').slice(-2)[0]}</span>
                                        </div>
                                    )}
                                </For>
                                <Show when={moveBrowserData()?.folders.length === 0}>
                                    <div class="text-center text-secondary text-xs p-4 italic">No subfolders</div>
                                </Show>
                            </Show>
                        </div>
                    </div>

                    <div class="flex justify-end gap-2 mt-6">
                        <Button variant="ghost" onClick={() => setShowMoveDialog(false)}>Cancel</Button>
                        <Button onClick={handleMove}>Move</Button>
                    </div>
                </Card>
            </div>
        </Show>

        <Show when={isDragging()}>
          <div class="fixed inset-0 bg-primary/10 border-4 border-dashed border-primary z-[60] flex items-center justify-center pointer-events-none">
            <div class="bg-white px-8 py-6 rounded-xl shadow-2xl flex flex-col items-center gap-4">
              <Upload size={48} class="text-primary animate-bounce" />
              <div class="text-center">
                <span class="text-2xl font-bold text-primary block">
                  Drop files to upload
                </span>
                <span class="text-secondary">to {prefix() || 'root'}</span>
              </div>
            </div>
          </div>
        </Show>

        <Show when={connection()} fallback={<div>Connection not found</div>}>
          <div class="flex justify-between items-center mb-6">
            <div>
              <div class="flex items-center gap-2 text-sm text-secondary mb-1">
                <A href={`/connections/${connection()?.id}/buckets`} class="hover:text-primary">
                  Buckets
                </A>
                <ChevronRight size={14} />
                <span class="font-medium text-primary">{bucketName()}</span>
              </div>
              <h1 class="text-2xl font-bold text-primary flex items-center gap-2">
                <Show when={bucketPublic()}>
                  <span title="Public bucket">
                    <Unlock size={20} class="text-green-500" />
                  </span>
                </Show>
                <Show when={!bucketPublic()}>
                  <span title="Private bucket">
                    <Lock size={20} class="text-slate-400" />
                  </span>
                </Show>
                <span
                  class={[
                    "cursor-pointer hover:underline transition-colors px-2 py-1 rounded",
                    dragOverTarget() === '' ? "bg-primary/20" : ""
                  ].join(" ")}
                  onClick={() => setPrefix('')}
                  onDragOver={onBreadcrumbDragOver(-1)}
                  onDrop={onBreadcrumbDrop(-1)}
                >
                  Root
                </span>
                <For each={prefix().split('/').filter(Boolean)}>
                  {(part, index) => (
                    <>
                      <ChevronRight size={20} class="text-secondary" />
                      <span
                        class={[
                          "cursor-pointer hover:underline transition-colors px-2 py-1 rounded",
                          dragOverTarget() === getBreadcrumbPath(index()) ? "bg-primary/20" : ""
                        ].join(" ")}
                        onClick={() => setPrefix(getBreadcrumbPath(index()))}
                        onDragOver={onBreadcrumbDragOver(index())}
                        onDrop={onBreadcrumbDrop(index())}
                      >
                        {part}
                      </span>
                    </>
                  )}
                </For>
              </h1>
            </div>
            <div class="flex gap-2">
              <Button variant="ghost" class="flex items-center gap-2" onClick={handleShowBucketDetails}>
                <Info size={18} />
                Bucket Details
              </Button>
              <Button variant="ghost" class="flex items-center gap-2" onClick={() => setShowCreateFolder(true)}>
                <FolderPlus size={18} />
                New Folder
              </Button>
              <label class="btn-primary flex items-center gap-2 cursor-pointer">
                <Upload size={18} />
                Upload
                <input type="file" multiple class="hidden" onChange={handleUpload} />
              </label>
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          <Show when={selectedItems().length > 0}>
            <div class="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                <div class="flex items-center gap-4">
                    <span class="text-sm font-medium text-primary">{selectedItems().length} items selected</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedItems([])}>Clear selection</Button>
                </div>
                <div class="flex gap-2">
                    <Button variant="ghost" size="sm" class="flex items-center gap-2" onClick={() => {
                        setDestinationPath(prefix());
                        setMoveBrowserPath(prefix());
                        setShowMoveDialog(true);
                    }}>
                        <Move size={16} />
                        Move
                    </Button>
                    <Button variant="ghost" size="sm" class="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleBulkDelete}>
                        <Trash2 size={16} />
                        Delete
                    </Button>
                </div>
            </div>
          </Show>

          <Show when={uploads().length > 0}>
            <div class="fixed bottom-6 right-6 w-80 z-50 flex flex-col gap-2">
              <For each={uploads()}>
                {(upload) => (
                  <div class="bg-white rounded-lg shadow-xl border border-slate-200 p-4 flex flex-col gap-2 animate-in slide-in-from-right-4">
                    <div class="flex justify-between items-start">
                      <div class="flex items-center gap-2 overflow-hidden">
                        <Show when={upload.status === 'uploading'}>
                          <Loader2 size={16} class="text-primary animate-spin shrink-0" />
                        </Show>
                        <Show when={upload.status === 'completed'}>
                          <CheckCircle2 size={16} class="text-green-500 shrink-0" />
                        </Show>
                        <Show when={upload.status === 'error'}>
                          <X size={16} class="text-red-500 shrink-0" />
                        </Show>
                        <span class="text-sm font-medium text-primary truncate">{upload.fileName}</span>
                      </div>
                      <button
                        class="text-secondary hover:text-primary"
                        onClick={() => setUploads((prev) => prev.filter((u) => u !== upload))}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        class="h-full transition-all duration-300"
                        style={{
                          width: `${upload.progress}%`,
                          'background-color':
                            upload.status === 'error'
                              ? '#ef4444'
                              : upload.status === 'completed'
                              ? '#22c55e'
                              : '#3b82f6',
                        }}
                      />
                    </div>
                    <Show when={upload.status === 'error'}>
                      <span class="text-xs text-red-500">{upload.error}</span>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>

          <Show when={prefix()}>
            <Button
              variant="ghost"
              class="mb-4 pl-0 hover:bg-transparent hover:text-primary"
              onClick={navigateUp}
            >
              <ChevronRight size={18} class="rotate-180" />
              Back
            </Button>
          </Show>

          <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-100 text-xs uppercase text-secondary font-medium">
                <tr>
                  <th class="px-6 py-4 w-10">
                      <input
                        type="checkbox"
                        class="rounded border-slate-300 text-primary focus:ring-primary"
                        checked={(() => {
                            const { items } = getPaginatedItems();
                            const allKeys = items.map(item => (item as { Key?: string; Prefix?: string }).Key || (item as { Prefix?: string }).Prefix).filter(Boolean) as string[];
                            return allKeys.length > 0 && allKeys.every(key => selectedItems().includes(key));
                        })()}
                        onClick={(e) => { e.stopPropagation(); toggleSelectAll(); }}
                      />
                  </th>
                  <th class="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleSort('name')}>
                    <div class="flex items-center gap-1">
                      Name
                      <Show when={sortField() === 'name'}>
                        <Show when={sortDirection() === 'asc'} fallback={<ChevronDown size={14} />}>
                          <ChevronUp size={14} />
                        </Show>
                      </Show>
                    </div>
                  </th>
                  <th class="px-6 py-4">Type</th>
                  <th class="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleSort('size')}>
                    <div class="flex items-center gap-1">
                      Size
                      <Show when={sortField() === 'size'}>
                        <Show when={sortDirection() === 'asc'} fallback={<ChevronDown size={14} />}>
                          <ChevronUp size={14} />
                        </Show>
                      </Show>
                    </div>
                  </th>
                  <th class="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleSort('lastModified')}>
                    <div class="flex items-center gap-1">
                      Last Modified
                      <Show when={sortField() === 'lastModified'}>
                        <Show when={sortDirection() === 'asc'} fallback={<ChevronDown size={14} />}>
                          <ChevronUp size={14} />
                        </Show>
                      </Show>
                    </div>
                  </th>
                  <th class="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <For each={getPaginatedItems().items}>
                  {(item) => {
                    const isFolder = 'Prefix' in item;
                    
                    if (isFolder) {
                      const folder = item as { Prefix?: string };
                      return (
                        <tr
                          class={[
                            "hover:bg-slate-50 transition-colors cursor-pointer group",
                            dragOverTarget() === folder.Prefix ? "bg-primary/10" : ""
                          ].join(" ")}
                          draggable={true}
                          onClick={() => folder.Prefix && navigateToFolder(folder.Prefix)}
                          onDragStart={folder.Prefix ? onDragStart(folder.Prefix) : undefined}
                          onDragEnd={onDragEnd}
                          onDragOver={folder.Prefix ? onRowDragOver(folder.Prefix) : undefined}
                          onDragLeave={onRowDragLeave}
                          onDrop={folder.Prefix ? onRowDrop(folder.Prefix) : undefined}
                        >
                          <td class="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                class="rounded border-slate-300 text-primary focus:ring-primary"
                                checked={folder.Prefix ? selectedItems().includes(folder.Prefix) : false}
                                onChange={() => folder.Prefix && toggleSelect(folder.Prefix)}
                              />
                          </td>
                          <td class="px-6 py-4 flex items-center gap-3">
                            <GripVertical size={16} class="text-slate-300 group-hover:text-slate-400 transition-colors" />
                            <Folder size={20} class={dragOverTarget() === folder.Prefix ? "text-primary fill-primary" : "text-yellow-500 fill-yellow-500"} />
                            <span class="font-medium text-primary">
                              {folder.Prefix?.split('/').slice(-2)[0]}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-secondary text-sm">Folder</td>
                          <td class="px-6 py-4 text-secondary text-sm">-</td>
                          <td class="px-6 py-4 text-secondary text-sm">-</td>
                          <td class="px-6 py-4" />
                        </tr>
                      );
                    } else {
                      const obj = item as { Key?: string; Size?: number; LastModified?: Date };
                      return (
                        <tr class="hover:bg-slate-50 transition-colors group" draggable={true} onDragStart={obj.Key ? onDragStart(obj.Key) : undefined} onDragEnd={onDragEnd}>
                          <td class="px-6 py-4">
                              <input
                                type="checkbox"
                                class="rounded border-slate-300 text-primary focus:ring-primary"
                                checked={obj.Key ? selectedItems().includes(obj.Key) : false}
                                onChange={() => obj.Key && toggleSelect(obj.Key)}
                              />
                          </td>
                          <td class="px-6 py-4 flex items-center gap-3">
                            <GripVertical size={16} class="text-slate-300 group-hover:text-slate-400 transition-colors cursor-grab" />
                            {obj.Key ? getFileIcon(obj.Key) : getFileIcon('')}
                            <span class="text-primary">{obj.Key?.split('/').pop()}</span>
                          </td>
                          <td class="px-6 py-4 text-secondary text-sm">
                            {obj.Key ? getFileType(obj.Key) : 'File'}
                          </td>
                          <td class="px-6 py-4 text-secondary text-sm">
                            {obj.Size ? (obj.Size / 1024).toFixed(1) + ' KB' : '0 KB'}
                          </td>
                          <td class="px-6 py-4 text-secondary text-sm">
                            {obj.LastModified ? new Date(obj.LastModified).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            }) : '-'}
                          </td>
                          <td class="px-6 py-4 text-right">
                            <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Show when={isObjectPublic(obj.Key)}>
                                <button
                                  class="p-2 hover:bg-blue-50 rounded text-blue-500 hover:text-blue-600 transition-colors"
                                  title="Copy Public Link"
                                  onClick={() => obj.Key && handleCopyPublicLink(obj.Key)}
                                >
                                  <Show when={copiedLink() === obj.Key} fallback={<Copy size={16} />}>
                                    <Check size={16} />
                                  </Show>
                                </button>
                              </Show>
                              <button
                                class="p-2 hover:bg-slate-200 rounded text-slate-500 hover:text-primary transition-colors"
                                title="Details"
                                onClick={() => obj.Key && handleShowObjectDetails(obj.Key, obj.Size, obj.LastModified)}
                              >
                                <Info size={16} />
                              </button>
                              <button
                                class="p-2 hover:bg-slate-200 rounded text-slate-500 hover:text-primary transition-colors"
                                title="Preview"
                                onClick={() => obj.Key && setPreviewFile(obj.Key)}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                class="p-2 hover:bg-slate-200 rounded text-slate-500 hover:text-primary transition-colors"
                                title="Download"
                                onClick={() => obj.Key && handleDownload(obj.Key)}
                              >
                                <Download size={16} />
                              </button>
                              <button
                                class="p-2 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                                title="Delete"
                                onClick={() => obj.Key && handleDelete(obj.Key)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  }}
                </For>
                <Show when={getPaginatedItems().totalItems === 0}>
                  <tr>
                    <td colspan={6} class="px-6 py-12 text-center text-secondary">
                      <File size={48} class="mx-auto mb-4 opacity-20" />
                      <p>This folder is empty.</p>
                    </td>
                  </tr>
                </Show>
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <Show when={getPaginatedItems().totalItems > 0}>
            <div class="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 rounded-b-xl">
              <div class="flex items-center gap-4 text-sm text-secondary">
                <span>
                  Showing {((currentPage() - 1) * pageSize() + 1)} to {Math.min(currentPage() * pageSize(), getPaginatedItems().totalItems)} of {getPaginatedItems().totalItems} items
                </span>
                <div class="flex items-center gap-2">
                  <span class="text-xs">Rows per page:</span>
                  <select
                    class="border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={pageSize()}
                    onChange={(e) => handlePageSizeChange(Number((e.target as HTMLSelectElement).value))}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-8 w-8 p-0"
                  disabled={currentPage() === 1}
                  onClick={() => handlePageChange(1)}
                >
                  <ChevronsLeft size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-8 w-8 p-0"
                  disabled={currentPage() === 1}
                  onClick={() => handlePageChange(currentPage() - 1)}
                >
                  <ChevronUp size={16} class="rotate-[-90deg]" />
                </Button>
                <div class="flex items-center gap-1">
                  <For each={Array.from({ length: getPaginatedItems().totalPages }, (_, i) => i + 1)}>
                    {(page) => (
                      <Button
                        variant={page === currentPage() ? "primary" : "ghost"}
                        size="sm"
                        class="h-8 w-8 p-0"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    )}
                  </For>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-8 w-8 p-0"
                  disabled={currentPage() === getPaginatedItems().totalPages}
                  onClick={() => handlePageChange(currentPage() + 1)}
                >
                  <ChevronDown size={16} class="rotate-90deg" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-8 w-8 p-0"
                  disabled={currentPage() === getPaginatedItems().totalPages}
                  onClick={() => handlePageChange(getPaginatedItems().totalPages)}
                >
                  <ChevronsRight size={16} />
                </Button>
              </div>
            </div>
          </Show>
        </Show>
      </Layout>
    </div>
  );
};

export default ObjectBrowser;
