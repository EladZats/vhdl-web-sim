from typing import List
from .signal import Signal
from .clock import Clock

class Simulator:
    """Simple simulation kernel for managing signals, clocks, and time."""

    def __init__(self):
        self.signals: List[Signal] = []
        self.clocks: List[Clock] = []
        self.time = 0
        self.history = {}  # track values over time for visualization

    def add_signal(self, sig: Signal):
        """Register a new signal in the simulation."""
        self.signals.append(sig)
        self.history[sig.name] = [sig.get()]

    def add_clock(self, clk: Clock):
        """Register a new clock in the simulation."""
        self.clocks.append(clk)
        self.history[clk.name] = [clk.get()]

    def step(self):
        """Advance simulation by one time step."""
        self.time += 1

        # Update clocks
        for clk in self.clocks:
            clk.tick()

        # Record state of all signals/clocks
        for s in self.signals + self.clocks:
            self.history[s.name].append(s.get())

    def run(self, steps: int, verbose: bool = True):
        """Run simulation for N steps. Optionally print state."""
        for _ in range(steps):
            self.step()
            if verbose:
                self._print_state()

    def _print_state(self):
        sig_states = [f"{s.name}={s.get()}" for s in self.signals]
        clk_states = [f"{c.name}={c.get()}" for c in self.clocks]
        print(f"t={self.time}: " + " | ".join(sig_states + clk_states))

    def get_waveform(self, name: str):
        """Return the recorded history of a given signal/clock."""
        return self.history.get(name, [])
