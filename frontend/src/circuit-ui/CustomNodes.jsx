import React, { useState, useCallback, useEffect, useRef } from "react";
import { Handle, Position, useReactFlow } from "reactflow";

// --- Editable Input Node ---
export const InputNode = ({ id, data }) => {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [nodeName, setNodeName] = useState(data.label);
  const inputRef = useRef(null);

  const onSave = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          node.data = { ...node.data, label: nodeName };
        }
        return node;
      })
    );
    setIsEditing(false);
  }, [id, nodeName, setNodes]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className="custom-node" style={{ position: "relative", width: 80, height: 40 }} onDoubleClick={() => setIsEditing(true)}>
      {isEditing ? (
        <input
          ref={inputRef}
          value={nodeName}
          onChange={(e) => setNodeName(e.target.value)}
          onBlur={onSave}
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
          style={{ width: '100%', height: '100%', textAlign: 'center', background: '#4A5568', border: '1px solid #63B3ED', color: '#E2E8F0', fontFamily: 'monospace', fontSize: '16px', borderRadius: '5px' }}
        />
      ) : (
        <svg width="80" height="40">
          <rect x="1" y="1" width="78" height="38" rx="5" ry="5" fill="#2D3748" stroke="#38A169" strokeWidth="2" />
          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="monospace" fontSize="16" fill="#E2E8F0">{data.label}</text>
        </svg>
      )}
      <Handle type="source" position={Position.Right} style={{ top: "20px", right: "-6px", background: "#68D391" }} />
    </div>
  );
};

// --- Editable Output Node ---
export const OutputNode = ({ id, data }) => {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [nodeName, setNodeName] = useState(data.label);
  const inputRef = useRef(null);

  const onSave = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          node.data = { ...node.data, label: nodeName };
        }
        return node;
      })
    );
    setIsEditing(false);
  }, [id, nodeName, setNodes]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className="custom-node" style={{ position: "relative", width: 80, height: 40 }} onDoubleClick={() => setIsEditing(true)}>
      <Handle type="target" position={Position.Left} style={{ top: "20px", left: "-6px", background: "#FBB6CE" }} />
      {isEditing ? (
        <input
          ref={inputRef}
          value={nodeName}
          onChange={(e) => setNodeName(e.target.value)}
          onBlur={onSave}
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
          style={{ width: '100%', height: '100%', textAlign: 'center', background: '#4A5568', border: '1px solid #D53F8C', color: '#E2E8F0', fontFamily: 'monospace', fontSize: '16px', borderRadius: '5px' }}
        />
      ) : (
        <svg width="80" height="40">
          <rect x="1" y="1" width="78" height="38" rx="5" ry="5" fill="#2D3748" stroke="#D53F8C" strokeWidth="2" />
          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="monospace" fontSize="16" fill="#E2E8F0">{data.label}</text>
        </svg>
      )}
    </div>
  );
};

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
      gateSvg = <svg width={width} height={height}><path d="M 0 0 L 50 20 L 0 40 Z" fill="#2D3748" stroke="#E53E3E" strokeWidth="2" /><circle cx="55" cy="20" r="5" fill="none" stroke="#E53E3E" strokeWidth="2" /><text x="25" y="20" style={textStyle}>NOT</text></svg>;
      break;
    case 'XOR':
      gateSvg = <svg width={width} height={height}><path d="M 0 0 Q 20 25 0 50 Q 40 50 70 25 Q 40 0 0 0 Z" fill="#2D3748" stroke="#319795" strokeWidth="2" /><path d="M -8 0 Q 12 25 -8 50" fill="none" stroke="#319795" strokeWidth="2" /><text x="30" y="25" style={textStyle}>XOR</text></svg>;
      break;
    case 'NAND':
      gateSvg = <svg width={width} height={height}><path d="M 0 0 L 30 0 A 30 25 0 1 1 30 50 L 0 50 Z" fill="#2D3748" stroke="#38B2AC" strokeWidth="2" /><circle cx="65" cy="25" r="5" fill="none" stroke="#38B2AC" strokeWidth="2" /><text x="25" y="25" style={textStyle}>NAND</text></svg>;
      break;
    case 'NOR':
      gateSvg = <svg width={width} height={height}><path d="M 0 0 Q 20 25 0 50 Q 40 50 65 25 Q 40 0 0 0 Z" fill="#2D3748" stroke="#9F7AEA" strokeWidth="2" /><circle cx="70" cy="25" r="5" fill="none" stroke="#9F7AEA" strokeWidth="2" /><text x="25" y="25" style={textStyle}>NOR</text></svg>;
      break;
    case 'XNOR':
      gateSvg = <svg width={width} height={height}><path d="M 0 0 Q 20 25 0 50 Q 40 50 65 25 Q 40 0 0 0 Z" fill="#2D3748" stroke="#ED64A6" strokeWidth="2" /><path d="M -8 0 Q 12 25 -8 50" fill="none" stroke="#ED64A6" strokeWidth="2" /><circle cx="70" cy="25" r="5" fill="none" stroke="#ED64A6" strokeWidth="2" /><text x="25" y="25" style={textStyle}>XNOR</text></svg>;
      break;
    default:
      gateSvg = <svg width={width} height={height}><rect x="1" y="1" width={width-2} height={height-2} rx="5" ry="5" fill="#2D3748" stroke="#A0AEC0" strokeWidth="2" /><text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="monospace" fontSize="16" fill="#E2E8F0">{data.label}</text></svg>;
  }

  return (
    <div className="custom-node" style={{ position: "relative", width, height }}>
      <Handle type="target" id="a" position={Position.Left} style={{ top: isNotGate ? '50%' : '25%', left: "-6px", background: "#A0AEC0" }} />
      {!isNotGate && <Handle type="target" id="b" position={Position.Left} style={{ top: '75%', left: "-6px", background: "#A0AEC0" }} />}
      {gateSvg}
      <Handle type="source" position={Position.Right} style={{ top: '50%', right: "-6px", background: "#A0AEC0" }} />
    </div>
  );
};
