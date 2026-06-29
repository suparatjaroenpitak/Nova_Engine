import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { PanelId, ConsoleEntry, EditorTab, Bookmark, LayerInfo, SceneSettings, ProfilerSnapshot, Command } from '@/types';

export type GizmoMode = 'translate' | 'rotate' | 'scale' | 'rect';
export type GizmoPivot = 'center' | 'pivot';
export type GizmoSpace = 'world' | 'local';

interface UiState {
  activePanel: PanelId;
  panels: Record<PanelId, { visible: boolean; order: number; width?: number; height?: number }>;
  console: ConsoleEntry[];
  tabs: EditorTab[];
  activeTab: string | null;
  showCommandPalette: boolean;
  showContextMenu: boolean;
  contextMenuPosition: { x: number; y: number };
  contextMenuItems: { label: string; action: string; shortcut?: string; danger?: boolean }[];

  // Gizmo & Viewport
  gizmoMode: GizmoMode;
  gizmoPivot: GizmoPivot;
  gizmoSpace: GizmoSpace;
  snapping: boolean;
  snapSize: number;
  gridVisible: boolean;
  gridSize: number;
  showGrid: boolean;

  // Scene
  bookmarks: Bookmark[];
  layers: LayerInfo[];
  isolationMode: boolean;
  isolatedObjectId: string | null;

  // Game
  isPlaying: boolean;
  isPaused: boolean;

  // Scene settings
  sceneSettings: SceneSettings;

  // Profiler data
  profilerData: ProfilerSnapshot[];

  // Viewport
  viewMode: '2d' | '3d';
  focusTarget: { id: string; position: [number, number, number] } | null;

  // Theme
  themeMode: 'dark' | 'light';

  // Methods
  togglePanel: (id: PanelId) => void;
  setActivePanel: (id: PanelId) => void;
  addConsole: (entry: ConsoleEntry) => void;
  clearConsole: () => void;
  addTab: (tab: EditorTab) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  setCommandPalette: (show: boolean) => void;
  showContextMenuAt: (x: number, y: number, items: { label: string; action: string; shortcut?: string; danger?: boolean }[]) => void;
  hideContextMenu: () => void;

  setGizmoMode: (mode: GizmoMode) => void;
  setGizmoPivot: (pivot: GizmoPivot) => void;
  toggleGizmoSpace: () => void;
  toggleSnapping: () => void;
  setSnapSize: (size: number) => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;

  // Bookmarks
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (id: string) => void;
  focusOnObject: (id: string) => void;
  clearFocus: () => void;

  // Layers
  toggleLayerVisibility: (id: number) => void;
  toggleLayerLock: (id: number) => void;
  setLayerName: (id: number, name: string) => void;

  // Isolation
  toggleIsolationMode: (objectId?: string) => void;
  exitIsolationMode: () => void;

  // Play mode
  startPlaying: () => void;
  stopPlaying: () => void;
  pausePlaying: () => void;

  // Profiler
  addProfilerSnapshot: (snapshot: ProfilerSnapshot) => void;
  clearProfiler: () => void;

  // Viewport
  setViewMode: (mode: '2d' | '3d') => void;

  // Scene settings
  updateSceneSettings: (settings: Partial<SceneSettings>) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      activePanel: 'scene',
      panels: {
        hierarchy: { visible: true, order: 0, width: 280 },
        inspector: { visible: true, order: 1, width: 320 },
        scene: { visible: true, order: 2 },
        game: { visible: false, order: 3 },
        assets: { visible: true, order: 4, height: 200 },
        console: { visible: true, order: 5, height: 150 },
        profiler: { visible: false, order: 6 },
        animation: { visible: false, order: 7 },
        timeline: { visible: false, order: 8 },
        ai: { visible: false, order: 9 },
        lighting: { visible: false, order: 10 },
        material: { visible: false, order: 11 },
        shader: { visible: false, order: 12 },
        terrain: { visible: false, order: 13 },
        script: { visible: false, order: 14 },
        navigation: { visible: false, order: 15 },
        physics: { visible: false, order: 16 },
        build: { visible: false, order: 17 },
        versionControl: { visible: false, order: 18 },
        terminal: { visible: false, order: 19 },
        packageManager: { visible: false, order: 20 },
        assetStore: { visible: false, order: 21 },
        shaderGraph: { visible: false, order: 22 },
        materialEditor: { visible: false, order: 23 },
        animationWindow: { visible: false, order: 24 },
        lightingWindow: { visible: false, order: 25 },
        navigationWindow: { visible: false, order: 26 },
        physicsDebugger: { visible: false, order: 27 },
        searchEverywhere: { visible: false, order: 28 },
        gameView: { visible: false, order: 29 },
      },
      console: [],
      tabs: [],
      activeTab: null,
      showCommandPalette: false,
      showContextMenu: false,
      contextMenuPosition: { x: 0, y: 0 },
      contextMenuItems: [],

      gizmoMode: 'translate',
      gizmoPivot: 'center',
      gizmoSpace: 'world',
      snapping: false,
      snapSize: 0.5,
      gridVisible: true,
      gridSize: 30,
      showGrid: true,

      bookmarks: [],
      layers: Array.from({ length: 32 }, (_, i) => ({
        id: i,
        name: i === 0 ? 'Default' : `Layer ${i}`,
        visible: true,
        locked: false,
      })),
      isolationMode: false,
      isolatedObjectId: null,

      isPlaying: false,
      isPaused: false,

      sceneSettings: {
        fogColor: '#0a0a1a',
        fogMode: 'exponential',
        fogDensity: 0.025,
        ambientColor: '#87ceeb',
        ambientIntensity: 0.4,
      },

      profilerData: ([] as ProfilerSnapshot[]),

      viewMode: '3d',
      focusTarget: null,

      themeMode: 'dark',

      togglePanel: (id) => set((s) => ({ panels: { ...s.panels, [id]: { ...s.panels[id], visible: !s.panels[id].visible } } })),

      setActivePanel: (id) => set({ activePanel: id }),

      addConsole: (entry) => set((s) => ({ console: [...s.console.slice(-499), entry] })),

      clearConsole: () => set({ console: [] }),

      addTab: (tab) => set((s) => {
        const exists = s.tabs.find((t) => t.id === tab.id);
        return {
          tabs: exists ? s.tabs : [...s.tabs, tab],
          activeTab: tab.id,
        };
      }),

      closeTab: (id) => set((s) => ({
        tabs: s.tabs.filter((t) => t.id !== id),
        activeTab: s.activeTab === id ? s.tabs[s.tabs.length - 2]?.id ?? null : s.activeTab,
      })),

      setActiveTab: (id) => set({ activeTab: id }),

      setCommandPalette: (show) => set({ showCommandPalette: show }),

      showContextMenuAt: (x, y, items) => set({
        showContextMenu: true,
        contextMenuPosition: { x, y },
        contextMenuItems: items,
      }),

      hideContextMenu: () => set({ showContextMenu: false }),

      setGizmoMode: (mode) => set({ gizmoMode: mode }),
      setGizmoPivot: (pivot) => set({ gizmoPivot: pivot }),
      toggleGizmoSpace: () => set((s) => ({ gizmoSpace: s.gizmoSpace === 'world' ? 'local' : 'world' })),
      toggleSnapping: () => set((s) => ({ snapping: !s.snapping })),
      setSnapSize: (size) => set({ snapSize: size }),
      toggleGrid: () => set((s) => ({ gridVisible: !s.gridVisible })),
      setGridSize: (size) => set({ gridSize: size }),

      addBookmark: (bookmark) => set((s) => ({ bookmarks: [...s.bookmarks, bookmark] })),
      removeBookmark: (id) => set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),

      focusOnObject: (id) => {
        const obj = findGameObjectById(id);
        if (obj) {
          set({ focusTarget: { id, position: [obj.transform.px, obj.transform.py, obj.transform.pz] } });
          setTimeout(() => set({ focusTarget: null }), 100);
        }
      },

      clearFocus: () => set({ focusTarget: null }),

      toggleLayerVisibility: (id) => set((s) => ({
        layers: s.layers.map((l) => l.id === id ? { ...l, visible: !l.visible } : l),
      })),

      toggleLayerLock: (id) => set((s) => ({
        layers: s.layers.map((l) => l.id === id ? { ...l, locked: !l.locked } : l),
      })),

      setLayerName: (id, name) => set((s) => ({
        layers: s.layers.map((l) => l.id === id ? { ...l, name } : l),
      })),

      toggleIsolationMode: (objectId) => set((s) => ({
        isolationMode: !s.isolationMode,
        isolatedObjectId: objectId || s.isolatedObjectId,
      })),

      exitIsolationMode: () => set({ isolationMode: false, isolatedObjectId: null }),

      startPlaying: () => set({ isPlaying: true, isPaused: false }),
      stopPlaying: () => set({ isPlaying: false, isPaused: false }),
      pausePlaying: () => set((s) => ({ isPaused: !s.isPaused })),

      addProfilerSnapshot: (snapshot) => set((s) => ({
        profilerData: [...s.profilerData.slice(-299), snapshot],
      })),

      clearProfiler: () => set({ profilerData: [] }),

      setViewMode: (mode) => set({ viewMode: mode }),

      updateSceneSettings: (settings) => set((s) => ({
        sceneSettings: { ...s.sceneSettings, ...settings },
      })),
    }),
    {
      name: 'nova-ui',
      partialize: (s) => ({
        panels: s.panels,
        gizmoMode: s.gizmoMode,
        gizmoSpace: s.gizmoSpace,
        snapping: s.snapping,
        snapSize: s.snapSize,
        gridVisible: s.gridVisible,
        themeMode: s.themeMode,
        layers: s.layers,
        bookmarks: s.bookmarks,
      }),
    }
  )
);

function findGameObjectById(id: string): any {
  return null; // Will be connected to sceneStore
}
