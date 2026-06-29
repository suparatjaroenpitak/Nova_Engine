import { useEffect, useState } from 'react';
import { useSceneStore } from '@/stores/sceneStore';
import { gameObjectsApi } from '@/api/gameObjects';
import type { TransformDto, ComponentDto } from '@/types';

function Vector3Field({ label, value, onChange }: { label: string; value: [number, number, number]; onChange: (v: [number, number, number]) => void }) {
  return (
    <div className="mb-2">
      <div className="text-xs text-nova-muted mb-1">{label}</div>
      <div className="flex gap-1">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis} className="flex-1 flex items-center">
            <span className="text-xs text-nova-muted mr-1 w-3">{axis}</span>
            <input
              type="number"
              value={Number(value[i]).toFixed(2)}
              onChange={(e) => {
                const newVal = [...value] as [number, number, number];
                newVal[i] = parseFloat(e.target.value) || 0;
                onChange(newVal);
              }}
              className="w-full px-1 py-0.5 bg-nova-bg border border-nova-border rounded text-xs text-nova-text"
              step="0.1"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentBlock({ component }: { component: ComponentDto }) {
  const [expanded, setExpanded] = useState(true);

  let props: Record<string, any> = {};
  try { props = JSON.parse(component.propertiesJson); } catch {}

  return (
    <div className="mb-2 bg-nova-bg/50 border border-nova-border rounded overflow-hidden">
      <div
        className="flex items-center justify-between px-2 py-1.5 bg-nova-surface2/50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={component.enabled} className="accent-nova-accent" readOnly />
          <span className="text-xs font-medium text-nova-text">{component.kind}</span>
        </div>
        <span className="text-xs text-nova-muted">{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <div className="p-2">
          {Object.entries(props).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-xs text-nova-muted">{key}</span>
              <span className="text-xs text-nova-text">{String(val)}</span>
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

  useEffect(() => {
    if (selectedGameObject) {
      setTransform({ ...selectedGameObject.transform });
    }
  }, [selectedGameObject]);

  if (!selectedGameObject) {
    return (
      <div className="h-full flex items-center justify-center text-nova-muted text-xs p-4">
        Select a GameObject to inspect
      </div>
    );
  }

  const saveTransform = () => {
    if (transform && selectedGameObject) {
      gameObjectsApi.update(selectedGameObject.id, {
        ...selectedGameObject,
        transform,
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="mb-4">
        <input
          value={selectedGameObject.name}
          onChange={(e) => updateGameObject(selectedGameObject.id, { name: e.target.value })}
          className="w-full px-2 py-1 bg-nova-bg border border-nova-border rounded text-sm text-nova-text font-medium"
        />
        <div className="flex items-center gap-2 mt-2">
          <label className="flex items-center gap-1 text-xs text-nova-muted">
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

      <div className="mb-4 bg-nova-bg/50 border border-nova-border rounded p-2">
        <div className="text-xs font-medium text-white mb-2">Transform</div>
        {transform && (
          <>
            <Vector3Field label="Position" value={[transform.px, transform.py, transform.pz]} onChange={(v) => setTransform({ ...transform, px: v[0], py: v[1], pz: v[2] })} />
            <Vector3Field label="Rotation" value={[transform.rx, transform.ry, transform.rz]} onChange={(v) => setTransform({ ...transform, rx: v[0], ry: v[1], rz: v[2] })} />
            <Vector3Field label="Scale" value={[transform.sx, transform.sy, transform.sz]} onChange={(v) => setTransform({ ...transform, sx: v[0], sy: v[1], sz: v[2] })} />
            <button onClick={saveTransform} className="mt-1 px-2 py-1 bg-nova-accent text-white text-xs rounded">Apply</button>
          </>
        )}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-white">Components</span>
        <button className="text-xs text-nova-accent hover:text-red-400">+ Add</button>
      </div>

      {selectedGameObject.components?.map((comp) => (
        <ComponentBlock key={comp.id} component={comp} />
      ))}
    </div>
  );
}
