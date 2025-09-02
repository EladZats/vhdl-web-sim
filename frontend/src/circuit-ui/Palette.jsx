import React from 'react';

// List of all available components to drag from the palette
const paletteItems = [
  { type: 'input', label: 'Input' },
  { type: 'output', label: 'Output' },
  { type: 'andGate', label: 'AND' },
  { type: 'default', label: 'OR' },
  { type: 'default', label: 'NOT' },
  { type: 'default', label: 'XOR' },
  { type: 'default', label: 'NAND' },
  { type: 'default', label: 'NOR' },
  { type: 'default', label: 'XNOR' },
];

export default function Palette() {
  const onDragStart = (event, nodeType, nodeLabel) => {
    // We store the node type and label to use it on drop
    const nodeInfo = JSON.stringify({ type: nodeType, label: nodeLabel });
    event.dataTransfer.setData('application/reactflow', nodeInfo);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-48 bg-gray-100 dark:bg-slate-900 p-4 border-r border-gray-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Components</h3>
      <div className="space-y-3">
        {paletteItems.map(({ type, label }) => (
          <div
            key={label}
            className="p-3 border-2 border-dashed bg-transparent dark:bg-slate-800 border-gray-400 dark:border-slate-600 rounded-lg cursor-grab text-center font-mono text-gray-700 dark:text-gray-200 hover:border-solid hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-emerald-500 transition-colors duration-150"
            onDragStart={(event) => onDragStart(event, type, label)}
            draggable
          >
            {label}
          </div>
        ))}
      </div>
    </aside>
  );
}