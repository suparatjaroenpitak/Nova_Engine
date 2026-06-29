import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameObjectDto, ComponentDto, TransformDto } from '@/types';
import { gameObjectsApi } from '@/api/gameObjects';
import { useUndoStore } from './undoStore';

interface SceneState {
  gameObjects: GameObjectDto[];
  selectedIds: string[];
  selectedGameObject: GameObjectDto | null;
  clipboard: GameObjectDto | null;
  loading: boolean;
  currentSceneId: string | null;
  setGameObjects: (objects: GameObjectDto[]) => void;
  selectGameObject: (id: string | null) => void;
  addSelection: (id: string) => void;
  clearSelection: () => void;
  addGameObject: (obj: GameObjectDto) => void;
  updateGameObject: (id: string, updates: Partial<GameObjectDto>) => void;
  removeGameObject: (id: string) => void;
  updateTransform: (id: string, transform: Partial<TransformDto>) => Promise<void>;
  copyGameObject: () => void;
  pasteGameObject: (sceneId: string) => Promise<void>;
  duplicateGameObject: (id: string) => Promise<void>;
  createGameObject: (sceneId: string, name: string, parentId?: string) => Promise<GameObjectDto>;
  deleteGameObject: (id: string) => Promise<void>;
  reparentGameObject: (id: string, newParentId: string | null) => Promise<void>;
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
}

export const useSceneStore = create<SceneState>()(
  immer((set, get) => ({
    gameObjects: [],
    selectedIds: [],
    selectedGameObject: null,
    clipboard: null,
    loading: false,
    currentSceneId: null,

    pushUndo: () => {
      const { gameObjects } = get();
      useUndoStore.getState().pushSnapshot(gameObjects);
    },

    undo: () => {
      const { gameObjects } = get();
      const restored = useUndoStore.getState().undo(gameObjects);
      if (restored) {
        set({ gameObjects: restored });
      }
    },

    redo: () => {
      const { gameObjects } = get();
      const restored = useUndoStore.getState().redo(gameObjects);
      if (restored) {
        set({ gameObjects: restored });
      }
    },

    setGameObjects: (objects) => set({ gameObjects: objects }),

    selectGameObject: (id) =>
      set((s) => {
        s.selectedIds = id ? [id] : [];
        s.selectedGameObject = id ? findById(s.gameObjects, id) ?? null : null;
      }),

    addSelection: (id) =>
      set((s) => {
        if (!s.selectedIds.includes(id)) {
          s.selectedIds.push(id);
          s.selectedGameObject = findById(s.gameObjects, id) ?? null;
        }
      }),

    clearSelection: () => set({ selectedIds: [], selectedGameObject: null }),

    addGameObject: (obj) =>
      set((s) => {
        get().pushUndo();
        if (!obj.parentId) {
          s.gameObjects.push(obj);
        } else {
          addChild(s.gameObjects, obj.parentId, obj);
        }
      }),

    updateGameObject: (id, updates) =>
      set((s) => {
        get().pushUndo();
        const obj = findById(s.gameObjects, id);
        if (obj) Object.assign(obj, updates);
      }),

    removeGameObject: (id) =>
      set((s) => {
        get().pushUndo();
        removeById(s.gameObjects, id);
        s.selectedIds = s.selectedIds.filter((i) => i !== id);
      }),

    updateTransform: async (id, transform) => {
      const obj = get().selectedGameObject;
      if (obj) {
        get().pushUndo();
        await gameObjectsApi.update(id, {
          ...obj,
          transform: { ...obj.transform, ...transform },
        });
      }
    },

    copyGameObject: () => set({ clipboard: get().selectedGameObject }),

    pasteGameObject: async (sceneId) => {
      const clip = get().clipboard;
      if (clip) {
        get().pushUndo();
        const obj = await gameObjectsApi.create({ sceneId, name: `${clip.name} (Copy)`, parentId: clip.parentId });
        set((s) => { s.gameObjects.push(obj.data); });
      }
    },

    duplicateGameObject: async (id) => {
      const obj = findById(get().gameObjects, id);
      if (obj) {
        get().pushUndo();
        const newObj = await gameObjectsApi.create({ sceneId: obj.sceneId, name: `${obj.name} (Copy)`, parentId: obj.parentId });
        set((s) => { s.gameObjects.push(newObj.data); });
      }
    },

    createGameObject: async (sceneId, name, parentId) => {
      get().pushUndo();
      const { data } = await gameObjectsApi.create({ sceneId, name, parentId });
      set((s) => { s.gameObjects.push(data); });
      return data;
    },

    deleteGameObject: async (id) => {
      get().pushUndo();
      await gameObjectsApi.delete(id);
      set((s) => { removeById(s.gameObjects, id); });
    },

    reparentGameObject: async (id, newParentId) => {
      get().pushUndo();
      await gameObjectsApi.reparent(id, newParentId, 0);
      set((s) => {
        const obj = findById(s.gameObjects, id);
        if (obj) obj.parentId = newParentId;
      });
    },
  }))
);

function findById(list: GameObjectDto[], id: string): GameObjectDto | undefined {
  for (const item of list) {
    if (item.id === id) return item;
    const found = findById(item.children, id);
    if (found) return found;
  }
  return undefined;
}

function addChild(list: GameObjectDto[], parentId: string, child: GameObjectDto) {
  for (const item of list) {
    if (item.id === parentId) { item.children.push(child); return; }
    addChild(item.children, parentId, child);
  }
}

function removeById(list: GameObjectDto[], id: string) {
  const idx = list.findIndex((i) => i.id === id);
  if (idx >= 0) { list.splice(idx, 1); return; }
  for (const item of list) removeById(item.children, id);
}
