import pytest
from core.clock import Clock
from core.simulator import Simulator

def pretty_waveform(values):
    """Render a waveform as string of 0/1 for easy debug."""
    return "".join(str(v) for v in values)

def test_waveform_debug():
    # Example 1: 50% duty, period=4
    clk = Clock("clk", period=4, duty_cycle=0.5)
    sim = Simulator()
    sim.add_clock(clk)

    sim.run(16, verbose=False)
    wf = sim.get_waveform("clk")

    print("\n50% duty cycle waveform:")
    print(pretty_waveform(wf))

    # Example 2: 25% duty, period=4
    clk25 = Clock("clk25", period=4, duty_cycle=0.25)
    sim2 = Simulator()
    sim2.add_clock(clk25)

    sim2.run(16, verbose=False)
    wf25 = sim2.get_waveform("clk25")

    print("\n25% duty cycle waveform:")
    print(pretty_waveform(wf25))

    # Example 3: 12.5% duty, period=8
    clk12 = Clock("clk12", period=8, duty_cycle=0.125)
    sim3 = Simulator()
    sim3.add_clock(clk12)

    sim3.run(16, verbose=False)
    wf12 = sim3.get_waveform("clk12")

    print("\n12.5% duty cycle waveform:")
    print(pretty_waveform(wf12))
    # Just sanity checks
    assert len(wf) == 17  # initial + 8 steps
    assert len(wf25) == 17
    assert len(wf12) == 17