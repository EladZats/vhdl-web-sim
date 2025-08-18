from core import Signal

def test_signal_set_get():
    a = Signal("a")
    assert a.get() == 0  # default should be 0
    a.set(1)
    assert a.get() == 1
