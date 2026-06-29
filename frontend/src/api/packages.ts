import api from './client';
import type { PackageDto } from '@/types';

export const packagesApi = {
  list: (projectId: string) => api.get<PackageDto[]>(`/packages/project/${projectId}`),
  add: (data: { name: string; version: string; source?: string; registryUrl?: string }) =>
    api.post<PackageDto>('/packages', data),
  remove: (id: string) => api.delete(`/packages/${id}`),
};
