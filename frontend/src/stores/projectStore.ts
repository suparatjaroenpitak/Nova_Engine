import { create } from 'zustand';
import type { ProjectDto, SceneDto } from '@/types';
import { projectsApi } from '@/api/projects';
import { scenesApi } from '@/api/scenes';

interface ProjectState {
  projects: ProjectDto[];
  currentProject: ProjectDto | null;
  scenes: SceneDto[];
  currentScene: SceneDto | null;
  loading: boolean;
  loadProjects: () => Promise<void>;
  selectProject: (id: string) => Promise<void>;
  createProject: (data: { name: string; description?: string; is3D?: boolean }) => Promise<ProjectDto>;
  deleteProject: (id: string) => Promise<void>;
  selectScene: (scene: SceneDto) => void;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  currentProject: null,
  scenes: [],
  currentScene: null,
  loading: false,

  loadProjects: async () => {
    set({ loading: true });
    try {
      const { data } = await projectsApi.list();
      set({ projects: data });
    } finally {
      set({ loading: false });
    }
  },

  selectProject: async (id: string) => {
    set({ loading: true });
    try {
      const { data: project } = await projectsApi.get(id);
      const { data: scenes } = await projectsApi.getScenes(id);
      set({ currentProject: project, scenes, currentScene: scenes[0] ?? null });
    } finally {
      set({ loading: false });
    }
  },

  createProject: async (data) => {
    const { data: project } = await projectsApi.create(data);
    set((s) => ({ projects: [...s.projects, project] }));
    return project;
  },

  deleteProject: async (id) => {
    await projectsApi.delete(id);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
  },

  selectScene: (scene) => set({ currentScene: scene }),
}));
