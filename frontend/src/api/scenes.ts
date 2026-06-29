import api from './client';
import type { SceneDto, GameObjectDto } from '@/types';

export const scenesApi = {
  get: (id: string) => api.get<SceneDto>(`/scenes/${id}`),
  create: (data: { projectId: string; name: string }) => api.post<SceneDto>('/scenes', data),
  update: (id: string, data: { name?: string; settingsJson?: string }) => api.put<SceneDto>(`/scenes/${id}`, data),
  delete: (id: string) => api.delete(`/scenes/${id}`),
  getGameObjects: (id: string) => api.get<GameObjectDto[]>(`/scenes/${id}/gameobjects`),
};
