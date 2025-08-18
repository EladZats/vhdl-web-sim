from typing import List
from .signal import Signal
from .clock import Clock

class Simulator:
    """Simple simulation kernel for managing signals and clocks."""

    def __init__(self):
        self.signals: List[Signal] = []
        self.clocks: List[Clock] = []
        self.time = 0

    def add_signal(self, sig: Signal):
        self.signals.append(sig)

    def add_clock(self, clk: Clock):
        self.clocks.append(clk)

    def step(self):
        """Advance simulation by one time step."""
        self.time += 1
        for clk in self.clocks:
            clk.tick()

    def run(self, steps: int):
        """Run simulation for N steps with simple printing."""
        for _ in range(steps):
            self.step()
            self._print_state()

    def _print_state(self):
        sig_states = [f"{s.name}={s.get()}" for s in self.signals]
        clk_states = [f"{c.signal.name}={c.get()}" for c in self.clocks]
        print(f"t={self.time}: " + " | ".join(sig_states + clk_states))
