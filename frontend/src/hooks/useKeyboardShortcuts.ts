import { useEffect } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { useSceneStore } from '@/stores/sceneStore';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useUiStore.getState().setCommandPalette(true);
        return;
      }

      if (e.key === 'Escape') {
        useUiStore.getState().hideContextMenu();
        useSceneStore.getState().clearSelection();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const sel = useSceneStore.getState().selectedGameObject;
        if (sel) {
          e.preventDefault();
          useSceneStore.getState().deleteGameObject(sel.id);
        }
        return;
      }

      if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const sel = useSceneStore.getState().selectedGameObject;
        if (sel) useSceneStore.getState().duplicateGameObject(sel.id);
        return;
      }

      if (e.key === 'c' && (e.metaKey || e.ctrlKey)) {
        useSceneStore.getState().copyGameObject();
        return;
      }

      if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
        const sel = useSceneStore.getState().selectedGameObject;
        if (sel) useSceneStore.getState().pasteGameObject(sel.sceneId);
        return;
      }

      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        useSceneStore.getState().redo();
        return;
      }

      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        useSceneStore.getState().undo();
        return;
      }

      if (e.key === 'y' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useSceneStore.getState().redo();
        return;
      }

      if (e.key === 'q') {
        useUiStore.getState().setGizmoMode('translate');
      }
      if (e.key === 'w') {
        useUiStore.getState().setGizmoMode('rotate');
      }
      if (e.key === 'e') {
        useUiStore.getState().setGizmoMode('scale');
      }

      if (e.key === 'g') {
        useUiStore.getState().toggleGrid();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
