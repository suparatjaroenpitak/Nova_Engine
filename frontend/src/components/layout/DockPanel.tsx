import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { PanelId } from '@/types';

interface DockPanelProps {
  panelId: PanelId;
  title: string;
  icon?: string;
  children: ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  onClose?: () => void;
  actions?: ReactNode;
}

export function DockPanel({
  panelId,
  title,
  icon,
  children,
  defaultWidth,
  defaultHeight,
  minWidth = 180,
  minHeight = 80,
  onClose,
  actions,
}: DockPanelProps) {
  const theme = useThemeStore((s) => s.theme);
  const { isPanelLocked, undockPanel, maximizePanel, maximizedPanel } = useWorkspaceStore();
  const [isFloating, setIsFloating] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: defaultWidth || 300, height: defaultHeight || 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'tl' | 'tr' | 'bl' | 'br' | 'l' | 'r' | 't' | 'b' | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const locked = isPanelLocked(panelId);
  const isMaximized = maximizedPanel === panelId;

  const handleHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.dock-panel-btn')) return;
    if (locked) return;
    if (!isFloating) {
      setIsFloating(true);
      const rect = panelRef.current?.getBoundingClientRect();
      if (rect) {
        setPosition({ x: rect.left, y: rect.top });
        setSize({ width: rect.width, height: rect.height });
      }
    }
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    setIsDragging(true);
  }, [locked, isFloating, position]);

  const handleResizeStart = useCallback((dir: 'tl' | 'tr' | 'bl' | 'br' | 'l' | 'r' | 't' | 'b') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(dir);
  }, []);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && isFloating) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
      if (isResizing) {
        const rect = panelRef.current?.getBoundingClientRect();
        if (!rect) return;
        let { width, height, left, top } = rect;
        switch (isResizing) {
          case 'r': width = Math.max(minWidth, e.clientX - left); break;
          case 'b': height = Math.max(minHeight, e.clientY - top); break;
          case 'l':
            width = Math.max(minWidth, left + width - e.clientX);
            left = e.clientX;
            break;
          case 't':
            height = Math.max(minHeight, top + height - e.clientY);
            top = e.clientY;
            break;
          case 'br':
            width = Math.max(minWidth, e.clientX - left);
            height = Math.max(minHeight, e.clientY - top);
            break;
          case 'bl':
            width = Math.max(minWidth, left + width - e.clientX);
            height = Math.max(minHeight, e.clientY - top);
            left = e.clientX;
            break;
          case 'tr':
            width = Math.max(minWidth, e.clientX - left);
            height = Math.max(minHeight, top + height - e.clientY);
            top = e.clientY;
            break;
          case 'tl':
            width = Math.max(minWidth, left + width - e.clientX);
            height = Math.max(minHeight, top + height - e.clientY);
            left = e.clientX;
            top = e.clientY;
            break;
        }
        setPosition({ x: left, y: top });
        setSize({ width, height });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isFloating, minWidth, minHeight]);

  const panelStyle: React.CSSProperties = isFloating ? {
    position: 'fixed',
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    zIndex: 1000,
    cursor: isDragging ? 'grabbing' : undefined,
  } : {
    width: '100%',
    height: '100%',
    minWidth,
    minHeight,
  };

  return (
    <div
      ref={panelRef}
      className={`flex flex-col overflow-hidden rounded-lg ${
        isFloating ? 'shadow-2xl border' : ''
      }`}
      style={{
        ...panelStyle,
        backgroundColor: theme.surface,
        borderColor: theme.border,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center h-8 px-2 select-none shrink-0 group"
        style={{
          backgroundColor: theme.surface2,
          borderBottom: `1px solid ${theme.border}`,
          cursor: locked ? 'default' : 'grab',
        }}
        onMouseDown={handleHeaderMouseDown}
        onDoubleClick={() => maximizePanel(isMaximized ? null : panelId)}
      >
        {icon && <span className="text-xs mr-1.5">{icon}</span>}
        <span className="text-xs font-medium truncate" style={{ color: theme.text }}>
          {title}
        </span>
        <div className="flex-1" />
        {actions}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="dock-panel-btn w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-xs"
            style={{ color: theme.muted }}
            onClick={() => maximizePanel(isMaximized ? null : panelId)}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? '❐' : '□'}
          </button>
          <button
            className="dock-panel-btn w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-xs"
            style={{ color: theme.muted }}
            onClick={() => {
              setIsFloating(!isFloating);
              if (!isFloating) {
                const rect = panelRef.current?.getBoundingClientRect();
                if (rect) {
                  setPosition({ x: rect.left, y: rect.top });
                  setSize({ width: rect.width, height: rect.height });
                }
              }
            }}
            title={isFloating ? 'Dock' : 'Undock'}
          >
            {isFloating ? '⊞' : '⊟'}
          </button>
          <button
            className="dock-panel-btn w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 text-xs"
            style={{ color: theme.muted }}
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Resize handles for floating mode */}
      {isFloating && (
        <>
          <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize" onMouseDown={handleResizeStart('tl')} />
          <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize" onMouseDown={handleResizeStart('tr')} />
          <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize" onMouseDown={handleResizeStart('bl')} />
          <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize" onMouseDown={handleResizeStart('br')} />
          <div className="absolute top-0 left-3 right-3 h-1.5 cursor-n-resize" onMouseDown={handleResizeStart('t')} />
          <div className="absolute bottom-0 left-3 right-3 h-1.5 cursor-s-resize" onMouseDown={handleResizeStart('b')} />
          <div className="absolute left-0 top-3 bottom-3 w-1.5 cursor-w-resize" onMouseDown={handleResizeStart('l')} />
          <div className="absolute right-0 top-3 bottom-3 w-1.5 cursor-e-resize" onMouseDown={handleResizeStart('r')} />
        </>
      )}
    </div>
  );
}

export function DockTabBar({
  tabs,
  activeTab,
  onSelectTab,
  onCloseTab,
  onReorder,
}: {
  tabs: { id: string; label: string; modified?: boolean }[];
  activeTab: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab?: (id: string) => void;
  onReorder?: (from: number, to: number) => void;
}) {
  const theme = useThemeStore((s) => s.theme);

  return (
    <div
      className="flex items-center h-8 overflow-x-auto shrink-0"
      style={{
        backgroundColor: theme.surface2,
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onSelectTab(tab.id)}
          className="flex items-center gap-1 px-3 h-full cursor-pointer text-xs whitespace-nowrap transition-colors shrink-0 group"
          style={{
            color: activeTab === tab.id ? theme.text : theme.muted,
            backgroundColor: activeTab === tab.id ? theme.surface : 'transparent',
            borderRight: `1px solid ${theme.border}`,
          }}
        >
          <span>{tab.label}</span>
          {tab.modified && (
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
          )}
          {onCloseTab && (
            <button
              onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function DockZoneIndicator({
  zone,
  isOver,
}: {
  zone: 'left' | 'right' | 'top' | 'bottom' | 'center';
  isOver: boolean;
}) {
  if (!isOver) return null;

  const positionMap = {
    left: { left: 0, top: 0, width: '33.33%', height: '100%' },
    right: { left: '66.66%', top: 0, width: '33.33%', height: '100%' },
    top: { left: 0, top: 0, width: '100%', height: '33.33%' },
    bottom: { left: 0, top: '66.66%', width: '100%', height: '33.33%' },
    center: { left: '33.33%', top: '33.33%', width: '33.33%', height: '33.33%' },
  };

  const pos = positionMap[zone];

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-150"
      style={{
        ...pos,
        backgroundColor: 'rgba(233, 69, 96, 0.15)',
        border: '2px solid rgba(233, 69, 96, 0.5)',
        borderRadius: '4px',
      }}
    >
      <div
        className="absolute inset-1 rounded"
        style={{ backgroundColor: 'rgba(233, 69, 96, 0.1)' }}
      />
    </div>
  );
}
