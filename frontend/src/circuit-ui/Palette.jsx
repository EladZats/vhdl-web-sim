import React from 'react';

// Item groups
const mainItems = [
  { type: 'input', label: 'Input' },
  { type: 'output', label: 'Output' },
];
const gateItems = [
  { type: 'andGate', label: 'AND' }, { type: 'default', label: 'OR' },
  { type: 'default', label: 'NOT' }, { type: 'default', label: 'XOR' },
  { type: 'default', label: 'NAND' }, { type: 'default', label: 'NOR' },
  { type: 'default', label: 'XNOR' },
];
const sequentialItems = [
  { type: 'clock', label: 'Clock' },
  { type: 'default', label: 'DFF' },
];

// Reusable draggable item
const DraggableItem = ({ item, onDragStart }) => (
  <div
    key={item.label}
    className="p-2 border-2 border-dashed bg-transparent dark:bg-slate-800 border-gray-400 dark:border-slate-600 rounded-lg cursor-grab text-center font-mono text-sm text-gray-700 dark:text-gray-200 hover:border-solid hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-emerald-500 transition-colors duration-150"
    onDragStart={(event) => onDragStart(event, item.type, item.label)}
    draggable
  >
    {item.label}
  </div>
);

// Simple vertical separator line
const Separator = () => (
    <div className="self-stretch w-px bg-slate-600"></div>
);

export default function Palette() {
  const onDragStart = (event, nodeType, nodeLabel) => {
    const nodeInfo = JSON.stringify({ type: nodeType, label: nodeLabel });
    event.dataTransfer.setData('application/reactflow', nodeInfo);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    // Main container is a horizontal bar at the bottom
    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700">
      <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-2">

        {/* Render all items in a flat list */}
        {mainItems.map((item) => (
          <DraggableItem key={item.label} item={item} onDragStart={onDragStart} />
        ))}

        <Separator />

        {gateItems.map((item) => (
          <DraggableItem key={item.label} item={item} onDragStart={onDragStart} />
        ))}

        <Separator />

        {sequentialItems.map((item) => (
          <DraggableItem key={item.label} item={item} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  );
}