import api from './client';
import type { ComponentDto } from '@/types';

export const componentsApi = {
  get: (id: string) => api.get<ComponentDto>(`/components/${id}`),
  add: (data: { gameObjectId: string; kind: string; propertiesJson?: string }) =>
    api.post<ComponentDto>('/components', data),
  update: (id: string, data: { kind: string; propertiesJson: string }) =>
    api.put<ComponentDto>(`/components/${id}`, data),
  delete: (id: string) => api.delete(`/components/${id}`),
};
