import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes = {
  event: EventNode,
  action: ActionNode,
  condition: ConditionNode,
  variable: VariableNode,
  math: MathNode,
};

function EventNode({ data }: NodeProps) {
  return (
    <div className="bg-green-900/80 border border-green-600 rounded-lg px-3 py-2 min-w-[140px]">
      <Handle type="source" position={Position.Bottom} className="bg-green-400" />
      <div className="text-xs text-green-300 font-medium">{data.label}</div>
    </div>
  );
}

function ActionNode({ data }: NodeProps) {
  return (
    <div className="bg-blue-900/80 border border-blue-600 rounded-lg px-3 py-2 min-w-[140px]">
      <Handle type="target" position={Position.Top} className="bg-blue-400" />
      <Handle type="source" position={Position.Bottom} className="bg-blue-400" />
      <div className="text-xs text-blue-300 font-medium">{data.label}</div>
      {data.fields?.map((field: string, i: number) => (
        <input key={i} placeholder={field} className="mt-1 w-full px-1 py-0.5 bg-blue-950 border border-blue-800 rounded text-xs text-white" />
      ))}
    </div>
  );
}

function ConditionNode({ data }: NodeProps) {
  return (
    <div className="bg-yellow-900/80 border border-yellow-600 rounded-lg px-3 py-2 min-w-[140px]">
      <Handle type="target" position={Position.Top} className="bg-yellow-400" />
      <Handle type="source" position={Position.Bottom} id="true" className="bg-green-400" />
      <Handle type="source" position={Position.Left} id="false" className="bg-red-400" />
      <div className="text-xs text-yellow-300 font-medium">{data.label}</div>
    </div>
  );
}

function VariableNode({ data }: NodeProps) {
  return (
    <div className="bg-purple-900/80 border border-purple-600 rounded-lg px-3 py-2 min-w-[140px]">
      <Handle type="source" position={Position.Right} className="bg-purple-400" />
      <div className="text-xs text-purple-300 font-medium">{data.label}</div>
      <input defaultValue={data.value} className="mt-1 w-full px-1 py-0.5 bg-purple-950 border border-purple-800 rounded text-xs text-white" />
    </div>
  );
}

function MathNode({ data }: NodeProps) {
  return (
    <div className="bg-orange-900/80 border border-orange-600 rounded-lg px-3 py-2 min-w-[140px]">
      <Handle type="target" position={Position.Top} className="bg-orange-400" />
      <Handle type="source" position={Position.Bottom} className="bg-orange-400" />
      <div className="text-xs text-orange-300 font-medium">{data.label}</div>
      <div className="flex gap-1 mt-1">
        <input className="w-12 px-1 py-0.5 bg-orange-950 border border-orange-800 rounded text-xs text-white" />
        <span className="text-orange-300 text-xs">+</span>
        <input className="w-12 px-1 py-0.5 bg-orange-950 border border-orange-800 rounded text-xs text-white" />
      </div>
    </div>
  );
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'event',
    position: { x: 250, y: 0 },
    data: { label: 'On Start' },
  },
  {
    id: '2',
    type: 'action',
    position: { x: 250, y: 100 },
    data: { label: 'Move GameObject', fields: ['Target', 'Speed'] },
  },
  {
    id: '3',
    type: 'condition',
    position: { x: 250, y: 200 },
    data: { label: 'Distance < Threshold' },
  },
  {
    id: '4',
    type: 'action',
    position: { x: 100, y: 300 },
    data: { label: 'Play Animation', fields: ['Clip Name'] },
  },
  {
    id: '5',
    type: 'action',
    position: { x: 400, y: 300 },
    data: { label: 'Destroy Object', fields: [] },
  },
];

export default function VisualScripting() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const nodeCategories = [
    { label: 'Events', items: ['On Start', 'On Update', 'On Trigger Enter', 'On Collision Enter'] },
    { label: 'Actions', items: ['Move Object', 'Rotate Object', 'Play Animation', 'Play Sound', 'Instantiate', 'Destroy'] },
    { label: 'Conditions', items: ['Distance Check', 'Variable Compare', 'Key Pressed', 'Timer'] },
    { label: 'Variables', items: ['Number', 'Vector3', 'String', 'Boolean'] },
    { label: 'Math', items: ['Add', 'Subtract', 'Multiply', 'Divide', 'Random'] },
  ];

  return (
    <div className="h-full flex">
      <div className="w-48 bg-nova-surface border-r border-nova-border p-2 overflow-y-auto">
        {nodeCategories.map((cat) => (
          <div key={cat.label} className="mb-3">
            <div className="text-xs text-nova-muted font-medium mb-1 uppercase">{cat.label}</div>
            {cat.items.map((item) => (
              <div
                key={item}
                draggable
                className="px-2 py-1 text-xs text-nova-text hover:bg-nova-hover rounded cursor-grab mb-0.5"
              >
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-nova-bg"
        >
          <Background color="#2a2a4a" gap={20} />
          <Controls className="bg-nova-surface border border-nova-border" />
          <MiniMap
            className="bg-nova-surface border border-nova-border"
            nodeColor="#e94560"
            maskColor="rgba(26,26,46,0.7)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
