from core import Signal, AndGate, OrGate, NotGate

def test_half_adder_manual():
    # Inputs
    a = Signal("a", 0)
    b = Signal("b", 0)

    # Outputs
    sum_out = Signal("sum")
    carry_out = Signal("carry")

    # Internal wires
    or_out = Signal("or_out")
    and_out = Signal("and_out")
    nand_out = Signal("nand_out")

    # Build XOR = (A OR B) AND (NOT (A AND B))
    or_gate = OrGate("or1", a, b, or_out)
    and_gate = AndGate("and1", a, b, and_out)
    not_gate = NotGate("not1", and_out, nand_out)
    sum_gate = AndGate("sum1", or_out, nand_out, sum_out)

    # Carry = A AND B
    carry_gate = AndGate("carry1", a, b, carry_out)

    # Function to eval all gates
    def eval_all():
        or_gate.eval()
        and_gate.eval()
        not_gate.eval()
        sum_gate.eval()
        carry_gate.eval()

    # Truth table
    cases = [
        (0, 0, 0, 0),
        (0, 1, 1, 0),
        (1, 0, 1, 0),
        (1, 1, 0, 1),
    ]

    for av, bv, expected_sum, expected_carry in cases:
        a.set(av)
        b.set(bv)
        eval_all()
        assert sum_out.get() == expected_sum
        assert carry_out.get() == expected_carry
