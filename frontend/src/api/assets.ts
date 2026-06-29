import api from './client';
import type { AssetDto } from '@/types';

export const assetsApi = {
  list: (projectId: string) => api.get<AssetDto[]>(`/assets/project/${projectId}`),
  get: (id: string) => api.get<AssetDto>(`/assets/${id}`),
  upload: (projectId: string, name: string, path: string, file: File) => {
    const form = new FormData();
    form.append('projectId', projectId);
    form.append('name', name);
    form.append('path', path);
    form.append('file', file);
    return api.post<AssetDto>('/assets/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  download: (id: string) => api.get(`/assets/${id}/download`, { responseType: 'blob' }),
  delete: (id: string) => api.delete(`/assets/${id}`),
};
