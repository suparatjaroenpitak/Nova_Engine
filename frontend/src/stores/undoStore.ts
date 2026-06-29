import { create } from 'zustand';
import type { GameObjectDto } from '@/types';

interface UndoState {
  past: GameObjectDto[][];
  future: GameObjectDto[][];
  maxSteps: number;
  pushSnapshot: (objects: GameObjectDto[]) => void;
  undo: (current: GameObjectDto[]) => GameObjectDto[] | null;
  redo: (current: GameObjectDto[]) => GameObjectDto[] | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useUndoStore = create<UndoState>()((set, get) => ({
  past: [],
  future: [],
  maxSteps: 50,

  pushSnapshot: (objects) => {
    set((s) => ({
      past: [...s.past.slice(-(s.maxSteps - 1)), JSON.parse(JSON.stringify(objects))],
      future: [],
    }));
  },

  undo: (current) => {
    const { past } = get();
    if (past.length === 0) return null;
    const previous = past[past.length - 1];
    set((s) => ({
      past: s.past.slice(0, -1),
      future: [JSON.parse(JSON.stringify(current)), ...s.future],
    }));
    return previous;
  },

  redo: (current) => {
    const { future } = get();
    if (future.length === 0) return null;
    const next = future[0];
    set((s) => ({
      past: [...s.past, JSON.parse(JSON.stringify(current))],
      future: s.future.slice(1),
    }));
    return next;
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clear: () => set({ past: [], future: [] }),
}));
