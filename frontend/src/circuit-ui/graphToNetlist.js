export function graphToNetlist(nodes, edges, circuitName = "my_circuit") {
  const lines = [];
  lines.push(`CIRCUIT ${circuitName}`);

  const signalMap = new Map();
  const internalSignals = new Set();
  let gateCounter = 1;
  let dffCounter = 1;
  let wireCounter = 1;

  // Separate nodes into their specific types
  const inputs = nodes.filter(n => n.type === 'input');
  const outputs = nodes.filter(n => n.type === 'output');
  const clocks = nodes.filter(n => n.type === 'clock');
  const dffs = nodes.filter(n => n.type === 'default' && n.data.label?.toUpperCase() === 'DFF');
  const gates = nodes.filter(n => (n.type === 'andGate' || n.type === 'default') && n.data.label?.toUpperCase() !== 'DFF');

  // 1. Declare each CLOCK on a new line.
  clocks.forEach(n => {
    const { label = 'CLK', period = '10ns', dutyCycle = 0.5 } = n.data;
    signalMap.set(n.id, label);
    lines.push(`CLOCK ${label} ${period} ${dutyCycle}`);
  });

  // 2. Declare each INPUT signal on a new line.
  inputs.forEach(n => {
    signalMap.set(n.id, n.data.label);
    lines.push(`INPUT ${n.data.label}`);
  });

  // 3. Declare each OUTPUT signal on a new line.
  outputs.forEach(n => {
    lines.push(`OUTPUT ${n.data.label}`);
  });

  // 4. Identify and map all gate and DFF outputs to determine internal signals.
  const componentsWithOutput = [...gates, ...dffs];
  componentsWithOutput.forEach(componentNode => {
    const outputEdge = edges.find(e => e.source === componentNode.id);
    let outputSignalName;

    if (outputEdge) {
      const targetNode = nodes.find(n => n.id === outputEdge.target);
      if (targetNode && targetNode.type === 'output') {
        outputSignalName = targetNode.data.label;
      }
    }

    if (!outputSignalName) {
      outputSignalName = `w${wireCounter++}`;
      internalSignals.add(outputSignalName);
    }
    signalMap.set(componentNode.id, outputSignalName);
  });

  // 5. Declare each identified internal SIGNAL on a new line.
  if (internalSignals.size > 0) {
    internalSignals.forEach(signalName => {
      lines.push(`SIGNAL ${signalName}`);
    });
  }
  
  lines.push(''); // Add a blank line for readability.

  // 6. Define all the GATE connections.
  gates.forEach(gateNode => {
    const gateId = `g${gateCounter++}`;
    const gateType = gateNode.data.label.toUpperCase();
    const outputSignalName = signalMap.get(gateNode.id);

    const inputEdges = edges.filter(e => e.target === gateNode.id);
    const inputSignalNames = inputEdges
      .sort((a, b) => (a.targetHandle < b.targetHandle ? -1 : 1))
      .map(edge => signalMap.get(edge.source))
      .filter(name => name);

    if (outputSignalName && inputSignalNames.length > 0) {
      lines.push(`GATE ${gateId} ${gateType} ${inputSignalNames.join(' ')} ${outputSignalName}`);
    }
  });

  // 7. Define all the DFF connections.
  dffs.forEach(dffNode => {
    const dffId = `dff${dffCounter++}`;
    const qOutput = signalMap.get(dffNode.id);
    
    const dInputEdge = edges.find(e => e.target === dffNode.id && e.targetHandle === 'a');
    const clkInputEdge = edges.find(e => e.target === dffNode.id && e.targetHandle === 'b');

    const dInput = dInputEdge ? signalMap.get(dInputEdge.source) : null;
    const clkInput = clkInputEdge ? signalMap.get(clkInputEdge.source) : null;

    if (dInput && clkInput && qOutput) {
      lines.push(`DFF ${dffId} ${dInput} ${clkInput} ${qOutput}`);
    }
  });

  return lines.join("\n");
}