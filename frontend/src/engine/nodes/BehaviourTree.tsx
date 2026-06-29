import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
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
  root: RootNode,
  selector: SelectorNode,
  sequence: SequenceNode,
  action: ActionNode,
  condition: BTConditionNode,
  decorator: DecoratorNode,
};

function RootNode({ data }: NodeProps) {
  return (
    <div className="bg-gray-800 border-2 border-gray-500 rounded-lg px-4 py-2">
      <Handle type="source" position={Position.Bottom} className="bg-gray-400" />
      <div className="text-xs text-gray-300 font-bold">ROOT</div>
    </div>
  );
}

function SelectorNode({ data }: NodeProps) {
  return (
    <div className="bg-blue-900/80 border border-blue-500 rounded-lg px-3 py-2 min-w-[120px]">
      <Handle type="target" position={Position.Top} className="bg-blue-400" />
      <Handle type="source" position={Position.Bottom} className="bg-blue-400" />
      <div className="text-xs text-blue-300 font-bold">❓ Selector</div>
    </div>
  );
}

function SequenceNode({ data }: NodeProps) {
  return (
    <div className="bg-green-900/80 border border-green-500 rounded-lg px-3 py-2 min-w-[120px]">
      <Handle type="target" position={Position.Top} className="bg-green-400" />
      <Handle type="source" position={Position.Bottom} className="bg-green-400" />
      <div className="text-xs text-green-300 font-bold">▶ Sequence</div>
    </div>
  );
}

function ActionNode({ data }: NodeProps) {
  return (
    <div className="bg-purple-900/80 border border-purple-500 rounded px-3 py-2 min-w-[120px]">
      <Handle type="target" position={Position.Top} className="bg-purple-400" />
      <div className="text-xs text-purple-300">{data.label}</div>
    </div>
  );
}

function BTConditionNode({ data }: NodeProps) {
  return (
    <div className="bg-yellow-900/80 border border-yellow-500 rounded px-3 py-2 min-w-[120px]">
      <Handle type="target" position={Position.Top} className="bg-yellow-400" />
      <div className="text-xs text-yellow-300">{data.label}</div>
    </div>
  );
}

function DecoratorNode({ data }: NodeProps) {
  return (
    <div className="bg-orange-900/80 border border-orange-500 rounded-lg px-3 py-2 min-w-[120px]">
      <Handle type="target" position={Position.Top} className="bg-orange-400" />
      <Handle type="source" position={Position.Bottom} className="bg-orange-400" />
      <div className="text-xs text-orange-300 font-bold">🔄 {data.label}</div>
    </div>
  );
}

const initialNodes: Node[] = [
  { id: '1', type: 'root', position: { x: 300, y: 0 }, data: {} },
  { id: '2', type: 'selector', position: { x: 300, y: 80 }, data: {} },
  { id: '3', type: 'sequence', position: { x: 150, y: 180 }, data: {} },
  { id: '4', type: 'sequence', position: { x: 450, y: 180 }, data: {} },
  { id: '5', type: 'condition', position: { x: 150, y: 280 }, data: { label: 'See Enemy?' } },
  { id: '6', type: 'action', position: { x: 150, y: 360 }, data: { label: 'Chase Enemy' } },
  { id: '7', type: 'action', position: { x: 450, y: 280 }, data: { label: 'Patrol' } },
  { id: '8', type: 'decorator', position: { x: 450, y: 360 }, data: { label: 'Repeat' } },
];

export default function BehaviourTree() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const nodePalette = [
    { label: 'Selector', type: '❓' },
    { label: 'Sequence', type: '▶' },
    { label: 'Action', type: '⚡' },
    { label: 'Condition', type: '❔' },
    { label: 'Decorator', type: '🔄' },
  ];

  return (
    <div className="h-full flex">
      <div className="w-40 bg-nova-surface border-r border-nova-border p-2">
        <div className="text-xs text-nova-muted font-medium mb-2 uppercase">Nodes</div>
        {nodePalette.map((n) => (
          <div
            key={n.label}
            draggable
            className="px-2 py-1.5 text-xs text-nova-text hover:bg-nova-hover rounded cursor-grab mb-1"
          >
            {n.type} {n.label}
          </div>
        ))}
      </div>
      <div className="flex-1">
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
        </ReactFlow>
      </div>
    </div>
  );
}
