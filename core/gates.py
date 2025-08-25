from __future__ import annotations
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from .circuit import Circuit


class Gate:
    """Base class for all logic gates."""

    def __init__(self, name: str, inputs: List[str], output: str, circuit: Circuit):
        self.name = name
        self.input_names = inputs
        self.output_name = output
        self.circuit = circuit

    def update(self):
        raise NotImplementedError

    def __repr__(self):
        return f"{type(self).__name__}({self.name})"


class AndGate(Gate):
    def update(self):
        in1_val = self.circuit.signals[self.input_names[0]].get_value() or 0
        in2_val = self.circuit.signals[self.input_names[1]].get_value() or 0
        val = int(in1_val and in2_val)
        self.circuit.signals[self.output_name].set_value(val)


class OrGate(Gate):
    def update(self):
        in1_val = self.circuit.signals[self.input_names[0]].get_value() or 0
        in2_val = self.circuit.signals[self.input_names[1]].get_value() or 0
        val = int(in1_val or in2_val)
        self.circuit.signals[self.output_name].set_value(val)


class XorGate(Gate):
    def update(self):
        in1_val = self.circuit.signals[self.input_names[0]].get_value() or 0
        in2_val = self.circuit.signals[self.input_names[1]].get_value() or 0
        val = int(in1_val ^ in2_val)
        self.circuit.signals[self.output_name].set_value(val)


class NotGate(Gate):
    def update(self):
        in_val = self.circuit.signals[self.input_names[0]].get_value() or 0
        val = int(not in_val)
        self.circuit.signals[self.output_name].set_value(val)

class NandGate(Gate):
    def update(self):
        in1 = self.circuit.signals[self.input_names[0]].get_value() or 0
        in2 = self.circuit.signals[self.input_names[1]].get_value() or 0
        self.circuit.signals[self.output_name].set_value(int(not (in1 and in2)))

class NorGate(Gate):
    def update(self):
        in1 = self.circuit.signals[self.input_names[0]].get_value() or 0
        in2 = self.circuit.signals[self.input_names[1]].get_value() or 0
        self.circuit.signals[self.output_name].set_value(int(not (in1 or in2)))

class XnorGate(Gate):
    def update(self):
        in1 = self.circuit.signals[self.input_names[0]].get_value() or 0
        in2 = self.circuit.signals[self.input_names[1]].get_value() or 0
        self.circuit.signals[self.output_name].set_value(int(not (in1 ^ in2)))
