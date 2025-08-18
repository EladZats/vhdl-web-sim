from .signal import Signal


class LogicGate:
    """Base class for logic gates. Supports inputs/outputs as Signal or str (signal name)."""

    def __init__(self, name, inputs, output):
        self.name = name
        self.inputs = inputs if isinstance(inputs, list) else [inputs]
        self.output = output  # Signal or str

    # helpers
    @staticmethod
    def _get(ref, signals):
        """Read value from a Signal or from signals dict using name."""
        if isinstance(ref, Signal):
            return ref.get()
        assert signals is not None, "signals dict is required when refs are names"
        return signals[ref].get()

    @staticmethod
    def _set(ref, val, signals):
        """Write value to a Signal or to signals dict using name."""
        if isinstance(ref, Signal):
            ref.set(val)
            return
        assert signals is not None, "signals dict is required when refs are names"
        signals[ref].set(val)

    def evaluate(self, signals=None):
        """Subclasses implement logic here. 'signals' is required if refs are names."""
        raise NotImplementedError

    # keep compatibility with tests that call g.eval()
    def eval(self):
        self.evaluate(None)

    def __repr__(self):
        ins = ",".join([i.name if isinstance(i, Signal) else str(i) for i in self.inputs])
        out = self.output.name if isinstance(self.output, Signal) else str(self.output)
        return f"{self.__class__.__name__}({self.name}: {ins} -> {out})"


class AndGate(LogicGate):
    def __init__(self, name, in1, in2=None, out=None):
        # Support both forms:
        #   AndGate(name, a, b, out)           (Signals)
        #   AndGate(name, ["a","b"], "out")    (names)
        if isinstance(in1, list):
            inputs, output = in1, in2
        else:
            inputs, output = [in1, in2], out
        super().__init__(name, inputs, output)

    def evaluate(self, signals=None):
        a = self._get(self.inputs[0], signals)
        b = self._get(self.inputs[1], signals)
        self._set(self.output, a & b, signals)


class OrGate(LogicGate):
    def __init__(self, name, in1, in2=None, out=None):
        if isinstance(in1, list):
            inputs, output = in1, in2
        else:
            inputs, output = [in1, in2], out
        super().__init__(name, inputs, output)

    def evaluate(self, signals=None):
        a = self._get(self.inputs[0], signals)
        b = self._get(self.inputs[1], signals)
        self._set(self.output, a | b, signals)


class NotGate(LogicGate):
    def __init__(self, name, in1, out=None):
        if isinstance(in1, list):
            inputs, output = in1, out
        else:
            inputs, output = [in1], out
        super().__init__(name, inputs, output)

    def evaluate(self, signals=None):
        a = self._get(self.inputs[0], signals)
        self._set(self.output, 1 - a, signals)


class XorGate(LogicGate):
    def __init__(self, name, in1, in2=None, out=None):
        if isinstance(in1, list):
            inputs, output = in1, in2
        else:
            inputs, output = [in1, in2], out
        super().__init__(name, inputs, output)

    def evaluate(self, signals=None):
        a = self._get(self.inputs[0], signals)
        b = self._get(self.inputs[1], signals)
        self._set(self.output, a ^ b, signals)


# Alias to preserve any old imports expecting 'Gate'
Gate = LogicGate
