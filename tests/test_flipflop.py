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
    """Check that Q follows D with one-cycle delay (sampled at rising edges)."""
    clk = Clock("clk", period=2, duty_cycle=0.5)
    d = Signal("d", init=0)
    q = Signal("q")
    ff = DFlipFlop(d, clk, q, reset=0)

    sim = Simulator()
    sim.add_clock(clk)
    sim.add_signal(d)
    sim.add_flipflop(ff)

    # Record the initial state of Q before any cycles run.
    observed = [q.get()]
    
    values = [0,1,0,1,0]
    # Run for all but the last value
    for v in values[:-1]:
        d.set(v)
        sim.run(2, verbose=False)  # one full cycle
        observed.append(q.get())

    # The final observed list should show Q delayed by one cycle.
    # Expected: Q(t) = D(t-1)
    # D sequence: [0, 0, 1, 0, 1] (includes initial state)
    # Q sequence: [0, 0, 0, 1, 0]
    assert observed == [0, 0, 1, 0, 1]


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


def test_ff_long_sequence_waveform():
    """Check that Q correctly follows a long, varied D input sequence."""
    clk = Clock("clk", period=2, duty_cycle=0.5)
    d = Signal("d", init=0)
    q = Signal("q")
    ff = DFlipFlop(d, clk, q, reset=0)

    sim = Simulator()
    sim.add_clock(clk)
    sim.add_signal(d)
    sim.add_flipflop(ff)

    # D sequence over time (at rising edge): [0 (initial), 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1]
    # Q sequence should be D delayed by one cycle.
    long_sequence = [1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1]
    d_values_at_edge = [d.get()] + long_sequence
    expected_q = [q.get()] + d_values_at_edge[:-1]
    
    observed_q = []
    
    for v in d_values_at_edge:
        # Check the value of Q *before* the cycle runs.
        # This reveals the value from the *previous* cycle.
        observed_q.append(q.get())
        d.set(v)
        sim.run(2, verbose=False)  # Run one full cycle

    assert observed_q == expected_q


def test_ff_holds_value_then_resets():
    """Check that FF holds its value over many cycles, then correctly resets."""
    clk = Clock("clk", period=2, duty_cycle=0.5)
    d = Signal("d", init=0)
    q = Signal("q")
    ff = DFlipFlop(d, clk, q, reset=0)

    sim = Simulator()
    sim.add_clock(clk)
    sim.add_signal(d)
    sim.add_flipflop(ff)

    # 1. Set D to 1 and run for a cycle to latch it.
    d.set(1)
    sim.run(2, verbose=False)
    assert q.get() == 1

    # 2. Set D to 0. Q should become 0 on the next cycle and stay there.
    d.set(0)
    sim.run(2, verbose=False) # Run one cycle to latch the D=0
    assert q.get() == 0

    # Q should now hold 0 for many cycles as long as D is 0.
    for _ in range(10):
        sim.run(2, verbose=False)
        assert q.get() == 0
    
    # 3. Now, reset the flip-flop mid-simulation.
    d.set(1) # Set D high
    ff.reset_ff()
    assert q.get() == 0 # Q should be forced to 0 immediately.

    # 4. Run for one more cycle. Q should now latch the D=1.
    sim.run(2, verbose=False)
    assert q.get() == 1
