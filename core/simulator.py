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
        self.history = {}
        self._initial_state_recorded = False

    def add_signal(self, sig: Signal):
        """Register a signal."""
        self.signals.append(sig)
        self.history[sig.name] = []

    def add_clock(self, clk: Clock):
        """Register a clock."""
        self.clocks.append(clk)
        self.history[clk.name] = []

    def add_flipflop(self, ff: DFlipFlop):
        """Register a flip-flop."""
        self.flipflops.append(ff)
        self.history[ff.q.name] = []

    def _record_state(self):
        """Internal helper to record the current state of all components."""
        for s in self.signals + self.clocks:
            self.history[s.name].append(s.get())
        for ff in self.flipflops:
            self.history[ff.q.name].append(ff.q.get())

    def step(self):
        """Advance simulation by one time step."""
        # 1. Advance simulation time.
        self.time += 1

        # 2. Tick the components to advance their internal state.
        for clk in self.clocks:
            clk.tick()
        for ff in self.flipflops:
            ff.tick()

        # 3. Record the new state *after* the tick.
        self._record_state()

    def run(self, steps: int, verbose: bool = True):
        """Run simulation for N steps."""
        # The very first time run() is called, we must record the initial state at t=0.
        if not self._initial_state_recorded:
            self._record_state()
            self._initial_state_recorded = True

        # Now, execute each time step by calling the unified step() method.
        for _ in range(steps):
            self.step()
            if verbose:
                self._print_state()

        # After the simulation loop, flush the flip-flops to commit the final
        # sampled value. This does not advance time or record a new history state.
        for ff in self.flipflops:
            ff.flush()

    def _print_state(self):
        """Print current state of all components."""
        sig_states = [f"{s.name}={s.get()}" for s in self.signals]
        clk_states = [f"{c.name}={c.get()}" for c in self.clocks]
        ff_states  = [f"{ff.q.name}={ff.q.get()}" for ff in self.flipflops]
        print(f"t={self.time}: " + " | ".join(sig_states + clk_states + ff_states))

    def get_waveform(self, name: str):
        """Return the recorded history of a given signal/clock/FF output."""
        return self.history.get(name, [])
