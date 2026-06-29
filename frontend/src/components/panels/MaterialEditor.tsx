import { useState } from 'react';

interface MaterialProperty {
  name: string;
  type: 'color' | 'texture' | 'float' | 'vector' | 'range';
  value: any;
}

export default function MaterialEditor() {
  const [materialName, setMaterialName] = useState('New Material');
  const [properties, setProperties] = useState<MaterialProperty[]>([
    { name: 'Albedo', type: 'color', value: '#ffffff' },
    { name: 'Metallic', type: 'range', value: 0.0 },
    { name: 'Smoothness', type: 'range', value: 0.5 },
    { name: 'Normal Map', type: 'texture', value: null },
    { name: 'Emission', type: 'color', value: '#000000' },
    { name: 'Tiling', type: 'vector', value: { x: 1, y: 1 } },
    { name: 'Offset', type: 'vector', value: { x: 0, y: 0 } },
  ]);

  const updateProperty = (index: number, value: any) => {
    setProperties((props) => {
      const updated = [...props];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1 bg-nova-surface border-b border-nova-border">
        <input
          value={materialName}
          onChange={(e) => setMaterialName(e.target.value)}
          className="px-2 py-0.5 bg-nova-bg border border-nova-border rounded text-xs text-nova-text font-medium"
        />
        <div className="flex-1" />
        <button className="px-3 py-0.5 bg-nova-accent text-white text-xs rounded">Apply</button>
        <button className="px-3 py-0.5 bg-nova-hover text-nova-text text-xs rounded">Save</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-6">
          <h3 className="text-xs font-medium text-nova-muted mb-2 uppercase">Surface Options</h3>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs text-nova-text">
              <input type="checkbox" defaultChecked className="accent-nova-accent" /> Opaque
            </label>
            <label className="flex items-center gap-2 text-xs text-nova-text">
              <input type="checkbox" className="accent-nova-accent" /> Transparent
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-nova-muted mb-2 uppercase">Surface Inputs</h3>
          <div className="space-y-3">
            {properties.map((prop, i) => (
              <div key={prop.name}>
                <label className="text-xs text-nova-muted block mb-1">{prop.name}</label>
                {prop.type === 'color' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={prop.value}
                      onChange={(e) => updateProperty(i, e.target.value)}
                      className="w-8 h-8 bg-transparent border border-nova-border rounded cursor-pointer"
                    />
                    <span className="text-xs text-nova-text">{prop.value}</span>
                  </div>
                )}
                {prop.type === 'range' && (
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={prop.value}
                    onChange={(e) => updateProperty(i, parseFloat(e.target.value))}
                    className="w-full accent-nova-accent"
                  />
                )}
                {prop.type === 'texture' && (
                  <div className="h-16 bg-nova-bg border border-nova-border rounded flex items-center justify-center text-nova-muted text-xs cursor-pointer hover:border-nova-accent/50">
                    {prop.value ? prop.value : 'Select Texture'}
                  </div>
                )}
                {prop.type === 'vector' && (
                  <div className="flex gap-2">
                    {Object.entries(prop.value).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-1">
                        <span className="text-xs text-nova-muted uppercase">{key}</span>
                        <input
                          type="number"
                          value={val as number}
                          onChange={(e) => updateProperty(i, { ...prop.value, [key]: parseFloat(e.target.value) || 0 })}
                          className="w-16 px-1 py-0.5 bg-nova-bg border border-nova-border rounded text-xs text-nova-text"
                          step="0.1"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Material preview */}
      <div className="h-24 border-t border-nova-border bg-nova-bg flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-nova-border" style={{ background: properties[0].value }} />
      </div>
    </div>
  );
}
