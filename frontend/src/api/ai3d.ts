import api from './client';
import type { AIGenerationRequest, AIGenerationJob, AIGenerationResult, AIModelInfo, ColabStatus } from '@/types/ai3d';

export const ai3dApi = {
  listModels: () => api.get<AIModelInfo[]>('/ai-generation/models'),
  colabStatus: () => api.get<ColabStatus>('/ai-generation/colab-status'),
  submitJob: (data: { projectId: string; request: AIGenerationRequest }) =>
    api.post<AIGenerationJob>('/ai-generation/jobs', data),
  listJobs: (projectId: string) =>
    api.get<AIGenerationJob[]>(`/ai-generation/jobs/project/${projectId}`),
  getJob: (jobId: string) =>
    api.get<AIGenerationJob>(`/ai-generation/jobs/${jobId}`),
  cancelJob: (jobId: string) =>
    api.post(`/ai-generation/jobs/${jobId}/cancel`),
  retryJob: (jobId: string) =>
    api.post<AIGenerationJob>(`/ai-generation/jobs/${jobId}/retry`),
  downloadResult: (jobId: string) =>
    api.get(`/ai-generation/jobs/${jobId}/download`, { responseType: 'blob' }),
};
