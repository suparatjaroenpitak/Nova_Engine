import { create } from 'zustand';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import type {
  AIGenerationJob, AIGenerationRequest, AIModelInfo,
  AIGenerationMode, AIModel, ColabStatus,
} from '@/types/ai3d';
import { DEFAULT_GENERATION_OPTIONS, AI_MODELS } from '@/types/ai3d';
import { ai3dApi } from '@/api/ai3d';
import { useProjectStore } from './projectStore';

interface AIGenerationState {
  jobs: AIGenerationJob[];
  activeJobId: string | null;
  models: AIModelInfo[];
  selectedModel: AIModel;
  mode: AIGenerationMode;
  prompt: string;
  imageFile: File | null;
  referenceFile: File | null;
  colabStatus: ColabStatus | null;
  connected: boolean;
  generating: boolean;
  error: string | null;

  setMode: (mode: AIGenerationMode) => void;
  setSelectedModel: (model: AIModel) => void;
  setPrompt: (prompt: string) => void;
  setImageFile: (file: File | null) => void;
  setReferenceFile: (file: File | null) => void;
  submitJob: () => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  loadJobs: () => Promise<void>;
  fetchColabStatus: () => Promise<void>;
  connectHub: () => Promise<void>;
  disconnectHub: () => void;
  clearError: () => void;
}

export const useAIGenerationStore = create<AIGenerationState>((set, get) => ({
  jobs: [],
  activeJobId: null,
  models: AI_MODELS,
  selectedModel: 'trellis',
  mode: 'text-to-3d',
  prompt: '',
  imageFile: null,
  referenceFile: null,
  colabStatus: null,
  connected: false,
  generating: false,
  error: null,

  setMode: (mode) => set({ mode }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setPrompt: (prompt) => set({ prompt }),
  setImageFile: (file) => set({ imageFile: file }),
  setReferenceFile: (file) => set({ referenceFile: file }),
  clearError: () => set({ error: null }),

  submitJob: async () => {
    const state = get();
    const projectId = useProjectStore.getState().currentProject?.id;
    if (!projectId) { set({ error: 'No project selected' }); return; }

    set({ generating: true, error: null });
    try {
      const request: AIGenerationRequest = {
        mode: state.mode,
        model: state.selectedModel,
        prompt: state.mode === 'text-to-3d' ? state.prompt : undefined,
        imageUrl: state.imageFile ? URL.createObjectURL(state.imageFile) : undefined,
        options: DEFAULT_GENERATION_OPTIONS,
      };
      const job = await ai3dApi.submitJob({ projectId, request });
      set((s) => ({ jobs: [job, ...s.jobs], activeJobId: job.id, generating: false }));
    } catch (e: any) {
      set({ error: e?.message || 'Failed to submit job', generating: false });
    }
  },

  cancelJob: async (jobId) => {
    try {
      await ai3dApi.cancelJob(jobId);
      set((s) => ({
        jobs: s.jobs.map((j) => j.id === jobId ? { ...j, status: 'cancelled' } : j),
        activeJobId: s.activeJobId === jobId ? null : s.activeJobId,
      }));
    } catch (e: any) {
      set({ error: e?.message || 'Failed to cancel job' });
    }
  },

  retryJob: async (jobId) => {
    try {
      const job = await ai3dApi.retryJob(jobId);
      set((s) => ({ jobs: s.jobs.map((j) => j.id === jobId ? job : j) }));
    } catch (e: any) {
      set({ error: e?.message || 'Failed to retry job' });
    }
  },

  loadJobs: async () => {
    const projectId = useProjectStore.getState().currentProject?.id;
    if (!projectId) return;
    try {
      const jobs = await ai3dApi.listJobs(projectId);
      set({ jobs });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to load jobs' });
    }
  },

  fetchColabStatus: async () => {
    try {
      const status = await ai3dApi.colabStatus();
      set({ colabStatus: status });
    } catch {}
  },

  connectHub: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const connection = new HubConnectionBuilder()
        .withUrl(`${import.meta.env.VITE_API_URL || ''}/hubs/generation`, {
          accessTokenFactory: () => token || '',
        })
        .configureLogging(LogLevel.Warning)
        .withAutomaticReconnect()
        .build();

      connection.on('JobProgress', (jobId: string, progress: number) => {
        set((s) => ({
          jobs: s.jobs.map((j) => j.id === jobId ? { ...j, progress } : j),
        }));
      });

      connection.on('JobCompleted', (job: AIGenerationJob) => {
        set((s) => ({
          jobs: s.jobs.map((j) => j.id === job.id ? job : j),
          activeJobId: s.activeJobId === job.id ? null : s.activeJobId,
          generating: false,
        }));
      });

      connection.on('JobFailed', (jobId: string, error: string) => {
        set((s) => ({
          jobs: s.jobs.map((j) => j.id === jobId ? { ...j, status: 'failed', error } : j),
          activeJobId: s.activeJobId === jobId ? null : s.activeJobId,
          generating: false,
        }));
      });

      await connection.start();
      set({ connected: true });
      get().fetchColabStatus();
    } catch (e: any) {
      set({ connected: false, error: 'Failed to connect to generation hub' });
    }
  },

  disconnectHub: () => {
    set({ connected: false });
  },
}));
