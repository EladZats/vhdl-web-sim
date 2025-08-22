from __future__ import annotations
from typing import Dict, List, TYPE_CHECKING

if TYPE_CHECKING:
    from .circuit import Circuit


class Simulator:
    """
    Handles the step-by-step simulation of a circuit.
    This class was the source of the error.
    """

    def __init__(self, circuit: Circuit):
        self.circuit = circuit
        # This is a placeholder for any setup logic.
        # The original bug was likely in a method within this class.

    def run(self, steps: int, inputs_map: Dict[str, str]) -> Dict[str, list[int]]:
        """Runs the simulation and returns the waveforms."""

        # Initialize all signals to a known state (0)
        for signal in self.circuit.signals.values():
            signal.set_value(0)

        waveforms = {name: [] for name in self.circuit.signals}

        for t in range(steps):
            # 1. Set inputs and update clocks for the current time step
            for signal in self.circuit.inputs:
                if signal.name in inputs_map and t < len(inputs_map[signal.name]):
                    try:
                        value = int(inputs_map[signal.name][t])
                        signal.set_value(value)
                    except (ValueError, TypeError):
                        signal.set_value(0)  # Default to 0 on bad input

            for clock in self.circuit.clocks:
                clock.update(t)

            # 2. Update stateful components (DFFs)
            for ff in self.circuit.flipflops:
                ff.update()

            # 3. Propagate changes through combinational logic (Gates)
            # The loop ensures signals stabilize.
            for _ in range(len(self.circuit.gates) + 1):
                for gate in self.circuit.gates:
                    gate.update()

            # 4. Record the final, stable state of all signals
            for name, signal in self.circuit.signals.items():
                waveforms[name].append(signal.get_value())

        return waveforms
