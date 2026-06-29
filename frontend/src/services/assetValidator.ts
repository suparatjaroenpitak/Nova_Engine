import type { DropFile, FileType, FileCategory } from '@/types/import';
import { FILE_TYPE_EXTENSIONS, CATEGORY_BY_EXTENSION } from '@/types/import';

export function classifyFile(file: File): { type: FileType; category: FileCategory } | null {
  const ext = getExtension(file.name);
  if (!ext) return null;
  const type = FILE_TYPE_EXTENSIONS[ext];
  if (!type) return null;
  return { type, category: CATEGORY_BY_EXTENSION[ext] || 'unknown' };
}

export function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot === -1) return '';
  return filename.slice(dot).toLowerCase();
}

export function getMimeType(filename: string): string {
  const map: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
    '.tga': 'image/tga', '.tif': 'image/tiff', '.tiff': 'image/tiff', '.bmp': 'image/bmp',
    '.exr': 'image/exr', '.hdr': 'image/vnd.radiance',
    '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.obj': 'model/obj',
    '.fbx': 'model/fbx', '.stl': 'model/stl', '.usd': 'model/usd', '.usdz': 'model/usdz',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.flac': 'audio/flac',
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
    '.ttf': 'font/ttf', '.otf': 'font/otf',
    '.cs': 'text/plain', '.json': 'application/json', '.xml': 'application/xml', '.yaml': 'text/yaml',
    '.zip': 'application/zip', '.tar': 'application/x-tar', '.gz': 'application/gzip',
    '.mat': 'application/octet-stream',
  };
  return map[getExtension(filename)] || 'application/octet-stream';
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  duplicates: string[];
  totalSize: number;
  fileCount: number;
}

export function validateFiles(files: DropFile[], existingNames: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const duplicates: string[] = [];
  let totalSize = 0;

  const MAX_SIZE = 2 * 1024 * 1024 * 1024;
  const MAX_FILES = 1000;

  for (const f of files) {
    totalSize += f.size;

    if (f.category === 'unknown') {
      warnings.push(`"${f.name}" has unrecognized format and will be skipped`);
    }

    if (existingNames.includes(f.name)) {
      duplicates.push(f.name);
    }
  }

  if (files.length > MAX_FILES) {
    errors.push(`Too many files (${files.length}). Max is ${MAX_FILES}.`);
  }

  if (totalSize > MAX_SIZE) {
    errors.push(`Total size (${(totalSize / 1e9).toFixed(1)} GB) exceeds limit (2 GB)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    duplicates: [...new Set(duplicates)],
    totalSize,
    fileCount: files.length,
  };
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export async function* iterateFiles(entries: FileSystemEntry[]): AsyncGenerator<{ file: File; path: string }> {
  const queue: { entry: FileSystemEntry; parentPath: string }[] = entries.map((e) => ({ entry: e, parentPath: '' }));

  while (queue.length > 0) {
    const { entry, parentPath } = queue.shift()!;
    const fullPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve, reject) => fileEntry.file(resolve, reject));
      Object.defineProperty(file, 'webkitRelativePath', { value: fullPath });
      yield { file, path: fullPath };
    } else if (entry.isDirectory) {
      const dirReader = (entry as FileSystemDirectoryEntry).createReader();
      const subEntries = await new Promise<FileSystemEntry[]>((resolve, reject) => dirReader.readEntries(resolve, reject));
      for (const sub of subEntries) {
        queue.push({ entry: sub, parentPath: fullPath });
      }
    }
  }
}
