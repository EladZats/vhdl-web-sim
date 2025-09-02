import React, { useCallback, useState, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { InputNode, OutputNode, AndGateNode, GenericGateNode, ClockNode } from './CustomNodes'; // Import ClockNode
import './CustomNodes.css';

const nodeTypes = {
  input: InputNode,
  output: OutputNode,
  andGate: AndGateNode,
  default: GenericGateNode,
  clock: ClockNode, // <-- Register the new clock node type
};

const flowStyles = {
  background: '#1A202C',
  '.react-flow__node.selected': {
    outline: '2px solid #FBB6CE',
    outlineOffset: '2px',
  },
  '.react-flow__edge-path': {
    stroke: '#A0AEC0',
    strokeWidth: '2px',
  },
};

let id = 0;
const getId = () => `dndnode_${id++}`;

export default function GraphEditor({ nodes, setNodes, edges, setEdges }) {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeInfoStr = event.dataTransfer.getData('application/reactflow');
      
      if (!nodeInfoStr || !reactFlowInstance) {
        return;
      }
      
      const { type, label } = JSON.parse(nodeInfoStr);

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div className="h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        nodeTypes={nodeTypes}
        style={flowStyles}
        deleteKeyCode={['Delete', 'Backspace']}
      >
        <Background variant="dots" gap={12} size={1} color="#4A5568" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
