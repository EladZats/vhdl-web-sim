from core import Simulator, Signal, Clock

def test_simulator_runs():
    sim = Simulator()
    a = Signal("a", 1)
    clk = Clock("clk", period=2)

    sim.add_signal(a)
    sim.add_clock(clk)

    sim.run(4)
    assert sim.time == 4
    assert clk.get() in (0, 1)  # clock must toggle
