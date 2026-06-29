import { useEffect, useRef, useCallback } from 'react';
import { useImportStore } from '@/stores/importStore';
import { scanDropItems } from '@/services/importService';

interface UseExternalDropOptions {
  panelId: string;
  enabled?: boolean;
  allowedCategories?: string[];
}

export function useExternalDrop({ panelId, enabled = true, allowedCategories }: UseExternalDropOptions) {
  const ref = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);

  const setDragging = useImportStore((s) => s.setDragging);
  const setDragFiles = useImportStore((s) => s.setDragFiles);
  const setDragOverPanel = useImportStore((s) => s.setDragOverPanel);
  const acceptDrop = useImportStore((s) => s.acceptDrop);
  const dismissDrop = useImportStore((s) => s.dismissDrop);

  const handleDragEnter = useCallback(async (e: DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;

    if (e.dataTransfer?.items) {
      const files = await scanDropItems(Array.from(e.dataTransfer.items));
      if (allowedCategories) {
        const filtered = files.filter((f) => allowedCategories.includes(f.category));
        setDragFiles(filtered);
      } else {
        setDragFiles(files);
      }
    }

    setDragging(true);
    setDragOverPanel(panelId);
  }, [enabled, panelId, allowedCategories]);

  const handleDragOver = useCallback((e: DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, [enabled]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      if (!document.querySelector('.drop-overlay-active')) {
        setDragging(false);
        setDragOverPanel(null);
      }
    }
  }, [enabled]);

  const handleDrop = useCallback(async (e: DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const files = await scanDropItems(Array.from(e.dataTransfer.items));
      const filtered = allowedCategories
        ? files.filter((f) => allowedCategories.includes(f.category))
        : files;

      if (filtered.length > 0) {
        acceptDrop(filtered);
      }
    } else {
      dismissDrop();
    }
  }, [enabled, allowedCategories]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('dragenter', handleDragEnter);
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('dragleave', handleDragLeave);
    el.addEventListener('drop', handleDrop);

    return () => {
      el.removeEventListener('dragenter', handleDragEnter);
      el.removeEventListener('dragover', handleDragOver);
      el.removeEventListener('dragleave', handleDragLeave);
      el.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragOver, handleDragLeave, handleDrop]);

  return ref;
}
