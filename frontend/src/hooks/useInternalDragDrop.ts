import { useCallback, useRef } from 'react';
import type { DragPayload } from '@/types/import';

interface UseInternalDragDropOptions {
  onDrop?: (payload: DragPayload, targetId: string) => void;
  acceptTypes?: string[];
}

export function useInternalDragDrop({ onDrop, acceptTypes }: UseInternalDragDropOptions) {
  const dragPayloadRef = useRef<DragPayload | null>(null);

  const createDragProps = useCallback((payload: DragPayload) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      dragPayloadRef.current = payload;
      e.dataTransfer.setData('application/nova-asset', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'move';
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = '0.5';
      }
    },
    onDragEnd: (e: React.DragEvent) => {
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = '1';
      }
      dragPayloadRef.current = null;
    },
  }), []);

  const createDropProps = useCallback((targetId: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.classList.add('drop-target-active');
      }
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.classList.remove('drop-target-active');
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.classList.remove('drop-target-active');
      }

      try {
        const raw = e.dataTransfer.getData('application/nova-asset');
        if (raw) {
          const payload: DragPayload = JSON.parse(raw);
          if (!acceptTypes || acceptTypes.includes(payload.type)) {
            onDrop?.(payload, targetId);
          }
        }
      } catch {}
    },
  }), [acceptTypes, onDrop]);

  return { createDragProps, createDropProps, dragPayloadRef };
}
