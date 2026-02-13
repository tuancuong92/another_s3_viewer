import { Component, Show, createSignal, createEffect, createMemo } from 'solid-js';
import { X, Loader2, Download, FileText, Image as ImageIcon, Film, Music, File, Table, Code, Eye } from 'lucide-solid';
import { Button } from './ui/Button';
import { S3Connection } from '../store/connectionStore';
import { getObjectContent, getObjectUrl } from '../services/s3_objects';

interface FilePreviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    connection: S3Connection;
    bucketName: string;
    fileKey: string;
}

export const FilePreviewDialog: Component<FilePreviewDialogProps> = (props) => {
    const [contentUrl, setContentUrl] = createSignal<string | null>(null);
    const [textContent, setTextContent] = createSignal<string | null>(null);
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [viewMode, setViewMode] = createSignal<'raw' | 'pretty' | 'table'>('raw');

    createEffect(async () => {
        if (props.isOpen && props.fileKey) {
            setLoading(true);
            setError(null);
            setContentUrl(null);
            setTextContent(null);

            const extension = props.fileKey.split('.').pop()?.toLowerCase();
            if (extension === 'json') setViewMode('pretty');
            else if (extension === 'csv') setViewMode('table');
            else setViewMode('raw');

            try {
                const url = await getObjectUrl(props.connection, props.bucketName, props.fileKey);
                setContentUrl(url);

                const isText = ['txt', 'json', 'md', 'csv', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'xml', 'yml', 'yaml', 'log', 'svg'].includes(extension || '');

                if (isText) {
                    const text = await getObjectContent(props.connection, props.bucketName, props.fileKey);
                    setTextContent(text || '');
                }
            } catch (e: any) {
                setError(e.message || 'Failed to load file');
            } finally {
                setLoading(false);
            }
        }
    });

    const getFileType = (key: string) => {
        const extension = key.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico'].includes(extension || '')) return 'image';
        if (['svg'].includes(extension || '')) return 'svg';
        if (['mp4', 'webm', 'ogg', 'mov'].includes(extension || '')) return 'video';
        if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension || '')) return 'audio';
        if (['pdf'].includes(extension || '')) return 'pdf';
        if (['txt', 'json', 'md', 'csv', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'xml', 'yml', 'yaml', 'log'].includes(extension || '')) return 'text';
        return 'other';
    };

    const extension = () => props.fileKey.split('.').pop()?.toLowerCase();

    const jsonContent = createMemo(() => {
        if (extension() !== 'json' || !textContent()) return null;
        try {
            return JSON.stringify(JSON.parse(textContent()!), null, 2);
        } catch (e) {
            return null;
        }
    });

    const csvContent = createMemo(() => {
        if (extension() !== 'csv' || !textContent()) return null;
        return textContent()!.split('\n').map(row => row.split(','));
    });

    return (
        <Show when={props.isOpen}>
            <div class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={props.onClose}>
                <div class="bg-white w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <div class="flex items-center gap-3 overflow-hidden">
                            <div class="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                                {(() => {
                                    const type = getFileType(props.fileKey);
                                    switch(type) {
                                        case 'image': return <ImageIcon size={20} />;
                                        case 'video': return <Film size={20} />;
                                        case 'audio': return <Music size={20} />;
                                        case 'text': return <FileText size={20} />;
                                        default: return <File size={20} />;
                                    }
                                })()}
                            </div>
                            <div class="flex flex-col overflow-hidden">
                                <h2 class="text-lg font-bold text-slate-800 truncate" title={props.fileKey}>
                                    {props.fileKey.split('/').pop()}
                                </h2>
                                <span class="text-xs text-slate-500 truncate font-mono">{props.fileKey}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <Show when={extension() === 'json'}>
                                <div class="flex bg-slate-100 rounded-lg p-1 mr-2">
                                    <button
                                        onClick={() => setViewMode('pretty')}
                                        class={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode() === 'pretty' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Eye size={14} />
                                        Pretty
                                    </button>
                                    <button
                                        onClick={() => setViewMode('raw')}
                                        class={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode() === 'raw' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Code size={14} />
                                        Raw
                                    </button>
                                </div>
                            </Show>
                            <Show when={extension() === 'csv'}>
                                <div class="flex bg-slate-100 rounded-lg p-1 mr-2">
                                    <button
                                        onClick={() => setViewMode('table')}
                                        class={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode() === 'table' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Table size={14} />
                                        Table
                                    </button>
                                    <button
                                        onClick={() => setViewMode('raw')}
                                        class={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode() === 'raw' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Code size={14} />
                                        Raw
                                    </button>
                                </div>
                            </Show>

                            <Show when={contentUrl()}>
                                <a 
                                    href={contentUrl()!}
                                    download={props.fileKey.split('/').pop()}
                                    target="_blank"
                                    class="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium"
                                    title="Download"
                                >
                                    <Download size={18} />
                                    <span class="hidden sm:inline">Download</span>
                                </a>
                            </Show>
                            <div class="w-px h-6 bg-slate-200 mx-1"></div>
                            <button 
                                onClick={props.onClose} 
                                class="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Content */}
                    <div class="flex-1 overflow-hidden bg-slate-100 relative flex items-center justify-center">
                        <Show when={loading()}>
                            <div class="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                                <Loader2 class="animate-spin text-primary mb-2" size={40} />
                                <span class="text-slate-500 font-medium">Loading preview...</span>
                            </div>
                        </Show>
                        
                        <Show when={!loading() && error()}>
                            <div class="text-center p-8 max-w-md">
                                <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                    <X size={32} />
                                </div>
                                <h3 class="text-lg font-bold text-slate-800 mb-2">Failed to load content</h3>
                                <p class="text-slate-500 mb-6">{error()}</p>
                                <Button onClick={props.onClose} variant="secondary">Close Preview</Button>
                            </div>
                        </Show>

                        <Show when={!loading() && !error() && contentUrl()}>
                            <div class="w-full h-full overflow-auto flex items-center justify-center p-4">
                                {(() => {
                                    const type = getFileType(props.fileKey);
                                    switch (type) {
                                        case 'image':
                                        case 'svg':
                                            return <img src={contentUrl()!} alt={props.fileKey} class="max-w-full max-h-full object-contain shadow-lg rounded-lg bg-[url('/checkerboard.svg')] bg-white" />;
                                        case 'video':
                                            return <video src={contentUrl()!} controls class="max-w-full max-h-full shadow-lg rounded-lg bg-black" />;
                                        case 'audio':
                                            return (
                                                <div class="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center gap-4 w-full max-w-md">
                                                    <div class="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                                                        <Music size={48} />
                                                    </div>
                                                    <h3 class="font-medium text-slate-800 truncate w-full text-center">{props.fileKey.split('/').pop()}</h3>
                                                    <audio src={contentUrl()!} controls class="w-full" />
                                                </div>
                                            );
                                        case 'pdf':
                                            return <iframe src={contentUrl()!} class="w-full h-full shadow-lg bg-white rounded-lg" />;
                                        case 'text':
                                            return (
                                                <div class="w-full h-full bg-white shadow-lg overflow-auto rounded-lg border border-slate-200">
                                                    <Show when={extension() === 'json' && viewMode() === 'pretty' && jsonContent()} fallback={
                                                        <Show when={extension() === 'csv' && viewMode() === 'table' && csvContent()} fallback={
                                                            <pre class="p-4 text-sm font-mono text-slate-800 whitespace-pre-wrap break-words">
                                                                {textContent()}
                                                            </pre>
                                                        }>
                                                            <div class="w-full h-full overflow-auto">
                                                                <table class="w-full border-collapse text-sm text-left">
                                                                    <thead>
                                                                        <tr>
                                                                            {csvContent()![0]?.map((header: string) => (
                                                                                <th class="border-b border-r last:border-r-0 border-slate-200 p-3 bg-slate-50 font-semibold text-slate-600 sticky top-0 z-10 whitespace-nowrap">
                                                                                    {header}
                                                                                </th>
                                                                            ))}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {csvContent()!.slice(1).map((row: string[]) => (
                                                                            <tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                                                {row.map((cell: string) => (
                                                                                    <td class="border-r last:border-r-0 border-slate-100 p-2 text-slate-700 whitespace-nowrap max-w-xs truncate" title={cell}>
                                                                                        {cell}
                                                                                    </td>
                                                                                ))}
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </Show>
                                                    }>
                                                        <pre class="p-4 text-sm font-mono text-slate-800 whitespace-pre-wrap break-words">
                                                            {jsonContent()}
                                                        </pre>
                                                    </Show>
                                                </div>
                                            );
                                        default:
                                            return (
                                                <div class="text-center text-slate-500 bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md">
                                                    <File size={48} class="mx-auto mb-4 text-slate-300" />
                                                    <p class="mb-2 font-medium text-slate-800">No preview available</p>
                                                    <p class="text-sm mb-6">This file type cannot be previewed directly.</p>
                                                    <Button onClick={() => window.open(contentUrl()!, '_blank')}>
                                                        Download to View
                                                    </Button>
                                                </div>
                                            );
                                    }
                                })()}
                            </div>
                        </Show>
                    </div>
                </div>
            </div>
        </Show>
    );
};