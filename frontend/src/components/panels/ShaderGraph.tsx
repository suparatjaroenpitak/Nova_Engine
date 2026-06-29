import { useState, useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  NodeTypes,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface ShaderNodeData {
  label: string;
  color: string;
  category: string;
  inputs: { id: string; label: string; type: string }[];
  outputs: { id: string; label: string; type: string }[];
  properties?: { key: string; label: string; type: string; default: any }[];
  values?: Record<string, any>;
}

const NODE_CATEGORIES: Record<string, string> = {
  input: '#4488ff',
  output: '#ff4444',
  math: '#44cc44',
  color: '#ff44aa',
  uv: '#ff8844',
  procedural: '#8844ff',
  utility: '#44cccc',
};

const NODE_DEFINITIONS: Record<string, ShaderNodeData> = {
  'master': {
    label: 'Fragment Output', color: NODE_CATEGORIES.output, category: 'output',
    inputs: [
      { id: 'baseColor', label: 'Base Color', type: 'vec3' },
      { id: 'metallic', label: 'Metallic', type: 'float' },
      { id: 'roughness', label: 'Roughness', type: 'float' },
      { id: 'emission', label: 'Emission', type: 'vec3' },
      { id: 'opacity', label: 'Opacity', type: 'float' },
      { id: 'normal', label: 'Normal', type: 'vec3' },
      { id: 'ao', label: 'Ambient Occlusion', type: 'float' },
    ],
    outputs: [],
  },
  'color': {
    label: 'Color', color: NODE_CATEGORIES.input, category: 'input',
    inputs: [],
    outputs: [{ id: 'out', label: 'Color', type: 'vec3' }],
    properties: [{ key: 'color', label: 'Color', type: 'color', default: '#ffffff' }],
  },
  'float': {
    label: 'Float', color: NODE_CATEGORIES.input, category: 'input',
    inputs: [],
    outputs: [{ id: 'out', label: 'Value', type: 'float' }],
    properties: [{ key: 'value', label: 'Value', type: 'float', default: 0.5 }],
  },
  'texture2d': {
    label: 'Texture 2D', color: NODE_CATEGORIES.input, category: 'input',
    inputs: [{ id: 'uv', label: 'UV', type: 'vec2' }],
    outputs: [
      { id: 'rgba', label: 'RGBA', type: 'vec4' },
      { id: 'rgb', label: 'RGB', type: 'vec3' },
      { id: 'r', label: 'R', type: 'float' },
      { id: 'g', label: 'G', type: 'float' },
      { id: 'b', label: 'B', type: 'float' },
      { id: 'a', label: 'A', type: 'float' },
    ],
    properties: [{ key: 'texture', label: 'Texture', type: 'texture', default: null }],
  },
  'time': {
    label: 'Time', color: NODE_CATEGORIES.input, category: 'input',
    inputs: [],
    outputs: [{ id: 'time', label: 'Time', type: 'float' }, { id: 'sin', label: 'Sin', type: 'float' }, { id: 'cos', label: 'Cos', type: 'float' }],
  },
  'add': {
    label: 'Add', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'a', label: 'A', type: 'float' }, { id: 'b', label: 'B', type: 'float' }],
    outputs: [{ id: 'out', label: 'Result', type: 'float' }],
  },
  'subtract': {
    label: 'Subtract', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'a', label: 'A', type: 'float' }, { id: 'b', label: 'B', type: 'float' }],
    outputs: [{ id: 'out', label: 'Result', type: 'float' }],
  },
  'multiply': {
    label: 'Multiply', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'a', label: 'A', type: 'float' }, { id: 'b', label: 'B', type: 'float' }],
    outputs: [{ id: 'out', label: 'Result', type: 'float' }],
  },
  'divide': {
    label: 'Divide', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'a', label: 'A', type: 'float' }, { id: 'b', label: 'B', type: 'float' }],
    outputs: [{ id: 'out', label: 'Result', type: 'float' }],
  },
  'power': {
    label: 'Power', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'base', label: 'Base', type: 'float' }, { id: 'exp', label: 'Exponent', type: 'float' }],
    outputs: [{ id: 'out', label: 'Result', type: 'float' }],
  },
  'lerp': {
    label: 'Lerp', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'a', label: 'A', type: 'float' }, { id: 'b', label: 'B', type: 'float' }, { id: 't', label: 'T', type: 'float' }],
    outputs: [{ id: 'out', label: 'Result', type: 'float' }],
  },
  'clamp': {
    label: 'Clamp', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'value', label: 'Value', type: 'float' }, { id: 'min', label: 'Min', type: 'float' }, { id: 'max', label: 'Max', type: 'float' }],
    outputs: [{ id: 'out', label: 'Result', type: 'float' }],
  },
  'remap': {
    label: 'Remap', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'value', label: 'Value', type: 'float' }, { id: 'inMin', label: 'In Min', type: 'float' }, { id: 'inMax', label: 'In Max', type: 'float' }, { id: 'outMin', label: 'Out Min', type: 'float' }, { id: 'outMax', label: 'Out Max', type: 'float' }],
    outputs: [{ id: 'out', label: 'Result', type: 'float' }],
  },
  'noise': {
    label: 'Noise', color: NODE_CATEGORIES.procedural, category: 'procedural',
    inputs: [{ id: 'uv', label: 'UV', type: 'vec2' }, { id: 'scale', label: 'Scale', type: 'float' }],
    outputs: [{ id: 'out', label: 'Noise', type: 'float' }],
    properties: [{ key: 'type', label: 'Type', type: 'select', default: 'simplex' }],
  },
  'voronoi': {
    label: 'Voronoi', color: NODE_CATEGORIES.procedural, category: 'procedural',
    inputs: [{ id: 'uv', label: 'UV', type: 'vec2' }, { id: 'scale', label: 'Scale', type: 'float' }],
    outputs: [{ id: 'out', label: 'Cells', type: 'float' }],
  },
  'normalFromHeight': {
    label: 'Normal From Height', color: NODE_CATEGORIES.utility, category: 'utility',
    inputs: [{ id: 'height', label: 'Height', type: 'float' }, { id: 'scale', label: 'Scale', type: 'float' }],
    outputs: [{ id: 'normal', label: 'Normal', type: 'vec3' }],
  },
  'pan': {
    label: 'UV Pan', color: NODE_CATEGORIES.uv, category: 'uv',
    inputs: [{ id: 'uv', label: 'UV', type: 'vec2' }, { id: 'speed', label: 'Speed', type: 'vec2' }],
    outputs: [{ id: 'out', label: 'UV', type: 'vec2' }],
  },
  'tiling': {
    label: 'UV Tiling', color: NODE_CATEGORIES.uv, category: 'uv',
    inputs: [{ id: 'uv', label: 'UV', type: 'vec2' }, { id: 'tiling', label: 'Tiling', type: 'vec2' }, { id: 'offset', label: 'Offset', type: 'vec2' }],
    outputs: [{ id: 'out', label: 'UV', type: 'vec2' }],
  },
  'combine': {
    label: 'Combine', color: NODE_CATEGORIES.color, category: 'color',
    inputs: [{ id: 'r', label: 'R', type: 'float' }, { id: 'g', label: 'G', type: 'float' }, { id: 'b', label: 'B', type: 'float' }],
    outputs: [{ id: 'out', label: 'RGB', type: 'vec3' }],
  },
  'split': {
    label: 'Split', color: NODE_CATEGORIES.color, category: 'color',
    inputs: [{ id: 'vec', label: 'Vector', type: 'vec3' }],
    outputs: [{ id: 'r', label: 'R', type: 'float' }, { id: 'g', label: 'G', type: 'float' }, { id: 'b', label: 'B', type: 'float' }],
  },
  'oneMinus': {
    label: 'One Minus', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'value', label: 'Value', type: 'float' }],
    outputs: [{ id: 'out', label: 'Result', type: 'float' }],
  },
  'saturate': {
    label: 'Saturate', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'value', label: 'Value', type: 'float' }],
    outputs: [{ id: 'out', label: 'Result', type: 'float' }],
  },
  'absolute': {
    label: 'Absolute', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'value', label: 'Value', type: 'float' }],
    outputs: [{ id: 'out', label: 'Result', type: 'float' }],
  },
  'sin': {
    label: 'Sine', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'value', label: 'Value', type: 'float' }],
    outputs: [{ id: 'out', label: 'Result', type: 'float' }],
  },
  'cos': {
    label: 'Cosine', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'value', label: 'Value', type: 'float' }],
    outputs: [{ id: 'out', label: 'Result', type: 'float' }],
  },
  'dot': {
    label: 'Dot Product', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'a', label: 'A', type: 'vec3' }, { id: 'b', label: 'B', type: 'vec3' }],
    outputs: [{ id: 'out', label: 'Result', type: 'float' }],
  },
  'cross': {
    label: 'Cross Product', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'a', label: 'A', type: 'vec3' }, { id: 'b', label: 'B', type: 'vec3' }],
    outputs: [{ id: 'out', label: 'Result', type: 'vec3' }],
  },
  'normalize': {
    label: 'Normalize', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'vec', label: 'Vector', type: 'vec3' }],
    outputs: [{ id: 'out', label: 'Result', type: 'vec3' }],
  },
  'length': {
    label: 'Length', color: NODE_CATEGORIES.math, category: 'math',
    inputs: [{ id: 'vec', label: 'Vector', type: 'vec3' }],
    outputs: [{ id: 'out', label: 'Result', type: 'float' }],
  },
  'fresnel': {
    label: 'Fresnel', color: NODE_CATEGORIES.utility, category: 'utility',
    inputs: [{ id: 'normal', label: 'Normal', type: 'vec3' }, { id: 'viewDir', label: 'View Dir', type: 'vec3' }, { id: 'power', label: 'Power', type: 'float' }],
    outputs: [{ id: 'out', label: 'Fresnel', type: 'float' }],
  },
  'pbr': {
    label: 'PBR Master', color: NODE_CATEGORIES.output, category: 'output',
    inputs: [
      { id: 'albedo', label: 'Albedo', type: 'vec3' },
      { id: 'metallic', label: 'Metallic', type: 'float' },
      { id: 'roughness', label: 'Roughness', type: 'float' },
      { id: 'normal', label: 'Normal', type: 'vec3' },
      { id: 'emission', label: 'Emission', type: 'vec3' },
      { id: 'ao', label: 'AO', type: 'float' },
      { id: 'opacity', label: 'Opacity', type: 'float' },
    ],
    outputs: [],
  },
  'position': {
    label: 'Position', color: NODE_CATEGORIES.input, category: 'input',
    inputs: [],
    outputs: [{ id: 'out', label: 'Position', type: 'vec3' }],
  },
  'normalVec': {
    label: 'Normal Vector', color: NODE_CATEGORIES.input, category: 'input',
    inputs: [],
    outputs: [{ id: 'out', label: 'Normal', type: 'vec3' }],
  },
  'viewDir': {
    label: 'View Direction', color: NODE_CATEGORIES.input, category: 'input',
    inputs: [],
    outputs: [{ id: 'out', label: 'View Dir', type: 'vec3' }],
  },
  'screenPos': {
    label: 'Screen Position', color: NODE_CATEGORIES.input, category: 'input',
    inputs: [],
    outputs: [{ id: 'out', label: 'Screen Pos', type: 'vec4' }],
  },
  'vertexColor': {
    label: 'Vertex Color', color: NODE_CATEGORIES.input, category: 'input',
    inputs: [],
    outputs: [{ id: 'out', label: 'Color', type: 'vec3' }],
  },
};

const NODE_CATEGORY_GROUPS = [
  { name: 'Input', nodes: ['color', 'float', 'texture2d', 'time', 'position', 'normalVec', 'viewDir', 'screenPos', 'vertexColor'] },
  { name: 'Math', nodes: ['add', 'subtract', 'multiply', 'divide', 'power', 'lerp', 'clamp', 'remap', 'oneMinus', 'saturate', 'absolute', 'sin', 'cos', 'dot', 'cross', 'normalize', 'length'] },
  { name: 'UV', nodes: ['pan', 'tiling'] },
  { name: 'Color', nodes: ['combine', 'split'] },
  { name: 'Procedural', nodes: ['noise', 'voronoi'] },
  { name: 'Utility', nodes: ['normalFromHeight', 'fresnel'] },
  { name: 'Output', nodes: ['master', 'pbr'] },
];

function ShaderGraphNode({ data, selected }: NodeProps<ShaderNodeData & { values?: Record<string, any> }>) {
  const [localValues, setLocalValues] = useState<Record<string, any>>(data.values || {});

  return (
    <div
      className={`rounded-lg border-2 shadow-lg min-w-[140px] text-[10px] ${selected ? 'border-white' : 'border-transparent'}`}
      style={{ backgroundColor: data.color + '22', borderColor: selected ? '#ffffff' : data.color + '66' }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-t-lg" style={{ backgroundColor: data.color + '44' }}>
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
        <span className="text-[10px] font-medium text-white">{data.label}</span>
        <span className="text-[8px] text-white/50 ml-auto px-1 rounded" style={{ backgroundColor: data.color + '44' }}>{data.category}</span>
      </div>

      {/* Properties */}
      {data.properties && data.properties.length > 0 && (
        <div className="px-2 py-1 space-y-1 border-b border-white/10">
          {data.properties.map((prop) => (
            <div key={prop.key} className="flex items-center justify-between gap-1">
              <span className="text-[9px] text-[#6a6a8a]">{prop.label}</span>
              {prop.type === 'color' && (
                <input type="color" value={localValues[prop.key] || prop.default} onChange={(e) => setLocalValues({ ...localValues, [prop.key]: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer bg-transparent border-0" />
              )}
              {prop.type === 'float' && (
                <input type="number" value={localValues[prop.key] ?? prop.default} onChange={(e) => setLocalValues({ ...localValues, [prop.key]: parseFloat(e.target.value) || 0 })}
                  className="w-14 px-1 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[9px] text-[#e8e8f0]" step="0.1" />
              )}
              {prop.type === 'select' && (
                <select value={localValues[prop.key] || prop.default} onChange={(e) => setLocalValues({ ...localValues, [prop.key]: e.target.value })}
                  className="px-1 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[9px] text-[#e8e8f0]">
                  <option value="simplex">Simplex</option>
                  <option value="perlin">Perlin</option>
                  <option value="cell">Cell</option>
                </select>
              )}
              {(prop.type === 'texture') && (
                <div className="w-14 h-5 bg-[#0a0a1a] border border-[#2a2a4a] rounded flex items-center justify-center text-[9px] text-[#6a6a8a] cursor-pointer">
                  Select
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input ports */}
      {data.inputs.map((input, i) => (
        <div key={input.id} className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-white/5 relative">
          <Handle type="target" position={Position.Left} id={input.id}
            className="!w-2 !h-2 !border-2 !border-white !bg-[#12122a]" style={{ left: -5 }}
          />
          <span className="text-[9px] text-[#6a6a8a] ml-2">{input.label}</span>
          <span className="text-[8px] text-white/30 ml-auto">{input.type}</span>
        </div>
      ))}

      {/* Output ports */}
      {data.outputs.map((output, i) => (
        <div key={output.id} className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-white/5 relative">
          <span className="text-[9px] text-[#6a6a8a]">{output.label}</span>
          <span className="text-[8px] text-white/30 ml-auto">{output.type}</span>
          <Handle type="source" position={Position.Right} id={output.id}
            className="!w-2 !h-2 !border-2 !border-white !bg-[#12122a]" style={{ right: -5 }}
          />
        </div>
      ))}
    </div>
  );
}

const nodeTypes: NodeTypes = { shaderNode: ShaderGraphNode };

let nodeIdCounter = 0;
function createNodeId() { return `node-${++nodeIdCounter}`; }

const initialNodes: Node[] = [
  {
    id: 'master-node',
    type: 'shaderNode',
    position: { x: 600, y: 250 },
    data: NODE_DEFINITIONS['master'],
  },
  {
    id: 'color-node',
    type: 'shaderNode',
    position: { x: 100, y: 200 },
    data: { ...NODE_DEFINITIONS['color'], values: { color: '#e94560' } },
  },
  {
    id: 'float-node',
    type: 'shaderNode',
    position: { x: 100, y: 350 },
    data: { ...NODE_DEFINITIONS['float'], values: { value: 0.8 } },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'color-node', target: 'master-node', sourceHandle: 'out', targetHandle: 'baseColor' },
  { id: 'e2', source: 'float-node', target: 'master-node', sourceHandle: 'out', targetHandle: 'roughness' },
];

export default function ShaderGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [graphName, setGraphName] = useState('New Shader Graph');
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [showCompile, setShowCompile] = useState(false);
  const [compiledCode, setCompiledCode] = useState('');

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback((type: string) => {
    const def = NODE_DEFINITIONS[type];
    if (!def) return;
    const newNode: Node = {
      id: createNodeId(),
      type: 'shaderNode',
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 300 },
      data: def,
    };
    setNodes((nds) => [...nds, newNode]);
    setShowNodeMenu(false);
  }, [setNodes]);

  const compileShader = useCallback(() => {
    const code = `// Shader Graph: ${graphName}
// Generated from Nova Shader Graph
Shader "Nova/ShaderGraph/${graphName.replace(/\s+/g, '')}"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _Color ("Color", Color) = (1,1,1,1)
        _Glossiness ("Smoothness", Range(0,1)) = 0.5
        _Metallic ("Metallic", Range(0,1)) = 0.0
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 200

        CGPROGRAM
        #pragma surface surf Standard fullforwardshadows
        #pragma target 3.0

        sampler2D _MainTex;
        fixed4 _Color;
        half _Glossiness;
        half _Metallic;

        struct Input
        {
            float2 uv_MainTex;
        };

        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            fixed4 c = tex2D (_MainTex, IN.uv_MainTex) * _Color;
            o.Albedo = c.rgb;
            o.Metallic = _Metallic;
            o.Smoothness = _Glossiness;
            o.Alpha = c.a;
        }
        ENDCG
    }
    FallBack "Diffuse"
}

// Nodes: ${nodes.map(n => n.data.label).join(', ')}
// Edges: ${edges.length}`;
    setCompiledCode(code);
    setShowCompile(true);
  }, [graphName, nodes, edges]);

  return (
    <div className="h-full flex flex-col bg-[#0a0a1a]">
      {/* Toolbar */}
      <div className="flex items-center h-7 px-2 bg-[#1a1a35] border-b border-[#2a2a4a] gap-2 shrink-0">
        <input value={graphName} onChange={(e) => setGraphName(e.target.value)} className="px-2 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-xs text-[#e8e8f0] font-medium w-40" />
        <div className="flex-1" />
        <button onClick={() => setShowNodeMenu(!showNodeMenu)} className="px-2 py-0.5 bg-[#e94560] text-white text-[10px] rounded hover:bg-red-600 flex items-center gap-1">
          + Add Node
        </button>
        <button onClick={compileShader} className="px-2 py-0.5 bg-[#4488ff] text-white text-[10px] rounded hover:bg-blue-600">
          Generate Shader
        </button>
        <button className="px-2 py-0.5 bg-[#1a1a35] border border-[#2a2a4a] text-[#6a6a8a] text-[10px] rounded hover:text-white">
          Save
        </button>
      </div>

      {/* Node palette dropdown */}
      {showNodeMenu && (
        <div className="absolute top-14 left-2 z-50 w-56 bg-[#12122a] border border-[#2a2a4a] rounded-xl shadow-2xl p-2 max-h-80 overflow-y-auto">
          {NODE_CATEGORY_GROUPS.map((group) => (
            <div key={group.name} className="mb-1">
              <div className="text-[9px] text-[#6a6a8a] uppercase tracking-wider px-1 py-0.5 font-medium">{group.name}</div>
              {group.nodes.map((nodeType) => {
                const def = NODE_DEFINITIONS[nodeType];
                return (
                  <button key={nodeType} onClick={() => addNode(nodeType)} className="w-full text-left px-2 py-1 rounded text-[10px] text-[#e8e8f0] hover:bg-white/10 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: def.color }} />
                    {def.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Main graph area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={4}
          defaultEdgeOptions={{ animated: true, style: { stroke: '#4a4a7a', strokeWidth: 2 } }}
          style={{ background: '#0a0a1a' }}
        >
          <Background color="#2a2a4a" gap={20} size={1} />
          <Controls className="!bg-[#12122a] !border-[#2a2a4a] !rounded-lg !shadow-xl" />
          <MiniMap
            nodeColor={(n) => n.data.color || '#4a4a7a'}
            maskColor="rgba(0,0,0,0.6)"
            style={{ background: '#12122a', border: '1px solid #2a2a4a', borderRadius: 8 }}
          />
        </ReactFlow>
      </div>

      {/* Compiled shader output */}
      {showCompile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCompile(false)}>
          <div className="w-3/4 max-w-3xl max-h-[80vh] bg-[#12122a] border border-[#2a2a4a] rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center h-8 px-3 bg-[#1a1a35] border-b border-[#2a2a4a] shrink-0">
              <span className="text-xs font-medium text-[#e8e8f0]">Generated Shader</span>
              <div className="flex-1" />
              <button onClick={() => setShowCompile(false)} className="text-xs text-[#6a6a8a] hover:text-white">✕</button>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs text-[#e8e8f0] font-mono leading-relaxed bg-[#0a0a1a]">{compiledCode}</pre>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a35] border-t border-[#2a2a4a]">
              <button
                onClick={() => navigator.clipboard.writeText(compiledCode)}
                className="px-3 py-1 bg-[#e94560] text-white text-xs rounded hover:bg-red-600"
              >Copy to Clipboard</button>
              <button className="px-3 py-1 bg-[#1a1a35] border border-[#2a2a4a] text-[#6a6a8a] text-xs rounded hover:text-white">Save as .shader</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
