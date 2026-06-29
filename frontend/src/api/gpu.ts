import api from './client';
import type { GpuJobDto } from '@/types';

export const gpuApi = {
  list: (projectId: string) => api.get<GpuJobDto[]>(`/gpu-jobs/project/${projectId}`),
  get: (id: string) => api.get<GpuJobDto>(`/gpu-jobs/${id}`),
  submit: (data: { type: string; gpu: string; payloadJson: string }) =>
    api.post<GpuJobDto>('/gpu-jobs', data),
  cancel: (id: string) => api.delete(`/gpu-jobs/${id}`),
};
