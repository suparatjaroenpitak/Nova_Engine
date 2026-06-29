import { useState } from 'react';

export default function TerrainEditor() {
  const [selectedTool, setSelectedTool] = useState<'raise' | 'lower' | 'smooth' | 'paint'>('raise');
  const [brushSize, setBrushSize] = useState(25);
  const [brushStrength, setBrushStrength] = useState(0.5);

  const tools = [
    { id: 'raise' as const, label: 'Raise', icon: '⤴' },
    { id: 'lower' as const, label: 'Lower', icon: '⤵' },
    { id: 'smooth' as const, label: 'Smooth', icon: '≈' },
    { id: 'paint' as const, label: 'Paint', icon: '🎨' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center h-7 gap-1 px-2 border-b border-nova-border bg-nova-surface2/30">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setSelectedTool(tool.id)}
            className={`px-3 py-1 text-xs rounded ${
              selectedTool === tool.id ? 'bg-nova-accent text-white' : 'bg-nova-hover text-nova-text hover:bg-nova-active'
            }`}
          >
            {tool.icon} {tool.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <label className="text-xs text-nova-muted block mb-1">Brush Size: {brushSize}</label>
          <input
            type="range"
            min="1"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-full accent-nova-accent"
          />
        </div>

        <div>
          <label className="text-xs text-nova-muted block mb-1">Strength: {brushStrength.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={brushStrength}
            onChange={(e) => setBrushStrength(parseFloat(e.target.value))}
            className="w-full accent-nova-accent"
          />
        </div>

        <div>
          <h3 className="text-xs font-medium text-nova-muted mb-2 uppercase">Terrain Settings</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-nova-text">
              <span>Resolution</span>
              <span>512 × 512</span>
            </div>
            <div className="flex justify-between text-xs text-nova-text">
              <span>Heightmap</span>
              <span>—</span>
            </div>
            <div className="flex justify-between text-xs text-nova-text">
              <span>Size</span>
              <span>1000 × 1000</span>
            </div>
          </div>
        </div>

        {selectedTool === 'paint' && (
          <div>
            <h3 className="text-xs font-medium text-nova-muted mb-2 uppercase">Textures</h3>
            <div className="grid grid-cols-4 gap-2">
              {['Grass', 'Rock', 'Sand', 'Snow'].map((tex) => (
                <div
                  key={tex}
                  className="h-10 bg-nova-bg border border-nova-border rounded flex items-center justify-center text-xs text-nova-muted cursor-pointer hover:border-nova-accent"
                >
                  {tex}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
