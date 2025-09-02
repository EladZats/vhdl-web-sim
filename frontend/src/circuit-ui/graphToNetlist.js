export function graphToNetlist(nodes, edges, circuitName = "my_circuit") {
  let lines = [];
  lines.push(`CIRCUIT ${circuitName}`);

  // Inputs
  nodes.filter(n => n.type === "input").forEach(n => {
    lines.push(`INPUT ${n.data.label}`);
  });

  // Outputs
  nodes.filter(n => n.type === "output").forEach(n => {
    lines.push(`OUTPUT ${n.data.label}`);
  });

  // Gates
  nodes.filter(n => n.type === "default").forEach(n => {
    if (n.data.label === "NOT") {
      const inputEdge = edges.find(e => e.target === n.id);
      const outputEdge = edges.find(e => e.source === n.id);
      if (inputEdge && outputEdge) {
        const inNode = nodes.find(nd => nd.id === inputEdge.source);
        const outNode = nodes.find(nd => nd.id === outputEdge.target);
        lines.push(`GATE ${n.id} NOT ${inNode.data.label} ${outNode.data.label}`);
      }
    } else {
      const inputEdges = edges.filter(e => e.target === n.id);
      const outputEdge = edges.find(e => e.source === n.id);
      if (inputEdges.length === 2 && outputEdge) {
        const in1 = nodes.find(nd => nd.id === inputEdges[0].source);
        const in2 = nodes.find(nd => nd.id === inputEdges[1].source);
        const outNode = nodes.find(nd => nd.id === outputEdge.target);
        lines.push(`GATE ${n.id} ${n.data.label} ${in1.data.label} ${in2.data.label} ${outNode.data.label}`);
      }
    }
  });

  return lines.join("\n");
}