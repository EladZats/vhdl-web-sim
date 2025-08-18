from typing import List
from .signal import Signal
from .clock import Clock
from .flipflop import DFlipFlop


class Simulator:
    """Simulation kernel for managing signals, clocks, flip-flops, and time."""

    def __init__(self):
        self.signals: List[Signal] = []
        self.clocks: List[Clock] = []
        self.flipflops: List[DFlipFlop] = []
        self.time = 0
        self.history = {}  # track values over time for visualization

    # ---------------- Registration ----------------
    def add_signal(self, sig: Signal):
        """Register a new signal in the simulation."""
        self.signals.append(sig)
        self.history[sig.name] = [sig.get()]

    def add_clock(self, clk: Clock):
        """Register a new clock in the simulation."""
        self.clocks.append(clk)
        self.history[clk.name] = [clk.get()]

    def add_flipflop(self, ff: DFlipFlop):
        """Register a new flip-flop in the simulation."""
        self.flipflops.append(ff)
        self.history[ff.q.name] = [ff.q.get()]

    # ---------------- Simulation core ----------------
    def step(self):
        """Advance simulation by one time step."""
        self.time += 1

        # Update clocks first
        for clk in self.clocks:
            clk.tick()

        # Then update flip-flops (edge-triggered, depend on clocks)
        for ff in self.flipflops:
            ff.tick()

        # Record state of all signals/clocks/FF outputs
        for s in self.signals + self.clocks + [ff.q for ff in self.flipflops]:
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
        ff_states = [f"{ff.q.name}={ff.q.get()}" for ff in self.flipflops]
        print(f"t={self.time}: " + " | ".join(sig_states + clk_states + ff_states))

    # ---------------- Utilities ----------------
    def get_waveform(self, name: str):
        """Return the recorded history of a given signal/clock/FF output."""
        return self.history.get(name, [])
