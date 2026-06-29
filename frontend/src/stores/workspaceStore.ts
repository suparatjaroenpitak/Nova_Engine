import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { PanelId, PanelState, DockZoneConfig, LayoutConfig } from '@/types';

interface WorkspaceState {
  currentLayout: string;
  layouts: Record<string, LayoutConfig>;
  dockZones: DockZoneConfig[];
  floatingPanels: PanelId[];
  maximizedPanel: PanelId | null;
  lockedPanels: PanelId[];

  setLayout: (name: string) => void;
  saveLayout: (name: string) => void;
  deleteLayout: (name: string) => void;
  resetLayout: () => void;
  getDefaultLayout: () => LayoutConfig;

  dockPanel: (panelId: PanelId, zone: string, targetPanel?: PanelId) => void;
  undockPanel: (panelId: PanelId) => void;
  closePanel: (panelId: PanelId) => void;
  openPanel: (panelId: PanelId) => void;
  togglePanel: (panelId: PanelId) => void;
  maximizePanel: (panelId: PanelId | null) => void;
  lockPanel: (panelId: PanelId) => void;
  unlockPanel: (panelId: PanelId) => void;
  isPanelLocked: (panelId: PanelId) => boolean;

  setPanelSize: (panelId: PanelId, size: Partial<{ width: number; height: number }>) => void;
  movePanel: (panelId: PanelId, x: number, y: number) => void;
  setActiveTab: (zoneId: string, panelId: PanelId) => void;
  splitZone: (zoneId: string, direction: 'horizontal' | 'vertical') => void;
}

const DEFAULT_LAYOUT: LayoutConfig = {
  id: 'default',
  name: 'Default',
  panels: {
    hierarchy: { id: 'hierarchy', visible: true, order: 0, width: 280 },
    inspector: { id: 'inspector', visible: true, order: 1, width: 320 },
    scene: { id: 'scene', visible: true, order: 2 },
    game: { id: 'game', visible: false, order: 3 },
    assets: { id: 'assets', visible: true, order: 4, height: 200 },
    console: { id: 'console', visible: true, order: 5, height: 150 },
    profiler: { id: 'profiler', visible: false, order: 6 },
    animation: { id: 'animation', visible: false, order: 7 },
    timeline: { id: 'timeline', visible: false, order: 8 },
    ai: { id: 'ai', visible: false, order: 9 },
    lighting: { id: 'lighting', visible: false, order: 10 },
    material: { id: 'material', visible: false, order: 11 },
    shader: { id: 'shader', visible: false, order: 12 },
    terrain: { id: 'terrain', visible: false, order: 13 },
    script: { id: 'script', visible: false, order: 14 },
    navigation: { id: 'navigation', visible: false, order: 15 },
    physics: { id: 'physics', visible: false, order: 16 },
    build: { id: 'build', visible: false, order: 17 },
    versionControl: { id: 'versionControl', visible: false, order: 18 },
    terminal: { id: 'terminal', visible: false, order: 19 },
    packageManager: { id: 'packageManager', visible: false, order: 20 },
    assetStore: { id: 'assetStore', visible: false, order: 21 },
    shaderGraph: { id: 'shaderGraph', visible: false, order: 22 },
    materialEditor: { id: 'materialEditor', visible: false, order: 23 },
    animationWindow: { id: 'animationWindow', visible: false, order: 24 },
    lightingWindow: { id: 'lightingWindow', visible: false, order: 25 },
    navigationWindow: { id: 'navigationWindow', visible: false, order: 26 },
    physicsDebugger: { id: 'physicsDebugger', visible: false, order: 27 },
    searchEverywhere: { id: 'searchEverywhere', visible: false, order: 28 },
    gameView: { id: 'gameView', visible: false, order: 29 },
    aiGeneration: { id: 'aiGeneration', visible: false, order: 30 },
  },
  zones: [
    {
      id: 'left',
      zone: 'left',
      panelIds: ['hierarchy'],
      size: 280,
    },
    {
      id: 'center',
      zone: 'center',
      panelIds: ['scene', 'game'],
      activeTab: 'scene',
      children: [
        {
          id: 'bottom',
          zone: 'bottom',
          panelIds: ['assets', 'console'],
          activeTab: 'assets',
          size: 200,
        },
      ],
    },
    {
      id: 'right',
      zone: 'right',
      panelIds: ['inspector'],
      size: 320,
    },
  ],
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    immer((set, get) => ({
      currentLayout: 'default',
      layouts: { default: DEFAULT_LAYOUT },
      dockZones: DEFAULT_LAYOUT.zones,
      floatingPanels: [],
      maximizedPanel: null,
      lockedPanels: [],

      setLayout: (name) => {
        const layout = get().layouts[name];
        if (layout) {
          set((s) => {
            s.currentLayout = name;
            s.dockZones = layout.zones;
          });
        }
      },

      saveLayout: (name) => {
        set((s) => {
          s.layouts[name] = {
            id: name,
            name,
            panels: { ...s.layouts['default']?.panels },
            zones: s.dockZones,
          };
          s.currentLayout = name;
        });
      },

      deleteLayout: (name) => {
        set((s) => {
          delete s.layouts[name];
          if (s.currentLayout === name) {
            s.currentLayout = 'default';
            s.dockZones = DEFAULT_LAYOUT.zones;
          }
        });
      },

      resetLayout: () => {
        set((s) => {
          s.dockZones = DEFAULT_LAYOUT.zones;
          s.currentLayout = 'default';
          s.floatingPanels = [];
          s.maximizedPanel = null;
        });
      },

      getDefaultLayout: () => DEFAULT_LAYOUT,

      dockPanel: (panelId, zone, targetPanel) => {
        set((s) => {
          s.floatingPanels = s.floatingPanels.filter((p) => p !== panelId);
          const zoneConfig = s.dockZones.find((z) => z.id === zone);
          if (zoneConfig) {
            if (!zoneConfig.panelIds.includes(panelId)) {
              zoneConfig.panelIds.push(panelId);
            }
            zoneConfig.activeTab = panelId;
          }
        });
      },

      undockPanel: (panelId) => {
        set((s) => {
          if (!s.floatingPanels.includes(panelId)) {
            s.floatingPanels.push(panelId);
          }
          for (const zone of s.dockZones) {
            zone.panelIds = zone.panelIds.filter((p) => p !== panelId);
          }
        });
      },

      closePanel: (panelId) => {
        set((s) => {
          const layout = s.layouts[s.currentLayout] || s.layouts['default'];
          if (layout.panels[panelId]) {
            layout.panels[panelId].visible = false;
          }
        });
      },

      openPanel: (panelId) => {
        set((s) => {
          const layout = s.layouts[s.currentLayout] || s.layouts['default'];
          if (layout.panels[panelId]) {
            layout.panels[panelId].visible = true;
          }
        });
      },

      togglePanel: (panelId) => {
        const layout = get().layouts[get().currentLayout] || get().layouts['default'];
        const panel = layout.panels[panelId];
        if (panel) {
          if (panel.visible) {
            get().closePanel(panelId);
          } else {
            get().openPanel(panelId);
          }
        }
      },

      maximizePanel: (panelId) => set((s) => { s.maximizedPanel = panelId; }),

      lockPanel: (panelId) => set((s) => {
        if (!s.lockedPanels.includes(panelId)) s.lockedPanels.push(panelId);
      }),

      unlockPanel: (panelId) => set((s) => {
        s.lockedPanels = s.lockedPanels.filter((p) => p !== panelId);
      }),

      isPanelLocked: (panelId) => get().lockedPanels.includes(panelId),

      setPanelSize: (panelId, size) => {
        set((s) => {
          const layout = s.layouts[s.currentLayout] || s.layouts['default'];
          if (layout.panels[panelId]) {
            if (size.width) layout.panels[panelId].width = size.width;
            if (size.height) layout.panels[panelId].height = size.height;
          }
        });
      },

      movePanel: (panelId, x, y) => {
        set((s) => {
          const layout = s.layouts[s.currentLayout] || s.layouts['default'];
          if (layout.panels[panelId]) {
            layout.panels[panelId].position = { x, y };
          }
        });
      },

      setActiveTab: (zoneId, panelId) => {
        set((s) => {
          const zone = s.dockZones.find((z) => z.id === zoneId);
          if (zone) zone.activeTab = panelId;
        });
      },

      splitZone: (zoneId, direction) => {
        set((s) => {
          const zone = s.dockZones.find((z) => z.id === zoneId);
          if (zone) {
            zone.splitDirection = direction;
          }
        });
      },
    })),
    {
      name: 'nova-workspace',
      partialize: (s) => ({
        currentLayout: s.currentLayout,
        layouts: s.layouts,
        dockZones: s.dockZones,
        floatingPanels: s.floatingPanels,
      }),
    }
  )
);
