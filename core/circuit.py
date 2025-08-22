from __future__ import annotations
from typing import Dict, List

from .signal import Signal
from .gates import Gate
from .clock import Clock
from .flipflop import DFlipFlop


class Circuit:
    """Represents a digital logic circuit."""

    def __init__(self, name: str):
        self.name = name
        self.signals: Dict[str, Signal] = {}
        self.inputs: List[Signal] = []
        self.outputs: List[Signal] = []
        self.gates: List[Gate] = []
        self.clocks: List[Clock] = []
        self.flipflops: List[DFlipFlop] = []

    # ------------------- Add elements -------------------

    def add_input(self, name: str):
        # This is one source of the error. It must use 'value'.
        signal = Signal(name=name, value=0)
        self.signals[name] = signal
        self.inputs.append(signal)

    def add_output(self, name: str):
        # This is another source of the error. It must use 'value'.
        signal = Signal(name=name, value=0)
        self.signals[name] = signal
        self.outputs.append(signal)

    def add_gate(self, gate: Gate):
        self.gates.append(gate)

    def add_clock(self, clock: Clock):
        self.clocks.append(clock)

    def add_flipflop(self, ff: DFlipFlop):
        self.flipflops.append(ff)

    def simulate(self, steps: int, inputs_map: Dict[str, str]):
        for signal in self.signals.values():
            signal.set_value(0)

        waveforms = {name: [] for name in self.signals}

        for t in range(steps):
            for signal in self.inputs:
                if signal.name in inputs_map and t < len(inputs_map[signal.name]):
                    signal.set_value(int(inputs_map[signal.name][t]))
            for clock in self.clocks:
                clock.update(t)

            for ff in self.flipflops:
                ff.update()

            for _ in range(len(self.gates) + 1):
                for gate in self.gates:
                    gate.update()

            for name, signal in self.signals.items():
                waveforms[name].append(signal.get_value())

        return waveforms
