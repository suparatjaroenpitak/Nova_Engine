import { useState, useMemo, useCallback } from 'react';

interface AnimationClip {
  id: string;
  name: string;
  length: number;
  loop: boolean;
  fps: number;
  curves: AnimationCurve[];
}

interface AnimationCurve {
  path: string;
  property: string;
  keys: Keyframe[];
}

interface Keyframe {
  time: number;
  value: number;
  inTangent: number;
  outTangent: number;
}

interface AnimationState {
  name: string;
  clipId: string;
  speed: number;
  loop: boolean;
  blendType: 'simple' | 'blendTree' | 'crossFade';
  transitions: AnimationTransition[];
  blendParameters?: BlendParameter[];
}

interface AnimationTransition {
  from: string;
  to: string;
  duration: number;
  hasExitTime: boolean;
  exitTime: number;
  conditions: AnimationCondition[];
}

interface AnimationCondition {
  parameter: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan';
  value: number | boolean;
}

interface BlendParameter {
  name: string;
  type: 'float' | 'int' | 'bool' | 'trigger';
  value: number | boolean;
}

const CURVE_COLORS = ['#e94560', '#4488ff', '#44cc44', '#ff8844', '#ff44aa', '#44cccc', '#8844ff'];

function CurveEditor({ curves, currentTime }: { curves: AnimationCurve[]; currentTime: number }) {
  const width = 600;
  const height = 120;
  const padding = { left: 50, right: 20, top: 10, bottom: 25 };

  const maxTime = Math.max(...curves.flatMap((c) => c.keys.map((k) => k.time)), 1);
  const minVal = Math.min(...curves.flatMap((c) => c.keys.map((k) => k.value)), 0);
  const maxVal = Math.max(...curves.flatMap((c) => c.keys.map((k) => k.value)), 1);

  const xScale = (time: number) => padding.left + (time / maxTime) * (width - padding.left - padding.right);
  const yScale = (value: number) => padding.top + (1 - (value - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);

  return (
    <svg width={width} height={height} className="w-full">
      {/* Grid */}
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i}>
          <line x1={padding.left} y1={yScale(minVal + (i / 9) * (maxVal - minVal))} x2={width - padding.right} y2={yScale(minVal + (i / 9) * (maxVal - minVal))} stroke="#2a2a4a" strokeWidth={0.5} />
          <text x={padding.left - 5} y={yScale(minVal + (i / 9) * (maxVal - minVal))} textAnchor="end" fill="#6a6a8a" fontSize={8}>
            {(minVal + (i / 9) * (maxVal - minVal)).toFixed(1)}
          </text>
        </g>
      ))}

      {/* Time markers */}
      {Array.from({ length: Math.ceil(maxTime) + 1 }, (_, i) => (
        <g key={i}>
          <line x1={xScale(i)} y1={padding.top} x2={xScale(i)} y2={height - padding.bottom} stroke="#2a2a4a" strokeWidth={0.5} />
          <text x={xScale(i)} y={height - 5} textAnchor="middle" fill="#6a6a8a" fontSize={8}>{i.toFixed(1)}</text>
        </g>
      ))}

      {/* Curves */}
      {curves.map((curve, ci) => (
        <g key={curve.path + curve.property}>
          <polyline
            points={curve.keys.map((k) => `${xScale(k.time)},${yScale(k.value)}`).join(' ')}
            fill="none"
            stroke={CURVE_COLORS[ci % CURVE_COLORS.length]}
            strokeWidth={1.5}
          />
          {curve.keys.map((k, ki) => (
            <g key={ki}>
              <circle cx={xScale(k.time)} cy={yScale(k.value)} r={3} fill={CURVE_COLORS[ci % CURVE_COLORS.length]} stroke="#12122a" strokeWidth={1} />
            </g>
          ))}
        </g>
      ))}

      {/* Current time indicator */}
      <line x1={xScale(currentTime)} y1={padding.top} x2={xScale(currentTime)} y2={height - padding.bottom} stroke="#e94560" strokeWidth={1} strokeDasharray="4,2" />
    </svg>
  );
}

function AnimationStateNode({ state, isActive, onSelect, onDelete }: { state: AnimationState; isActive: boolean; onSelect: () => void; onDelete: () => void }) {
  return (
    <div
      onClick={onSelect}
      className={`p-2 rounded-lg border-2 cursor-pointer transition-all text-center min-w-[100px] ${
        isActive
          ? 'border-[#e94560] bg-[#e94560]/10 shadow-lg shadow-[#e94560]/20'
          : 'border-[#2a2a4a] bg-[#1a1a35] hover:border-[#3a3a5a]'
      }`}
    >
      <div className={`text-[10px] font-medium ${isActive ? 'text-[#e94560]' : 'text-[#e8e8f0]'}`}>{state.name}</div>
      <div className="text-[8px] text-[#6a6a8a] mt-0.5">
        {state.blendType === 'blendTree' ? 'Blend Tree' : state.clipId ? 'Single' : 'Empty'}
      </div>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="mt-1 text-[8px] text-[#ff4444] opacity-0 hover:opacity-100 transition-opacity">✕</button>
    </div>
  );
}

export default function AnimationPanel() {
  const [tab, setTab] = useState<'states' | 'blendTree' | 'curves' | 'events'>('states');
  const [clips] = useState<AnimationClip[]>([
    { id: 'idle', name: 'Idle', length: 2, loop: true, fps: 30, curves: [
      { path: 'Player', property: 'Position.x', keys: [
        { time: 0, value: 0, inTangent: 0, outTangent: 0 },
        { time: 1, value: 0.5, inTangent: 0, outTangent: 0 },
        { time: 2, value: 0, inTangent: 0, outTangent: 0 },
      ]},
    ]},
    { id: 'walk', name: 'Walk', length: 1, loop: true, fps: 30, curves: [
      { path: 'Player', property: 'Position.x', keys: [
        { time: 0, value: 0, inTangent: 0, outTangent: 0 },
        { time: 0.25, value: 1, inTangent: 0, outTangent: 0 },
        { time: 0.5, value: 0, inTangent: 0, outTangent: 0 },
        { time: 0.75, value: -1, inTangent: 0, outTangent: 0 },
        { time: 1, value: 0, inTangent: 0, outTangent: 0 },
      ]},
    ]},
    { id: 'run', name: 'Run', length: 0.6, loop: true, fps: 30, curves: [] },
    { id: 'jump', name: 'Jump', length: 0.8, loop: false, fps: 30, curves: [] },
  ]);

  const [states, setStates] = useState<AnimationState[]>([
    { name: 'Idle', clipId: 'idle', speed: 1, loop: true, blendType: 'simple', transitions: [] },
    { name: 'Walk', clipId: 'walk', speed: 1, loop: true, blendType: 'simple', transitions: [{ from: 'Idle', to: 'Walk', duration: 0.25, hasExitTime: false, exitTime: 0, conditions: [{ parameter: 'Speed', operator: 'greaterThan', value: 0.1 }] }] },
    { name: 'Run', clipId: 'run', speed: 1.5, loop: true, blendType: 'simple', transitions: [] },
    { name: 'Jump', clipId: 'jump', speed: 1, loop: false, blendType: 'simple', transitions: [] },
  ]);

  const [activeState, setActiveState] = useState('Idle');
  const [currentTime, setCurrentTime] = useState(0.5);
  const [parameters, setParameters] = useState<BlendParameter[]>([
    { name: 'Speed', type: 'float', value: 0 },
    { name: 'IsGrounded', type: 'bool', value: true },
    { name: 'Health', type: 'int', value: 100 },
    { name: 'Jump', type: 'trigger', value: false },
  ]);
  const [selectedClip, setSelectedClip] = useState('idle');
  const [newStateName, setNewStateName] = useState('');

  const activeClip = clips.find((c) => c.id === states.find((s) => s.name === activeState)?.clipId);
  const activeCurves = activeClip?.curves || [];

  const addState = () => {
    if (!newStateName.trim()) return;
    setStates((prev) => [...prev, { name: newStateName.trim(), clipId: '', speed: 1, loop: true, blendType: 'simple', transitions: [] }]);
    setNewStateName('');
  };

  const removeState = (name: string) => {
    setStates((prev) => prev.filter((s) => s.name !== name));
    if (activeState === name) setActiveState(states[0]?.name || '');
  };

  const updateParameter = (index: number, value: number | boolean) => {
    setParameters((prev) => prev.map((p, i) => i === index ? { ...p, value } : p));
  };

  return (
    <div className="h-full flex flex-col bg-[#12122a]">
      {/* Tab bar */}
      <div className="flex items-center h-7 bg-[#1a1a35] border-b border-[#2a2a4a] shrink-0">
        {(['states', 'blendTree', 'curves', 'events'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 h-full text-[10px] border-r border-[#2a2a4a] transition-colors ${
              tab === t ? 'bg-[#12122a] text-white' : 'text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]'
            }`}
          >
            {t === 'states' ? 'State Machine' : t === 'blendTree' ? 'Blend Tree' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[9px] text-[#6a6a8a] px-2">{currentTime.toFixed(2)}s</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {tab === 'states' && (
          <>
            {/* State machine graph */}
            <div className="flex-1 p-3 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <input value={newStateName} onChange={(e) => setNewStateName(e.target.value)}
                  placeholder="New state name..."
                  className="flex-1 px-2 py-1 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[10px] text-[#e8e8f0] placeholder-[#6a6a8a]/50"
                  onKeyDown={(e) => e.key === 'Enter' && addState()}
                />
                <button onClick={addState} className="px-2 py-1 bg-[#e94560] text-white text-[10px] rounded hover:bg-red-600">+ Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {states.map((state) => (
                  <AnimationStateNode
                    key={state.name}
                    state={state}
                    isActive={activeState === state.name}
                    onSelect={() => setActiveState(state.name)}
                    onDelete={() => removeState(state.name)}
                  />
                ))}
              </div>

              {/* Transition editor */}
              <div className="mt-4 bg-[#1a1a35] border border-[#2a2a4a] rounded p-3">
                <div className="text-[10px] font-medium text-[#e8e8f0] mb-2">Transitions from: {activeState}</div>
                {states.find((s) => s.name === activeState)?.transitions.map((trans, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 text-[10px] text-[#6a6a8a] border-b border-[#2a2a4a]/50 last:border-0">
                    <span className="text-[#e94560]">{trans.from}</span>
                    <span>→</span>
                    <span className="text-[#44cc44]">{trans.to}</span>
                    <span className="text-white/50">|</span>
                    <span>Duration: {trans.duration}s</span>
                    {trans.conditions.map((cond, ci) => (
                      <span key={ci} className="text-[#ffaa00] bg-[#ffaa00]/10 px-1 rounded">{cond.parameter} {cond.operator === 'greaterThan' ? '>' : cond.operator === 'lessThan' ? '<' : cond.operator === 'equals' ? '==' : '!='} {cond.value}</span>
                    ))}
                  </div>
                ))}
                {states.find((s) => s.name === activeState)?.transitions.length === 0 && (
                  <div className="text-[10px] text-[#6a6a8a] py-2">No transitions. Add via the Inspector.</div>
                )}
              </div>
            </div>

            {/* Parameters panel */}
            <div className="w-56 border-l border-[#2a2a4a] p-2 overflow-y-auto">
              <div className="text-[10px] font-medium text-[#e8e8f0] mb-2">Parameters</div>
              {parameters.map((param, i) => (
                <div key={param.name} className="mb-2 p-1.5 bg-[#1a1a35] border border-[#2a2a4a] rounded">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] text-[#6a6a8a]">{param.name}</span>
                    <span className="text-[8px] text-[#4488ff] bg-[#4488ff]/10 px-1 rounded">{param.type}</span>
                  </div>
                  {param.type === 'float' && (
                    <input type="range" min={0} max={10} step={0.1} value={param.value as number}
                      onChange={(e) => updateParameter(i, parseFloat(e.target.value))}
                      className="w-full h-1 accent-[#e94560] cursor-pointer"
                    />
                  )}
                  {param.type === 'bool' && (
                    <button onClick={() => updateParameter(i, !param.value)}
                      className={`w-full py-0.5 rounded text-[9px] ${param.value ? 'bg-[#44cc44] text-white' : 'bg-[#2a2a4a] text-[#6a6a8a]'}`}>
                      {param.value ? 'True' : 'False'}
                    </button>
                  )}
                  {param.type === 'int' && (
                    <input type="number" value={param.value as number}
                      onChange={(e) => updateParameter(i, parseInt(e.target.value) || 0)}
                      className="w-full px-1 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[9px] text-[#e8e8f0]"
                    />
                  )}
                  {param.type === 'trigger' && (
                    <button onClick={() => updateParameter(i, true)}
                      className="w-full py-0.5 bg-[#e94560] text-white text-[9px] rounded hover:bg-red-600"
                    >Trigger</button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'curves' && (
          <div className="flex-1 p-3 overflow-y-auto">
            {/* Clip selector */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-[#6a6a8a]">Clip:</span>
              <select value={selectedClip} onChange={(e) => setSelectedClip(e.target.value)}
                className="px-2 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[10px] text-[#e8e8f0]">
                {clips.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.length}s)</option>)}
              </select>
              <div className="flex-1" />
              <span className="text-[9px] text-[#6a6a8a]">Time: {currentTime.toFixed(2)}s</span>
            </div>

            {/* Curve Editor */}
            <div className="bg-[#0a0a1a] border border-[#2a2a4a] rounded overflow-hidden">
              <div className="flex items-center justify-between px-2 py-1 bg-[#1a1a35] border-b border-[#2a2a4a]">
                <span className="text-[9px] text-[#6a6a8a]">Curves ({activeCurves.length})</span>
                <button className="text-[9px] text-[#e94560] hover:text-red-400">+ Add Curve</button>
              </div>
              <div className="p-2">
                {activeCurves.length > 0 ? (
                  <CurveEditor curves={activeCurves} currentTime={currentTime} />
                ) : (
                  <div className="text-[10px] text-[#6a6a8a] text-center py-8">No curves in this clip. Select a clip with curves or add new curves.</div>
                )}
              </div>
            </div>

            {/* Keyframe list */}
            {activeCurves.flatMap((c) => c.keys).length > 0 && (
              <div className="mt-2 bg-[#1a1a35] border border-[#2a2a4a] rounded p-2">
                <div className="text-[9px] text-[#6a6a8a] mb-1">Keyframes</div>
                {activeCurves.map((curve, ci) => (
                  <div key={curve.path + curve.property} className="mb-1">
                    <div className="text-[9px] text-white/50 mb-0.5">{curve.path}.{curve.property}</div>
                    <div className="flex flex-wrap gap-1">
                      {curve.keys.map((k, ki) => (
                        <div key={ki} className="px-1.5 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[8px] text-[#e8e8f0]">
                          t:{k.time.toFixed(2)} v:{k.value.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'blendTree' && (
          <div className="flex-1 p-3">
            <div className="text-[10px] text-[#6a6a8a] mb-3">Blend trees combine multiple animations based on parameters.</div>

            <div className="bg-[#1a1a35] border border-[#2a2a4a] rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-[#e8e8f0]">1D Blend Tree</span>
                <span className="text-[8px] text-[#6a6a8a] bg-[#0a0a1a] px-1.5 py-0.5 rounded">Parameter: Speed</span>
              </div>
              <div className="space-y-1">
                {[{ name: 'Idle', pos: 0 }, { name: 'Walk', pos: 3 }, { name: 'Run', pos: 6 }].map((m) => (
                  <div key={m.name} className="flex items-center gap-2 py-1 text-[10px] text-[#e8e8f0] hover:bg-white/5 rounded px-2">
                    <span className="w-16">{m.name}</span>
                    <div className="flex-1 h-2 bg-[#0a0a1a] rounded relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-[#e94560] rounded" style={{ width: `${(m.pos / 6) * 100}%` }} />
                    </div>
                    <span className="w-12 text-right text-[#6a6a8a]">{m.pos.toFixed(1)}</span>
                    <input type="number" value={m.pos} className="w-14 px-1 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[9px] text-[#e8e8f0]" step="0.1" />
                  </div>
                ))}
              </div>
              <button className="mt-2 text-[9px] text-[#e94560] hover:text-red-400">+ Add Motion</button>
            </div>
          </div>
        )}

        {tab === 'events' && (
          <div className="flex-1 p-3">
            <div className="text-[10px] text-[#6a6a8a] mb-3">Animation Events trigger functions during playback.</div>
            <div className="bg-[#1a1a35] border border-[#2a2a4a] rounded p-3 space-y-1">
              {[
                { time: 0.5, func: 'Footstep()', params: 'left' },
                { time: 1.0, func: 'Footstep()', params: 'right' },
                { time: 1.5, func: 'PlaySound("whoosh")', params: '' },
              ].map((evt, i) => (
                <div key={i} className="flex items-center gap-2 py-1 text-[10px] text-[#e8e8f0] hover:bg-white/5 rounded px-2">
                  <span className="text-[#6a6a8a] w-10">{evt.time.toFixed(2)}s</span>
                  <span className="text-[#ffaa00]">{evt.func}</span>
                  {evt.params && <span className="text-[#6a6a8a]">({evt.params})</span>}
                  <button className="ml-auto text-[8px] text-[#ff4444] opacity-0 hover:opacity-100">✕</button>
                </div>
              ))}
              <button className="mt-2 text-[9px] text-[#e94560] hover:text-red-400">+ Add Event</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
