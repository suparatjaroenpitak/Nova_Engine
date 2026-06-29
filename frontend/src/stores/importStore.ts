import { create } from 'zustand';
import type { DropFile, ImportJob, ImportSettings, UploadProgress, FileCategory } from '@/types/import';
import { DEFAULT_IMPORT_SETTINGS } from '@/types/import';
import { validateFiles } from '@/services/assetValidator';
import { buildFileTree, flattenTreeStats } from '@/services/importService';
import type { FileTreeNode } from '@/services/importService';

interface ImportState {
  isDragging: boolean;
  dragFiles: DropFile[];
  dragCount: number;
  dragCategories: FileCategory[];
  dragOverPanel: string | null;
  activeDropZone: string | null;

  importJobs: ImportJob[];
  activeJobId: string | null;
  importSettings: ImportSettings;
  currentPreset: string;

  uploadQueue: UploadProgress[];
  showImportDialog: boolean;
  pendingImport: DropFile[] | null;

  existingAssetNames: string[];
  fileTree: FileTreeNode | null;

  setDragging: (dragging: boolean) => void;
  setDragFiles: (files: DropFile[]) => void;
  setDragOverPanel: (panel: string | null) => void;
  setActiveDropZone: (zone: string | null) => void;
  acceptDrop: (files: DropFile[]) => void;
  dismissDrop: () => void;

  showImportSettings: (files: DropFile[]) => void;
  hideImportSettings: () => void;
  updateImportSettings: (settings: Partial<ImportSettings>) => void;
  setPreset: (preset: string) => void;

  startImport: (projectId: string) => Promise<void>;
  cancelJob: (jobId: string) => void;
  cancelAllJobs: () => void;

  updateUploadProgress: (progress: UploadProgress) => void;
  clearCompletedUploads: () => void;
  setExistingAssetNames: (names: string[]) => void;
}

export const useImportStore = create<ImportState>((set, get) => ({
  isDragging: false,
  dragFiles: [],
  dragCount: 0,
  dragCategories: [],
  dragOverPanel: null,
  activeDropZone: null,
  importJobs: [],
  activeJobId: null,
  importSettings: { ...DEFAULT_IMPORT_SETTINGS },
  currentPreset: 'default',
  uploadQueue: [],
  showImportDialog: false,
  pendingImport: null,
  existingAssetNames: [],
  fileTree: null,

  setDragging: (dragging) => set({ isDragging: dragging }),
  setDragFiles: (files) => {
    const tree = buildFileTree(files);
    const stats = flattenTreeStats(tree);
    set({
      dragFiles: files,
      dragCount: stats.count,
      dragCategories: [...stats.categories],
      fileTree: tree,
    });
  },
  setDragOverPanel: (panel) => set({ dragOverPanel: panel }),
  setActiveDropZone: (zone) => set({ activeDropZone: zone }),

  acceptDrop: (files) => {
    const { existingAssetNames } = get();
    const validation = validateFiles(files, existingAssetNames);
    if (!validation.valid) return;
    set({ showImportDialog: true, pendingImport: files, isDragging: false, dragFiles: [], fileTree: null });
  },

  dismissDrop: () => set({ isDragging: false, dragFiles: [], dragCount: 0, dragCategories: [], dragOverPanel: null, activeDropZone: null, pendingImport: null, showImportDialog: false, fileTree: null }),

  showImportSettings: (files) => {
    const tree = buildFileTree(files);
    set({ showImportDialog: true, pendingImport: files, fileTree: tree });
  },

  hideImportSettings: () => set({ showImportDialog: false, pendingImport: null, fileTree: null }),

  updateImportSettings: (settings) =>
    set((s) => ({ importSettings: { ...s.importSettings, ...settings } })),

  setPreset: (preset) => set({ currentPreset: preset }),

  startImport: async (projectId) => {
    const { pendingImport, importSettings } = get();
    if (!pendingImport || !pendingImport.length) return;

    const jobId = crypto.randomUUID();
    const job: ImportJob = {
      id: jobId,
      projectId,
      files: pendingImport,
      status: 'queued',
      progress: 0,
      settings: importSettings,
      results: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((s) => ({ importJobs: [job, ...s.importJobs], activeJobId: jobId, showImportDialog: false, pendingImport: null }));

    try {
      set((s) => ({
        importJobs: s.importJobs.map((j) => j.id === jobId ? { ...j, status: 'validating' as const } : j),
      }));

      // Simulate pipeline progress
      const steps = ['validating', 'importing', 'optimizing', 'generating', 'completed'] as const;
      for (const step of steps) {
        await new Promise((r) => setTimeout(r, 300));
        set((s) => ({
          importJobs: s.importJobs.map((j) => j.id === jobId ? {
            ...j, status: step, progress: step === 'completed' ? 100 : j.progress + 25,
          } : j),
        }));
      }
    } catch (e: any) {
      set((s) => ({
        importJobs: s.importJobs.map((j) => j.id === jobId ? { ...j, status: 'failed' as const, error: e.message } : j),
      }));
    }
  },

  cancelJob: (jobId) => {
    set((s) => ({
      importJobs: s.importJobs.map((j) => j.id === jobId ? { ...j, status: 'cancelled' as const } : j),
      activeJobId: s.activeJobId === jobId ? null : s.activeJobId,
    }));
  },

  cancelAllJobs: () => {
    set((s) => ({
      importJobs: s.importJobs.map((j) => j.status === 'queued' || j.status === 'validating' || j.status === 'importing' ? { ...j, status: 'cancelled' as const } : j),
      activeJobId: null,
    }));
  },

  updateUploadProgress: (progress) =>
    set((s) => ({
      uploadQueue: [...s.uploadQueue.filter((u) => u.fileId !== progress.fileId), progress],
    })),

  clearCompletedUploads: () =>
    set((s) => ({
      uploadQueue: s.uploadQueue.filter((u) => u.status !== 'completed'),
    })),

  setExistingAssetNames: (names) => set({ existingAssetNames: names }),
}));
