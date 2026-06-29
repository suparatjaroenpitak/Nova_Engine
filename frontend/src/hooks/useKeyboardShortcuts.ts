import { useEffect, useCallback } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
};

type ShortcutHandler = {
  combo: KeyCombo;
  handler: () => void;
  description: string;
  category: string;
  preventDefault?: boolean;
};

class ShortcutManager {
  private shortcuts: Map<string, ShortcutHandler> = new Map();
  private enabled = true;

  private serialize(combo: KeyCombo): string {
    const parts: string[] = [];
    if (combo.ctrl) parts.push('Ctrl');
    if (combo.meta) parts.push('Meta');
    if (combo.shift) parts.push('Shift');
    if (combo.alt) parts.push('Alt');
    parts.push(combo.key.toUpperCase());
    return parts.join('+');
  }

  register(handler: ShortcutHandler) {
    const key = this.serialize(handler.combo);
    this.shortcuts.set(key, handler);
  }

  unregister(combo: KeyCombo) {
    this.shortcuts.delete(this.serialize(combo));
  }

  handleKeyDown(e: KeyboardEvent) {
    if (!this.enabled) return;
    const combo: KeyCombo = {
      key: e.key,
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      alt: e.altKey,
      meta: e.metaKey,
    };

    const isInput = e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement;

    const key = this.serialize(combo);
    const handler = this.shortcuts.get(key);
    if (handler) {
      if (isInput && !handler.combo.ctrl && !handler.combo.meta) return;
      if (handler.preventDefault) e.preventDefault();
      handler.handler();
    }
  }

  getAllShortcuts() {
    return Array.from(this.shortcuts.entries()).map(([key, handler]) => ({
      key,
      ...handler,
    }));
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const globalShortcuts = new ShortcutManager();

function registerDefaultShortcuts() {
  globalShortcuts.register({
    combo: { key: 'k', ctrl: true },
    handler: () => useUiStore.getState().setCommandPalette(true),
    description: 'Open Command Palette',
    category: 'General',
    preventDefault: true,
  });

  globalShortcuts.register({
    combo: { key: 'Escape' },
    handler: () => {
      useUiStore.getState().hideContextMenu();
      useUiStore.getState().setCommandPalette(false);
    },
    description: 'Dismiss',
    category: 'General',
  });

  globalShortcuts.register({
    combo: { key: 'Delete' },
    handler: () => {
      const sel = useSceneStore.getState().selectedGameObject;
      if (sel) useSceneStore.getState().deleteGameObject(sel.id);
    },
    description: 'Delete selected',
    category: 'Edit',
  });

  globalShortcuts.register({
    combo: { key: 'z', ctrl: true },
    handler: () => useSceneStore.getState().undo(),
    description: 'Undo',
    category: 'Edit',
    preventDefault: true,
  });

  globalShortcuts.register({
    combo: { key: 'z', ctrl: true, shift: true },
    handler: () => useSceneStore.getState().redo(),
    description: 'Redo',
    category: 'Edit',
    preventDefault: true,
  });

  globalShortcuts.register({
    combo: { key: 'y', ctrl: true },
    handler: () => useSceneStore.getState().redo(),
    description: 'Redo',
    category: 'Edit',
    preventDefault: true,
  });

  globalShortcuts.register({
    combo: { key: 'd', ctrl: true },
    handler: () => {
      const sel = useSceneStore.getState().selectedGameObject;
      if (sel) useSceneStore.getState().duplicateGameObject(sel.id);
    },
    description: 'Duplicate',
    category: 'Edit',
    preventDefault: true,
  });

  globalShortcuts.register({
    combo: { key: 'c', ctrl: true },
    handler: () => useSceneStore.getState().copyGameObject(),
    description: 'Copy',
    category: 'Edit',
  });

  globalShortcuts.register({
    combo: { key: 'v', ctrl: true },
    handler: () => {
      const sel = useSceneStore.getState().selectedGameObject;
      if (sel) useSceneStore.getState().pasteGameObject(sel.sceneId);
    },
    description: 'Paste',
    category: 'Edit',
    preventDefault: true,
  });

  globalShortcuts.register({
    combo: { key: 'a', ctrl: true },
    handler: () => {
      const { gameObjects, addSelection } = useSceneStore.getState();
      gameObjects.forEach((go) => addSelection(go.id));
    },
    description: 'Select All',
    category: 'Edit',
    preventDefault: true,
  });

  globalShortcuts.register({
    combo: { key: 's', ctrl: true },
    handler: () => console.log('Save'),
    description: 'Save Scene',
    category: 'File',
    preventDefault: true,
  });

  globalShortcuts.register({
    combo: { key: 's', ctrl: true, shift: true },
    handler: () => console.log('Save As'),
    description: 'Save Scene As',
    category: 'File',
    preventDefault: true,
  });

  globalShortcuts.register({
    combo: { key: 'q' },
    handler: () => useUiStore.getState().setGizmoMode('translate'),
    description: 'Translate Tool',
    category: 'Scene',
  });

  globalShortcuts.register({
    combo: { key: 'w' },
    handler: () => useUiStore.getState().setGizmoMode('rotate'),
    description: 'Rotate Tool',
    category: 'Scene',
  });

  globalShortcuts.register({
    combo: { key: 'e' },
    handler: () => useUiStore.getState().setGizmoMode('scale'),
    description: 'Scale Tool',
    category: 'Scene',
  });

  globalShortcuts.register({
    combo: { key: 'r' },
    handler: () => useUiStore.getState().setGizmoMode('rect'),
    description: 'Rect Tool',
    category: 'Scene',
  });

  globalShortcuts.register({
    combo: { key: 't' },
    handler: () => useUiStore.getState().toggleGizmoSpace(),
    description: 'Toggle Pivot/Center',
    category: 'Scene',
  });

  globalShortcuts.register({
    combo: { key: 'g' },
    handler: () => useUiStore.getState().toggleGrid(),
    description: 'Toggle Grid',
    category: 'Scene',
  });

  globalShortcuts.register({
    combo: { key: 'v' },
    handler: () => useUiStore.getState().toggleSnapping(),
    description: 'Toggle Snap',
    category: 'Scene',
  });

  globalShortcuts.register({
    combo: { key: 'f' },
    handler: () => {
      const sel = useSceneStore.getState().selectedGameObject;
      if (sel) useUiStore.getState().focusOnObject(sel.id);
    },
    description: 'Focus on Object',
    category: 'Scene',
  });

  globalShortcuts.register({
    combo: { key: 'F5' },
    handler: () => {
      const playing = useUiStore.getState().isPlaying;
      if (playing) useUiStore.getState().stopPlaying();
      else useUiStore.getState().startPlaying();
    },
    description: 'Play / Stop',
    category: 'Game',
  });

  globalShortcuts.register({
    combo: { key: 'F6' },
    handler: () => useUiStore.getState().pausePlaying(),
    description: 'Pause',
    category: 'Game',
  });

  globalShortcuts.register({
    combo: { key: '1' },
    handler: () => useUiStore.getState().setGizmoMode('translate'),
    description: 'Translate Tool (1)',
    category: 'Scene',
  });

  globalShortcuts.register({
    combo: { key: '2' },
    handler: () => useUiStore.getState().setGizmoMode('rotate'),
    description: 'Rotate Tool (2)',
    category: 'Scene',
  });

  globalShortcuts.register({
    combo: { key: '3' },
    handler: () => useUiStore.getState().setGizmoMode('scale'),
    description: 'Scale Tool (3)',
    category: 'Scene',
  });

  globalShortcuts.register({
    combo: { key: '4' },
    handler: () => useUiStore.getState().setGizmoMode('rect'),
    description: 'Rect Tool (4)',
    category: 'Scene',
  });

  globalShortcuts.register({
    combo: { key: 'x', ctrl: true },
    handler: () => {
      const sel = useSceneStore.getState().selectedGameObject;
      if (sel) {
        useSceneStore.getState().copyGameObject();
        useSceneStore.getState().deleteGameObject(sel.id);
      }
    },
    description: 'Cut',
    category: 'Edit',
    preventDefault: true,
  });

  globalShortcuts.register({
    combo: { key: 'n', ctrl: true },
    handler: () => {
      const store = useSceneStore.getState();
      if (store.currentSceneId) {
        store.createGameObject(store.currentSceneId, 'GameObject');
      }
    },
    description: 'New GameObject',
    category: 'GameObject',
    preventDefault: true,
  });

  globalShortcuts.register({
    combo: { key: 'f', ctrl: true, shift: true },
    handler: () => useUiStore.getState().setCommandPalette(true),
    description: 'Search Everywhere',
    category: 'General',
    preventDefault: true,
  });

  globalShortcuts.register({
    combo: { key: 'Tab', ctrl: true },
    handler: () => {
      const store = useWorkspaceStore.getState();
      // Cycle through dock zones
    },
    description: 'Next Tab',
    category: 'General',
    preventDefault: true,
  });

  globalShortcuts.register({
    combo: { key: 'p', ctrl: true, shift: true },
    handler: () => {
      const playing = useUiStore.getState().isPlaying;
      if (playing) useUiStore.getState().stopPlaying();
      else useUiStore.getState().startPlaying();
    },
    description: 'Play / Stop',
    category: 'Game',
    preventDefault: true,
  });
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    registerDefaultShortcuts();
    const handler = (e: KeyboardEvent) => globalShortcuts.handleKeyDown(e);
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, []);
}

export function useShortcut(combo: KeyCombo, handler: () => void, deps: any[] = []) {
  useEffect(() => {
    const shortcut: ShortcutHandler = { combo, handler, description: '', category: '' };
    globalShortcuts.register(shortcut);
    return () => globalShortcuts.unregister(combo);
  }, deps);
}
