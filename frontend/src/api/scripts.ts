import api from './client';
import type { ScriptDto, CompileResultDto } from '@/types';

export const scriptsApi = {
  list: (projectId: string) => api.get<ScriptDto[]>(`/scripts/project/${projectId}`),
  get: (id: string) => api.get<ScriptDto>(`/scripts/${id}`),
  create: (data: { projectId: string; name: string; className?: string; source?: string }) =>
    api.post<ScriptDto>('/scripts', data),
  updateSource: (id: string, source: string) =>
    api.put<CompileResultDto>(`/scripts/${id}/source`, { source }),
  delete: (id: string) => api.delete(`/scripts/${id}`),
};
