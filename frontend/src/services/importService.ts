import { classifyFile } from './assetValidator';
import type { DropFile, FileCategory } from '@/types/import';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const importApi = {
  uploadChunk: (projectId: string, formData: FormData, signal?: AbortSignal) =>
    fetch(`${BASE_URL}/api/v1/import/upload-chunk`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` },
      body: formData,
      signal,
    }),

  finalizeUpload: (data: { fileId: string; fileName: string; totalChunks: number; projectId: string }) =>
    fetch(`${BASE_URL}/api/v1/import/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` },
      body: JSON.stringify(data),
    }),

  startImport: (data: { projectId: string; files: { fileId: string; fileName: string; fileSize: number; type: string; category: string }[]; settings: any }) =>
    fetch(`${BASE_URL}/api/v1/import/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` },
      body: JSON.stringify(data),
    }),

  getImportJob: (jobId: string) =>
    fetch(`${BASE_URL}/api/v1/import/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` },
    }).then((r) => r.json()),
};

export async function scanDropItems(items: DataTransferItem[]): Promise<DropFile[]> {
  const result: DropFile[] = [];

  for (const item of items) {
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry?.();
      if (entry?.isDirectory) {
        await scanDirectory(entry as FileSystemDirectoryEntry, result);
      } else {
        const file = item.getAsFile();
        if (file) {
          const classified = classifyFile(file);
          result.push({
            id: crypto.randomUUID(),
            name: file.name,
            path: file.name,
            size: file.size,
            type: classified?.type || 'unknown' as any,
            category: classified?.category || 'unknown',
            file,
            relativePath: file.name,
            isDirectory: false,
            lastModified: file.lastModified,
          });
        }
      }
    }
  }

  return result;
}

async function scanDirectory(entry: FileSystemDirectoryEntry, result: DropFile[], path = ''): Promise<void> {
  const reader = entry.createReader();

  const readBatch = (): Promise<void> => {
    return new Promise((resolve) => {
      reader.readEntries(async (entries) => {
        if (entries.length === 0) { resolve(); return; }

        for (const sub of entries) {
          const subPath = path ? `${path}/${sub.name}` : sub.name;
          if (sub.isDirectory) {
            await scanDirectory(sub as FileSystemDirectoryEntry, result, subPath);
          } else if (sub.isFile) {
            const fileEntry = sub as FileSystemFileEntry;
            const file = await new Promise<File>((resolveFile) => fileEntry.file(resolveFile));
            Object.defineProperty(file, 'webkitRelativePath', { value: subPath });
            const classified = classifyFile(file);
            result.push({
              id: crypto.randomUUID(),
              name: file.name,
              path: subPath,
              size: file.size,
              type: classified?.type || 'unknown' as any,
              category: classified?.category || 'unknown',
              file,
              relativePath: subPath,
              isDirectory: false,
              lastModified: file.lastModified,
            });
          }
        }
        await readBatch();
      });
    });
  };

  await readBatch();
}

export function buildFileTree(files: DropFile[]): FileTreeNode {
  const root: FileTreeNode = { name: '', children: {}, files: [] };

  for (const f of files) {
    const parts = f.path.replace(/\\/g, '/').split('/');
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node.children[parts[i]]) {
        node.children[parts[i]] = { name: parts[i], children: {}, files: [] };
      }
      node = node.children[parts[i]];
    }
    node.files.push(f);
  }

  return root;
}

export interface FileTreeNode {
  name: string;
  children: Record<string, FileTreeNode>;
  files: DropFile[];
}

export function flattenTreeStats(root: FileTreeNode): { count: number; totalSize: number; categories: Set<FileCategory> } {
  const count = root.files.length;
  const totalSize = root.files.reduce((s, f) => s + f.size, 0);
  const categories = new Set(root.files.map((f) => f.category));
  const childStats = Object.values(root.children).map(flattenTreeStats);
  return {
    count: count + childStats.reduce((s, c) => s + c.count, 0),
    totalSize: totalSize + childStats.reduce((s, c) => s + c.totalSize, 0),
    categories: new Set([...categories, ...childStats.flatMap((c) => [...c.categories])]),
  };
}
