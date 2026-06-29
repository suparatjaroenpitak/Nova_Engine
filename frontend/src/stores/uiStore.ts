import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PanelId, ConsoleEntry, EditorTab } from '@/types';

interface UiState {
  activePanel: PanelId;
  panels: Record<PanelId, { visible: boolean; order: number; width?: number; height?: number }>;
  console: ConsoleEntry[];
  tabs: EditorTab[];
  activeTab: string | null;
  showCommandPalette: boolean;
  showContextMenu: boolean;
  contextMenuPosition: { x: number; y: number };
  contextMenuItems: { label: string; action: string }[];
  gizmoMode: 'translate' | 'rotate' | 'scale';
  gizmoSpace: 'world' | 'local';
  snapping: boolean;
  gridVisible: boolean;

  togglePanel: (id: PanelId) => void;
  setActivePanel: (id: PanelId) => void;
  addConsole: (entry: ConsoleEntry) => void;
  clearConsole: () => void;
  addTab: (tab: EditorTab) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  setCommandPalette: (show: boolean) => void;
  showContextMenuAt: (x: number, y: number, items: { label: string; action: string }[]) => void;
  hideContextMenu: () => void;
  setGizmoMode: (mode: 'translate' | 'rotate' | 'scale') => void;
  toggleGizmoSpace: () => void;
  toggleSnapping: () => void;
  toggleGrid: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
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
      },
      console: [],
      tabs: [],
      activeTab: null,
      showCommandPalette: false,
      showContextMenu: false,
      contextMenuPosition: { x: 0, y: 0 },
      contextMenuItems: [],
      gizmoMode: 'translate',
      gizmoSpace: 'world',
      snapping: false,
      gridVisible: true,

      togglePanel: (id) =>
        set((s) => ({ panels: { ...s.panels, [id]: { ...s.panels[id], visible: !s.panels[id].visible } } })),

      setActivePanel: (id) => set({ activePanel: id }),

      addConsole: (entry) =>
        set((s) => ({ console: [...s.console.slice(-499), entry] })),

      clearConsole: () => set({ console: [] }),

      addTab: (tab) =>
        set((s) => {
          const exists = s.tabs.find((t) => t.id === tab.id);
          return {
            tabs: exists ? s.tabs : [...s.tabs, tab],
            activeTab: tab.id,
          };
        }),

      closeTab: (id) =>
        set((s) => ({
          tabs: s.tabs.filter((t) => t.id !== id),
          activeTab: s.activeTab === id ? s.tabs[s.tabs.length - 2]?.id ?? null : s.activeTab,
        })),

      setActiveTab: (id) => set({ activeTab: id }),

      setCommandPalette: (show) => set({ showCommandPalette: show }),

      showContextMenuAt: (x, y, items) =>
        set({ showContextMenu: true, contextMenuPosition: { x, y }, contextMenuItems: items }),

      hideContextMenu: () => set({ showContextMenu: false }),

      setGizmoMode: (mode) => set({ gizmoMode: mode }),
      toggleGizmoSpace: () => set((s) => ({ gizmoSpace: s.gizmoSpace === 'world' ? 'local' : 'world' })),
      toggleSnapping: () => set((s) => ({ snapping: !s.snapping })),
      toggleGrid: () => set((s) => ({ gridVisible: !s.gridVisible })),
    }),
    { name: 'nova-ui', partialize: (s) => ({ panels: s.panels, gizmoMode: s.gizmoMode }) }
  )
);
