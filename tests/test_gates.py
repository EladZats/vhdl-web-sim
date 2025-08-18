from core import Signal, AndGate, OrGate, NotGate

def test_and_gate():
    a, b, out = Signal("a", 0), Signal("b", 0), Signal("out", 0)
    g = AndGate("G1", a, b, out)

    a.set(1); b.set(1); g.eval()
    assert out.get() == 1

    b.set(0); g.eval()
    assert out.get() == 0

def test_or_gate():
    a, b, out = Signal("a", 0), Signal("b", 0), Signal("out", 0)
    g = OrGate("G2", a, b, out)

    g.eval()
    assert out.get() == 0

    a.set(1); g.eval()
    assert out.get() == 1

def test_not_gate():
    a, out = Signal("a", 0), Signal("out", 0)
    g = NotGate("G3", a, out)

    g.eval()
    assert out.get() == 1

    a.set(1); g.eval()
    assert out.get() == 0
