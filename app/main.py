from core.circuit import Circuit
from core.gates import AndGate, OrGate, NotGate

# Create circuit
c = Circuit("Demo")

# Add IO
c.add_input("a")
c.add_input("b")
c.add_output("out1")
c.add_output("out2")

# Add gates
c.add_gate(AndGate("g1", ["a", "b"], "out1"))
c.add_gate(OrGate("g2", ["a", "b"], "out2"))

# Simulate case
c.set_inputs({"a": 1, "b": 0})
c.evaluate()
print(c.get_outputs())   # {'out1': 0, 'out2': 1}
