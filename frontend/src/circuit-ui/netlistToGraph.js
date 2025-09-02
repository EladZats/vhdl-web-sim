/**
 * Implements a layered layout algorithm (topological sort) for a circuit graph.
 * Handles cycles by placing remaining nodes in a subsequent layer.
 * @param {Map<string, {inputs: string[]}>} components - Map of component IDs to their inputs.
 * @param {Set<string>} sourceNodes - Set of initial node IDs (inputs, clocks).
 * @returns {Map<string, number>} A map of node ID to its calculated layer number.
 */
function calculateNodeLayers(components, sourceNodes) {
  const layers = new Map();
  const inDegree = new Map();
  const queue = [];
  let maxLayer = 0;

  // Initialize in-degrees and find initial nodes for the queue
  for (const [id, { inputs }] of components.entries()) {
    if (sourceNodes.has(id)) continue; // Skip primary inputs/clocks

    let degree = 0;
    for (const inputId of inputs) {
      // We only care about connections from other components, not primary inputs
      if (components.has(inputId) && !sourceNodes.has(inputId)) {
        degree++;
      }
    }
    inDegree.set(id, degree);
    if (degree === 0) {
      queue.push(id);
      layers.set(id, 1);
      maxLayer = Math.max(maxLayer, 1);
    }
  }
  
  // Set layer 0 for all primary source nodes
  sourceNodes.forEach(id => layers.set(id, 0));

  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    const uLayer = layers.get(u) || 1;
    maxLayer = Math.max(maxLayer, uLayer);

    // Find all nodes that `u` is an input to
    for (const [v, { inputs }] of components.entries()) {
      if (inputs.includes(u)) {
        const currentDegree = (inDegree.get(v) || 0) - 1;
        inDegree.set(v, currentDegree);
        if (currentDegree === 0) {
          layers.set(v, uLayer + 1);
          queue.push(v);
        }
      }
    }
  }

  // --- Cycle Handling ---
  // If there are nodes left in `inDegree` with a count > 0, they are part of a cycle.
  // Place them in a layer after the last successfully placed node.
  const cycleLayer = maxLayer + 1;
  for (const [id, degree] of inDegree.entries()) {
    if (degree > 0 && !layers.has(id)) {
      layers.set(id, cycleLayer);
    }
  }

  return layers;
}


/**
 * Parses a netlist string and converts it into a graph structure for React Flow.
 * @param {string} netlistString The netlist content.
 * @returns {{nodes: Array<object>, edges: Array<object>}}
 */
export function netlistToGraph(netlistString) {
  if (!netlistString || typeof netlistString !== 'string') {
    return { nodes: [], edges: [] };
  }

  const finalNodes = [];
  const finalEdges = [];
  const lines = netlistString.split('\n');

  const components = new Map(); // Maps component ID to its info {type, label, inputs}
  const signalToSourceId = new Map(); // Maps a signal name to the node ID that produces it
  const sourceNodeIds = new Set(); // IDs of all INPUT and CLOCK nodes
  const outputNodes = new Map(); // Maps signal name to OUTPUT node info

  // --- Pass 1: Gather all information ---
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('--')) return;

    const tokens = trimmedLine.split(/\s+/).filter(Boolean);
    const directive = tokens[0]?.toUpperCase();
    const args = tokens.slice(1);

    switch (directive) {
      case 'INPUT': {
        args.forEach(signalName => {
          if (!signalName) return;
          const nodeId = `input-${signalName}`;
          components.set(nodeId, { type: 'input', label: signalName, inputs: [] });
          signalToSourceId.set(signalName, nodeId);
          sourceNodeIds.add(nodeId);
        });
        break;
      }
      case 'CLOCK': {
        const signalName = args[0];
        if (!signalName) break;
        const nodeId = `clock-${signalName}`;
        components.set(nodeId, { type: 'clock', label: signalName, inputs: [] });
        signalToSourceId.set(signalName, nodeId);
        sourceNodeIds.add(nodeId);
        break;
      }
      case 'OUTPUT': {
        args.forEach(signalName => {
          if (!signalName) return;
          const nodeId = `output-${signalName}`;
          outputNodes.set(signalName, { id: nodeId, type: 'output', label: signalName });
        });
        break;
      }
      case 'GATE':
      case 'DFF': {
        const [componentId, ...rest] = args;
        if (!componentId) return;
        const outputSignal = rest.pop();
        const componentType = directive === 'GATE' ? rest.shift() : 'DFF';
        const inputSignals = rest;
        
        const nodeType = (componentType === 'AND') ? 'andGate' : 'default';

        components.set(componentId, { type: nodeType, label: componentType, inputs: inputSignals });
        signalToSourceId.set(outputSignal, componentId);
        break;
      }
    }
  });

  // --- Pass 2: Calculate layers ---
  const componentInputsOnly = new Map();
  for (const [id, { inputs }] of components.entries()) {
      const componentInputIds = inputs.map(sig => signalToSourceId.get(sig)).filter(Boolean);
      componentInputsOnly.set(id, { inputs: componentInputIds });
  }
  const nodeLayers = calculateNodeLayers(componentInputsOnly, sourceNodeIds);

  // --- Pass 3: Position nodes and create edges ---
  const X_SPACING = 220;
  const Y_SPACING = 100;
  const nodePositions = new Map();
  const nodesByLayer = [];
  let maxLayer = 0;

  // Group nodes by layer
  for (const [id, layer] of nodeLayers.entries()) {
    if (!nodesByLayer[layer]) nodesByLayer[layer] = [];
    nodesByLayer[layer].push(id);
    maxLayer = Math.max(maxLayer, layer);
  }

  // Position nodes layer by layer
  for (let i = 0; i <= maxLayer; i++) {
    const layerNodes = nodesByLayer[i] || [];
    
    // Calculate initial desired Y for each node in the layer
    const desiredPositions = layerNodes.map((id, yIndex) => {
        const { inputs: inputSignals } = components.get(id);
        const inputNodeIds = inputSignals.map(sig => signalToSourceId.get(sig)).filter(Boolean);
        
        let targetY = yIndex * Y_SPACING + 50; // Default stacked position

        if (i > 0 && inputNodeIds.length > 0) {
            let ySum = 0;
            let relevantInputs = 0;
            inputNodeIds.forEach(inputId => {
                if (nodePositions.has(inputId)) {
                    ySum += nodePositions.get(inputId).y;
                    relevantInputs++;
                }
            });
            if (relevantInputs > 0) {
                targetY = ySum / relevantInputs;
            }
        }
        return { id, y: targetY };
    });

    // Sort nodes in the current layer by their desired Y position
    desiredPositions.sort((a, b) => a.y - b.y);

    let lastY = -Infinity; // Keep track of the last placed node's Y position in this column

    // Place nodes, ensuring minimum spacing
    desiredPositions.forEach(({ id, y }) => {
        const finalY = Math.max(y, lastY + Y_SPACING);
        const position = { x: i * X_SPACING, y: finalY };
        nodePositions.set(id, position);
        lastY = finalY;

        finalNodes.push({
            id,
            type: components.get(id).type,
            position,
            data: { label: components.get(id).label },
        });
    });
  }

  // Position output nodes
  const outputLayer = maxLayer + 1;
  const outputDesiredPositions = [];
  for (const [signal, { id }] of outputNodes.entries()) {
      const sourceId = signalToSourceId.get(signal);
      let targetY = 0;
      if (sourceId && nodePositions.has(sourceId)) {
          targetY = nodePositions.get(sourceId).y; // Align with its source
      }
      outputDesiredPositions.push({ id, y: targetY, signal });
  }
  outputDesiredPositions.sort((a, b) => a.y - b.y);

  let lastY = -Infinity;
  outputDesiredPositions.forEach(({ id, y, signal }) => {
      const finalY = Math.max(y, lastY + Y_SPACING);
      const { type, label } = outputNodes.get(signal);
      finalNodes.push({
          id,
          type,
          position: { x: outputLayer * X_SPACING, y: finalY },
          data: { label },
      });
      lastY = finalY;
  });

  // Create edges for components
  for (const [targetId, { inputs }] of components.entries()) {
    inputs.forEach((signal, index) => {
      const sourceId = signalToSourceId.get(signal);
      if (sourceId) {
        const handle = String.fromCharCode(97 + index); // 'a', 'b', ...
        finalEdges.push({
          id: `e-${sourceId}-${targetId}-${handle}`,
          source: sourceId,
          target: targetId,
          targetHandle: handle,
        });
      }
    });
  }

  // Create edges to output nodes
  for (const [signal, { id: targetId }] of outputNodes.entries()) {
    const sourceId = signalToSourceId.get(signal);
    if (sourceId) {
      finalEdges.push({
        id: `e-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
      });
    }
  }

  return { nodes: finalNodes, edges: finalEdges };
}