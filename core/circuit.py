from .signal import Signal


class Circuit:
    """Holds signals and gates, lets you evaluate once per 'combinational step'."""

    def __init__(self, name: str):
        self.name = name
        self.signals: dict[str, Signal] = {}
        self.inputs: list[Signal] = []
        self.outputs: list[Signal] = []
        self.gates = []

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
