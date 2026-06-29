import { create } from 'zustand';
import type { ProjectDto, SceneDto, CreateProjectRequest } from '@/types';
import { projectsApi } from '@/api/projects';
import { scenesApi } from '@/api/scenes';

interface ProjectState {
  projects: ProjectDto[];
  currentProject: ProjectDto | null;
  scenes: SceneDto[];
  currentScene: SceneDto | null;
  loading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  selectProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectRequest) => Promise<ProjectDto>;
  deleteProject: (id: string) => Promise<void>;
  selectScene: (scene: SceneDto) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  currentProject: null,
  scenes: [],
  currentScene: null,
  loading: false,
  error: null,

  loadProjects: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await projectsApi.list();
      set({ projects: data });
    } catch (e: any) {
      set({ error: e?.response?.data?.title || e?.message || 'Failed to load projects' });
    } finally {
      set({ loading: false });
    }
  },

  selectProject: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data: project } = await projectsApi.get(id);
      const { data: scenes } = await projectsApi.getScenes(id);
      set({ currentProject: project, scenes, currentScene: scenes[0] ?? null });
    } catch (e: any) {
      set({ error: e?.response?.data?.title || e?.message || 'Failed to load project' });
    } finally {
      set({ loading: false });
    }
  },

  createProject: async (data) => {
    set({ error: null });
    const { data: project } = await projectsApi.create(data);
    set((s) => ({ projects: [...s.projects, project] }));
    return project;
  },

  deleteProject: async (id) => {
    set({ error: null });
    try {
      await projectsApi.delete(id);
      set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    } catch (e: any) {
      set({ error: e?.response?.data?.title || e?.message || 'Failed to delete project' });
    }
  },

  selectScene: (scene) => set({ currentScene: scene }),
  clearError: () => set({ error: null }),
}));
