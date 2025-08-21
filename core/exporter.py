from core.circuit import Circuit
from core.simulator import Simulator

def _compress_waveform(values: list[int]) -> list[dict]:
    if not values:
        return []
    compressed = []
    prev = values[0]
    count = 1
    for v in values[1:]:
        if v == prev:
            count += 1
        else:
            compressed.append({"value": prev, "duration": count})
            prev, count = v, 1
    compressed.append({"value": prev, "duration": count})
    return compressed


def export_to_json(circuit: Circuit, simulator: Simulator, steps: int) -> dict:
    """Export circuit structure + simulation results as Python dict (not string)."""

    input_names = {s.name for s in circuit.inputs}
    output_names = {s.name for s in circuit.outputs}
    clock_names = {c.name for c in circuit.clocks}
    ff_output_names = {ff.q.name for ff in circuit.flipflops}
    excluded_names = input_names | output_names | clock_names | ff_output_names

    internal_signals = [name for name in circuit.signals if name not in excluded_names]

    return {
        "circuit": {
            "name": circuit.name,
            "inputs": [
                {"id": f"in{i}", "name": sig.name}
                for i, sig in enumerate(circuit.inputs, start=1)
            ],
            "outputs": [
                {"id": f"out{i}", "name": sig.name}
                for i, sig in enumerate(circuit.outputs, start=1)
            ],
            "signals": [
                {"id": f"sig{i}", "name": name}
                for i, name in enumerate(internal_signals, start=1)
            ],
            "clocks": [
                {
                    "id": f"clk{i}",
                    "name": clk.name,
                    "period": clk.period,
                    "duty_cycle": clk.duty_cycle,
                }
                for i, clk in enumerate(circuit.clocks, start=1)
            ],
            "flipflops": [
                {
                    "id": f"ff{i}",
                    "type": "DFF",
                    "d": ff.d.name,
                    "clk": ff.clk.name,
                    "q": ff.q.name,
                }
                for i, ff in enumerate(circuit.flipflops, start=1)
            ],
            "gates": [
                {
                    "id": f"g{i}",
                    "name": g.name,
                    "type": g.__class__.__name__.replace("Gate", "").upper(),
                    "inputs": [
                        i if isinstance(i, str) else i.name for i in g.inputs
                    ],
                    "output": g.output if isinstance(g.output, str) else g.output.name,
                }
                for i, g in enumerate(circuit.gates, start=1)
            ],
        },
        "simulation": {
            "steps": steps,
            "waveforms": simulator.history,
            "waveforms_compressed": {
                name: _compress_waveform(values)
                for name, values in simulator.history.items()
            },
        },
    }
