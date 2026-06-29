import { useEffect, useState, useRef } from 'react';
import { useSceneStore } from '@/stores/sceneStore';
import { gameObjectsApi } from '@/api/gameObjects';
import { componentsApi } from '@/api/components';
import type { TransformDto, ComponentDto } from '@/types';

const AVAILABLE_COMPONENTS = [
  { kind: 'MeshRenderer', category: 'Rendering' },
  { kind: 'MeshFilter', category: 'Rendering' },
  { kind: 'SpriteRenderer', category: 'Rendering' },
  { kind: 'CanvasRenderer', category: 'UI' },
  { kind: 'RigidBody', category: 'Physics' },
  { kind: 'BoxCollider', category: 'Physics' },
  { kind: 'SphereCollider', category: 'Physics' },
  { kind: 'CapsuleCollider', category: 'Physics' },
  { kind: 'MeshCollider', category: 'Physics' },
  { kind: 'CharacterController', category: 'Physics' },
  { kind: 'AudioSource', category: 'Audio' },
  { kind: 'AudioListener', category: 'Audio' },
  { kind: 'Light', category: 'Lighting' },
  { kind: 'Camera', category: 'Camera' },
  { kind: 'ParticleSystem', category: 'Effects' },
  { kind: 'Animation', category: 'Animation' },
  { kind: 'Animator', category: 'Animation' },
  { kind: 'Canvas', category: 'UI' },
  { kind: 'Button', category: 'UI' },
  { kind: 'Image', category: 'UI' },
  { kind: 'Text', category: 'UI' },
  { kind: 'Slider', category: 'UI' },
  { kind: 'Terrain', category: 'Terrain' },
  { kind: 'ScriptComponent', category: 'Scripting' },
];

function Vector3Field({ label, value, onChange }: { label: string; value: [number, number, number]; onChange: (v: [number, number, number]) => void }) {
  return (
    <div className="mb-2">
      <div className="text-xs text-nova-muted mb-1">{label}</div>
      <div className="flex gap-1">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis} className="flex-1 flex items-center">
            <span className="text-xs text-nova-muted mr-1 w-3 font-mono">{axis}</span>
            <input
              type="number"
              value={Number(value[i]).toFixed(2)}
              onChange={(e) => {
                const newVal = [...value] as [number, number, number];
                newVal[i] = parseFloat(e.target.value) || 0;
                onChange(newVal);
              }}
              className="w-full px-1 py-0.5 bg-nova-bg border border-nova-border rounded text-xs text-nova-text font-mono"
              step="0.1"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentBlock({
  component,
  onRemove,
  onToggle,
  onCopy,
}: {
  component: ComponentDto;
  onRemove: () => void;
  onToggle: () => void;
  onCopy: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  let props: Record<string, any> = {};
  try { props = JSON.parse(component.propertiesJson); } catch {}

  const iconMap: Record<string, string> = {
    MeshRenderer: '◆', MeshFilter: '◈', SpriteRenderer: '🖼',
    RigidBody: '⚙', BoxCollider: '▣', SphereCollider: '◉', CapsuleCollider: '⬯', MeshCollider: '⬡', CharacterController: '🚶',
    AudioSource: '🔊', AudioListener: '👂',
    Light: '💡', Camera: '📷',
    ParticleSystem: '✨',
    Animation: '▶', Animator: '🎭',
    Canvas: '▭', Button: '▢', Image: '🖼', Text: 'T', Slider: '━',
    Terrain: '⛰',
    ScriptComponent: '📜',
  };

  return (
    <div className="mb-2 bg-nova-bg/50 border border-nova-border rounded overflow-hidden group">
      <div
        className="flex items-center justify-between px-2 py-1.5 bg-nova-surface2/50 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="checkbox"
            checked={component.enabled}
            onChange={(e) => { e.stopPropagation(); onToggle(); }}
            className="accent-nova-accent shrink-0"
          />
          <span className="text-xs text-nova-muted shrink-0">{iconMap[component.kind] || '◇'}</span>
          <span className="text-xs font-medium text-nova-text truncate">{component.kind}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="opacity-0 group-hover:opacity-100 text-nova-muted hover:text-nova-text text-xs px-1 transition-opacity"
          >
            ⋮
          </button>
          <span className="text-xs text-nova-muted">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {showMenu && (
        <div className="relative">
          <div className="absolute right-2 top-0 w-32 glass border border-nova-border rounded-lg p-1 z-20 shadow-xl">
            {[
              { label: 'Copy Component', action: onCopy },
              { label: 'Remove', action: onRemove, danger: true },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => { item.action(); setShowMenu(false); }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs ${item.danger ? 'text-red-400 hover:bg-red-500/20' : 'text-nova-text hover:bg-nova-hover'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {expanded && Object.keys(props).length > 0 && (
        <div className="p-2 space-y-1">
          {Object.entries(props).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between py-0.5">
              <span className="text-xs text-nova-muted">{key}</span>
              <span className="text-xs text-nova-text font-mono">{String(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Inspector() {
  const { selectedGameObject, updateGameObject } = useSceneStore();
  const [transform, setTransform] = useState<TransformDto | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [localComponents, setLocalComponents] = useState<ComponentDto[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedGameObject) {
      setTransform({ ...selectedGameObject.transform });
      setLocalComponents([...selectedGameObject.components]);
    } else {
      setTransform(null);
      setLocalComponents([]);
    }
    setShowAddMenu(false);
  }, [selectedGameObject]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!selectedGameObject) {
    return (
      <div className="h-full flex items-center justify-center text-nova-muted text-xs p-4">
        <div className="text-center">
          <div className="text-2xl mb-2 opacity-30">◇</div>
          Select a GameObject to inspect
        </div>
      </div>
    );
  }

  const saveTransform = async () => {
    if (transform && selectedGameObject) {
      await gameObjectsApi.update(selectedGameObject.id, {
        ...selectedGameObject,
        transform,
      });
    }
  };

  const handleAddComponent = async (kind: string) => {
    try {
      const { data } = await componentsApi.add({ gameObjectId: selectedGameObject.id, kind });
      setLocalComponents((prev) => [...prev, data]);
      setShowAddMenu(false);
    } catch (err) {
      console.error('Failed to add component:', err);
    }
  };

  const handleRemoveComponent = async (comp: ComponentDto) => {
    try {
      await componentsApi.delete(comp.id);
      setLocalComponents((prev) => prev.filter((c) => c.id !== comp.id));
    } catch (err) {
      console.error('Failed to remove component:', err);
    }
  };

  const handleCopyComponent = (comp: ComponentDto) => {
    navigator.clipboard.writeText(JSON.stringify({ kind: comp.kind, propertiesJson: comp.propertiesJson }, null, 2));
  };

  const categories = [...new Set(AVAILABLE_COMPONENTS.map((c) => c.category))];
  const existingKinds = new Set(localComponents.map((c) => c.kind));

  return (
    <div className="h-full overflow-y-auto p-3">
      {/* Header */}
      <div className="mb-4">
        <input
          value={selectedGameObject.name}
          onChange={(e) => updateGameObject(selectedGameObject.id, { name: e.target.value })}
          className="w-full px-2 py-1 bg-nova-bg border border-nova-border rounded text-sm text-nova-text font-medium"
        />
        <div className="flex items-center gap-3 mt-2">
          <label className="flex items-center gap-1.5 text-xs text-nova-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedGameObject.isActive}
              onChange={(e) => updateGameObject(selectedGameObject.id, { isActive: e.target.checked })}
              className="accent-nova-accent"
            />
            Active
          </label>
          <span className="text-xs text-nova-muted">Layer: {selectedGameObject.layer}</span>
          <span className="text-xs text-nova-muted">Tag: {selectedGameObject.tag ?? 'Untagged'}</span>
        </div>
      </div>

      {/* Transform */}
      <div className="mb-4 bg-nova-bg/50 border border-nova-border rounded p-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-nova-muted">◈</span>
            <span className="text-xs font-medium text-white">Transform</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                if (selectedGameObject) {
                  gameObjectsApi.update(selectedGameObject.id, {
                    ...selectedGameObject,
                    transform: { px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, rw: 1, sx: 1, sy: 1, sz: 1 },
                  });
                  setTransform({ px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, rw: 1, sx: 1, sy: 1, sz: 1 });
                }
              }}
              className="text-xs text-nova-muted hover:text-nova-text px-1"
              title="Reset"
            >
              ↺
            </button>
            <button className="text-xs text-nova-muted hover:text-nova-text px-1" title="Context Menu">⋮</button>
          </div>
        </div>
        {transform && (
          <>
            <Vector3Field label="Position" value={[transform.px, transform.py, transform.pz]} onChange={(v) => setTransform({ ...transform, px: v[0], py: v[1], pz: v[2] })} />
            <Vector3Field label="Rotation" value={[transform.rx, transform.ry, transform.rz]} onChange={(v) => setTransform({ ...transform, rx: v[0], ry: v[1], rz: v[2] })} />
            <Vector3Field label="Scale" value={[transform.sx, transform.sy, transform.sz]} onChange={(v) => setTransform({ ...transform, sx: v[0], sy: v[1], sz: v[2] })} />
            <div className="flex gap-2 mt-1">
              <button onClick={saveTransform} className="flex-1 px-2 py-1 bg-nova-accent text-white text-xs rounded hover:bg-red-500 transition-colors">
                Apply
              </button>
              <button
                onClick={() => selectedGameObject && setTransform({ ...selectedGameObject.transform })}
                className="px-2 py-1 bg-nova-hover text-nova-text text-xs rounded hover:bg-nova-active transition-colors"
              >
                Revert
              </button>
            </div>
          </>
        )}
      </div>

      {/* Components */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-white">Components</span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="text-xs text-nova-accent hover:text-red-400 transition-colors px-2 py-0.5 rounded hover:bg-nova-hover"
          >
            + Add Component
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-6 w-56 glass border border-nova-border rounded-xl p-2 z-30 shadow-2xl max-h-80 overflow-y-auto animate-scale-in">
              {categories.map((cat) => {
                const items = AVAILABLE_COMPONENTS.filter((c) => c.category === cat && !existingKinds.has(c.kind));
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="mb-1">
                    <div className="text-xs font-medium text-nova-muted uppercase tracking-wider px-2 py-1">{cat}</div>
                    {items.map((item) => (
                      <button
                        key={item.kind}
                        onClick={() => handleAddComponent(item.kind)}
                        className="w-full text-left px-2 py-1.5 rounded text-xs text-nova-text hover:bg-nova-hover transition-colors"
                      >
                        {item.kind}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {localComponents.map((comp) => (
        <ComponentBlock
          key={comp.id}
          component={comp}
          onRemove={() => handleRemoveComponent(comp)}
          onToggle={async () => {
            await componentsApi.update(comp.id, { kind: comp.kind, propertiesJson: comp.propertiesJson });
            setLocalComponents((prev) => prev.map((c) => c.id === comp.id ? { ...c, enabled: !c.enabled } : c));
          }}
          onCopy={() => handleCopyComponent(comp)}
        />
      ))}
    </div>
  );
}
