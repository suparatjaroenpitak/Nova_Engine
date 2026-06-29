import api from './client';
import type { GameObjectDto, ComponentDto } from '@/types';

export const gameObjectsApi = {
  get: (id: string) => api.get<GameObjectDto>(`/gameobjects/${id}`),
  create: (data: { sceneId: string; name: string; parentId?: string | null }) =>
    api.post<GameObjectDto>('/gameobjects', data),
  update: (id: string, data: Partial<GameObjectDto>) =>
    api.put<GameObjectDto>(`/gameobjects/${id}`, data),
  delete: (id: string) => api.delete(`/gameobjects/${id}`),
  reparent: (id: string, newParentId: string | null, siblingIndex: number) =>
    api.put(`/gameobjects/${id}/parent`, null, { params: { newParentId, siblingIndex } }),
};
