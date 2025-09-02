import React from "react";
import { Handle, Position } from "reactflow";

// --- Input Node ---
export const InputNode = ({ data }) => (
  <div className="custom-node" style={{ position: "relative", width: 80, height: 40 }}>
    <svg width="80" height="40">
      <rect x="1" y="1" width="78" height="38" rx="5" ry="5" fill="#2D3748" stroke="#38A169" strokeWidth="2" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="monospace" fontSize="16" fill="#E2E8F0">{data.label}</text>
    </svg>
    <Handle type="source" position={Position.Right} style={{ top: "20px", right: "-6px", background: "#68D391" }} />
  </div>
);

// --- Output Node ---
export const OutputNode = ({ data }) => (
  <div className="custom-node" style={{ position: "relative", width: 80, height: 40 }}>
    <Handle type="target" position={Position.Left} style={{ top: "20px", left: "-6px", background: "#FBB6CE" }} />
    <svg width="80" height="40">
      <rect x="1" y="1" width="78" height="38" rx="5" ry="5" fill="#2D3748" stroke="#D53F8C" strokeWidth="2" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="monospace" fontSize="16" fill="#E2E8F0">{data.label}</text>
    </svg>
  </div>
);

// --- AND Gate Node (with text added) ---
export const AndGateNode = ({ data }) => (
  <div className="custom-node" style={{ position: "relative", width: 80, height: 50 }}>
    <Handle type="target" id="a" position={Position.Left} style={{ top: "12.5px", left: "-6px", background: "#A0AEC0" }} />
    <Handle type="target" id="b" position={Position.Left} style={{ top: "37.5px", left: "-6px", background: "#A0AEC0" }} />
    <svg width="80" height="50">
      <path d="M 0 0 L 40 0 A 40 25 0 1 1 40 50 L 0 50 Z" fill="#2D3748" stroke="#5A67D8" strokeWidth="2" />
      <text x="25" y="25" fontFamily="monospace" fontSize="12" fill="#E2E8F0" textAnchor="middle" dominantBaseline="central">AND</text>
    </svg>
    <Handle type="source" position={Position.Right} style={{ top: "25px", right: "-6px", background: "#A0AEC0" }} />
  </div>
);

// --- GenericGateNode: Renders the correct shape and label based on the data ---
export const GenericGateNode = ({ data }) => {
  const gateType = data.label?.toUpperCase();

  let gateSvg;
  const isNotGate = gateType === 'NOT';
  const width = 80;
  const height = isNotGate ? 40 : 50;

  // Common text style for all gates
  const textStyle = {
    fontSize: '12px',
    fontFamily: 'monospace',
    fill: '#E2E8F0',
    textAnchor: 'middle',
    dominantBaseline: 'central'
  };

  switch (gateType) {
    case 'OR':
      gateSvg = <svg width={width} height={height}><path d="M 0 0 Q 20 25 0 50 Q 40 50 70 25 Q 40 0 0 0 Z" fill="#2D3748" stroke="#ED8936" strokeWidth="2" /><text x="30" y="25" style={textStyle}>OR</text></svg>;
      break;
    case 'NOT':
      // Made triangle shorter/wider and added text
      gateSvg = <svg width={width} height={height}><path d="M 0 0 L 50 20 L 0 40 Z" fill="#2D3748" stroke="#E53E3E" strokeWidth="2" /><circle cx="55" cy="20" r="5" fill="none" stroke="#E53E3E" strokeWidth="2" /><text x="15" y="20" style={textStyle}>NOT</text></svg>;
      break;
    case 'XOR':
      gateSvg = <svg width={width} height={height}><path d="M 0 0 Q 20 25 0 50 Q 40 50 70 25 Q 40 0 0 0 Z" fill="#2D3748" stroke="#319795" strokeWidth="2" /><path d="M -8 0 Q 12 25 -8 50" fill="none" stroke="#319795" strokeWidth="2" /><text x="30" y="25" style={textStyle}>XOR</text></svg>;
      break;
    case 'NAND':
      gateSvg = <svg width={width} height={height}><path d="M 0 0 L 30 0 A 30 25 0 1 1 30 50 L 0 50 Z" fill="#2D3748" stroke="#e8eb08ff" strokeWidth="2" /><circle cx="65" cy="25" r="5" fill="none" stroke="#e8eb08ff" strokeWidth="2" /><text x="25" y="25" style={textStyle}>NAND</text></svg>;
      break;
    case 'NOR':
      gateSvg = <svg width={width} height={height}><path d="M 0 0 Q 20 25 0 50 Q 40 50 65 25 Q 40 0 0 0 Z" fill="#2D3748" stroke="#9F7AEA" strokeWidth="2" /><circle cx="70" cy="25" r="5" fill="none" stroke="#9F7AEA" strokeWidth="2" /><text x="25" y="25" style={textStyle}>NOR</text></svg>;
      break;
    case 'XNOR':
      gateSvg = <svg width={width} height={height}><path d="M 0 0 Q 20 25 0 50 Q 40 50 65 25 Q 40 0 0 0 Z" fill="#2D3748" stroke="#3103e7ff" strokeWidth="2" /><path d="M -8 0 Q 12 25 -8 50" fill="none" stroke="#3103e7ff" strokeWidth="2" /><circle cx="70" cy="25" r="5" fill="none" stroke="#3103e7ff" strokeWidth="2" /><text x="30" y="25" style={textStyle}>XNOR</text></svg>;
      break;
    default: // Fallback to a simple rectangle
      gateSvg = <svg width={width} height={height}><rect x="1" y="1" width={width-2} height={height-2} rx="5" ry="5" fill="#2D3748" stroke="#A0AEC0" strokeWidth="2" /><text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="monospace" fontSize="16" fill="#E2E8F0">{data.label}</text></svg>;
  }

  return (
    <div className="custom-node" style={{ position: "relative", width, height }}>
      {/* Input Handles */}
      <Handle type="target" id="a" position={Position.Left} style={{ top: isNotGate ? '50%' : '25%', left: "-6px", background: "#A0AEC0" }} />
      {!isNotGate && <Handle type="target" id="b" position={Position.Left} style={{ top: '75%', left: "-6px", background: "#A0AEC0" }} />}
      
      {gateSvg}
      
      {/* Output Handle */}
      <Handle type="source" position={Position.Right} style={{ top: '50%', right: "-6px", background: "#A0AEC0" }} />
    </div>
  );
};
