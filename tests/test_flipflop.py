import pytest
from core.signal import Signal
from core.clock import Clock
from core.flipflop import DFlipFlop
from core.simulator import Simulator


def test_ff_reset_and_hold():
    """FF should reset to 0 and hold value until first clock edge."""
    clk = Clock("clk", period=2, duty_cycle=0.5)
    d = Signal("d", init=1)
    q = Signal("q", init=-1)   # invalid start
    ff = DFlipFlop(d, clk, q, reset=1)

    sim = Simulator()
    sim.add_clock(clk)
    sim.add_signal(d)
    sim.add_flipflop(ff)

    # Immediately after reset
    assert q.get() == 0

    sim.run(2, verbose=False)  # one full cycle
    # After first rising edge, Q should take D=1
    assert q.get() == 1


def test_ff_tracks_input_on_rising_edge():
    """FF should latch input D only on rising clock edges."""
    clk = Clock("clk", period=2, duty_cycle=0.5)
    d = Signal("d", init=0)
    q = Signal("q")
    ff = DFlipFlop(d, clk, q, reset=0)

    sim = Simulator()
    sim.add_clock(clk)
    sim.add_signal(d)
    sim.add_flipflop(ff)

    # Step 1: still reset=0
    sim.step()
    assert q.get() == 0

    # Change D in the middle of the cycle (shouldn't affect until edge)
    d.set(1)
    sim.step()
    assert q.get() == 0  # no change yet

    # Rising edge comes now, FF should capture D=1
    sim.step()
    assert q.get() == 1


def test_ff_multiple_cycles_waveform():
    """Check waveform across multiple cycles with toggling input."""
    clk = Clock("clk", period=2, duty_cycle=0.5)
    d = Signal("d", init=0)
    q = Signal("q")
    ff = DFlipFlop(d, clk, q, reset=0)

    sim = Simulator()
    sim.add_clock(clk)
    sim.add_signal(d)
    sim.add_flipflop(ff)

    # Run with toggling input
    values = [0,1,0,1,0]
    for v in values:
        d.set(v)
        sim.run(2, verbose=False)  # one full clock cycle

    waveform = sim.get_waveform("q")
    # Expect Q to follow D, but one cycle delayed
    # Q should be: [0,0,1,0,1,0]
    assert waveform[-6:] == [0,0,1,0,1,0]


def test_ff_reset_mid_simulation():
    """Resetting during simulation should force Q=0 regardless of D."""
    clk = Clock("clk", period=2, duty_cycle=0.5)
    d = Signal("d", init=1)
    q = Signal("q")
    ff = DFlipFlop(d, clk, q, reset=0)

    sim = Simulator()
    sim.add_clock(clk)
    sim.add_signal(d)
    sim.add_flipflop(ff)

    sim.run(3, verbose=False)
    assert q.get() == 1  # already captured D

    # Now reset
    ff.reset_ff()
    assert q.get() == 0

    # Even if D=1, it should hold 0 until next clock edge
    d.set(1)
    sim.run(2, verbose=False)
    assert q.get() == 1
