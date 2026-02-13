import type { JSX } from 'solid-js';
import { File, FileArchive, FileAudio, FileCode, FileImage, FileText, FileVideo } from 'lucide-solid';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif', 'bmp', 'ico']);
const DOCUMENT_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'rtf']);
const TEXT_EXTENSIONS = new Set(['txt', 'md', 'json', 'xml', 'csv', 'yaml', 'yml', 'log']);
const CODE_EXTENSIONS = new Set([
  'js',
  'jsx',
  'ts',
  'tsx',
  'html',
  'css',
  'scss',
  'less',
  'py',
  'java',
  'go',
  'rs',
  'php',
  'rb',
  'c',
  'cpp',
  'h',
  'hpp',
  'sh',
  'sql',
]);
const ARCHIVE_EXTENSIONS = new Set(['zip', 'tar', 'gz', 'rar', '7z', 'bz2', 'xz']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v']);

const getObjectName = (fileKey: string): string => fileKey.split('/').filter(Boolean).pop() || fileKey;

export const getFileExtension = (fileKey: string): string => {
  const name = getObjectName(fileKey);
  const lastDotIndex = name.lastIndexOf('.');

  if (lastDotIndex < 0 || lastDotIndex === name.length - 1) {
    return '';
  }

  return name.slice(lastDotIndex + 1).toLowerCase();
};

export const getFileType = (fileKey: string): string => {
  const extension = getFileExtension(fileKey);

  if (!extension) return 'File';

  if (IMAGE_EXTENSIONS.has(extension)) return 'Image';
  if (DOCUMENT_EXTENSIONS.has(extension)) return 'Document';
  if (TEXT_EXTENSIONS.has(extension)) return 'Text';
  if (CODE_EXTENSIONS.has(extension)) return 'Code';
  if (ARCHIVE_EXTENSIONS.has(extension)) return 'Archive';
  if (AUDIO_EXTENSIONS.has(extension)) return 'Audio';
  if (VIDEO_EXTENSIONS.has(extension)) return 'Video';

  return 'File';
};

export const getFileIcon = (fileKey: string, className = 'text-slate-400'): JSX.Element => {
  const type = getFileType(fileKey);

  if (type === 'Image') return <FileImage size={20} class={className} />;
  if (type === 'Document' || type === 'Text') return <FileText size={20} class={className} />;
  if (type === 'Code') return <FileCode size={20} class={className} />;
  if (type === 'Archive') return <FileArchive size={20} class={className} />;
  if (type === 'Audio') return <FileAudio size={20} class={className} />;
  if (type === 'Video') return <FileVideo size={20} class={className} />;

  return <File size={20} class={className} />;
};
