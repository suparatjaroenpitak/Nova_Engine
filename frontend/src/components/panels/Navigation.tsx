import { useState } from 'react';

export default function Navigation() {
  const [baking, setBaking] = useState(false);
  const [agentRadius, setAgentRadius] = useState(0.5);
  const [agentHeight, setAgentHeight] = useState(2);
  const [maxSlope, setMaxSlope] = useState(45);
  const [stepHeight, setStepHeight] = useState(0.4);

  const handleBake = () => {
    setBaking(true);
    setTimeout(() => setBaking(false), 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="p-3 space-y-3">
        <div>
          <span className="text-xs font-medium text-[#e8e8f0] block mb-2">NavMesh Settings</span>
          <div className="bg-[#1a1a35] border border-[#2a2a4a] rounded p-3 space-y-2">
            <SliderField label="Agent Radius" value={agentRadius} min={0.1} max={5} step={0.1} onChange={setAgentRadius} />
            <SliderField label="Agent Height" value={agentHeight} min={0.5} max={10} step={0.1} onChange={setAgentHeight} />
            <SliderField label="Max Slope (°)" value={maxSlope} min={0} max={90} step={1} onChange={setMaxSlope} />
            <SliderField label="Step Height" value={stepHeight} min={0.1} max={2} step={0.1} onChange={setStepHeight} />
          </div>
        </div>

        <button
          onClick={handleBake}
          disabled={baking}
          className="w-full py-2 bg-[#e94560] text-white text-xs font-medium rounded hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {baking ? (
            <>
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Baking...
            </>
          ) : (
            'Bake NavMesh'
          )}
        </button>

        <div className="bg-[#1a1a35] border border-[#2a2a4a] rounded p-3">
          <span className="text-xs font-medium text-[#e8e8f0] block mb-2">Areas</span>
          {['Walkable', 'Not Walkable', 'Jump', 'Water'].map((area, i) => (
            <div key={area} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: ['#44cc44', '#ff4444', '#4488ff', '#4488cc'][i] }} />
                <span className="text-xs text-[#e8e8f0]">{area}</span>
              </div>
              <span className="text-[10px] text-[#6a6a8a]">Cost: {i === 0 ? 1 : i * 2}</span>
            </div>
          ))}
        </div>

        <div className="bg-[#1a1a35] border border-[#2a2a4a] rounded p-3">
          <span className="text-xs font-medium text-[#e8e8f0] block mb-2">Agents</span>
          <div className="space-y-1">
            {['Player', 'Enemy', 'Vehicle'].map((agent) => (
              <div key={agent} className="flex items-center gap-2 py-1">
                <input type="checkbox" defaultChecked className="accent-[#e94560]" />
                <span className="text-xs text-[#e8e8f0]">{agent}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1a35] border border-[#2a2a4a] rounded p-3">
          <span className="text-xs font-medium text-[#e8e8f0] block mb-2">Obstacles</span>
          <div className="space-y-1">
            {['Crate', 'Wall', 'Tree', 'Rock'].map((obs) => (
              <div key={obs} className="flex items-center gap-2 py-1">
                <input type="checkbox" defaultChecked className="accent-[#e94560]" />
                <span className="text-xs text-[#e8e8f0]">{obs}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#6a6a8a]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-20 h-1 accent-[#e94560] cursor-pointer"
        />
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-14 px-1.5 py-0.5 text-xs bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] font-mono"
        />
      </div>
    </div>
  );
}
