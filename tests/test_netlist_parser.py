from core.parser import NetlistParser

def test_parse_half_adder_and_eval():
    netlist = """
    # Half Adder example
    CIRCUIT HalfAdder
    INPUT a, b
    OUTPUT sum, carry

    GATE g1 XOR a b sum
    GATE g2 AND a b carry
    """

    c = NetlistParser(netlist).parse()

    cases = [
        (0,0, 0,0),
        (0,1, 1,0),
        (1,0, 1,0),
        (1,1, 0,1),
    ]
    for av, bv, s_exp, c_exp in cases:
        c.set_inputs({"a": av, "b": bv})
        c.evaluate()
        out = c.get_outputs()
        assert out["sum"] == s_exp
        assert out["carry"] == c_exp


def test_parse_not_gate():
    netlist = """
    CIRCUIT NotExample
    INPUT a
    OUTPUT y
    GATE n1 NOT a y
    """
    c = NetlistParser(netlist).parse()
    c.set_inputs({"a": 0})
    c.evaluate()
    assert c.get_outputs()["y"] == 1
    c.set_inputs({"a": 1})
    c.evaluate()
    assert c.get_outputs()["y"] == 0
