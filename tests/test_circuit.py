from core.circuit import Circuit
from core.gates import AndGate, OrGate, NotGate

def test_simple_circuit():
    # Create circuit
    c = Circuit("TestCircuit")

    # Add inputs/outputs
    c.add_input("a")
    c.add_input("b")
    c.add_output("out_and")
    c.add_output("out_or")
    c.add_output("out_not_a")

    # Add gates
    c.add_gate(AndGate("g1", ["a", "b"], "out_and"))
    c.add_gate(OrGate("g2", ["a", "b"], "out_or"))
    c.add_gate(NotGate("g3", ["a"], "out_not_a"))

    # Case 1: a=0, b=0
    c.set_inputs({"a": 0, "b": 0})
    c.evaluate()
    assert c.get_outputs() == {"out_and": 0, "out_or": 0, "out_not_a": 1}

    # Case 2: a=1, b=0
    c.set_inputs({"a": 1, "b": 0})
    c.evaluate()
    assert c.get_outputs() == {"out_and": 0, "out_or": 1, "out_not_a": 0}

    # Case 3: a=1, b=1
    c.set_inputs({"a": 1, "b": 1})
    c.evaluate()
    assert c.get_outputs() == {"out_and": 1, "out_or": 1, "out_not_a": 0}
