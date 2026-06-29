import { useState, useMemo } from 'react';

interface TerrainLayer {
  id: string;
  name: string;
  texture: string;
  tileSize: [number, number];
  metallic: number;
  smoothness: number;
  color: string;
}

interface TerrainSettings {
  width: number;
  length: number;
  height: number;
  resolution: number;
  detailResolution: number;
  grassDensity: number;
  treeDensity: number;
}

const TOOLS = [
  { id: 'raise', label: 'Raise', icon: '⤴', desc: 'Raise terrain height' },
  { id: 'lower', label: 'Lower', icon: '⤵', desc: 'Lower terrain height' },
  { id: 'smooth', label: 'Smooth', icon: '≈', desc: 'Smooth height changes' },
  { id: 'flatten', label: 'Flatten', icon: '▬', desc: 'Flatten to target height' },
  { id: 'paint', label: 'Paint', icon: '🎨', desc: 'Paint terrain textures' },
  { id: 'tree', label: 'Trees', icon: '🌲', desc: 'Place trees' },
  { id: 'grass', label: 'Grass', icon: '🌿', desc: 'Paint grass' },
  { id: 'water', label: 'Water', icon: '🌊', desc: 'Place water' },
  { id: 'road', label: 'Road', icon: '🛣', desc: 'Paint roads' },
  { id: 'noise', label: 'Noise', icon: '〰', desc: 'Generate noise-based terrain' },
];

const DEFAULT_LAYERS: TerrainLayer[] = [
  { id: 'l1', name: 'Grass', texture: 'grass_albedo', tileSize: [10, 10], metallic: 0, smoothness: 0.3, color: '#44aa44' },
  { id: 'l2', name: 'Rock', texture: 'rock_albedo', tileSize: [15, 15], metallic: 0.8, smoothness: 0.2, color: '#888888' },
  { id: 'l3', name: 'Sand', texture: 'sand_albedo', tileSize: [8, 8], metallic: 0, smoothness: 0.5, color: '#ddcc88' },
  { id: 'l4', name: 'Snow', texture: 'snow_albedo', tileSize: [12, 12], metallic: 0, smoothness: 0.8, color: '#ffffff' },
  { id: 'l5', name: 'Mud', texture: 'mud_albedo', tileSize: [10, 10], metallic: 0, smoothness: 0.1, color: '#665544' },
];

const TREE_TYPES = [
  { name: 'Oak', icon: '🌳', height: 10, color: '#2d5a27' },
  { name: 'Pine', icon: '🌲', height: 15, color: '#1a4a1a' },
  { name: 'Palm', icon: '🌴', height: 8, color: '#3a7a3a' },
  { name: 'Bush', icon: '🌿', height: 2, color: '#4a8a3a' },
  { name: 'Mushroom', icon: '🍄', height: 1, color: '#cc4444' },
];

const GRASS_TYPES = [
  { name: 'Short Grass', icon: '🌱', color: '#44aa44' },
  { name: 'Tall Grass', icon: '🌾', color: '#88aa44' },
  { name: 'Wildflowers', icon: '🌸', color: '#cc88aa' },
  { name: 'Ferns', icon: '🍃', color: '#44aa66' },
];

export default function TerrainEditor() {
  const [selectedTool, setSelectedTool] = useState('raise');
  const [brushSize, setBrushSize] = useState(25);
  const [brushStrength, setBrushStrength] = useState(0.5);
  const [targetHeight, setTargetHeight] = useState(50);
  const [settings, setSettings] = useState<TerrainSettings>({
    width: 1000, length: 1000, height: 200,
    resolution: 512, detailResolution: 256,
    grassDensity: 0.3, treeDensity: 0.2,
  });
  const [layers, setLayers] = useState<TerrainLayer[]>(DEFAULT_LAYERS);
  const [activeLayer, setActiveLayer] = useState('l1');
  const [selectedTree, setSelectedTree] = useState(0);
  const [selectedGrass, setSelectedGrass] = useState(0);
  const [showLayers, setShowLayers] = useState(false);
  const [exportHeightmap, setExportHeightmap] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateTerrain = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1500);
  };

  return (
    <div className="h-full flex flex-col bg-[#12122a]">
      {/* Tool selector */}
      <div className="flex items-center h-8 px-1 bg-[#1a1a35] border-b border-[#2a2a4a] gap-0.5 overflow-x-auto shrink-0">
        {TOOLS.map((tool) => (
          <button key={tool.id} onClick={() => setSelectedTool(tool.id)}
            className={`px-2 py-1 rounded text-[10px] whitespace-nowrap transition-all flex items-center gap-1 ${
              selectedTool === tool.id
                ? 'bg-[#e94560] text-white shadow-sm shadow-[#e94560]/30'
                : 'text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]'
            }`}
            title={tool.desc}
          >
            <span>{tool.icon}</span>
            <span className="hidden lg:inline">{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main settings */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {/* Brush settings */}
          <div className="bg-[#0f0f25] border border-[#2a2a4a] rounded p-2">
            <div className="text-[10px] font-medium text-[#e8e8f0] mb-2">Brush</div>
            <SliderField label="Size" value={brushSize} min={1} max={100} step={1} onChange={setBrushSize} />
            <SliderField label="Strength" value={brushStrength} min={0} max={1} step={0.01} onChange={setBrushStrength} />
            {selectedTool === 'flatten' && <SliderField label="Target Height" value={targetHeight} min={0} max={200} step={1} onChange={setTargetHeight} />}
          </div>

          {/* Paint layers */}
          {selectedTool === 'paint' && (
            <div className="bg-[#0f0f25] border border-[#2a2a4a] rounded p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-[#e8e8f0]">Textures</span>
                <button onClick={() => setShowLayers(!showLayers)} className="text-[9px] text-[#e94560] hover:text-red-400">+ Add Layer</button>
              </div>
              <div className="space-y-1">
                {layers.map((layer) => (
                  <div key={layer.id} onClick={() => setActiveLayer(layer.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-[10px] transition-all ${
                      activeLayer === layer.id ? 'bg-[#e94560]/20 border border-[#e94560]/50' : 'bg-[#0a0a1a] border border-[#2a2a4a] hover:border-[#3a3a5a]'
                    }`}
                  >
                    <div className="w-6 h-6 rounded border border-[#2a2a4a]" style={{ backgroundColor: layer.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[#e8e8f0] font-medium truncate">{layer.name}</div>
                      <div className="text-[8px] text-[#6a6a8a]">Tile: {layer.tileSize[0]}×{layer.tileSize[1]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tree placement */}
          {selectedTool === 'tree' && (
            <div className="bg-[#0f0f25] border border-[#2a2a4a] rounded p-2">
              <div className="text-[10px] font-medium text-[#e8e8f0] mb-2">Trees</div>
              <div className="grid grid-cols-5 gap-1 mb-2">
                {TREE_TYPES.map((tree, i) => (
                  <button key={tree.name} onClick={() => setSelectedTree(i)}
                    className={`p-1 rounded text-center border transition-all ${
                      selectedTree === i ? 'border-[#e94560] bg-[#e94560]/10' : 'border-[#2a2a4a] hover:border-[#3a3a5a]'
                    }`}
                  >
                    <div className="text-sm">{tree.icon}</div>
                    <div className="text-[7px] text-[#6a6a8a] truncate">{tree.name}</div>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[#6a6a8a]">
                <span>Density:</span>
                <input type="range" value={settings.treeDensity * 100} min={1} max={100}
                  onChange={(e) => setSettings({ ...settings, treeDensity: parseInt(e.target.value) / 100 })}
                  className="flex-1 h-1 accent-[#e94560]"
                />
                <span>{(settings.treeDensity * 100).toFixed(0)}%</span>
              </div>
              <button className="w-full mt-1 py-1 bg-[#44cc44] text-white text-[10px] rounded hover:bg-green-600">Paint Trees</button>
            </div>
          )}

          {/* Grass painting */}
          {selectedTool === 'grass' && (
            <div className="bg-[#0f0f25] border border-[#2a2a4a] rounded p-2">
              <div className="text-[10px] font-medium text-[#e8e8f0] mb-2">Grass & Foliage</div>
              <div className="grid grid-cols-4 gap-1 mb-2">
                {GRASS_TYPES.map((grass, i) => (
                  <button key={grass.name} onClick={() => setSelectedGrass(i)}
                    className={`p-1 rounded text-center border transition-all ${
                      selectedGrass === i ? 'border-[#e94560] bg-[#e94560]/10' : 'border-[#2a2a4a] hover:border-[#3a3a5a]'
                    }`}
                  >
                    <div className="text-sm">{grass.icon}</div>
                    <div className="text-[7px] text-[#6a6a8a] truncate">{grass.name}</div>
                  </button>
                ))}
              </div>
              <SliderField label="Density" value={settings.grassDensity} min={0} max={1} step={0.05} onChange={(v) => setSettings({ ...settings, grassDensity: v })} />
              <button className="w-full mt-1 py-1 bg-[#44cc44] text-white text-[10px] rounded hover:bg-green-600">Paint Grass</button>
            </div>
          )}

          {/* Terrain Settings */}
          <div className="bg-[#0f0f25] border border-[#2a2a4a] rounded p-2">
            <div className="text-[10px] font-medium text-[#e8e8f0] mb-2">Terrain Settings</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-[#6a6a8a]">Width</span><span className="text-[#e8e8f0]">{settings.width}m</span></div>
              <div className="flex justify-between"><span className="text-[#6a6a8a]">Length</span><span className="text-[#e8e8f0]">{settings.length}m</span></div>
              <div className="flex justify-between"><span className="text-[#6a6a8a]">Height</span><span className="text-[#e8e8f0]">{settings.height}m</span></div>
              <div className="flex justify-between"><span className="text-[#6a6a8a]">Resolution</span><span className="text-[#e8e8f0]">{settings.resolution}×{settings.resolution}</span></div>
            </div>
          </div>

          {/* Generate / Noise */}
          {(selectedTool === 'noise') && (
            <div className="bg-[#0f0f25] border border-[#2a2a4a] rounded p-2">
              <div className="text-[10px] font-medium text-[#e8e8f0] mb-2">Noise Generation</div>
              <div className="flex gap-1 mb-2">
                {['Perlin', 'Simplex', 'Voronoi', 'Ridge'].map((type) => (
                  <button key={type} className="flex-1 px-2 py-1 rounded text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] text-[#6a6a8a] hover:text-white hover:border-[#e94560]/50">{type}</button>
                ))}
              </div>
              <button onClick={generateTerrain} disabled={generating} className="w-full py-1.5 bg-[#4488ff] text-white text-[10px] rounded hover:bg-blue-600 disabled:opacity-50">
                {generating ? '⏳ Generating...' : 'Generate Terrain'}
              </button>
              <button className="w-full mt-1 py-1 bg-[#1a1a35] border border-[#2a2a4a] text-[#6a6a8a] text-[10px] rounded hover:text-white">Export Heightmap</button>
            </div>
          )}
        </div>

        {/* Layer detail panel */}
        <div className="w-56 border-l border-[#2a2a4a] p-2 bg-[#0f0f25] overflow-y-auto">
          <div className="text-[10px] font-medium text-[#e8e8f0] mb-2">Layer Details</div>
          {layers.filter((l) => l.id === activeLayer).map((layer) => (
            <div key={layer.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#6a6a8a]">{layer.name}</span>
                <div className="w-6 h-6 rounded border border-[#2a2a4a]" style={{ backgroundColor: layer.color }} />
              </div>
              <div><SliderField label="Tile X" value={layer.tileSize[0]} min={1} max={50} step={1} onChange={(v) => setLayers((prev) => prev.map((l) => l.id === layer.id ? { ...l, tileSize: [v, l.tileSize[1]] } : l))} /></div>
              <div><SliderField label="Tile Y" value={layer.tileSize[1]} min={1} max={50} step={1} onChange={(v) => setLayers((prev) => prev.map((l) => l.id === layer.id ? { ...l, tileSize: [l.tileSize[0], v] } : l))} /></div>
              <div><SliderField label="Metallic" value={layer.metallic} min={0} max={1} step={0.01} onChange={(v) => setLayers((prev) => prev.map((l) => l.id === layer.id ? { ...l, metallic: v } : l))} /></div>
              <div><SliderField label="Smoothness" value={layer.smoothness} min={0} max={1} step={0.01} onChange={(v) => setLayers((prev) => prev.map((l) => l.id === layer.id ? { ...l, smoothness: v } : l))} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[9px] text-[#6a6a8a]">{label}</span>
      <div className="flex items-center gap-1">
        <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-16 h-1 accent-[#e94560] cursor-pointer" />
        <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-12 px-1 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] font-mono" />
      </div>
    </div>
  );
}
