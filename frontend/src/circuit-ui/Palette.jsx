import React, { useState } from 'react';

// Separate items into logical groups
const mainItems = [
  { type: 'input', label: 'Input' },
  { type: 'output', label: 'Output' },
];

const gateItems = [
  { type: 'andGate', label: 'AND' },
  { type: 'default', label: 'OR' },
  { type: 'default', label: 'NOT' },
  { type: 'default', label: 'XOR' },
  { type: 'default', label: 'NAND' },
  { type: 'default', label: 'NOR' },
  { type: 'default', label: 'XNOR' },
];

// A reusable component for the draggable item to keep the code clean
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

export default function Palette() {
  const [isGatesOpen, setIsGatesOpen] = useState(false); // State for dropdown

  const onDragStart = (event, nodeType, nodeLabel) => {
    // We store the node type and label to use it on drop
    const nodeInfo = JSON.stringify({ type: nodeType, label: nodeLabel });
    event.dataTransfer.setData('application/reactflow', nodeInfo);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    // Main container is now a horizontal bar
    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700">
      <div className="flex items-center space-x-4">
        <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200">Components:</h3>
        
        {/* Render Main Items directly */}
        {mainItems.map((item) => (
          <DraggableItem key={item.label} item={item} onDragStart={onDragStart} />
        ))}

        {/* Separator */}
        <div className="h-8 w-px bg-slate-600"></div>

        {/* Gates Dropdown Section (opens upwards) */}
        <div className="relative">
          <button
            onClick={() => setIsGatesOpen(!isGatesOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg font-semibold text-gray-600 dark:text-gray-400 hover:bg-slate-700"
          >
            <span>Gates</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isGatesOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
            </svg>
          </button>
          {isGatesOpen && (
            <div className="absolute bottom-full mb-2 flex flex-wrap gap-2 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-lg w-96">
              {gateItems.map((item) => (
                <DraggableItem key={item.label} item={item} onDragStart={onDragStart} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}