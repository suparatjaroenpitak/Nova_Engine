import api from './client';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types';

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),
  refresh: (refreshToken: string) => api.post<AuthResponse>('/auth/refresh', { refreshToken }),
  revoke: (refreshToken: string) => api.post('/auth/revoke', { refreshToken }),
  me: () => api.get<AuthResponse['user']>('/auth/me'),
};
