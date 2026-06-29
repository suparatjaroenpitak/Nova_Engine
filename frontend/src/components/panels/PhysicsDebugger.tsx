import { useState } from 'react';

export default function PhysicsDebugger() {
  const [showColliders, setShowColliders] = useState(true);
  const [showRigidbodies, setShowRigidbodies] = useState(true);
  const [showContacts, setShowContacts] = useState(false);
  const [showJoints, setShowJoints] = useState(true);
  const [showSleeping, setShowSleeping] = useState(false);
  const [physicsSpeed, setPhysicsSpeed] = useState(1);

  const bodies = [
    { name: 'Player', type: 'Dynamic', collider: 'Capsule', mass: 70, sleeping: false },
    { name: 'Ground', type: 'Static', collider: 'Mesh', mass: 0, sleeping: true },
    { name: 'Enemy', type: 'Dynamic', collider: 'Capsule', mass: 50, sleeping: false },
    { name: 'Coin', type: 'Dynamic', collider: 'Sphere', mass: 1, sleeping: true },
    { name: 'Crate', type: 'Dynamic', collider: 'Box', mass: 10, sleeping: false },
  ];

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="p-3 space-y-3">
        {/* Visualization */}
        <div className="bg-[#1a1a35] border border-[#2a2a4a] rounded p-3 space-y-2">
          <span className="text-xs font-medium text-[#e8e8f0] block">Visualization</span>
          <ToggleField label="Show Colliders" value={showColliders} onChange={setShowColliders} />
          <ToggleField label="Show Rigidbodies" value={showRigidbodies} onChange={setShowRigidbodies} />
          <ToggleField label="Show Contacts" value={showContacts} onChange={setShowContacts} />
          <ToggleField label="Show Joints" value={showJoints} onChange={setShowJoints} />
          <ToggleField label="Show Sleeping Bodies" value={showSleeping} onChange={setShowSleeping} />
        </div>

        {/* Simulation */}
        <div className="bg-[#1a1a35] border border-[#2a2a4a] rounded p-3 space-y-2">
          <span className="text-xs font-medium text-[#e8e8f0] block">Simulation</span>
          <SliderField label="Physics Speed" value={physicsSpeed} min={0} max={2} step={0.1} onChange={setPhysicsSpeed} />
          <div className="text-[10px] text-[#6a6a8a]">
            Contacts: {Math.floor(Math.random() * 20)} | Active Bodies: {bodies.filter((b) => !b.sleeping).length}
          </div>
        </div>

        {/* Body list */}
        <div>
          <span className="text-xs font-medium text-[#e8e8f0] block mb-2">Active Bodies</span>
          <div className="space-y-1">
            {bodies.map((body) => (
              <div
                key={body.name}
                className="flex items-center justify-between px-2 py-1.5 bg-[#1a1a35] border border-[#2a2a4a] rounded text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${body.sleeping ? 'bg-[#6a6a8a]' : 'bg-[#44cc44]'}`} />
                  <span className="text-[#e8e8f0]">{body.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#6a6a8a]">{body.type}</span>
                  <span className="text-[#6a6a8a]">{body.collider}</span>
                  <span className="text-[#6a6a8a]">{body.mass}kg</span>
                  <span className={body.sleeping ? 'text-[#6a6a8a]' : 'text-[#44cc44]'}>
                    {body.sleeping ? 'Sleep' : 'Awake'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-[#6a6a8a]">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-8 h-4 rounded-full transition-colors relative ${value ? 'bg-[#e94560]' : 'bg-[#2a2a4a]'}`}
      >
        <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${value ? 'left-4' : 'left-0.5'}`} />
      </button>
    </label>
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
        <span className="text-xs text-[#e8e8f0] font-mono w-8 text-right">{value.toFixed(1)}</span>
      </div>
    </div>
  );
}
