import api from './client';
import type { ProjectDto, CreateProjectRequest, SceneDto } from '@/types';

export const projectsApi = {
  list: () => api.get<ProjectDto[]>('/projects'),
  get: (id: string) => api.get<ProjectDto>(`/projects/${id}`),
  create: (data: CreateProjectRequest) => api.post<ProjectDto>('/projects', data),
  update: (id: string, data: Partial<CreateProjectRequest>) => api.put<ProjectDto>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getScenes: (id: string) => api.get<SceneDto[]>(`/projects/${id}/scenes`),
};
