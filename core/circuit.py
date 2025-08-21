from .signal import Signal
from .clock import Clock
from .flipflop import DFlipFlop
from .simulator import Simulator


class Circuit:
    """Holds signals, gates, and sequential elements for a digital circuit."""

    def __init__(self, name: str = "Unnamed"):
        self.name = name
        self.signals: dict[str, Signal] = {}
        self.inputs: list[Signal] = []
        self.outputs: list[Signal] = []
        self.gates = []
        self.clocks: list[Clock] = []
        self.flipflops: list[DFlipFlop] = []

    # ------------------- Add elements -------------------

    def add_input(self, name: str):
        sig = Signal(name)
        self.signals[name] = sig
        self.inputs.append(sig)

    def add_output(self, name: str):
        sig = Signal(name)
        self.signals[name] = sig
        self.outputs.append(sig)

    def add_gate(self, gate):
        self.gates.append(gate)

    def add_clock(self, clock: Clock):
        """Add a clock source to the circuit."""
        self.clocks.append(clock)
        # A clock is also a signal source
        self.signals[clock.name] = clock

    def add_flipflop(self, ff: DFlipFlop):
        """Add a flip-flop to the circuit."""
        self.flipflops.append(ff)
        # The output of a FF is also a signal
        if ff.q.name not in self.signals:
            self.signals[ff.q.name] = ff.q

    # ------------------- Simulation helpers -------------------

    def set_inputs(self, values: dict[str, int]):
        for k, v in values.items():
            if k not in self.signals:
                raise KeyError(f"Unknown signal '{k}'")
            self.signals[k].set(v)

    def evaluate(self):
        for gate in self.gates:
            gate.evaluate(self.signals)

    def get_outputs(self) -> dict[str, int]:
        return {sig.name: sig.get() for sig in self.outputs}

    def build_simulator(self) -> "Simulator":
        """Create a Simulator and register all signals, clocks, and flip-flops."""
        sim = Simulator()
        for sig in self.signals.values():
            sim.add_signal(sig)
        for clk in self.clocks:
            sim.add_clock(clk)
        for ff in self.flipflops:
            sim.add_flipflop(ff)
        return sim
