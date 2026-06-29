import api from './client';

export const aiApi = {
  capabilities: () => api.get<string[]>('/ai/capabilities'),
  execute: (data: { capability: string; prompt: string; payloadJson?: string; projectId?: string }) =>
    api.post<{ success: boolean; content: string; error?: string }>('/ai/execute', data),
};
